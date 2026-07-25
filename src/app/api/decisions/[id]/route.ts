import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { decisions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

async function getOwned(decisionId: string, userId: string) {
  return db.query.decisions.findFirst({
    where: and(eq(decisions.id, decisionId), eq(decisions.userId, userId)),
  })
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const { id } = await params
  const decision = await db.query.decisions.findFirst({
    where: and(eq(decisions.id, id), eq(decisions.userId, session.user.id)),
    with: {
      options: true,
      interrogationSessions: true,
      recommendations: { orderBy: (r, { desc }) => [desc(r.acceptedAt)] },
      reflections: true,
      patternAlertDecisions: true,
    },
  })

  if (!decision) return new Response(null, { status: 404 })
  return Response.json(decision)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const { id } = await params
  const owned = await getOwned(id, session.user.id)
  if (!owned) return new Response(null, { status: 404 })
  if (owned.lockedAt) return new Response(JSON.stringify({ error: 'Decision is locked' }), { status: 403 })

  const body = await req.json()
  const { title, summary, chosenOptionId, reasoning } = body

  const [updated] = await db
    .update(decisions)
    .set({
      ...(title !== undefined && { title }),
      ...(summary !== undefined && { summary }),
      ...(chosenOptionId !== undefined && { chosenOptionId }),
      ...(reasoning !== undefined && { reasoning }),
      updatedAt: new Date(),
    })
    .where(eq(decisions.id, id))
    .returning()

  return Response.json(updated)
}
