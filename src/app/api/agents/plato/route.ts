/**
 * Plato — The Reflection Agent
 *
 * Plato believed that looking back at the "ideal form" of a thing reveals truth.
 * This agent finds decisions whose reflection window has opened, then asks the user
 * whether reality matched their original vision.
 *
 * Cron: daily at 9 AM  →  vercel.json: "0 9 * * *"
 */
import { generateText } from 'ai'
import { groq } from '@/lib/ai'
import { resend, verifyCron } from '@/lib/agents'
import { db } from '@/lib/db'
import { reflections, decisions, users } from '@/lib/db/schema'
import { and, isNull, lte, eq } from 'drizzle-orm'

export async function GET(req: Request) {
  if (!verifyCron(req)) return new Response(null, { status: 401 })

  const today = new Date().toISOString().slice(0, 10)

  const due = await db.query.reflections.findMany({
    where: and(lte(reflections.scheduledFor, today), isNull(reflections.completedAt)),
    with: {
      decision: {
        with: { user: true },
      },
    },
  })

  let sent = 0
  for (const r of due) {
    const user = r.decision.user
    if (!user?.email) continue

    const label = r.intervalLabel === '1mo' ? '1 month' : '3 months'

    const { text: body } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: `You are Plato, the reflection agent for Blindspot — a decision intelligence tool.
Write a short, thoughtful email nudging ${user.name ?? 'a user'} to reflect on a decision they made ${label} ago.

Decision: "${r.decision.title}"
Category: ${r.decision.category}
Summary: ${r.decision.summary ?? 'no summary'}

Rules:
- 3–4 sentences max
- Warm but direct. Do not be sycophantic.
- End with one concrete question they should answer in their reflection.
- Do not use platitudes like "I hope this finds you well."
- Sign as "Plato · Blindspot"`,
    })

    await resend.emails.send({
      from: 'Blindspot <reflections@resend.dev>',
      to: user.email,
      subject: `Time to reflect: "${r.decision.title}"`,
      text: body,
    })

    sent++
  }

  return Response.json({ sent, total: due.length })
}
