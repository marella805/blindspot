import { getUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Profile } from '@/components/profile'
import type { AppData } from '@/types'

export default async function ProfilePage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const isFresh = !user.onboardingCompleted

  const name = user.name ?? ''
  const data: AppData = {
    profile: {
      name,
      initials: user.initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      role: user.role ?? '',
      decisionContext: user.decisionContext ?? '',
      calibration: user.calibration ?? 0,
      createdAt: user.createdAt.toISOString(),
    },
    decisions: [],
    reflections: [],
    patterns: [],
  }

  return (
    <Profile
      data={data}
      isFresh={isFresh}
      savedAnswers={(user.profileAnswers ?? null) as Record<string, unknown> | null}
    />
  )
}
