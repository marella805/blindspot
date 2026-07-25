import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { patternAlerts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const { id } = await params

  const [updated] = await db
    .update(patternAlerts)
    .set({ dismissedAt: new Date() })
    .where(and(eq(patternAlerts.id, id), eq(patternAlerts.userId, session.user.id)))
    .returning()

  if (!updated) return new Response(null, { status: 404 })
  return Response.json(updated)
}
