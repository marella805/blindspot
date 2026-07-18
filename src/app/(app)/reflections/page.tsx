'use client'

import { Reflections } from '@/components/reflections'
import type { AppData } from '@/types'

const emptyData: AppData = {
  profile: { name: '', initials: '', role: '', decisionContext: '', calibration: 0, createdAt: new Date().toISOString() },
  decisions: [],
  reflections: [],
  patterns: [],
}

export default function ReflectionsPage() {
  return <Reflections data={emptyData} />
}
