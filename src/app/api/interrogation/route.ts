import { streamText } from 'ai'
import { groq } from '@/lib/ai'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { decisions, interrogationSessions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
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
}: {
  coachingStyle: string
  profileAnswers?: Record<string, unknown>
  activePatterns?: PatternAlert[]
  decisionTitle: string
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

  return `You are Blindspot, a Socratic decision interrogation system. You are helping the user think through: "${decisionTitle}".

${styleInstructions}

Your role is to ask one focused question per turn. Each question must:
1. Challenge or deepen a specific claim the user made
2. Surface an assumption, tradeoff, or unconsidered option
3. Be under 60 words

Do NOT summarize, congratulate, or offer opinions. Only ask the next question. Stop when the user has demonstrated a genuinely defensible position (they've named the key tradeoff, identified what they'd need to be wrong, and can articulate what they're optimizing for).
${profileContext}${patternContext}`
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const body = await req.json()
  const {
    decisionId,
    sessionId,
    messages,
    coachingStyle = 'advisor',
    activePatterns,
    decisionTitle,
  } = body

  // Legacy path: sessionId not yet provided — create session inline
  if (!sessionId && decisionId) {
    const owned = await db.query.decisions.findFirst({
      where: and(eq(decisions.id, decisionId), eq(decisions.userId, session.user.id)),
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

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: buildSystemPrompt({ coachingStyle, profileAnswers, activePatterns, decisionTitle }),
    messages,
    maxTokens: 400,
  })

  return result.toDataStreamResponse()
}
