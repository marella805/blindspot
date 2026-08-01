import { getUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { decisions, patternAlerts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { LogScreen } from '@/components/log-screen'
import type { AppData } from '@/types'

export default async function LogPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const userId = user.id

  if (!user.onboardingCompleted) redirect('/profile')

  const [userDecisions, userAlerts] = await Promise.all([
    db.query.decisions.findMany({
      where: eq(decisions.userId, userId),
      with: {
        options: true,
        reflections: true,
        recommendations: {
          orderBy: (r, { desc }) => [desc(r.acceptedAt)],
          limit: 1,
        },
      },
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    }),
    db.query.patternAlerts.findMany({
      where: eq(patternAlerts.userId, userId),
      with: { patternType: true, decisions: true },
    }),
  ])

  const data: AppData = {
    profile: {
      name: user.name ?? '',
      initials: user.initials ?? (user.name ?? '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      role: user.role ?? '',
      decisionContext: '',
      calibration: user.calibration,
      createdAt: user.createdAt.toISOString(),
    },
    decisions: userDecisions.map(d => ({
      id: d.id,
      title: d.title,
      summary: d.summary ?? '',
      category: d.category,
      options: d.options.map(o => ({
        id: o.id,
        label: o.label,
        pros: o.pros as string[],
        cons: o.cons as string[],
      })),
      chosenOption: d.chosenOptionId ?? undefined,
      reasoning: d.reasoning ?? undefined,
      interrogated: d.interrogationCount > 0,
      recommendation: d.recommendations[0]
        ? {
            answer: d.recommendations[0].answer,
            rationale: d.recommendations[0].rationale,
            evidence: (d.recommendations[0].evidence ?? []) as { pattern: string; finding: string }[],
          }
        : undefined,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
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

  return <LogScreen data={data} />
}
