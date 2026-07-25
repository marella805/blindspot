import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Profile } from '@/components/profile'
import type { AppData } from '@/types'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  const isFresh = !user?.onboardingCompleted

  const name = user?.name ?? session.user.name ?? ''
  const data: AppData = {
    profile: {
      name,
      initials: user?.initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      role: user?.role ?? '',
      decisionContext: user?.decisionContext ?? '',
      calibration: user?.calibration ?? 0,
      createdAt: user?.createdAt.toISOString() ?? new Date().toISOString(),
    },
    decisions: [],
    reflections: [],
    patterns: [],
  }

  return (
    <Profile
      data={data}
      isFresh={isFresh}
      savedAnswers={(user?.profileAnswers ?? null) as Record<string, unknown> | null}
    />
  )
}
