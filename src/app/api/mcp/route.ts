import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  decisions,
  decisionOptions,
  interrogationSessions,
  recommendations,
  patternTypes,
  patternAlerts,
  patternAlertDecisions,
  reflections,
  users,
} from '@/lib/db/schema'
import { eq, and, desc, isNull, isNotNull, inArray } from 'drizzle-orm'
import { groq } from '@/lib/ai'
import { generateObject, generateText } from 'ai'
import blockersJson from '../../../../docs/decision-making-blockers.json'

// ── Blocker taxonomy ──────────────────────────────────────────────────────────

type Blocker = {
  id: string
  name: string
  category: string
  description: string
  mechanism: string
}

type BlockersJson = {
  categories: Record<string, string>
  decision_making_blockers: Blocker[]
}

const BLOCKERS: Blocker[] = (blockersJson as BlockersJson).decision_making_blockers
const BLOCKER_CATEGORIES: Record<string, string> = (blockersJson as BlockersJson).categories
const BLOCKER_IDS = BLOCKERS.map((b) => b.id) as [string, ...string[]]

// ── Enums ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'career',
  'financial',
  'relationship',
  'health',
  'education',
  'housing',
  'business',
  'personal_growth',
  'other',
] as const

const COACHING_STYLES = ['advisor', 'supporter', 'critic'] as const

// ── Response helpers ──────────────────────────────────────────────────────────

function ok(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

function fail(message: string) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }],
    isError: true as const,
  }
}

// ── Compact blocker reference (for system prompts — avoids token bloat) ──────

// Group blocker names by category for a ~200-token compact reference
const COMPACT_BLOCKER_REF = Object.entries(BLOCKER_CATEGORIES)
  .map(([cat, _]) => {
    const names = BLOCKERS.filter((b) => b.category === cat).map((b) => b.name)
    return `${cat}: ${names.join(', ')}`
  })
  .join('\n')

// ── Socratic system prompt ────────────────────────────────────────────────────

function buildSocraticPrompt(
  decision: { title: string; summary: string | null; category: string },
  options: { label: string }[],
  coachingStyle: 'advisor' | 'supporter' | 'critic',
  profileSnapshot: Record<string, unknown> | null,
) {
  const styleGuide = {
    advisor: 'neutral, analytical, and balanced — like a trusted mentor presenting both sides clearly',
    supporter: 'warm, encouraging, and validating — acknowledge emotions while gently probing assumptions',
    critic:
      'direct, challenging, and adversarial — expose weak reasoning and untested assumptions head-on',
  }[coachingStyle]

  const profileCtx = profileSnapshot
    ? `\nUser decision profile: ${JSON.stringify(profileSnapshot)}`
    : ''

  return `You are a Socratic decision intelligence coach. Ask ONE precise, probing question that helps the user think more clearly about their decision.

Coaching style: ${styleGuide}

Decision under examination:
Title: "${decision.title}"
Category: ${decision.category}
Summary: ${decision.summary ?? 'Not provided'}
Options considered: ${options.map((o) => `"${o.label}"`).join(', ')}
${profileCtx}

Watch for these psychological blockers without naming them explicitly:
${COMPACT_BLOCKER_REF}

Socratic rules:
1. Ask exactly ONE question — never multiple questions in one turn
2. Probe hidden assumptions ("What makes you assume X is true?")
3. Surface unconsidered alternatives ("What option haven't you mentioned?")
4. Separate emotional from rational reasoning
5. Test the decision frame — is it truly binary?
6. Explore time horizons ("How will you feel about this in 5 years?")
7. Probe stakes and values ("What would you be giving up with each path?")
8. Challenge sunk costs, authority deference, and status quo reasoning subtly
9. Never name a bias directly — probe the thinking pattern instead

Output ONLY the question. No preamble, no affirmations, no coaching meta-commentary.`
}

// ── Blocker detection (small model, fast) ─────────────────────────────────────

async function detectBlockersInText(text: string): Promise<string[]> {
  try {
    const { object } = await generateObject({
      model: groq('llama-3.1-8b-instant'),
      schema: z.object({
        detected: z.array(z.enum(BLOCKER_IDS)).max(6),
      }),
      prompt: `Identify psychological decision-making blockers clearly present in this text. Return only blocker IDs where you can point to specific evidence.

Known blocker IDs and names:
${BLOCKERS.map((b) => `${b.id}: ${b.name}`).join('\n')}

Text:
"${text.slice(0, 2000)}"

Return only IDs of clearly-present blockers (max 6). Use the exact ID strings listed above.`,
      maxTokens: 120,
    })
    return object.detected
  } catch {
    return []
  }
}

// ── Blocker → pattern slug mapping ───────────────────────────────────────────

