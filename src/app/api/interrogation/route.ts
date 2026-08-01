import { streamText } from 'ai'
import { groq } from '@/lib/ai'
import { getUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { decisions, interrogationSessions } from '@/lib/db/schema'
import { eq, and, inArray, isNotNull, ne } from 'drizzle-orm'
import { logTokenUsage } from '@/lib/token-tracker'
import type { PatternAlert } from '@/types'

function buildProfileContext(profile: Record<string, unknown>): string {
  const lines: string[] = []

  if (Array.isArray(profile.struggles) && profile.struggles.length > 0) {
    lines.push(`- Tends to struggle with: ${profile.struggles.join(', ')}`)
  }
  if (typeof profile.risk === 'number') {
    const label = profile.risk <= 2 ? 'low' : profile.risk >= 4 ? 'high' : 'moderate'
    lines.push(`- Risk tolerance: ${label} (${profile.risk}/5)`)
  }
  if (typeof profile.pace === 'number') {
    const label = profile.pace <= 2 ? 'deliberate' : profile.pace >= 4 ? 'fast' : 'balanced'
    lines.push(`- Decision pace: ${label} (${profile.pace}/5)`)
  }
  if (Array.isArray(profile.triggers) && profile.triggers.length > 0) {
    lines.push(`- Common decision triggers: ${profile.triggers.join(', ')}`)
  }
  if (Array.isArray(profile.areas) && profile.areas.length > 0) {
    lines.push(`- Typically decides in: ${profile.areas.join(', ')}`)
  }

  return lines.length > 0
    ? `\n\nUser profile context (use to sharpen your questions, not to soften them):\n${lines.join('\n')}`
    : ''
}

function buildSystemPrompt({
  coachingStyle,
  profileAnswers,
  activePatterns,
  decisionTitle,
  decisionSummary,
  decisionOptions,
}: {
  coachingStyle: string
  profileAnswers?: Record<string, unknown>
  activePatterns?: PatternAlert[]
  decisionTitle: string
  decisionSummary?: string
  decisionOptions?: string[]
}) {
  const styleInstructions = {
    advisor: "You are a balanced advisor. Surface what the user hasn't considered without telling them what to do. Ask one sharp clarifying question at a time.",
    supporter: 'You are a supportive coach. Validate the user\'s instincts while flagging genuine gaps. Frame challenges as things they can handle.',
    critic: 'You are an adversarial critic. Steelman the opposite of whatever the user is leaning toward. Do not stop until their reasoning survives a real challenge.',
  }[coachingStyle] ?? "You are a balanced advisor."

  const patternContext = activePatterns && activePatterns.length > 0
    ? `\n\nActive decision patterns detected for this user:\n${activePatterns.map(p => `- ${p.title}: ${p.description}`).join('\n')}\nReference these patterns if they appear in the user's reasoning.`
    : ''

  const profileContext = profileAnswers ? buildProfileContext(profileAnswers) : ''

  const decisionContext = [
    decisionSummary ? `Context: ${decisionSummary}` : null,
    decisionOptions && decisionOptions.length > 0
      ? `Options on the table: ${decisionOptions.join(' · ')}`
      : null,
  ].filter(Boolean).join('\n')

  return `You are Blindspot, a Socratic decision interrogation system. You are helping the user think through: "${decisionTitle}".
${decisionContext ? `\n${decisionContext}` : ''}
${styleInstructions}

Your role is to ask one focused question per turn. Each question must:
1. Challenge or deepen a specific claim the user made
2. Surface an assumption, tradeoff, or unconsidered option
3. Be under 60 words

Do NOT summarize, congratulate, or offer opinions. Only ask the next question. Aim to reach a conclusion within 4-5 exchanges. Stop as soon as the user has demonstrated a genuinely defensible position — they've named the key tradeoff, identified what they'd need to be wrong, and can articulate what they're optimizing for. Do not keep probing once the reasoning holds.
${profileContext}${patternContext}`
}

async function fetchPreviousSessionContext(userId: string, currentSessionId: string): Promise<string> {
  const userDecisions = await db.query.decisions.findMany({
    where: eq(decisions.userId, userId),
    columns: { id: true },
  })
  if (userDecisions.length === 0) return ''

  const decisionIds = userDecisions.map(d => d.id)
  const prevSessions = await db.query.interrogationSessions.findMany({
    where: and(
      inArray(interrogationSessions.decisionId, decisionIds),
      isNotNull(interrogationSessions.turns),
      ne(interrogationSessions.id, currentSessionId),
    ),
    with: { decision: { columns: { title: true } } },
    orderBy: (s, { desc }) => [desc(s.createdAt)],
    limit: 3,
  })

  const excerpts = prevSessions
    .map(s => {
      const userTurns = ((s.turns ?? []) as { role: string; content: string }[])
        .filter(t => t.role === 'user')
        .slice(1)
      if (userTurns.length === 0) return null
      const responses = userTurns.map(t => `- ${t.content.slice(0, 180)}`).join('\n')
      return `Decision: "${s.decision.title}"\n${responses}`
    })
    .filter(Boolean)

  if (excerpts.length === 0) return ''

  return `\n\nContext from this user's previous interrogation sessions — use to notice recurring reasoning patterns and calibrate your questions:\n${excerpts.join('\n\n')}`
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return new Response(null, { status: 401 })

  const body = await req.json()
  const {
    decisionId,
    sessionId,
    messages,
    coachingStyle = 'advisor',
    activePatterns,
    decisionTitle,
    decisionSummary,
    decisionOptions,
  } = body

  // Legacy path: sessionId not yet provided — create session inline
  if (!sessionId && decisionId) {
    const owned = await db.query.decisions.findFirst({
      where: and(eq(decisions.id, decisionId), eq(decisions.userId, user.id)),
    })
    if (!owned) return new Response(null, { status: 404 })

    await db.insert(interrogationSessions).values({ decisionId, coachingStyle })
    await db
      .update(decisions)
      .set({ interrogationCount: owned.interrogationCount + 1, updatedAt: new Date() })
      .where(eq(decisions.id, decisionId))
  }

  // Fetch profile snapshot from the session record
  let profileAnswers: Record<string, unknown> | undefined
  if (sessionId) {
    const sess = await db.query.interrogationSessions.findFirst({
      where: eq(interrogationSessions.id, sessionId),
      columns: { profileSnapshot: true },
    })
    profileAnswers = sess?.profileSnapshot ?? undefined
  }

  const previousContext = sessionId ? await fetchPreviousSessionContext(user.id, sessionId) : ''

  const MODEL = 'llama-3.3-70b-versatile'
  const result = streamText({
    model: groq(MODEL),
    system: buildSystemPrompt({ coachingStyle, profileAnswers, activePatterns, decisionTitle, decisionSummary, decisionOptions }) + previousContext,
    messages,
    maxTokens: 150,
    onFinish: ({ usage }) => {
      logTokenUsage({ model: MODEL, route: '/api/interrogation', ...usage })
    },
  })

  return result.toDataStreamResponse()
}
