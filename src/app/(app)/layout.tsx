import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, reflections, decisions, patternAlerts } from '@/lib/db/schema'
import { eq, isNull } from 'drizzle-orm'
import { AppShell } from '@/components/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const userId = user.id

  const userDecisionIds = (await db.query.decisions.findMany({
    where: eq(decisions.userId, userId),
    columns: { id: true },
  })).map(d => d.id)

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
      userName={user.name ?? ''}
      initials={user.initials ?? undefined}
      calibration={user.calibration ?? 0}
      pendingReflections={pendingReflections}
      activePatterns={activePatternCount}
    >
      {children}
    </AppShell>
  )
}
