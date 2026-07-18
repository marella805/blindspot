import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { interrogationSessions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const { sessionId } = await params

  const interrogationSession = await db.query.interrogationSessions.findFirst({
    where: eq(interrogationSessions.id, sessionId),
    with: { decision: { columns: { userId: true } } },
  })

  if (!interrogationSession || interrogationSession.decision.userId !== session.user.id) {
    return new Response(null, { status: 404 })
  }

  const body = await req.json()
  const { turns } = body

  if (!Array.isArray(turns)) {
    return Response.json({ error: 'turns must be an array' }, { status: 400 })
  }

  await db
    .update(interrogationSessions)
    .set({ turns })
    .where(eq(interrogationSessions.id, sessionId))

  return new Response(null, { status: 204 })
}
