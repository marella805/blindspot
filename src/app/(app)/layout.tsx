import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, reflections, decisions, patternAlerts } from '@/lib/db/schema'
import { eq, isNull } from 'drizzle-orm'
import { AppShell } from '@/components/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  // Redirect to profile onboarding if role is not set
  // (skip redirect if already on profile page to avoid infinite loop)
  // This is handled client-side in the AppShell for simplicity

  const userDecisionIds = user ? (await db.query.decisions.findMany({
    where: eq(decisions.userId, userId),
    columns: { id: true },
  })).map(d => d.id) : []

  const [pendingReflections, activePatternCount] = await Promise.all([
    userDecisionIds.length > 0
      ? db.query.reflections.findMany({
          where: isNull(reflections.completedAt),
        }).then(rows => rows.filter(r => userDecisionIds.includes(r.decisionId)).length)
      : Promise.resolve(0),
    db.query.patternAlerts.findMany({
      where: eq(patternAlerts.userId, userId),
    }).then(rows => rows.filter(r => !r.dismissedAt).length),
  ])

  return (
    <AppShell
      userId={userId}
      userName={user?.name ?? session.user.name ?? ''}
      initials={user?.initials ?? undefined}
      calibration={user?.calibration ?? 0}
      pendingReflections={pendingReflections}
      activePatterns={activePatternCount}
    >
      {children}
    </AppShell>
  )
}
