import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reflections, decisions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { content } = body

  const reflection = await db.query.reflections.findFirst({
    where: eq(reflections.id, id),
    with: { decision: { columns: { userId: true } } },
  })
  if (!reflection || reflection.decision.userId !== session.user.id) {
    return new Response(null, { status: 404 })
  }

  const [updated] = await db
    .update(reflections)
    .set({ completedAt: new Date(), content })
    .where(eq(reflections.id, id))
    .returning()

  return Response.json(updated)
}
