import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { decisions, interrogationSessions, reflections, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const body = await req.json()
  const { decisionTitle, coachingStyle = 'advisor' } = body

  if (!decisionTitle?.trim()) {
    return Response.json({ error: 'decisionTitle is required' }, { status: 400 })
  }

  // Snapshot the user's current profile answers
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { profileAnswers: true },
  })

  const [decision] = await db
    .insert(decisions)
    .values({
      userId: session.user.id,
      title: decisionTitle.trim(),
      category: 'other',
    })
    .returning()

  // Schedule 1-month and 3-month reflections at creation time
  const now = new Date()
  const oneMonth = new Date(now)
  oneMonth.setMonth(oneMonth.getMonth() + 1)
  const threeMonth = new Date(now)
  threeMonth.setMonth(threeMonth.getMonth() + 3)

  await db.insert(reflections).values([
    {
      decisionId: decision.id,
      scheduledFor: oneMonth.toISOString().slice(0, 10),
      intervalType: 'standard' as const,
      intervalLabel: '1mo' as const,
    },
    {
      decisionId: decision.id,
      scheduledFor: threeMonth.toISOString().slice(0, 10),
      intervalType: 'standard' as const,
      intervalLabel: '3mo' as const,
    },
  ])

  const [interrogationSession] = await db
    .insert(interrogationSessions)
    .values({
      decisionId: decision.id,
      coachingStyle,
      profileSnapshot: user?.profileAnswers ?? undefined,
    })
    .returning()

  return Response.json(
    { decisionId: decision.id, sessionId: interrogationSession.id },
    { status: 201 }
  )
}
