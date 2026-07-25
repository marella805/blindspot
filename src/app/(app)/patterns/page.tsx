import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { decisions, patternAlerts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Patterns } from '@/components/patterns'
import type { AppData } from '@/types'

export default async function PatternsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const [userDecisions, userAlerts] = await Promise.all([
    db.query.decisions.findMany({
      where: eq(decisions.userId, userId),
      columns: { id: true, title: true },
    }),
    db.query.patternAlerts.findMany({
      where: eq(patternAlerts.userId, userId),
      with: { patternType: true, decisions: true },
    }),
  ])

  const data: AppData = {
    profile: { name: '', initials: '', role: '', decisionContext: '', calibration: 0, createdAt: new Date().toISOString() },
    decisions: userDecisions.map(d => ({
      id: d.id, title: d.title, summary: '', category: 'other',
      options: [], interrogated: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })),
    reflections: [],
    patterns: userAlerts.map(a => ({
      id: a.id,
      title: a.patternType.title,
      description: a.patternType.description,
      relatedDecisionIds: a.decisions.map(d => d.decisionId),
      detectedAt: a.detectedAt.toISOString(),
      dismissed: a.dismissedAt !== null,
    })),
  }

  return <Patterns data={data} />
}
