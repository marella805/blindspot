/**
 * Aristotle — The Pattern Analyst
 *
 * Aristotle was the first systematic categorizer of knowledge. This agent
 * runs weekly, scans each user's recent decisions for emerging cognitive bias
 * patterns, and surfaces what they keep doing — even when they can't see it.
 *
 * Cron: Sundays at 7 AM  →  vercel.json: "0 7 * * 0"
 */
import { generateObject } from 'ai'
import { groq } from '@/lib/ai'
import { resend, verifyCron } from '@/lib/agents'
import { db } from '@/lib/db'
import { decisions, users, patternAlerts, patternTypes } from '@/lib/db/schema'
import { eq, gte, inArray } from 'drizzle-orm'
import { z } from 'zod'

const AnalysisSchema = z.object({
  patterns: z.array(z.object({
    slug: z.string(),
    evidence: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
  })),
  summary: z.string(),
})

export async function GET(req: Request) {
  if (!verifyCron(req)) return new Response(null, { status: 401 })

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Get all users who made decisions in the last 7 days
  const recentDecisions = await db.query.decisions.findMany({
    where: gte(decisions.createdAt, sevenDaysAgo),
    with: {
      user: true,
      interrogationSessions: { columns: { turns: true } },
    },
  })

  const byUser = new Map<string, { user: typeof recentDecisions[0]['user']; decisions: typeof recentDecisions }>()
  for (const d of recentDecisions) {
    if (!d.user?.email) continue
    const entry = byUser.get(d.userId) ?? { user: d.user, decisions: [] }
    entry.decisions.push(d)
    byUser.set(d.userId, entry)
  }

  const knownPatterns = await db.query.patternTypes.findMany()
  const patternList = knownPatterns.map(p => `${p.slug}: ${p.title} — ${p.description}`).join('\n')

  let analysed = 0
  for (const { user, decisions: userDecisions } of byUser.values()) {
    if (!user?.email || userDecisions.length < 2) continue

    const decisionSummary = userDecisions.map(d =>
      `"${d.title}" (${d.category}) — interrogated ${d.interrogationCount}x`
    ).join('\n')

    const { object } = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      schema: AnalysisSchema,
      prompt: `You are Aristotle, a pattern analysis agent for Blindspot.
Analyse the following recent decisions made by ${user.name ?? 'a user'} and identify any cognitive bias patterns.

Known bias patterns (use their exact slugs):
${patternList}

User's decisions this week:
${decisionSummary}

Return only patterns you have real evidence for. Be conservative — 1-2 patterns is better than 5 weak ones.
Write a 2-sentence summary of what you observe about this person's decision-making style this week.`,
    })

    if (object.patterns.length > 0) {
      await resend.emails.send({
        from: 'Blindspot <patterns@resend.dev>',
        to: user.email,
        subject: `Aristotle found a pattern in your decisions this week`,
        text: `${object.summary}\n\nPatterns detected:\n${object.patterns.map(p => `• ${p.slug} (${p.severity}): ${p.evidence}`).join('\n')}\n\nOpen Blindspot to review your patterns.\n\n— Aristotle · Blindspot`,
      })
    }

    analysed++
  }

  return Response.json({ analysed, usersWithDecisions: byUser.size })
}
