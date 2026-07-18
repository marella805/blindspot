import { db } from './index'
import { patternTypes } from './schema'

const PATTERN_TYPES = [
  {
    slug: 'binary_framing',
    title: 'Binary framing',
    description: 'Consistently collapses decisions into A-vs-B when a third or hybrid option exists and goes unexamined.',
    detectionThreshold: 3,
  },
  {
    slug: 'external_validation',
    title: 'External validation',
    description: 'Anchors to the option the professional network would validate. Decision rationale is written after the socially preferred choice is made.',
    detectionThreshold: 3,
  },
  {
    slug: 'career_over_alignment',
    title: 'Career over alignment',
    description: 'Consistently selects the stronger career signal over personal alignment, particularly in high-stakes decisions.',
    detectionThreshold: 3,
  },
  {
    slug: 'recency_bias',
    title: 'Recency bias',
    description: 'Recent events or outcomes disproportionately drive the framing of the current decision.',
    detectionThreshold: 2,
  },
  {
    slug: 'sunk_cost',
    title: 'Sunk cost reasoning',
    description: 'Prior investment in time, money, or identity is cited as a reason to continue rather than evaluated independently.',
    detectionThreshold: 2,
  },
  {
    slug: 'authority_deference',
    title: 'Authority deference',
    description: 'Defers to an authority figure or mentor recommendation without independently stress-testing the advice.',
    detectionThreshold: 3,
  },
]

async function seed() {
  await db
    .insert(patternTypes)
    .values(PATTERN_TYPES)
    .onConflictDoNothing()

  console.log(`Seeded ${PATTERN_TYPES.length} pattern types.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
