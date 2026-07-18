'use client'

import { Patterns } from '@/components/patterns'
import type { AppData } from '@/types'

const emptyData: AppData = {
  profile: { name: '', initials: '', role: '', decisionContext: '', calibration: 0, createdAt: new Date().toISOString() },
  decisions: [],
  reflections: [],
  patterns: [],
}

export default function PatternsPage() {
  return <Patterns data={emptyData} />
}
