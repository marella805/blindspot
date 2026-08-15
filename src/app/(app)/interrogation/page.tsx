'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { RealInterrogation } from '@/components/real-interrogation'

export default function InterrogationPage() {
  const router = useRouter()
  const params = useSearchParams()
  const demo = params.get('demo') === 'true'
  return (
    <RealInterrogation
      demo={demo}
      onComplete={(decisionId) => router.push(decisionId ? `/log?decision=${decisionId}` : '/log')}
    />
  )
}
