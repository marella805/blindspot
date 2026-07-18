import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { patternAlerts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return new Response(null, { status: 401 })

  const alerts = await db.query.patternAlerts.findMany({
    where: eq(patternAlerts.userId, session.user.id),
    with: {
      patternType: true,
      decisions: {
        with: { decision: true },
      },
    },
    orderBy: (a, { desc }) => [desc(a.detectedAt)],
  })

  // Only surface alerts that have reached the pattern type's detection threshold.
  // Alerts are created on first detection; this filter is the threshold gate.
  const thresholdAlerts = alerts.filter(
    a => a.decisions.length >= a.patternType.detectionThreshold
  )

  return Response.json(thresholdAlerts)
}
