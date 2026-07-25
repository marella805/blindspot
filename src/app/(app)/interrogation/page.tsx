'use client'

import { useRouter } from 'next/navigation'
import { RealInterrogation } from '@/components/real-interrogation'

export default function InterrogationPage() {
  const router = useRouter()
  return <RealInterrogation onComplete={(decisionId) => router.push(decisionId ? `/log?decision=${decisionId}` : '/log')} />
}
