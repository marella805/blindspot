import { getUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { decisions, decisionOptions, interrogationSessions, reflections, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const VALID_CATEGORIES = ['career','financial','relationship','health','education','housing','business','personal_growth','other'] as const
type Category = typeof VALID_CATEGORIES[number]

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return new Response(null, { status: 401 })

  const body = await req.json()
  const {
    decisionTitle,
    coachingStyle = 'advisor',
    summary,
    category,
    options: optionLabels,
  } = body

  if (!decisionTitle?.trim()) {
    return Response.json({ error: 'decisionTitle is required' }, { status: 400 })
  }

  const resolvedCategory: Category = VALID_CATEGORIES.includes(category) ? category : 'other'

  // Snapshot the user's current profile answers
  const user = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { profileAnswers: true },
  })

  const [decision] = await db
    .insert(decisions)
    .values({
      userId: user.id,
      title: decisionTitle.trim(),
      summary: summary?.trim() || null,
      category: resolvedCategory,
    })
    .returning()

  // Persist options if provided
  const trimmedOptions = Array.isArray(optionLabels)
    ? optionLabels.map((l: string) => l?.trim()).filter(Boolean)
    : []

  if (trimmedOptions.length > 0) {
    await db.insert(decisionOptions).values(
      trimmedOptions.map((label: string, i: number) => ({
        decisionId: decision.id,
        label,
        pros: [],
        cons: [],
        position: i,
      }))
    )
  }

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
