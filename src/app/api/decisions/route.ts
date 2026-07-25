import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { decisions, decisionOptions, reflections } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const rows = await db.query.decisions.findMany({
    where: eq(decisions.userId, session.user.id),
    with: {
      options: true,
      recommendations: {
        orderBy: (r, { desc }) => [desc(r.acceptedAt)],
        limit: 1,
      },
    },
    orderBy: (d, { desc }) => [desc(d.createdAt)],
  })

  return Response.json(rows)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const body = await req.json()
  const { title, category, options = [] } = body

  const [decision] = await db
    .insert(decisions)
    .values({ userId: session.user.id, title, category })
    .returning()

  if (options.length > 0) {
    await db.insert(decisionOptions).values(
      options.map((o: { label: string; pros?: string[]; cons?: string[] }, i: number) => ({
        decisionId: decision.id,
        label: o.label,
        pros: o.pros ?? [],
        cons: o.cons ?? [],
        position: i,
      }))
    )
  }

  // Auto-schedule 1-month and 3-month reflections
  const now = new Date()
  const oneMonth  = new Date(now); oneMonth.setMonth(oneMonth.getMonth() + 1)
  const threeMonth = new Date(now); threeMonth.setMonth(threeMonth.getMonth() + 3)

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

  const full = await db.query.decisions.findFirst({
    where: eq(decisions.id, decision.id),
    with: { options: true },
  })

  return Response.json(full, { status: 201 })
}
