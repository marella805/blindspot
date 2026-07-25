'use client'

import { useRouter } from 'next/navigation'
import { DecisionLog } from './decision-log'
import type { AppData } from '@/types'

export function LogScreen({ data }: { data: AppData }) {
  const router = useRouter()
  return (
    <DecisionLog
      data={data}
      onStartInterrogation={() => router.push('/interrogation')}
    />
  )
}
