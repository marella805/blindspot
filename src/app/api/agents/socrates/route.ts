/**
 * Socrates — The Interrogation Nudge
 *
 * Socrates believed an unexamined life is not worth living. This agent finds
 * decisions that have been logged but never interrogated, and pushes the user
 * to sit down with the hard questions before they lock in.
 *
 * Cron: daily at 8 AM  →  vercel.json: "0 8 * * *"
 */
import { generateText } from 'ai'
import { groq } from '@/lib/ai'
import { getResend, verifyCron } from '@/lib/agents'
import { db } from '@/lib/db'
import { decisions, users } from '@/lib/db/schema'
import { and, eq, lte } from 'drizzle-orm'

export async function GET(req: Request) {
  if (!verifyCron(req)) return new Response(null, { status: 401 })

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // older than 24h

  const unexamined = await db.query.decisions.findMany({
    where: and(
      eq(decisions.interrogationCount, 0),
      lte(decisions.createdAt, cutoff),
    ),
    with: { user: true },
  })

  // Deduplicate: one email per user with all their unexamined decisions
  const byUser = new Map<string, { user: typeof unexamined[0]['user']; titles: string[] }>()
  for (const d of unexamined) {
    if (!d.user?.email) continue
    const entry = byUser.get(d.userId) ?? { user: d.user, titles: [] }
    entry.titles.push(d.title)
    byUser.set(d.userId, entry)
  }

  let sent = 0
  for (const { user, titles } of byUser.values()) {
    if (!user?.email) continue

    const decisionList = titles.map(t => `• "${t}"`).join('\n')

    const { text: body } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: `You are Socrates, the interrogation nudge agent for Blindspot.
Write a short, pointed email to ${user.name ?? 'a user'} who has logged decisions but not interrogated them yet.

Unexamined decisions:
${decisionList}

Rules:
- 3–4 sentences. Blunt, not rude.
- Channel Socratic irony: make them feel the cost of NOT examining these decisions.
- Do not list the decisions in the email body — just reference the count.
- End with a single direct call to action.
- Sign as "Socrates · Blindspot"`,
    })

    await getResend().emails.send({
      from: 'Blindspot <nudge@resend.dev>',
      to: user.email,
      subject: `${titles.length} decision${titles.length > 1 ? 's' : ''} waiting to be examined`,
      text: body,
    })

    sent++
  }

  return Response.json({ sent, usersNudged: byUser.size })
}
