import type { AppData, DecisionEntry, PatternAlert, ReflectionRecord, UserProfile } from './types'

// ── Profiles ─────────────────────────────────────────────────────────────────

const freshProfile: UserProfile = {
  name: "Jordan",
  initials: "JO",
  role: "Incoming college freshman",
  decisionContext: "Navigating the first major life decisions outside of high school — choosing schools, majors, and opportunities with real long-term consequences.",
  calibration: 0,
  createdAt: "2026-08-01T00:00:00Z",
}

const seasonedProfile: UserProfile = {
  name: "Jordan",
  initials: "JO",
  role: "College sophomore · CS + CogSci",
  decisionContext: "One year in. Building a track record of deliberate decisions around academics, career, and independence. Starting to see patterns in how I choose.",
  calibration: 82,
  createdAt: "2026-06-01T00:00:00Z",
}

// ── Seasoned decisions ────────────────────────────────────────────────────────

const seasonedDecisions: DecisionEntry[] = [
  {
    id: "d1",
    title: "Accept UC Berkeley offer over NYU for Computer Science",
    category: "Education",
    summary: "Both programs placed well at top tech companies, but Berkeley offered proximity to Silicon Valley, a superior systems/hardware research track, and a stronger alumni network in the areas I wanted to work in. NYU offered more financial aid but a less specialized program for my direction.",
    options: [
      {
        id: "d1-a",
        label: "UC Berkeley",
        pros: ["#1 public CS program", "Silicon Valley proximity", "Systems/hardware research concentration", "Stronger alumni network in SWE"],
        cons: ["$40k more in total cost vs NYU aid package", "Highly competitive culture", "Far from home in the Northeast"],
      },
      {
        id: "d1-b",
        label: "NYU",
        pros: ["Better financial aid package", "New York City network (finance + media tech)", "Smaller cohort, more faculty access"],
        cons: ["Less specialized for systems work", "Weaker Bay Area recruiting pipeline", "NYC cost of living offsets aid advantage"],
      },
    ],
    chosenOption: "d1-a",
    reasoning: "The interrogation surfaced that I was framing this as a prestige comparison when it was really a specialization question. Berkeley's systems research track and Silicon Valley recruiting pipeline are directly aligned with the kind of SWE work I want to do. The $40k cost difference is real but manageable with part-time work and internship income.",
    interrogated: true,
    createdAt: "2026-04-15T10:00:00Z",
    updatedAt: "2026-04-15T11:30:00Z",
    lockedAt: "2026-04-20T00:00:00Z",
  },
  {
    id: "d2",
    title: "Declare CS or pursue a CS + Cognitive Science double major",
    category: "Education",
    summary: "Single CS major is the clear career path. CogSci adds depth in human behavior, design, and AI that I find genuinely interesting, but extends the timeline and adds unit pressure.",
    options: [
      {
        id: "d2-a",
        label: "CS only",
        pros: ["Clear recruiting narrative", "More flexibility for electives", "Less unit pressure"],
        cons: ["Misses my interest in human-AI interaction", "Less differentiated at the application layer"],
      },
      {
        id: "d2-b",
        label: "CS + Cognitive Science double major",
        pros: ["Unique positioning for AI product/research roles", "Interdisciplinary — covers the full stack of AI + human behavior", "Differentiating for grad school"],
        cons: ["140+ units, tight schedule", "Harder to maintain GPA", "Recruiters may not recognize the value immediately"],
      },
    ],
    chosenOption: "d2-b",
    reasoning: "The work I actually want to do sits at the intersection of AI systems and human behavior. The double major isn't a hedge — it's the direct path to that space. The unit load is manageable with planning.",
    interrogated: false,
    createdAt: "2026-06-10T09:00:00Z",
    updatedAt: "2026-06-10T09:00:00Z",
  },
  {
    id: "d3",
    title: "Accept Stripe internship vs. Berkeley AI Lab research position",
    category: "Career",
    summary: "Stripe offered a SWE internship at $9k/month with a return offer path. The AI Lab offered unpaid research credit with a faculty mentor working on language model evaluation. Completely different trajectories.",
    options: [
      {
        id: "d3-a",
        label: "Stripe internship",
        pros: ["$9k/month stipend", "Return offer potential", "Real production code, real scale", "Brand name recruiting signal"],
        cons: ["Product engineering, not research", "Locks me into a SWE track early", "Not aligned with my CogSci interests"],
      },
      {
        id: "d3-b",
        label: "Berkeley AI Lab research",
        pros: ["Direct alignment with long-term research interests", "Faculty relationship for recommendations", "Paper co-authorship potential"],
        cons: ["Unpaid", "Slow-paced relative to industry", "Narrower immediate career signal"],
      },
    ],
    chosenOption: "d3-a",
    reasoning: "I need income to stay debt-light. More importantly, the interrogation helped me see I was romanticizing research — I don't yet have the foundations to contribute meaningfully in a lab setting. Stripe gives me production credibility; research is a better bet after sophomore year fundamentals.",
    interrogated: true,
    createdAt: "2026-06-28T14:00:00Z",
    updatedAt: "2026-06-28T15:00:00Z",
    lockedAt: "2026-07-01T00:00:00Z",
  },
  {
    id: "d4",
    title: "Rush a fraternity or stay independent first semester",
    category: "Personal",
    summary: "Two friends from high school were rushing. The social case for joining was real, but the time cost and the culture I observed during rush week felt misaligned with how I wanted to spend first semester.",
    options: [
      {
        id: "d4-a",
        label: "Rush and join",
        pros: ["Built-in social network", "Alumni connections", "Structured community"],
        cons: ["Heavy time commitment", "Culture didn't feel like a fit", "Expensive semesterly dues"],
      },
      {
        id: "d4-b",
        label: "Stay independent",
        pros: ["Full schedule flexibility", "Build relationships on my own terms", "Keep options open"],
        cons: ["Slower to build a social network", "FOMO risk", "Less structured community"],
      },
    ],
    chosenOption: "d4-b",
    reasoning: "I was only considering it because friends were doing it — not because the culture fit. Staying independent and building connections through CS clubs and the AI lab turned out to be the right call.",
    interrogated: false,
    createdAt: "2026-08-20T09:00:00Z",
    updatedAt: "2026-08-20T09:00:00Z",
  },
  {
    id: "d5",
    title: "Take a summer research position at Berkeley vs. go home and work locally",
    category: "Career",
    summary: "After freshman year, I had an offer to stay on campus and work as an undergrad RA in the AI lab over the summer — unpaid, but access to the professor I wanted to work with. The alternative was going home, working a local job, saving money, and decompressing.",
    options: [
      {
        id: "d5-a",
        label: "Stay for research RA",
        pros: ["Relationship with target faculty mentor", "Resume signal for research-track applications", "Build on the AI foundations from the semester"],
        cons: ["Unpaid — net cost with rent", "No decompression from a hard first year", "Parents wanted me home"],
      },
      {
        id: "d5-b",
        label: "Go home, work locally",
        pros: ["Income", "Rest", "Time with family"],
        cons: ["Career opportunity cost", "Delays the faculty relationship", "Harder to re-enter the lab next year"],
      },
    ],
    chosenOption: "d5-a",
    reasoning: "The window to work with this professor closes — he's on sabbatical next year. The financial cost is real but manageable with savings from the Stripe internship. This is the right move for the long-term research track.",
    interrogated: true,
    createdAt: "2026-04-30T10:00:00Z",
    updatedAt: "2026-04-30T10:00:00Z",
  },
  {
    id: "d6",
    title: "Switch thesis advisors mid-project or see it through with current advisor",
    category: "Education",
    summary: "Six weeks into my honors thesis, it became clear my advisor and I had a fundamental mismatch in research direction. A different faculty member had offered to take me on. Switching meant restarting — but continuing felt like building on a broken foundation.",
    options: [
      {
        id: "d6-a",
        label: "Switch to new advisor",
        pros: ["Better research alignment", "Mentor who I trust and who trusts me", "More likely to produce good work"],
        cons: ["6 weeks of work effectively lost", "Awkward relationship with current advisor", "Compressed timeline for new direction"],
      },
      {
        id: "d6-b",
        label: "See it through with current advisor",
        pros: ["No lost work", "No relationship fallout", "Known timeline"],
        cons: ["Thesis will be mediocre — both parties know it", "Likely to affect the quality of the recommendation letter", "Wrong direction regardless of execution quality"],
      },
    ],
    chosenOption: "d6-a",
    reasoning: "Sunk cost. The 6 weeks of work was going in the wrong direction anyway — seeing it through would mean producing a thesis neither of us believed in. The new advisor's research direction is genuinely what I want to do.",
    interrogated: true,
    createdAt: "2026-07-02T11:00:00Z",
    updatedAt: "2026-07-02T11:30:00Z",
  },
]

