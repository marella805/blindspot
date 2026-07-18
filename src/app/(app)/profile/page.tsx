'use client'

import { Profile } from '@/components/profile'
import type { AppData } from '@/types'

const emptyData: AppData = {
  profile: { name: '', initials: '', role: '', decisionContext: '', calibration: 0, createdAt: new Date().toISOString() },
  decisions: [],
  reflections: [],
  patterns: [],
}

export default function ProfilePage() {
  return <Profile data={emptyData} isFresh={true} />
}
