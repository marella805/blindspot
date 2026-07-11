# Decision Intelligence Platform — Developer Handoff

**Deadline:** August 14, 2026 (private beta)
**Status:** Pre-build — spikes required before sprint starts (see below)

---

## What We Are Building

A consumer app that helps users make better high-stakes decisions through three mechanisms:

1. **Socratic interrogation** — multi-turn AI questioning that pushes back on weak reasoning and surfaces the real driver behind a decision (not the rationalization). This is the day-one value and the core of the product.
2. **Decision log** — structured entries capturing the decision, options, reasoning summary, and user-inputted option data. Builds the dataset the pattern engine reads from.
3. **Pattern engine** — detects structural similarities across past decisions and surfaces them at the start of a new interrogation. Gets more powerful as the log accumulates.

**What it is not:** not a journaling app, not a chatbot, not a habit tracker, not a pros/cons list, not a firm/school database. The product is a structured system — the AI does interrogation and pattern detection, not freeform conversation.

---

## Repo Structure

```
/
├── HANDOFF.md                        ← you are here
├── Decision_Intelligence_Platform_PRD.md   ← full product requirements
├── Notes.docx                        ← founder interview (source of truth for product intent)
└── research/
    ├── User_Research_Report.md       ← personas, segments, journey maps
    └── Backlog_User_Stories.md       ← 15 user stories with acceptance criteria (P0 only)
```

---

## Core Data Model

These entities are implied by the backlog. Define this before writing any application code.

```
User
  └── Profile (versioned — each edit is timestamped)
        ├── values[]           ranked list
        ├── riskTolerance      structured response
        ├── financialSituation
        ├── workLifeWeighting
        ├── careerStage
        └── geographicConstraints

Decision Entry
  ├── type                   "interrogation" | "manual"
  ├── status                 "draft" | "completed" | "locked"
  ├── decisionName
  ├── date
  ├── profileSnapshotId      → which Profile version was active at session time
  ├── options[]
  │     ├── name
  │     ├── chosen           boolean
  │     └── data{}           user-defined key/value pairs (salary, location, etc.)
  ├── interrogationSession?  → present only for type="interrogation"
  │     ├── turns[]          each Q&A exchange
  │     ├── summary          AI-generated (read-only after generation)
  │     └── completedAt
  ├── notes[]                free-form, timestamped, append-only
  ├── reflections[]
  │     ├── type             "scheduled_1m" | "scheduled_3m" | "user_initiated"
  │     ├── responses{}      structured Q&A
  │     ├── freeText?
  │     └── createdAt
  └── patternAlertShown?     reference to matched Decision Entry id, if alert fired
```

---

## Build Sequence

Follow this order — later stories depend on earlier ones.

### Week 1–2 — Interrogation Core (critical path)
| Story | Description | Effort |
|---|---|---|
| 1 | Profile onboarding | M |
| 4 | Start a new decision interrogation | L |
| 5 | System challenges weak / circular reasoning | L |
| 6 | System generates structured session summary | M |

> **Do not proceed to Week 3 until Stories 4 and 5 have been user-tested.** The counter-consideration quality (Story 5) is the highest-risk component in the product. If it does not feel precise, the product does not work.

### Week 3 — Log and Reflection Infrastructure
| Story | Description | Effort |
|---|---|---|
| 2 | Profile personalizes interrogation questions | M |
| 7 | Save and resume a draft interrogation | S |
| 8 | View decision log timeline | S |
| 9 | Add option-level data to a decision entry | S |
| 10 | Create a manual decision entry | S |
| 12 | Receive and respond to scheduled reflection prompts | M |

### Week 4 — Polish and Pattern Alert
| Story | Description | Effort |
|---|---|---|
| 3 | Edit profile after onboarding | S |
| 11 | Add a free-form note to an existing entry | S |
| 13 | Write a free-form reflection at any time | S |
| 14 | Lock a decision entry | S |
| 15 | Pattern alert at interrogation start | L |

### Week 5 — QA, edge cases, onboarding polish

---

## Spikes — Resolve Before Sprint 1 Starts

These two questions are blocking. Stories 4, 5, and 15 cannot be accurately estimated or built without answers.

### Spike 1: Interrogation Termination Criteria
**Question:** How does the system know the user has reasoned their way to a defensible position — vs. simply typed enough words?

What needs to be defined:
- The rubric the LLM uses to evaluate session completeness (e.g., has the user named the tradeoff? acknowledged the counter-consideration? articulated a reason they can defend?)
- Whether termination is LLM-evaluated per turn, or triggered by a fixed minimum turn count plus a quality check
- What the user sees when the session is "complete" vs. when it is not yet there

**Owner:** Product + Engineering
**Output:** A written termination rubric that can be encoded into the system prompt

---

### Spike 2: Structural Similarity Algorithm
**Question:** What attributes define that two decisions are "structurally similar" for the pattern alert (Story 15)?

What needs to be defined:
- The finite set of structural attributes the system tags decisions with (e.g., `prestige_vs_intimacy`, `financial_sacrifice_for_status`, `environment_preference`, `risk_tolerance_mismatch`)
- How these attributes are extracted from a session summary (LLM classification, user-tagged, or hybrid)
- The matching threshold (≥2 shared attributes fires an alert — but does weighting apply?)

**Owner:** Product + Engineering
**Output:** A defined attribute taxonomy and matching logic that can be implemented before Story 15

---

## LLM Integration Notes

Three stories require LLM calls with distinct prompt behavior:

| Story | LLM job | Key constraint |
|---|---|---|
| 5 | Generate a counter-consideration | Must reference a specific unaddressed tradeoff — not a generic category. Profile context must be injected. |
| 6 | Generate session summary | Structured output (JSON or fixed schema) — not prose. Must be deterministic enough to be stored as a permanent record. |
| 15 | Classify decision attributes for similarity matching | Classification task against a fixed taxonomy. Must be consistent across sessions — same decision should produce same tags. |

The interrogation turn loop (Story 4) also requires an LLM but its job is question generation, not classification — different prompt architecture.

---

## Open Questions for Product (not blocking engineering unless noted)

| Question | Blocking? | Owner |
|---|---|---|
| What is the minimum response length for an interrogation answer before the system prompts to expand? | Yes — needed before Story 4 | Product |
| Is in-app notification sufficient for reflection prompts, or do we need push/email from day one? | Yes — affects Story 12 infra | Engineering + Founder |
| Should manual entries (Story 10) trigger the reflection prompt schedule? A reconstructed 3-year-old decision should probably not get a 1-month prompt. | No | Product |
| What is the monetization mechanic — free trial length, price point, what is gated? | No — but affects onboarding flow | Founder |
| How are reconstructed past decisions weighted vs. forward-logged ones in the pattern engine? | No — affects P1 pattern engine expansion | Engineering / Data |

---

## Success Bar for August 14 Private Beta

The beta is successful if:
- ≥70% of users who complete an interrogation report it surfaced something they hadn't named
- ≥60% of started interrogation sessions reach a completed summary
- The pattern alert fires at least once for a user with 2+ logged decisions and is rated "relevant"

If the interrogation counter-consideration (Story 5) does not pass a quality bar by end of week 2, re-evaluate scope before proceeding to the log and reflection infrastructure.
