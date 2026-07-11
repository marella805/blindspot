export type Screen = 'log' | 'interrogation' | 'reflections' | 'patterns' | 'profile'

export interface UserProfile {
  name: string
  role: string
  decisionContext: string
  createdAt: string
}

export interface DecisionOption {
  id: string
  label: string
  pros: string[]
  cons: string[]
}

export interface DecisionEntry {
  id: string
  title: string
  summary: string
  options: DecisionOption[]
  chosenOption?: string
  reasoning?: string
  interrogationSessionId?: string
  manualEntry: boolean
  createdAt: string
  updatedAt: string
  lockedAt?: string
}

export interface InterrogationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface InterrogationSession {
  id: string
  decisionTitle: string
  messages: InterrogationMessage[]
  summary?: string
  completedAt?: string
  createdAt: string
}

export interface ReflectionRecord {
  id: string
  decisionId: string
  scheduledFor: string
  completedAt?: string
  content?: string
  type: '1month' | '3month'
}

export interface PatternAlert {
  id: string
  title: string
  description: string
  relatedDecisionIds: string[]
  detectedAt: string
  dismissed: boolean
}
