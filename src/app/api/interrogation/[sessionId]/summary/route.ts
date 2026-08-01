import { generateObject } from 'ai'
import { groq } from '@/lib/ai'
import { logTokenUsage } from '@/lib/token-tracker'
import { getUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { recommendations, interrogationSessions, patternAlerts, patternAlertDecisions, patternTypes } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { z } from 'zod'

const PATTERN_SLUGS = [
  'binary_framing',
  'external_validation',
  'career_over_alignment',
  'recency_bias',
  'sunk_cost',
  'authority_deference',
] as const

const summarySchema = z.object({
  answer: z.string().max(200).describe('The Blindspot call — short and direct, under 30 words'),
  rationale: z.string().max(600).describe('2-3 sentence explanation of the call'),
  evidence: z.array(z.object({
    pattern: z.string().describe('The pattern or reasoning issue observed'),
    finding: z.string().max(200).describe('Specific example from the conversation'),
  })).max(3),
})

const classificationSchema = z.object({
  detectedPatterns: z.array(z.enum(PATTERN_SLUGS)).describe('Decision patterns present in this session'),
})

async function classifyAndUpdatePatterns(
  decisionId: string,
  userId: string,
  transcript: string,
  summary: z.infer<typeof summarySchema>
) {
  const CLASSIFY_MODEL = 'llama-3.1-8b-instant'
  const { object, usage: classifyUsage } = await generateObject({
    model: groq(CLASSIFY_MODEL),
    schema: classificationSchema,
    maxTokens: 60,
    system: `Classify decision patterns. Only flag patterns clearly evidenced in the text.\nbinary_framing|external_validation|career_over_alignment|recency_bias|sunk_cost|authority_deference`,
    prompt: `Transcript:\n${transcript}\n\nSummary answer: ${summary.answer}`,
  })
  logTokenUsage({ model: CLASSIFY_MODEL, route: '/api/interrogation/summary:classify', ...classifyUsage })

  if (object.detectedPatterns.length === 0) return

  const allPatternTypes = await db.query.patternTypes.findMany({
    where: inArray(patternTypes.slug, [...object.detectedPatterns]),
  })

  const existingAlerts = await db.query.patternAlerts.findMany({
    where: and(
      eq(patternAlerts.userId, userId),
      inArray(patternAlerts.patternTypeId, allPatternTypes.map(p => p.id))
    ),
    with: { decisions: true },
  })

  for (const patternType of allPatternTypes) {
    const existing = existingAlerts.find(a => a.patternTypeId === patternType.id)

    if (existing) {
      // Add this decision to the existing alert's junction table
      await db
        .insert(patternAlertDecisions)
        .values({ patternAlertId: existing.id, decisionId })
        .onConflictDoNothing()

      // Check threshold: if this alert now covers enough decisions, ensure it's not dismissed
      const decisionCount = existing.decisions.length + 1
      if (decisionCount >= patternType.detectionThreshold && existing.dismissedAt) {
        await db
          .update(patternAlerts)
          .set({ dismissedAt: null, detectedAt: new Date() })
          .where(eq(patternAlerts.id, existing.id))
      }
    } else {
      // Create new alert if we have enough decisions
      const [newAlert] = await db
        .insert(patternAlerts)
        .values({ userId, patternTypeId: patternType.id })
        .returning()

      await db.insert(patternAlertDecisions).values({
        patternAlertId: newAlert.id,
        decisionId,
      })
    }
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getUser()
  if (!user) return new Response(null, { status: 401 })

  const { sessionId } = await params

  const interrogationSession = await db.query.interrogationSessions.findFirst({
    where: eq(interrogationSessions.id, sessionId),
    with: { decision: { columns: { userId: true, id: true } } },
  })
  if (!interrogationSession || interrogationSession.decision.userId !== user.id) {
    return new Response(null, { status: 404 })
  }

  const body = await req.json()
  const { transcript } = body

  const SUMMARY_MODEL = 'llama-3.3-70b-versatile'
  const { object, usage: summaryUsage } = await generateObject({
    model: groq(SUMMARY_MODEL),
    schema: summarySchema,
    maxTokens: 300,
    system: `You are Blindspot. From the transcript, output a direct recommendation: answer (what to do, <30 words), rationale (2 sentences), evidence (2-3 specific observations).`,
    prompt: `Transcript:\n${transcript}`,
  })
  logTokenUsage({ model: SUMMARY_MODEL, route: '/api/interrogation/summary', ...summaryUsage })

  const [rec] = await db
    .insert(recommendations)
    .values({
      decisionId: interrogationSession.decision.id,
      interrogationSessionId: sessionId,
      answer: object.answer,
      rationale: object.rationale,
      evidence: object.evidence,
    })
    .returning()

  // Fire-and-forget pattern classification
  classifyAndUpdatePatterns(
    interrogationSession.decision.id,
    user.id,
    transcript,
    object
  ).catch(console.error)

  return Response.json(rec, { status: 201 })
}