// ── Reflections ───────────────────────────────────────────────────────────────

const seasonedReflections: ReflectionRecord[] = [
  {
    id: "r1",
    decisionId: "d1",
    scheduledFor: "2026-05-15T00:00:00Z",
    type: "1month",
    completedAt: "2026-05-16T09:00:00Z",
    content: "The systems research track reasoning held up. Enrolled in CS 162 (OS) and immediately knew I was in the right place. The culture is competitive but it's competition I want to be in. Cost is real — budgeting more carefully than expected.",
  },
  {
    id: "r2",
    decisionId: "d1",
    scheduledFor: "2026-07-15T00:00:00Z",
    type: "3month",
  },
  {
    id: "r3",
    decisionId: "d3",
    scheduledFor: "2026-07-28T00:00:00Z",
    type: "1month",
  },
  {
    id: "r4",
    decisionId: "d4",
    scheduledFor: "2026-11-20T00:00:00Z",
    type: "3month",
    completedAt: "2026-11-22T10:00:00Z",
    content: "Staying independent was right. Found my people through the AI Club and the honors cohort. The friends who joined frats are happy but I would've been miserable. The FOMO was noise.",
  },
]

// ── Patterns ──────────────────────────────────────────────────────────────────

const seasonedPatterns: PatternAlert[] = [
  {
    id: "p1",
    title: "You consistently prioritize career over personal alignment",
    description: "In 4 of 6 decisions, career advancement was the primary deciding factor — even when personal interest, energy level, or cultural fit was initially listed as important. You tend to choose the option with the better resume signal, then retrofit the reasoning.",
    relatedDecisionIds: ["d1", "d3", "d5", "d6"],
    detectedAt: "2026-07-05T00:00:00Z",
    dismissed: false,
  },
  {
    id: "p2",
    title: "You frame decisions as binary when middle options exist",
    description: "Across 3 decisions, a reversible middle path — negotiate aid, defer, or explore a hybrid — went unlogged as a real option. Your A-vs-B framing may be causing you to dismiss compromise paths prematurely.",
    relatedDecisionIds: ["d1", "d2", "d3"],
    detectedAt: "2026-07-05T00:00:00Z",
    dismissed: false,
  },
  {
    id: "p3",
    title: "External validation anchors your initial framing",
    description: "In 4 of 6 decisions, the option you chose was the one your professional network would recognize as the stronger signal. You're calibrating primarily to the professional audience in your head, not to your stated values.",
    relatedDecisionIds: ["d1", "d3", "d5", "d6"],
    detectedAt: "2026-07-06T00:00:00Z",
    dismissed: false,
  },
]

