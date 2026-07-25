import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { decisions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

async function getOwned(id: string, userId: string) {
  return db.query.decisions.findFirst({
    where: and(eq(decisions.id, id), eq(decisions.userId, userId)),
  })
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const { id } = await params
  const owned = await getOwned(id, session.user.id)
  if (!owned) return new Response(null, { status: 404 })

  const [updated] = await db
    .update(decisions)
    .set({ lockedAt: new Date(), updatedAt: new Date() })
    .where(eq(decisions.id, id))
    .returning()

  return Response.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const { id } = await params
  const owned = await getOwned(id, session.user.id)
  if (!owned) return new Response(null, { status: 404 })

  const [updated] = await db
    .update(decisions)
    .set({ lockedAt: null, updatedAt: new Date() })
    .where(eq(decisions.id, id))
    .returning()

  return Response.json(updated)
}
