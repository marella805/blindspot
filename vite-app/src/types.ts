export type Screen = 'log' | 'interrogation' | 'reflections' | 'patterns' | 'profile'
export type DemoMode = 'picker' | 'fresh' | 'seasoned'

export interface UserProfile {
  name: string
  initials: string
  role: string
  decisionContext: string
  calibration: number
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
  category: string
  options: DecisionOption[]
  chosenOption?: string
  reasoning?: string
  interrogated: boolean
  createdAt: string
  updatedAt: string
  lockedAt?: string
}

export interface InterrogationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
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

export interface AppData {
  profile: UserProfile
  decisions: DecisionEntry[]
  reflections: ReflectionRecord[]
  patterns: PatternAlert[]
}
