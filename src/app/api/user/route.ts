import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })
  if (!user) return new Response(null, { status: 404 })

  return Response.json(user)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const body = await req.json()
  const { name, initials, role, decisionContext, profileAnswers, onboardingCompleted } = body

  const [updated] = await db
    .update(users)
    .set({
      ...(name !== undefined && { name }),
      ...(initials !== undefined && { initials }),
      ...(role !== undefined && { role }),
      ...(decisionContext !== undefined && { decisionContext }),
      ...(profileAnswers !== undefined && { profileAnswers }),
      ...(onboardingCompleted !== undefined && {
        onboardingCompleted: onboardingCompleted ? new Date() : null,
      }),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id))
    .returning()

  return Response.json(updated)
}
