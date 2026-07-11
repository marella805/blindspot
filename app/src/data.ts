import type { DecisionEntry, InterrogationSession, ReflectionRecord, PatternAlert, UserProfile } from './types'

export const sampleProfile: UserProfile = {
  name: 'Jordan',
  role: 'College applicant',
  decisionContext: 'Navigating major life transitions — choosing colleges, deciding on majors, evaluating opportunities',
  createdAt: '2026-06-01T00:00:00Z',
}

export const sampleDecisions: DecisionEntry[] = [
  {
    id: 'decision-1',
    title: 'Choose between UC Berkeley and NYU for Computer Science',
    summary: 'Both programs are strong but differ significantly in culture, location, and career paths. Berkeley offers proximity to Silicon Valley; NYU offers New York City access and a more urban campus experience.',
    options: [
      {
        id: 'option-1a',
        label: 'UC Berkeley',
        pros: ['Top CS program', 'Silicon Valley proximity', 'Strong alumni network', 'Lower cost for CA residents'],
        cons: ['Competitive culture', 'Far from home', 'High cost of living'],
      },
      {
        id: 'option-1b',
        label: 'NYU',
        pros: ['New York City access', 'Diverse campus', 'Strong finance and media networks'],
        cons: ['Very high cost', 'Less prominent CS program', 'Dense urban environment'],
      },
    ],
    chosenOption: 'option-1a',
    reasoning: 'Long-term career goals align with Silicon Valley. The academic reputation and alumni network outweigh the cost-of-living disadvantage.',
    manualEntry: false,
    createdAt: '2026-06-15T10:00:00Z',
    updatedAt: '2026-06-15T11:30:00Z',
    lockedAt: '2026-06-20T00:00:00Z',
  },
  {
    id: 'decision-2',
    title: 'Declare Computer Science or Cognitive Science as major',
    summary: 'Considering pivoting from CS to CogSci to combine interest in AI with human behavior and design.',
    options: [
      {
        id: 'option-2a',
        label: 'Computer Science',
        pros: ['Clear career path', 'Higher starting salary', 'More job openings'],
        cons: ['Less interdisciplinary', 'Missing human behavior interests'],
      },
      {
        id: 'option-2b',
        label: 'Cognitive Science',
        pros: ['Interdisciplinary', 'Combines AI + psychology + design', 'Unique positioning'],
        cons: ['Narrower job market', 'Less name recognition with recruiters'],
      },
    ],
    manualEntry: true,
    createdAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-07-01T09:00:00Z',
  },
]

export const sampleSession: InterrogationSession = {
  id: 'session-1',
  decisionTitle: 'Choose between UC Berkeley and NYU for Computer Science',
  messages: [
    {
      role: 'assistant',
      content: "Let's stress-test this decision. What's the core thing you're trying to get out of choosing Berkeley over NYU — if you strip away everything secondary?",
      timestamp: '2026-06-15T10:00:00Z',
    },
    {
      role: 'user',
      content: "I want to work at a top tech company after graduation, and I think Berkeley's location gives me a better shot.",
      timestamp: '2026-06-15T10:01:00Z',
    },
    {
      role: 'assistant',
      content: "What makes you think location matters more than brand name for recruiting? NYU grads get into those same companies from New York offices.",
      timestamp: '2026-06-15T10:01:30Z',
    },
  ],
  summary: 'Decision driven primarily by career proximity rather than academic preference. The "location advantage" framing may be overstated — both schools have strong placement at top tech firms.',
  completedAt: '2026-06-15T11:30:00Z',
  createdAt: '2026-06-15T10:00:00Z',
}

export const sampleReflections: ReflectionRecord[] = [
  {
    id: 'reflection-1',
    decisionId: 'decision-1',
    scheduledFor: '2026-07-15T00:00:00Z',
    type: '1month',
  },
  {
    id: 'reflection-2',
    decisionId: 'decision-1',
    scheduledFor: '2026-09-15T00:00:00Z',
    type: '3month',
  },
]

export const samplePatterns: PatternAlert[] = [
  {
    id: 'pattern-1',
    title: 'You consistently prioritize career outcomes over personal fit',
    description: 'Across 2 decisions in the past 30 days, career advancement has appeared as the primary deciding factor — even when personal interest or culture fit was initially listed as important.',
    relatedDecisionIds: ['decision-1', 'decision-2'],
    detectedAt: '2026-07-05T00:00:00Z',
    dismissed: false,
  },
]
