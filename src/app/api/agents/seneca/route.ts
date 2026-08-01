/**
 * Seneca — The Weekly Digest
 *
 * Seneca wrote letters about time: how we waste it, how to reclaim it.
 * This agent sends each active user a weekly letter summarising what they
 * decided, reflected on, and what still demands their attention.
 *
 * Cron: Mondays at 7 AM  →  vercel.json: "0 7 * * 1"
 */
import { generateText } from 'ai'
import { groq } from '@/lib/ai'
import { resend, verifyCron } from '@/lib/agents'
import { db } from '@/lib/db'
import { decisions, reflections, patternAlerts, users } from '@/lib/db/schema'
import { eq, gte, isNotNull, and } from 'drizzle-orm'

export async function GET(req: Request) {
  if (!verifyCron(req)) return new Response(null, { status: 401 })

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const today = new Date().toISOString().slice(0, 10)

  const allUsers = await db.query.users.findMany({
    where: isNotNull(users.onboardingCompleted),
  })

  let sent = 0
  for (const user of allUsers) {
    if (!user.email) continue

    const [weekDecisions, completedReflections, pendingReflections, activePatterns] = await Promise.all([
      db.query.decisions.findMany({
        where: and(eq(decisions.userId, user.id), gte(decisions.createdAt, sevenDaysAgo)),
        columns: { title: true, category: true, interrogationCount: true },
      }),
      db.query.reflections.findMany({
        where: and(
          isNotNull(reflections.completedAt),
          gte(reflections.completedAt!, sevenDaysAgo),
        ),
        with: { decision: { columns: { userId: true, title: true } } },
      }).then(rows => rows.filter(r => r.decision.userId === user.id)),
      db.query.reflections.findMany({
        where: and(reflections.scheduledFor as any, isNotNull(reflections.scheduledFor)),
      }).then(rows => rows.filter(r =>
        r.scheduledFor <= today && !r.completedAt
      )),
      db.query.patternAlerts.findMany({
        where: and(eq(patternAlerts.userId, user.id)),
      }).then(rows => rows.filter(r => !r.dismissedAt)),
    ])

    // Skip users with no activity at all
    if (weekDecisions.length === 0 && completedReflections.length === 0) continue

    const stats = [
      weekDecisions.length > 0 ? `${weekDecisions.length} new decision${weekDecisions.length > 1 ? 's' : ''} logged` : null,
      completedReflections.length > 0 ? `${completedReflections.length} reflection${completedReflections.length > 1 ? 's' : ''} completed` : null,
      pendingReflections.length > 0 ? `${pendingReflections.length} reflection${pendingReflections.length > 1 ? 's' : ''} overdue` : null,
      activePatterns.length > 0 ? `${activePatterns.length} active pattern${activePatterns.length > 1 ? 's' : ''} flagged` : null,
    ].filter(Boolean).join(', ')

    const { text: body } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: `You are Seneca, the weekly digest agent for Blindspot — a decision intelligence tool.
Write a brief, direct weekly letter to ${user.name ?? 'a user'}.

This week: ${stats || 'no new activity'}
Decisions logged: ${weekDecisions.map(d => `"${d.title}" (${d.category}, interrogated ${d.interrogationCount}x)`).join('; ') || 'none'}

Rules:
- 4–6 sentences. One short, sharp paragraph.
- Seneca's voice: philosophical but practical. He cares about how time is spent.
- Acknowledge what they did well, name what is still unresolved.
- Do NOT use bullet points or lists.
- Sign as "Seneca · Blindspot"`,
    })

    await resend.emails.send({
      from: 'Blindspot <weekly@resend.dev>',
      to: user.email,
      subject: `Your week in decisions`,
      text: body,
    })

    sent++
  }

  return Response.json({ sent, totalUsers: allUsers.length })
}
