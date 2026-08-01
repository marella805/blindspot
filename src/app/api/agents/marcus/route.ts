/**
 * Marcus Aurelius — The Morning Briefing
 *
 * Marcus began each day writing down what needed his attention and what
 * he should brace for. This agent does the same: a short daily brief of
 * what's urgent, what's overdue, and what deserves thought today.
 *
 * Cron: daily at 7 AM  →  vercel.json: "0 7 * * *"
 */
import { generateText } from 'ai'
import { groq } from '@/lib/ai'
import { resend, verifyCron } from '@/lib/agents'
import { db } from '@/lib/db'
import { decisions, reflections, patternAlerts, users } from '@/lib/db/schema'
import { and, eq, isNull, lte, isNotNull } from 'drizzle-orm'

export async function GET(req: Request) {
  if (!verifyCron(req)) return new Response(null, { status: 401 })

  const today = new Date().toISOString().slice(0, 10)
  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000)

  const allUsers = await db.query.users.findMany({
    where: isNotNull(users.onboardingCompleted),
  })

  let sent = 0
  for (const user of allUsers) {
    if (!user.email) continue

    const [unexamined, overdueReflections, activePatterns] = await Promise.all([
      db.query.decisions.findMany({
        where: and(
          eq(decisions.userId, user.id),
          eq(decisions.interrogationCount, 0),
          lte(decisions.createdAt, cutoff48h),
        ),
        columns: { title: true },
      }),
      db.query.reflections.findMany({
        where: and(isNull(reflections.completedAt), lte(reflections.scheduledFor, today)),
        with: { decision: { columns: { userId: true, title: true } } },
      }).then(rows => rows.filter(r => r.decision.userId === user.id)),
      db.query.patternAlerts.findMany({
        where: eq(patternAlerts.userId, user.id),
      }).then(rows => rows.filter(r => !r.dismissedAt)),
    ])

    // Only send if there's something actually worth briefing on
    if (unexamined.length === 0 && overdueReflections.length === 0 && activePatterns.length === 0) continue

    const agenda: string[] = []
    if (unexamined.length > 0)
      agenda.push(`${unexamined.length} uninterrogated decision${unexamined.length > 1 ? 's' : ''}: ${unexamined.map(d => `"${d.title}"`).join(', ')}`)
    if (overdueReflections.length > 0)
      agenda.push(`${overdueReflections.length} overdue reflection${overdueReflections.length > 1 ? 's' : ''}`)
    if (activePatterns.length > 0)
      agenda.push(`${activePatterns.length} unresolved pattern${activePatterns.length > 1 ? 's' : ''} detected`)

    const { text: body } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: `You are Marcus Aurelius, the morning briefing agent for Blindspot.
Write a short morning note to ${user.name ?? 'a user'} about what requires their attention today.

Today's agenda:
${agenda.join('\n')}

Rules:
- 3 sentences max. Stoic, calm, action-oriented.
- Do not moralize. Just state what is real and what to do.
- One sentence of stoic grounding, then the items, then one sentence of encouragement.
- Sign as "Marcus · Blindspot"`,
    })

    await resend.emails.send({
      from: 'Blindspot <morning@resend.dev>',
      to: user.email,
      subject: `Your morning brief`,
      text: body,
    })

    sent++
  }

  return Response.json({ sent, totalUsers: allUsers.length })
}
