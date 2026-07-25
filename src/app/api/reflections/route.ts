import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reflections, decisions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const userDecisions = await db.query.decisions.findMany({
    where: eq(decisions.userId, session.user.id),
    columns: { id: true },
  })
  const decisionIds = userDecisions.map(d => d.id)

  if (decisionIds.length === 0) return Response.json([])

  const rows = await db.query.reflections.findMany({
    with: { decision: { columns: { id: true, title: true } } },
    orderBy: (r, { asc }) => [asc(r.scheduledFor)],
  })

  const userRows = rows.filter(r => decisionIds.includes(r.decisionId))
  return Response.json(userRows)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const body = await req.json()
  const { decisionId, scheduledFor, intervalType, intervalLabel, customIntervalDays } = body

  const owned = await db.query.decisions.findFirst({
    where: eq(decisions.id, decisionId),
    columns: { userId: true },
  })
  if (!owned || owned.userId !== session.user.id) return new Response(null, { status: 403 })

  const [row] = await db
    .insert(reflections)
    .values({ decisionId, scheduledFor, intervalType, intervalLabel, customIntervalDays })
    .returning()

  return Response.json(row, { status: 201 })
}