// ── Exported datasets ─────────────────────────────────────────────────────────

export const freshData: AppData = {
  profile: freshProfile,
  decisions: [],
  reflections: [],
  patterns: [],
}

export const seasonedData: AppData = {
  profile: seasonedProfile,
  decisions: seasonedDecisions,
  reflections: seasonedReflections,
  patterns: seasonedPatterns,
}

// ── Interrogation sample responses ────────────────────────────────────────────

export const sampleInterrogation = {
  title: "Accept UC Berkeley offer vs. wait for NYU financial aid appeal",
  responses: [
    "I want to maximize my shot at working in systems engineering at a top tech company within 3 years. I keep saying it's about fit but the alumni network and Bay Area proximity are the real reasons I keep coming back to Berkeley.",
    "My parents want me to pick the cheaper option — NYU gave me a better aid package. My high school CS teacher says Berkeley's alumni network is unbeatable. I'm probably giving my parents too much weight. The decision is mine to live with.",
    "The strongest argument against Berkeley is the $40k additional cost over four years. NYU has placed people at Google, Meta, and Stripe. Location advantage is probably smaller than I'm assuming — anyone who wants a Bay Area job can get there regardless of school.",
    "Worst case: I graduate with extra debt, can't land the role I wanted, and the $40k difference limits my financial decisions for the first 5 years out. That's real. The counterfactual from NYU is that I network my way to the same outcome for less money.",
    "I keep skipping past the fact that Berkeley has a serious systems and hardware research concentration that NYU doesn't. I've been framing this as a prestige comparison when it's actually a specialization question. NYU is stronger in finance-adjacent tech — which isn't what I want to do.",
    "Berkeley. But the real reason is the systems research track, not the brand name. I should also appeal Berkeley's financial aid package before I commit — I haven't even tried that yet.",
  ],
}