const BLOCKER_TO_PATTERN: Record<string, string> = {
  escalation_of_commitment: 'sunk_cost',
  effort_justification: 'sunk_cost',
  status_quo_bias: 'sunk_cost',
  authority_bias: 'authority_deference',
  automation_bias: 'authority_deference',
  recency_bias: 'recency_bias',
  availability_heuristic: 'recency_bias',
  availability_cascade: 'recency_bias',
  framing_effect: 'binary_framing',
  zero_risk_bias: 'binary_framing',
  pseudocertainty_effect: 'binary_framing',
  groupthink: 'external_validation',
  shared_information_bias: 'external_validation',
  reactive_devaluation: 'external_validation',
  optimism_bias: 'career_over_alignment',
  impact_bias: 'career_over_alignment',
  prevention_bias: 'career_over_alignment',
  filter_bubble_effect: 'recency_bias',
  algorithm_aversion: 'authority_deference',
  techno_solutionism_bias: 'authority_deference',
}

// ── Pattern alert management (fire-and-forget) ────────────────────────────────

async function classifyAndUpdatePatterns(
  userId: string,
  decisionId: string,
  detectedBlockerIds: string[],
): Promise<void> {
  if (detectedBlockerIds.length === 0) return

  const allPatternTypes = await db.query.patternTypes.findMany()
  const triggeredSlugs = new Set(
    detectedBlockerIds.map((id) => BLOCKER_TO_PATTERN[id]).filter(Boolean),
  )

  for (const slug of triggeredSlugs) {
    const patternType = allPatternTypes.find((p) => p.slug === slug)
    if (!patternType) continue

    const existing = await db.query.patternAlerts.findFirst({
      where: and(
        eq(patternAlerts.userId, userId),
        eq(patternAlerts.patternTypeId, patternType.id),
        isNull(patternAlerts.dismissedAt),
      ),
    })

    if (existing) {
      await db
        .insert(patternAlertDecisions)
        .values({ patternAlertId: existing.id, decisionId })
        .onConflictDoNothing()
    } else {
      const [newAlert] = await db
        .insert(patternAlerts)
        .values({ userId, patternTypeId: patternType.id })
        .returning()
      await db.insert(patternAlertDecisions).values({ patternAlertId: newAlert.id, decisionId })
    }
  }
}

// ── MCP Server ────────────────────────────────────────────────────────────────

