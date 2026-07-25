import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { decisions, patternAlerts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Reflections } from '@/components/reflections'
import type { AppData } from '@/types'

export default async function ReflectionsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const [userDecisions, userAlerts] = await Promise.all([
    db.query.decisions.findMany({
      where: eq(decisions.userId, userId),
      with: { reflections: true },
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    }),
    db.query.patternAlerts.findMany({
      where: eq(patternAlerts.userId, userId),
      with: { patternType: true, decisions: true },
    }),
  ])

  const data: AppData = {
    profile: { name: '', initials: '', role: '', decisionContext: '', calibration: 0, createdAt: new Date().toISOString() },
    decisions: userDecisions.map(d => ({
      id: d.id, title: d.title, summary: d.summary ?? '', category: d.category,
      options: [], interrogated: d.interrogationCount > 0,
      createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString(),
      lockedAt: d.lockedAt?.toISOString(),
    })),
    reflections: userDecisions.flatMap(d =>
      d.reflections.map(r => ({
        id: r.id,
        decisionId: r.decisionId,
        scheduledFor: r.scheduledFor,
        completedAt: r.completedAt?.toISOString(),
        content: r.content ?? undefined,
        type: (r.intervalLabel === '1mo' ? '1month' : '3month') as '1month' | '3month',
      }))
    ),
    patterns: userAlerts.map(a => ({
      id: a.id,
      title: a.patternType.title,
      description: a.patternType.description,
      relatedDecisionIds: a.decisions.map(d => d.decisionId),
      detectedAt: a.detectedAt.toISOString(),
      dismissed: a.dismissedAt !== null,
    })),
  }

  return <Reflections data={data} />
}