const handler = createMcpHandler(
  (server) => {
    // ──────────────────────────────────────────────────────────────────────────
    // DECISION MANAGEMENT
    // ──────────────────────────────────────────────────────────────────────────

    server.tool(
      'list_decisions',
      'List all decisions for a user. Returns title, category, lock status, interrogation count, and option labels.',
      {
        userId: z.string().uuid().describe('User ID'),
        limit: z.number().int().min(1).max(100).default(20).optional(),
        category: z.enum(CATEGORIES).optional().describe('Filter by category'),
        locked: z.boolean().optional().describe('true = locked only, false = unlocked only'),
      },
      async ({ userId, limit = 20, category, locked }) => {
        try {
          const rows = await db.query.decisions.findMany({
            where: and(
              eq(decisions.userId, userId),
              category ? eq(decisions.category, category) : undefined,
              locked === true ? isNotNull(decisions.lockedAt) : undefined,
              locked === false ? isNull(decisions.lockedAt) : undefined,
            ),
            with: { options: true, chosenOption: true },
            limit,
            orderBy: [desc(decisions.createdAt)],
          })

          return ok({ decisions: rows, count: rows.length })
        } catch (e) {
          return fail(`Failed to list decisions: ${e}`)
        }
      },
    )

    server.tool(
      'get_decision',
      'Get full detail for a single decision including all options, interrogation sessions, latest recommendation, and reflections.',
      {
        userId: z.string().uuid().describe('User ID (for authorization)'),
        decisionId: z.string().uuid(),
      },
      async ({ userId, decisionId }) => {
        try {
          const decision = await db.query.decisions.findFirst({
            where: and(eq(decisions.id, decisionId), eq(decisions.userId, userId)),
            with: {
              options: true,
              chosenOption: true,
              interrogationSessions: true,
              recommendations: { orderBy: [desc(recommendations.createdAt)] },
              reflections: { orderBy: [desc(reflections.scheduledFor)] },
            },
          })
          if (!decision) return fail('Decision not found or access denied')
          return ok(decision)
        } catch (e) {
          return fail(`Failed to get decision: ${e}`)
        }
      },
    )

    server.tool(
      'create_decision',
      'Create a new decision with title, summary, category, and initial options. Automatically schedules 1-month and 3-month reflections.',
      {
        userId: z.string().uuid(),
        title: z.string().min(1).max(300).describe('Short title for the decision'),
        summary: z.string().max(2000).optional().describe('Detailed context about what makes this decision hard'),
        category: z.enum(CATEGORIES),
        options: z
          .array(
            z.object({
              label: z.string().min(1).max(200),
              pros: z.array(z.string()).default([]),
              cons: z.array(z.string()).default([]),
            }),
          )
          .min(1)
          .max(8)
          .describe('Options being considered'),
      },
      async ({ userId, title, summary, category, options: optionInputs }) => {
        try {
          const [decision] = await db
            .insert(decisions)
            .values({ userId, title, summary, category })
            .returning()

          const insertedOptions = await db
            .insert(decisionOptions)
            .values(
              optionInputs.map((opt, i) => ({
                decisionId: decision.id,
                label: opt.label,
                pros: opt.pros,
                cons: opt.cons,
                position: i,
              })),
            )
            .returning()

          const now = new Date()
          const oneMonth = new Date(now)
          oneMonth.setMonth(oneMonth.getMonth() + 1)
          const threeMonth = new Date(now)
          threeMonth.setMonth(threeMonth.getMonth() + 3)

          await db.insert(reflections).values([
            {
              decisionId: decision.id,
              scheduledFor: oneMonth.toISOString().split('T')[0],
              intervalType: 'standard',
              intervalLabel: '1mo',
            },
            {
              decisionId: decision.id,
              scheduledFor: threeMonth.toISOString().split('T')[0],
              intervalType: 'standard',
              intervalLabel: '3mo',
            },
          ])

          return ok({ decision, options: insertedOptions, reflectionsScheduled: 2 })
        } catch (e) {
          return fail(`Failed to create decision: ${e}`)
        }
      },
    )

    server.tool(
      'update_decision',
      'Update a decision\'s title, summary, chosen option, or reasoning. Returns an error if the decision is locked.',
      {
        userId: z.string().uuid(),
        decisionId: z.string().uuid(),
        title: z.string().min(1).max(300).optional(),
        summary: z.string().max(2000).optional(),
        chosenOptionId: z.string().uuid().optional().describe('ID of the option the user chose'),
        reasoning: z.string().max(3000).optional().describe('Reasoning for the final choice'),
      },
      async ({ userId, decisionId, title, summary, chosenOptionId, reasoning }) => {
        try {
          const existing = await db.query.decisions.findFirst({
            where: and(eq(decisions.id, decisionId), eq(decisions.userId, userId)),
          })
          if (!existing) return fail('Decision not found or access denied')
          if (existing.lockedAt) return fail('Decision is locked — call unlock_decision first')

          const [updated] = await db
            .update(decisions)
            .set({
              ...(title !== undefined && { title }),
              ...(summary !== undefined && { summary }),
              ...(chosenOptionId !== undefined && { chosenOptionId }),
              ...(reasoning !== undefined && { reasoning }),
              updatedAt: new Date(),
            })
            .where(and(eq(decisions.id, decisionId), eq(decisions.userId, userId)))
            .returning()

          return ok(updated)
        } catch (e) {
          return fail(`Failed to update decision: ${e}`)
        }
      },
    )

    server.tool(
      'add_decision_option',
      'Add a new option to an existing decision',
      {
        userId: z.string().uuid(),
        decisionId: z.string().uuid(),
        label: z.string().min(1).max(200),
        pros: z.array(z.string()).default([]),
        cons: z.array(z.string()).default([]),
      },
      async ({ userId, decisionId, label, pros, cons }) => {
        try {
          const decision = await db.query.decisions.findFirst({
            where: and(eq(decisions.id, decisionId), eq(decisions.userId, userId)),
            with: { options: true },
          })
          if (!decision) return fail('Decision not found or access denied')
          if (decision.lockedAt) return fail('Decision is locked')

          const [option] = await db
            .insert(decisionOptions)
            .values({ decisionId, label, pros, cons, position: decision.options.length })
            .returning()

          return ok(option)
        } catch (e) {
          return fail(`Failed to add option: ${e}`)
        }
      },
    )

    server.tool(
      'lock_decision',
      'Lock a decision to signal it has been made and prevent further edits',
      {
        userId: z.string().uuid(),
        decisionId: z.string().uuid(),
      },
      async ({ userId, decisionId }) => {
        try {
          const [updated] = await db
            .update(decisions)
            .set({ lockedAt: new Date() })
            .where(
              and(
                eq(decisions.id, decisionId),
                eq(decisions.userId, userId),
                isNull(decisions.lockedAt),
              ),
            )
            .returning()
          if (!updated) return fail('Decision not found, already locked, or access denied')
          return ok({ locked: true, lockedAt: updated.lockedAt })
        } catch (e) {
          return fail(`Failed to lock decision: ${e}`)
        }
      },
    )

    server.tool(
      'unlock_decision',
      'Unlock a previously locked decision to allow edits',
      {
        userId: z.string().uuid(),
        decisionId: z.string().uuid(),
      },
      async ({ userId, decisionId }) => {
        try {
          const [updated] = await db
            .update(decisions)
            .set({ lockedAt: null })
            .where(
              and(
                eq(decisions.id, decisionId),
                eq(decisions.userId, userId),
                isNotNull(decisions.lockedAt),
              ),
            )
            .returning()
          if (!updated) return fail('Decision not found, not locked, or access denied')
          return ok({ locked: false })
        } catch (e) {
          return fail(`Failed to unlock decision: ${e}`)
        }
      },
    )

    // ──────────────────────────────────────────────────────────────────────────
    // SOCRATIC INTERROGATION
    // ──────────────────────────────────────────────────────────────────────────

    server.tool(
      'start_interrogation',
      'Begin a Socratic interrogation session for a decision. Returns a session ID and the first probing question. The AI uses a full 72-blocker taxonomy to guide questioning and detect psychological patterns.',
      {
        userId: z.string().uuid(),
        decisionId: z.string().uuid(),
        coachingStyle: z
          .enum(COACHING_STYLES)
          .describe(
            'advisor = balanced mentor, supporter = warm and validating, critic = direct and challenging',
          ),
        appealNote: z
          .string()
          .max(500)
          .optional()
          .describe(
            'What was missing from a previous recommendation — used when re-interrogating a decision',
          ),
      },
      async ({ userId, decisionId, coachingStyle, appealNote }) => {
        try {
          const decision = await db.query.decisions.findFirst({
            where: and(eq(decisions.id, decisionId), eq(decisions.userId, userId)),
            with: { options: true },
          })
          if (!decision) return fail('Decision not found or access denied')

          const user = await db.query.users.findFirst({ where: eq(users.id, userId) })

          const [session] = await db
            .insert(interrogationSessions)
            .values({
              decisionId,
              coachingStyle,
              appealNote,
              profileSnapshot: user?.profileAnswers ?? {},
              turns: [],
            })
            .returning()

          await db
            .update(decisions)
            .set({ interrogationCount: decision.interrogationCount + 1, updatedAt: new Date() })
            .where(eq(decisions.id, decisionId))

          const systemPrompt = buildSocraticPrompt(
            decision,
            decision.options,
            coachingStyle,
            user?.profileAnswers ?? null,
          )

          const openingPrompt = appealNote
            ? `Re-interrogation. The user said what was missing: "${appealNote}". Start fresh with a targeted question that addresses this gap.`
            : `Opening turn. Ask a broad question that surfaces the core tension or unspoken assumption in this decision.`

          const { text: firstQuestion } = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            system: systemPrompt,
            prompt: openingPrompt,
            maxTokens: 120,
          })

          const turns = [{ role: 'assistant', content: firstQuestion, id: crypto.randomUUID() }]
          await db
            .update(interrogationSessions)
            .set({ turns })
            .where(eq(interrogationSessions.id, session.id))

          return ok({
            sessionId: session.id,
            firstQuestion,
            decisionTitle: decision.title,
            userResponseCount: 0,
            canComplete: false,
            hint: 'Call continue_interrogation with the sessionId and user responses. After 5 responses, call complete_interrogation.',
          })
        } catch (e) {
          return fail(`Failed to start interrogation: ${e}`)
        }
      },
    )

    server.tool(
      'continue_interrogation',
      'Advance the Socratic interrogation by submitting a user response. Returns the next probing question. After 5 user responses, canComplete becomes true.',
      {
        userId: z.string().uuid(),
        sessionId: z.string().uuid(),
        userMessage: z
          .string()
          .min(1)
          .max(3000)
          .describe("The user's response to the previous question"),
      },
      async ({ userId, sessionId, userMessage }) => {
        try {
          const session = await db.query.interrogationSessions.findFirst({
            where: eq(interrogationSessions.id, sessionId),
            with: { decision: { with: { options: true } } },
          })
          if (!session) return fail('Session not found')
          if (session.decision.userId !== userId) return fail('Access denied')

          const existingTurns = (session.turns ?? []) as {
            role: string
            content: string
            id: string
          }[]
          const userTurn = { role: 'user', content: userMessage, id: crypto.randomUUID() }
          const turnsWithUser = [...existingTurns, userTurn]

          const systemPrompt = buildSocraticPrompt(
            session.decision,
            session.decision.options,
            session.coachingStyle,
            session.profileSnapshot as Record<string, unknown> | null,
          )

          const { text: nextQuestion } = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            system: systemPrompt,
            messages: turnsWithUser.map((t) => ({
              role: t.role as 'user' | 'assistant',
              content: t.content,
            })),
            maxTokens: 120,
          })

          const assistantTurn = {
            role: 'assistant',
            content: nextQuestion,
            id: crypto.randomUUID(),
          }
          const finalTurns = [...turnsWithUser, assistantTurn]

          await db
            .update(interrogationSessions)
            .set({ turns: finalTurns })
            .where(eq(interrogationSessions.id, sessionId))

          const userResponseCount = finalTurns.filter((t) => t.role === 'user').length

          return ok({
            nextQuestion,
            userResponseCount,
            canComplete: userResponseCount >= 5,
            hint:
              userResponseCount < 5
                ? `${5 - userResponseCount} more response(s) needed before complete_interrogation`
                : 'Ready — call complete_interrogation to generate recommendation and detect patterns',
          })
        } catch (e) {
          return fail(`Failed to continue interrogation: ${e}`)
        }
      },
    )

    server.tool(
      'complete_interrogation',
      'End the interrogation session and generate a recommendation plus a psychological blocker profile. Requires at least 5 user responses. Detects cognitive patterns from the full 72-blocker taxonomy and fires async pattern alert updates.',
      {
        userId: z.string().uuid(),
        sessionId: z.string().uuid(),
      },
      async ({ userId, sessionId }) => {
        try {
          const session = await db.query.interrogationSessions.findFirst({
            where: eq(interrogationSessions.id, sessionId),
            with: { decision: { with: { options: true } } },
          })
          if (!session) return fail('Session not found')
          if (session.decision.userId !== userId) return fail('Access denied')

          const turns = (session.turns ?? []) as { role: string; content: string; id: string }[]
          const userResponseCount = turns.filter((t) => t.role === 'user').length

          if (userResponseCount < 5) {
            return fail(
              `Need at least 5 user responses (currently ${userResponseCount}). Call continue_interrogation first.`,
            )
          }

          const conversationText = turns
            .map((t) => `${t.role.toUpperCase()}: ${t.content}`)
            .join('\n\n')

          const { object: rec } = await generateObject({
            model: groq('llama-3.3-70b-versatile'),
            schema: z.object({
              answer: z.string().max(200).describe('Clear recommendation in 1-2 sentences'),
              rationale: z
                .string()
                .max(600)
                .describe('Reasoning behind the recommendation in 3-5 sentences'),
              evidence: z
                .array(
                  z.object({
                    pattern: z.string().describe('Name of the pattern or theme observed'),
                    finding: z.string().describe('Specific observation from the conversation'),
                  }),
                )
                .max(5),
            }),
            prompt: `Based on this Socratic interrogation about "${session.decision.title}", generate a recommendation.

Options: ${session.decision.options.map((o) => `"${o.label}"`).join(', ')}
Context: ${session.decision.summary ?? 'Not provided'}

Conversation:
${conversationText}

Generate a clear recommendation with rationale and up to 5 key evidence patterns from the conversation.`,
            maxTokens: 600,
          })

          const [recommendation] = await db
            .insert(recommendations)
            .values({
              decisionId: session.decision.id,
              interrogationSessionId: sessionId,
              answer: rec.answer,
              rationale: rec.rationale,
              evidence: rec.evidence,
            })
            .returning()

          const detectedBlockerIds = await detectBlockersInText(conversationText)
          const detectedBlockers = BLOCKERS.filter((b) => detectedBlockerIds.includes(b.id))

          classifyAndUpdatePatterns(userId, session.decision.id, detectedBlockerIds).catch(
            console.error,
          )

          return ok({
            recommendationId: recommendation.id,
            recommendation: {
              answer: rec.answer,
              rationale: rec.rationale,
              evidence: rec.evidence,
            },
            detectedBlockers: detectedBlockers.map((b) => ({
              id: b.id,
              name: b.name,
              category: b.category,
              categoryLabel: BLOCKER_CATEGORIES[b.category],
              description: b.description,
              mechanism: b.mechanism,
            })),
            primaryBlocker: detectedBlockers[0]?.name ?? null,
            blockerCategories: [
              ...new Set(detectedBlockers.map((b) => b.category)),
            ].map((cat) => ({ id: cat, label: BLOCKER_CATEGORIES[cat] })),
            hint: 'Call list_patterns to see cross-decision pattern alerts, or cross_decision_insights for a full synthesis.',
          })
        } catch (e) {
          return fail(`Failed to complete interrogation: ${e}`)
        }
      },
    )

    // ──────────────────────────────────────────────────────────────────────────
    // PATTERN ENGINE
    // ──────────────────────────────────────────────────────────────────────────

    server.tool(
      'list_patterns',
      'List detected pattern alerts for a user. Patterns surface when the same psychological blocker appears across multiple decisions above the detection threshold. Each alert links to the decisions where the pattern was observed.',
      {
        userId: z.string().uuid(),
        includeDismissed: z.boolean().default(false).optional(),
      },
      async ({ userId, includeDismissed = false }) => {
        try {
          const alerts = await db.query.patternAlerts.findMany({
            where: and(
              eq(patternAlerts.userId, userId),
              !includeDismissed ? isNull(patternAlerts.dismissedAt) : undefined,
            ),
            with: {
              patternType: true,
              decisions: { with: { decision: true } },
            },
            orderBy: [desc(patternAlerts.detectedAt)],
          })

          const thresholded = alerts.filter(
            (a) => a.decisions.length >= a.patternType.detectionThreshold,
          )

          return ok({
            patterns: thresholded.map((a) => ({
              id: a.id,
              pattern: a.patternType.title,
              slug: a.patternType.slug,
              description: a.patternType.description,
              detectedAt: a.detectedAt,
              dismissed: !!a.dismissedAt,
              decisionCount: a.decisions.length,
              threshold: a.patternType.detectionThreshold,
              relatedDecisions: a.decisions.map((d) => ({
                id: d.decision.id,
                title: d.decision.title,
                category: d.decision.category,
                createdAt: d.decision.createdAt,
              })),
            })),
            count: thresholded.length,
          })
        } catch (e) {
          return fail(`Failed to list patterns: ${e}`)
        }
      },
    )

    server.tool(
      'dismiss_pattern',
      'Dismiss a pattern alert — signals the user has acknowledged and processed this pattern',
      {
        userId: z.string().uuid(),
        patternAlertId: z.string().uuid(),
      },
      async ({ userId, patternAlertId }) => {
        try {
          const [updated] = await db
            .update(patternAlerts)
            .set({ dismissedAt: new Date() })
            .where(
              and(
                eq(patternAlerts.id, patternAlertId),
                eq(patternAlerts.userId, userId),
                isNull(patternAlerts.dismissedAt),
              ),
            )
            .returning()
          if (!updated) return fail('Alert not found, already dismissed, or access denied')
          return ok({ dismissed: true, dismissedAt: updated.dismissedAt })
        } catch (e) {
          return fail(`Failed to dismiss pattern: ${e}`)
        }
      },
    )

    server.tool(
      'get_blocker_taxonomy',
      'Return the complete taxonomy of 72 psychological decision-making blockers across 8 categories: cognitive_bias, self_perception_bias, emotional_blocker, processing_bias, decision_bias, temporal_bias, inertia_bias, social_bias. Use this to understand the full landscape before analyzing decisions.',
      {},
      async () => {
        return ok({
          categories: Object.entries(BLOCKER_CATEGORIES).map(([id, description]) => ({
            id,
            description,
            blockers: BLOCKERS.filter((b) => b.category === id).map((b) => b.id),
            count: BLOCKERS.filter((b) => b.category === id).length,
          })),
          blockers: BLOCKERS,
          totalCount: BLOCKERS.length,
        })
      },
    )

    server.tool(
      'analyze_for_blockers',
      'Analyze a piece of text (decision context, conversation excerpt, or reasoning) for psychological decision-making blockers from the full 67-blocker taxonomy. Returns detected blockers with confidence levels and specific evidence.',
      {
        text: z
          .string()
          .min(10)
          .max(5000)
          .describe('Text to analyze — decision context, reasoning, or conversation excerpt'),
        topN: z
          .number()
          .int()
          .min(1)
          .max(10)
          .default(5)
          .optional()
          .describe('Maximum blockers to return'),
      },
      async ({ text, topN = 5 }) => {
        try {
          const { object } = await generateObject({
            model: groq('llama-3.1-8b-instant'),
            schema: z.object({
              detected: z
                .array(
                  z.object({
                    blockerId: z.enum(BLOCKER_IDS),
                    confidence: z.enum(['high', 'medium', 'low']),
                    evidence: z
                      .string()
                      .max(200)
                      .describe('Specific phrase or pattern from the text as evidence'),
                  }),
                )
                .max(topN),
            }),
            prompt: `Analyze this text for psychological decision-making blockers. Only include blockers with specific text evidence.

Known blockers (id: name — description):
${BLOCKERS.map((b) => `${b.id}: ${b.name} — ${b.description}`).join('\n')}

Text:
"${text}"

Return only blockers with clear textual evidence. Include confidence level and exact quote or pattern as evidence.`,
            maxTokens: 500,
          })

          const enriched = object.detected.map((d) => {
            const blocker = BLOCKERS.find((b) => b.id === d.blockerId)!
            return {
              ...d,
              name: blocker.name,
              category: blocker.category,
              categoryLabel: BLOCKER_CATEGORIES[blocker.category],
              description: blocker.description,
              mechanism: blocker.mechanism,
            }
          })

          const categorySummary = Object.entries(
            enriched.reduce(
              (acc, b) => {
                acc[b.category] = (acc[b.category] ?? 0) + 1
                return acc
              },
              {} as Record<string, number>,
            ),
          ).map(([cat, count]) => ({ category: cat, label: BLOCKER_CATEGORIES[cat], count }))

          return ok({ detectedBlockers: enriched, categorySummary, count: enriched.length })
        } catch (e) {
          return fail(`Failed to analyze blockers: ${e}`)
        }
      },
    )

    server.tool(
      'cross_decision_insights',
      'Surface cross-context insights across a user\'s full decision history. Identifies recurring psychological patterns by category, dominant blocker types, decision readiness score, and an AI-generated synthesis of the user\'s decision-making fingerprint.',
      {
        userId: z.string().uuid(),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .default(20)
          .optional()
          .describe('Number of recent decisions to analyze'),
      },
      async ({ userId, limit = 20 }) => {
        try {
          const userDecisions = await db.query.decisions.findMany({
            where: eq(decisions.userId, userId),
            with: {
              options: true,
              interrogationSessions: true,
              recommendations: { orderBy: [desc(recommendations.createdAt)] },
            },
            limit,
            orderBy: [desc(decisions.createdAt)],
          })

          if (userDecisions.length === 0) {
            return ok({
              synthesis:
                'No decisions logged yet. Start by creating a decision with create_decision.',
              totalDecisions: 0,
              patterns: [],
              blockerProfile: {},
            })
          }

          const activeAlerts = await db.query.patternAlerts.findMany({
            where: and(eq(patternAlerts.userId, userId), isNull(patternAlerts.dismissedAt)),
            with: {
              patternType: true,
              decisions: { with: { decision: true } },
            },
          })

          const thresholdedAlerts = activeAlerts.filter(
            (a) => a.decisions.length >= a.patternType.detectionThreshold,
          )

          // Tally patterns from recommendation evidence
          const patternFreq: Record<string, number> = {}
          for (const d of userDecisions) {
            for (const r of d.recommendations) {
              for (const ev of (r.evidence as { pattern: string; finding: string }[]) ?? []) {
                patternFreq[ev.pattern] = (patternFreq[ev.pattern] ?? 0) + 1
              }
            }
          }

          const topPatterns = Object.entries(patternFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([pattern, occurrences]) => ({ pattern, occurrences }))

          const categoryDist = userDecisions.reduce(
            (acc, d) => {
              acc[d.category] = (acc[d.category] ?? 0) + 1
              return acc
            },
            {} as Record<string, number>,
          )

          const interrogatedCount = userDecisions.filter((d) => d.interrogationCount > 0).length
          const decisionReadiness = Math.round(
            (interrogatedCount / Math.max(userDecisions.length, 1)) * 100,
          )

          const context = [
            `${userDecisions.length} decisions across: ${JSON.stringify(categoryDist)}`,
            `Interrogated: ${interrogatedCount}/${userDecisions.length} (${decisionReadiness}% readiness)`,
            `Top recurring patterns: ${topPatterns
              .slice(0, 5)
              .map((p) => p.pattern)
              .join(', ')}`,
            `Active pattern alerts: ${
              thresholdedAlerts.map((a) => a.patternType.title).join(', ') || 'none'
            }`,
          ].join('\n')

          const { text: synthesis } = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            system:
              'You are a decision intelligence analyst. Write a 3-4 sentence synthesis of this person\'s decision-making fingerprint. Be specific, insightful, and name the key blind spots and strengths. No bullet points.',
            prompt: context,
            maxTokens: 220,
          })

          return ok({
            synthesis,
            totalDecisions: userDecisions.length,
            interrogatedDecisions: interrogatedCount,
            decisionReadiness,
            categoryDistribution: categoryDist,
            topRecurringPatterns: topPatterns,
            activePatternAlerts: thresholdedAlerts.map((a) => ({
              pattern: a.patternType.title,
              slug: a.patternType.slug,
              decisionCount: a.decisions.length,
              threshold: a.patternType.detectionThreshold,
            })),
          })
        } catch (e) {
          return fail(`Failed to generate insights: ${e}`)
        }
      },
    )

    // ──────────────────────────────────────────────────────────────────────────
    // REFLECTIONS
    // ──────────────────────────────────────────────────────────────────────────

    server.tool(
      'list_reflections',
      'List scheduled decision reflections (1-month and 3-month check-ins). Filter by pending or completed.',
      {
        userId: z.string().uuid(),
        status: z.enum(['pending', 'completed', 'all']).default('all').optional(),
      },
      async ({ userId, status = 'all' }) => {
        try {
          const userDecisionIds = await db.query.decisions.findMany({
            where: eq(decisions.userId, userId),
            columns: { id: true },
          })
          const decisionIds = userDecisionIds.map((d) => d.id)
          if (decisionIds.length === 0) return ok({ reflections: [], count: 0 })

          const all = await db.query.reflections.findMany({
            where: inArray(reflections.decisionId, decisionIds),
            with: { decision: { columns: { id: true, title: true, category: true } } },
            orderBy: [desc(reflections.scheduledFor)],
          })

          const filtered = all.filter((r) => {
            if (status === 'pending') return !r.completedAt
            if (status === 'completed') return !!r.completedAt
            return true
          })

          return ok({ reflections: filtered, count: filtered.length })
        } catch (e) {
          return fail(`Failed to list reflections: ${e}`)
        }
      },
    )

    server.tool(
      'complete_reflection',
      'Mark a scheduled reflection as completed with written content on how the decision played out',
      {
        userId: z.string().uuid(),
        reflectionId: z.string().uuid(),
        content: z
          .string()
          .min(10)
          .max(5000)
          .describe("The user's reflection on what actually happened after the decision"),
      },
      async ({ userId, reflectionId, content }) => {
        try {
          const reflection = await db.query.reflections.findFirst({
            where: eq(reflections.id, reflectionId),
            with: { decision: { columns: { userId: true } } },
          })
          if (!reflection) return fail('Reflection not found')
          if (reflection.decision.userId !== userId) return fail('Access denied')
          if (reflection.completedAt) return fail('Reflection already completed')

          const [updated] = await db
            .update(reflections)
            .set({ completedAt: new Date(), content })
            .where(eq(reflections.id, reflectionId))
            .returning()

          return ok(updated)
        } catch (e) {
          return fail(`Failed to complete reflection: ${e}`)
        }
      },
    )

    // ──────────────────────────────────────────────────────────────────────────
    // USER PROFILE
    // ──────────────────────────────────────────────────────────────────────────

    server.tool(
      'get_profile',
      'Get a user\'s decision-making profile including calibration score, role context, and diagnostic answers',
      {
        userId: z.string().uuid(),
      },
      async ({ userId }) => {
        try {
          const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: {
              id: true,
              name: true,
              email: true,
              initials: true,
              role: true,
              decisionContext: true,
              profileAnswers: true,
              calibration: true,
              onboardingCompleted: true,
              createdAt: true,
            },
          })
          if (!user) return fail('User not found')
          return ok(user)
        } catch (e) {
          return fail(`Failed to get profile: ${e}`)
        }
      },
    )

    server.tool(
      'update_profile',
      'Update a user\'s profile — name, role, decision context, calibration score, or diagnostic profile answers',
      {
        userId: z.string().uuid(),
        name: z.string().max(200).optional(),
        role: z.string().max(200).optional(),
        decisionContext: z
          .string()
          .max(1000)
          .optional()
          .describe('What kinds of decisions this user typically faces'),
        calibration: z
          .number()
          .int()
          .min(0)
          .max(100)
          .optional()
          .describe('Overall decision quality score (0–100)'),
        profileAnswers: z
          .record(z.unknown())
          .optional()
          .describe(
            'Diagnostic profile answers: areas, struggles, risk (1-5), pace (1-5), triggers, push (1-5), consult',
          ),
      },
      async ({ userId, name, role, decisionContext, calibration, profileAnswers }) => {
        try {
          const [updated] = await db
            .update(users)
            .set({
              ...(name !== undefined && { name }),
              ...(role !== undefined && { role }),
              ...(decisionContext !== undefined && { decisionContext }),
              ...(calibration !== undefined && { calibration }),
              ...(profileAnswers !== undefined && { profileAnswers }),
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning({
              id: users.id,
              name: users.name,
              role: users.role,
              decisionContext: users.decisionContext,
              calibration: users.calibration,
              profileAnswers: users.profileAnswers,
            })
          if (!updated) return fail('User not found')
          return ok(updated)
        } catch (e) {
          return fail(`Failed to update profile: ${e}`)
        }
      },
    )
  },
  {
    serverInfo: {
      name: 'blindspot-decision-intelligence',
      version: '1.0.0',
    },
    capabilities: { tools: {} },
  },
  {
    streamableHttpEndpoint: '/api/mcp',
    verboseLogs: process.env.NODE_ENV === 'development',
  },
)

export { handler as GET, handler as POST, handler as DELETE }
