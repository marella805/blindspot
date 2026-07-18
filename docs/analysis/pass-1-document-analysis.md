# Blindspot — Pass 1: Requirements and Documentation Analysis

**Prepared:** 2026-07-16  
**Analyst role:** Senior Solution Architect and Business Analyst  
**Scope:** Pre-build requirements and documentation analysis only. No user stories, epics, or implementation tasks generated.  
**Hard deadline context:** August 14, 2026 private beta (approx. 4 weeks from analysis date)

---

## 1. Executive Summary

Blindspot is a consumer decision-intelligence platform with a coherent product vision and a strong foundational narrative. The documentation set is unusually self-aware for an early-stage product: the PRD explicitly calls out what is not in scope, names the highest-risk build components, and flags blocking questions before engineering starts. This is a meaningful advantage.

However, the analysis reveals a material and widening divergence between the documentation layer (PRD, handoff, ERD markdown) and the implemented layer (database schema, API routes, frontend types). Several entities described in the handoff as essential — versioned Profile, interrogation transcript storage, notes, draft status, profile snapshot reference — are either absent or under-represented in the actual schema. The pattern alert mechanism described in the PRD (pairwise structural similarity between decisions) differs architecturally from what is implemented (per-session LLM pattern classification). An undocumented achievements/gamification system exists in code with no corresponding documentation.

**Overall readiness assessment:** Documentation alone is at 2.5/5 for solution design readiness, primarily blocked by the profile model gap, the interrogation termination gap, and the divergence between documented and implemented data architecture. The codebase represents an incomplete but directionally coherent first implementation that has made architectural decisions not yet reflected in the documentation.

**Summary scorecard:**
- Critical contradictions: 7
- High-severity contradictions: 4
- Blocking gaps: 9
- Non-blocking gaps: 12
- P0 stakeholder questions: 8

---

## 2. Source Document Inventory

| # | File Path | Document Type | Purpose | Key Subjects | Status | Relationships |
|---|---|---|---|---|---|---|
| 1 | `docs/prd.md` | Product Requirements Document | Defines scope, requirements, success metrics, and open questions for v1 | Problem statement, target users, P0/P1/P2 requirements, success metrics, timeline | **Current** — dated July 8, 2026 | Primary source; user stories, handoff, and ERD are derived from it |
| 2 | `docs/personas.md` | User Research Report | Defines four user personas, segments, journey maps, and acquisition strategy | Jordan, Priya, Marcus, Alex; customer journey stages; key insights; recommendations | **Current** — dated July 8, 2026; explicitly labeled as qualitative hypothesis, 1 founder interview | Informs PRD requirements; directly referenced in handoff |
| 3 | `docs/user-stories.md` | Backlog: User Stories | 15 P0 user stories with acceptance criteria and a story map | Stories 1–15, priorities, dependencies, effort estimates, technical notes | **Current** — derived from PRD; references spikes required for Stories 4, 5, 15 | Derived from `prd.md`; references `handoff.md` for data model |
| 4 | `docs/handoff.md` | Developer Handoff | Engineering-facing summary of what to build, build sequence, data model, and spikes | Core data model, build sequence, LLM integration notes, open questions | **Current** — references August 14 deadline; consistent with PRD dates | Derived from PRD; describes a data model that partially diverges from `erd.md` and `schema.ts` |
| 5 | `docs/erd.md` | Entity Relationship Diagram | Defines the data model in Mermaid ERD notation with design notes | 8 core entities, relationships, enums, design rationale | **Current but incomplete** — matches `schema.ts` structurally but is missing entities described in `handoff.md` | Should be authoritative data model; diverges from `handoff.md` on Profile, transcript storage, and notes |
| 6 | `docs/erd.html` | ERD (rendered) | HTML rendering of the Mermaid ERD | Same content as `erd.md` | **Current** — appears to be a visual companion to `erd.md` | Duplicate of `erd.md` content |
| 7 | `design/Decision Interrogation.dc.html` | Design Prototype | Interactive design specification for the interrogation flow | UI states, interrogation panel layout, option comparison, coaching style picker | **Uncertain** — HTML design file; content may be ahead of or behind the current PRD | Relationship to current UI implementation unclear without full inspection |
| 8 | `README.md` | Project Overview | Brief product description and links to docs | Product summary, directory structure, run instructions | **Current** — consistent with other docs | Entry point; references `docs/` for authoritative content |
| 9 | `src/lib/db/schema.ts` | Implemented Database Schema | Drizzle ORM schema defining actual database tables | All live tables, enums, relations, constraints | **Current** — implementation in progress; is the authoritative data contract for engineering | Partially diverges from `erd.md`; adds auth adapter tables not in ERD; omits Profile versioning, notes, and transcript storage |
| 10 | `src/types.ts` | Frontend TypeScript Types | Client-side data model used by React components | `UserProfile`, `DecisionEntry`, `PatternAlert`, `ReflectionRecord`, `InterrogationMessage` | **Current** — reflects demo/frontend state, not necessarily the DB schema | Diverges from `schema.ts` in several places (e.g., `ReflectionRecord.type` = `'1month' \| '3month'` vs. enum in DB) |
| 11 | `src/lib/db/seed.ts` | Seed Data | Seeds `PatternTypes` table with 6 system-defined patterns | 6 pattern slugs with titles, descriptions, detection thresholds | **Current** | Defines the live pattern taxonomy; diverges from PRD's pattern attribute set |
| 12 | `src/lib/achievements.ts` | Gamification Logic | Achievement unlock conditions | 9 achievement definitions with unlock criteria | **Current — undocumented** | No corresponding documentation in PRD, personas, or user stories |
| 13 | `src/lib/auth.ts` | Authentication Configuration | NextAuth.js setup with Resend magic-link provider | JWT strategy, Drizzle adapter, sign-in page | **Current** | Not referenced in any documentation |
| 14 | `src/app/api/*/route.ts` (all) | API Route Implementations | REST endpoints for decisions, interrogation, patterns, reflections, user | CRUD operations, LLM streaming, pattern classification | **Current — partially implemented** | No API documentation exists; routes are the authoritative source of API behavior |
| 15 | `src/lib/demo-data.ts` | Demo Fixture Data | Hard-coded demo scenarios for "fresh" and "seasoned" user states | Jordan profiles, decision history, reflections, patterns | **Current** | Reveals implicit product expectations; not a requirements document |
| 16 | `package.json` | Dependency Manifest | Technology stack | Next.js 15, React 19, Drizzle ORM, AI SDK, NextAuth, Zod, Resend, Playwright | **Current** | Defines runtime and tooling constraints |
| 17 | `.env.local` | Environment Configuration | API keys and environment variables | Database URL (empty), Anthropic API key (present), Auth Secret, Resend keys (empty) | **Current** — **CAUTION: contains a live Anthropic API key** | Reveals integration dependencies; DATABASE_URL and Resend keys are unset |

**Files of uncertain relevance:**
- `src/lib/demo-data.ts`: Not a requirements document, but it embeds assumptions about product behavior (e.g., `calibration` field semantics, decision categories as capitalized strings, reflection types as `'1month' | '3month'`) that conflict with the schema. Treated as an implementation artifact, not a specification.
- `src/lib/achievements.ts`: Entirely undocumented. An active product decision with no requirements traceability.

---

## 3. Product Understanding

### Business Problem
*Source: `docs/prd.md` §Problem Statement; `docs/personas.md` §Executive Summary*

People making high-stakes decisions — firm recruiting, career pivots, school choices — construct rational justifications after decisions are already made emotionally. They repeat the same structural mistakes across different domains (e.g., a prestige trap in school choice, then again in firm choice) and have no mechanism to connect the dots across separate domains or separate life stages. No existing tool distinguishes stated preference from revealed preference, or surfaces cross-context patterns that span a user's decision history. The cost is concrete and measurable: a $150k scholarship gap, years in the wrong environment, patterns that only become legible in hindsight.

### Product Vision
*Source: `docs/handoff.md` §What We Are Building; `README.md`*

A structured decision-intelligence system that stress-tests reasoning through Socratic interrogation, builds a longitudinal decision log, and surfaces structural patterns across separate decisions over time. Value is delivered on two timelines: Day 1 value (a single interrogation session that surfaces something the user had not named) and Long-term value (the pattern engine, which requires months of accumulated decisions).

### Business Objectives
*Source: `docs/prd.md` §Goals*

| # | Objective | Target |
|---|---|---|
| 1 | Interrogation quality: users report surfaced something not previously named | ≥70% of completed sessions |
| 2 | Activation: users log ≥2 decisions within first 14 days | ≥60% of signups |
| 3 | 90-day retention | ≥30% active at 90 days |
| 4 | Reflection loop engagement | ≥50% of 1-month prompts answered |
| 5 | Pattern engine signal quality | ≥60% of pattern alerts rated "relevant" |

### Target Users
*Source: `docs/personas.md` §Personas*

| Persona | Description | Age/Stage | Primary JTBD |
|---|---|---|---|
| Jordan | Active decision-maker at a deadline | 17–19 | Stress-test reasoning before committing at a hard fork |
| Priya | Mid-career domain piveter | 27–35 | Test whether reasons for a major change are grounded in self-knowledge |
| Marcus | Patterned achiever | 30–42 | Understand the underlying structural pattern across past decisions |
| Alex | Performance pattern logger | 26–40 | Behavioral feedback loop for recurring high-stakes performance events (P1) |

### Primary User Journeys
*Source: `docs/personas.md` §Customer Journey Map; `docs/user-stories.md`*

1. **New user onboarding → first interrogation** (Jordan): Complete profile → start interrogation → receive session summary → view decision in log
2. **Returning user with decision history → new interrogation with pattern alert** (Marcus): Start interrogation → receive pattern alert showing structural match → review past entry → proceed with informed context
3. **Post-decision reflection loop** (Priya): Receive 1-month or 3-month prompt → answer structured questions → reflection stored and available to pattern engine
4. **Retrospective entry (manual log)** (Marcus onboarding): Create manual entry for past decisions → build historical dataset for pattern engine

### Core Capabilities
*Source: `docs/prd.md` §Requirements §Must-Have*

1. **User Profile Onboarding** — Structured intake capturing values, risk tolerance, financial situation, work-life weighting, career stage, geographic constraints. Cold-start solution. Cannot be skipped.
2. **Decision Interrogation Mechanic** — Socratic multi-turn AI questioning. System pushes back on weak or circular reasoning. Minimum 5 substantive follow-up questions. Session aware of user profile.
3. **Decision Log** — Create, view, and manage entries. Both interrogation-driven and manual entry. Chronological timeline.
4. **Reflection Prompts** — 1-month and 3-month tool-initiated prompts with three structured questions. User can lock entries to stop prompts. Free-form reflection anytime.
5. **Basic Pattern Alert** — At interrogation start, system checks for structural similarity to past decisions. Alert fires if ≥2 shared structural attributes found.

### Expected Business Outcomes
- Establish a habit of structured pre-commitment reasoning among high-stakes decision-makers
- Build a longitudinal dataset per user that increases product value over time (defensible moat)
- Word-of-mouth acquisition within peer cohorts (college applicants, legal recruiting) during decision seasons

### Success Metrics
*Source: `docs/prd.md` §Success Metrics*

Leading (2–4 weeks): Onboarding completion ≥70%, interrogation completion ≥60%, Day-7 retention ≥40%, post-interrogation "surfaced something new" ≥70%.  
Lagging (60–90 days): 30-day retention ≥30%, 90-day retention ≥20%, reflection response rate ≥50%, pattern alert relevance ≥60%, subscription conversion ≥15%.

### Major Systems and Integrations
*Source: `docs/handoff.md`; `src/lib/auth.ts`; `package.json`*

| System | Technology | Status |
|---|---|---|
| Application framework | Next.js 15 (App Router), React 19, TypeScript | In development |
| Database | PostgreSQL via Drizzle ORM | Schema defined; DATABASE_URL not configured |
| Authentication | NextAuth.js v5 (magic link via Resend) | Configured; Resend API key unset |
| AI/LLM | Anthropic Claude via AI SDK (`@ai-sdk/anthropic`) | Integrated; API key present |
| Email delivery | Resend | Configured in auth; RESEND_API_KEY unset |
| P1 integration | Otter AI (transcript ingestion) | Not started |
| Notifications | Undefined | Not implemented |

### Privacy and Security Considerations
*Source: `docs/prd.md`; `src/lib/auth.ts`; `src/lib/db/schema.ts`*

- The product stores deeply personal decision history, reasoning, and psychological pattern data. This is sensitive personal data with no equivalent in commodity B2B SaaS.
- Authentication uses magic-link email (no password), which limits credential-stuffing risk but introduces email deliverability dependency.
- `onDelete: 'cascade'` is applied on all user-owned tables — deletion of a user cascades to all decisions, sessions, reflections, and pattern alerts.
- No data retention or deletion policy is documented.
- The `.env.local` file contains a live Anthropic API key that should not be committed.

---

## 4. Requirement Catalog

### Business Requirements

| ID | Requirement | Source | Persona/Actor | Business Objective | Confidence | Notes |
|---|---|---|---|---|---|---|
| BR-001 | The product must deliver value on day one before any decision history exists, using the user profile as the cold-start solution | `prd.md` §Must-Have #1; `personas.md` §Key Insights #1 | All personas | Activation | High | If this fails, early retention collapses |
| BR-002 | The product must increase in value as a user accumulates decision history — value must compound over time | `prd.md` §Goals; `personas.md` §Key Insights #1 | Marcus, Priya | 90-day retention | High | The pattern engine is the mechanism |
| BR-003 | The product must distinguish stated preference from revealed preference and surface that divergence to the user | `prd.md` §Problem Statement; `prd.md` §Nice-to-Have #5 | Marcus | Long-term retention | High | P1 feature; requires longitudinal data |
| BR-004 | The product must not be a journaling app, general AI chatbot, habit tracker, or therapy tool | `prd.md` §Non-Goals | All | Scope control | High | Constraint on product design decisions |
| BR-005 | The interrogation mechanic must push back — it cannot simply validate what the user already believes | `prd.md` §Must-Have #2; `personas.md` §Key Insights #3 | All personas | Interrogation quality goal | High | The counter-consideration is the make-or-break moment |
| BR-006 | The product targets users at a life stage where decisions carry lasting consequences and patterns have meaningful runway | `prd.md` §Target Users | Active segment | Market positioning | High | Defines acquisition targeting |
| BR-007 | Onboarding cannot be skipped — the interrogation mechanic degrades without profile data | `prd.md` §Must-Have #1; `user-stories.md` Story 1 AC | New users | Activation | High | Enforced at route level by middleware |
| BR-008 | The private beta launches on August 14, 2026 with a limited cohort of 20–50 users | `prd.md` §Timeline; `handoff.md` §Success Bar | Business | Delivery | High | 4 weeks from analysis date |

### Functional Requirements

| ID | Requirement | Source | Persona/Actor | Business Objective | Confidence | Notes |
|---|---|---|---|---|---|---|
| FR-001 | New user can complete profile onboarding in ≤15 minutes | `prd.md` §Must-Have #1; `user-stories.md` Story 1 | Jordan, all new users | Activation | High | — |
| FR-002 | Profile captures: top 5 ranked values, risk tolerance (structured), financial situation, work-life weighting, career stage, geographic constraints | `prd.md` §Must-Have #1; `user-stories.md` Story 1 | New users | Activation | High | **Not modeled in current schema — gap** |
| FR-003 | Profile is editable after onboarding; each edit is timestamped; prior versions are preserved | `prd.md` §Must-Have #1; `user-stories.md` Story 3 | All users | Data integrity | High | **Not modeled in current schema — gap** |
| FR-004 | Profile data in use at session time is timestamped and preserved; editing profile does not alter past summaries | `user-stories.md` Story 2 AC; Story 3 AC | All users | Data integrity | High | **profileSnapshotId not in schema — gap** |
| FR-005 | User cannot submit a response shorter than a defined minimum length without a prompt to expand | `prd.md` §Must-Have #2; `user-stories.md` Story 4 AC | Active decision-makers | Interrogation quality | High | Minimum length value is an open question |
| FR-006 | Session asks minimum 5 substantive follow-up questions per decision | `prd.md` §Must-Have #2 | Active decision-makers | Interrogation quality | High | Not enforced by current LLM prompt alone |
| FR-007 | System explicitly challenges at least one piece of reasoning per session with a counter-consideration or alternative framing | `prd.md` §Must-Have #2; `user-stories.md` Story 5 | Active decision-makers | Interrogation quality | High | Highest-risk prompt engineering challenge |
| FR-008 | System detects circular reasoning and prompts for a new angle | `prd.md` §Must-Have #2; `user-stories.md` Story 5 | Active decision-makers | Interrogation quality | High | Requires LLM detection logic |
| FR-009 | Session produces a structured summary: decision name, options, option chosen, key factors, articulated reasoning, acknowledged tradeoffs | `prd.md` §Must-Have #2; `user-stories.md` Story 6 | Active decision-makers | Decision log quality | High | Currently modeled as `Recommendations` table — naming mismatch |
| FR-010 | User can save a draft interrogation mid-session and resume it later | `prd.md` §Must-Have #2; `user-stories.md` Story 7 | All users | UX | High | **Draft status not modeled in schema — gap** |
| FR-011 | Interrogation questions reference user profile data directly | `prd.md` §Must-Have #2; `user-stories.md` Story 2 | All users | Personalization | High | Partially implemented via `decisionContext` field |
| FR-012 | User can create a decision entry via interrogation (primary) or manual log (secondary) | `prd.md` §Must-Have #3; `user-stories.md` Story 10 | All users | Decision log | High | — |
| FR-013 | Each decision entry stores: decision name, date, options (key/value pairs), option chosen, interrogation summary, free tags | `prd.md` §Must-Have #3 | All users | Decision log | High | Tags not modeled in schema |
| FR-014 | User can view all past entries in a chronological timeline | `prd.md` §Must-Have #3; `user-stories.md` Story 8 | All users | Decision log | High | — |
| FR-015 | User can edit option data fields after entry creation | `prd.md` §Must-Have #3; `user-stories.md` Story 9 | All users | Decision log | High | — |
| FR-016 | User can add a note to any entry at any time outside the reflection schedule | `prd.md` §Must-Have #3; `user-stories.md` Story 11 | All users | Decision log | High | **Notes table not in schema — gap** |
| FR-017 | User receives in-app notification at 1-month and 3-month post-decision | `prd.md` §Must-Have #4; `user-stories.md` Story 12 | Reflective users | Reflection loop | High | Notification mechanism undefined |
| FR-018 | Reflection prompt asks three structured questions: how did this turn out? what do you wish you'd known? would you make the same choice again? | `prd.md` §Must-Have #4; `user-stories.md` Story 12 | Reflective users | Reflection data quality | High | DB stores only free-text `content` — structured responses not modeled |
| FR-019 | User can write a free-form reflection at any time | `prd.md` §Must-Have #4; `user-stories.md` Story 13 | All users | Reflection loop | High | — |
| FR-020 | User can lock an entry to stop all future prompts; locking is reversible (user can unlock) | `prd.md` §Must-Have #4; `user-stories.md` Story 14 | All users | Decision management | High | Unlock route not implemented; only lock route exists |
| FR-021 | At interrogation start, system scans past entries for structural overlap; alerts if ≥2 shared structural attributes match | `prd.md` §Must-Have #5; `user-stories.md` Story 15 | Pattern-aware users | Pattern engine | High | **Implementation differs architecturally from PRD description — see contradiction C-007** |
| FR-022 | Alert includes reflection outcome data from matched entry if available | `prd.md` §Must-Have #5; `user-stories.md` Story 15 AC | Pattern-aware users | Pattern engine | High | — |
| FR-023 | User can dismiss a pattern alert or open the matched entry before proceeding | `prd.md` §Must-Have #5; `user-stories.md` Story 15 AC | Pattern-aware users | Pattern engine | High | Dismiss is implemented; "open matched entry" flow unclear in code |
| FR-024 | Manual entries are flagged as lower confidence in the pattern engine | `user-stories.md` Story 10 AC | All users | Pattern engine integrity | Medium | Not modeled in schema |
| FR-025 | Manual entries do not automatically start reflection prompt schedule | `user-stories.md` Story 10 AC | All users | Data integrity | Medium | Current POST /decisions always schedules 1mo and 3mo — no manual entry type distinction |

### User Experience Requirements

| ID | Requirement | Source | Confidence | Notes |
|---|---|---|---|---|
| UX-001 | Onboarding profile must feel behavioral, not categorical — use scenario-based questions, not value ranking dropdowns | `personas.md` §Onboarding Design; `user-stories.md` Story 1 AC | High | Critical design constraint |
| UX-002 | The counter-consideration must feel precise, not generic — it must name a specific unaddressed tradeoff | `prd.md` §Must-Have #2; `personas.md` §Key Insights #3 | High | Highest-risk prompt engineering challenge |
| UX-003 | Empty state on decision log must explain the log's purpose and prompt the user to log their first decision | `user-stories.md` Story 8 AC | High | — |
| UX-004 | The interrogation must feel unlike anything the user has tried (not a form, not a chatbot, not a pros/cons list) within the first 3 questions | `personas.md` §Jordan journey §Consideration | High | — |
| UX-005 | Draft entries must be visually distinct from completed entries in the decision log | `user-stories.md` Story 7 AC; Story 8 AC | High | — |
| UX-006 | Locked entries must be visually distinguished in the decision log | `user-stories.md` Story 14 AC | High | — |
| UX-007 | Manual entries must be labeled "manually logged" and distinct from interrogation entries | `user-stories.md` Story 10 AC | High | — |
| UX-008 | Profile must feel like the first act of the interrogation, not a prerequisite form | `personas.md` §Key Insights #2; §Onboarding Design | High | Design constraint, not engineering |
| UX-009 | Post-session prompt must ask: "Did this surface something you hadn't named?" (single question) | `prd.md` §Success Metrics | Medium | No implementation defined |
| UX-010 | User must see session progress indicator during interrogation | `user-stories.md` Story 4 AC | High | — |

### Business Rules

| ID | Rule | Source | Confidence | Notes |
|---|---|---|---|---|
| RULE-001 | Onboarding cannot be skipped | `prd.md` §Must-Have #1; `user-stories.md` Story 1 AC | High | Enforced by route middleware |
| RULE-002 | A locked decision entry becomes read-only; reflections can still be completed after lock | `erd.md` §Design Notes; `user-stories.md` Story 14 | High | — |
| RULE-003 | AI-generated session summary is read-only — user cannot edit it (but can add a separate note) | `user-stories.md` Story 6 AC | High | — |
| RULE-004 | A user can have only one active draft per decision at a time | `user-stories.md` Story 7 AC | High | — |
| RULE-005 | Notes on entries are append-only — existing notes are not editable or deletable | `user-stories.md` Story 11 AC | High | — |
| RULE-006 | Dismissing a scheduled reflection prompt means it is not re-sent | `user-stories.md` Story 12 AC | High | — |
| RULE-007 | Writing an unscheduled reflection does not reset or cancel the scheduled prompt schedule | `user-stories.md` Story 13 AC | High | — |
| RULE-008 | Unlocking a decision re-enables prompts starting from the next scheduled interval | `user-stories.md` Story 14 AC | Medium | Unlock route not implemented |
| RULE-009 | Recommendations are never updated — each re-interrogation produces a new row | `erd.md` §Design Notes | High | — |
| RULE-010 | PatternTypes are system-seeded and not user-editable | `erd.md` §Design Notes; `seed.ts` | High | 6 types defined in seed |
| RULE-011 | A pattern alert fires only when the detection threshold for that pattern type is reached | `erd.md` §Design Notes; `interrogation/[sessionId]/summary/route.ts` | Medium | Threshold logic has a gap — see C-007 |
| RULE-012 | Pattern alert firing at interrogation start (PRD) vs. at summary generation (implementation) | `prd.md` §Must-Have #5 vs. implementation | **Conflicted** — see contradiction C-007 |
| RULE-013 | No pattern alert is surfaced if no past entries exist or no structural match is found | `prd.md` §Must-Have #5; `user-stories.md` Story 15 AC | High | — |

### Data Requirements

| ID | Requirement | Source | Confidence | Notes |
|---|---|---|---|---|
| DR-001 | Profile must be versioned — each edit timestamped; prior versions preserved | `prd.md` §Must-Have #1; `user-stories.md` Story 3 | High | **Gap: no Profile table or versioning in schema** |
| DR-002 | Profile snapshot at decision time must be preserved (which profile version was active) | `user-stories.md` Story 2 AC; `handoff.md` §Core Data Model | High | **Gap: no profileSnapshotId in schema** |
| DR-003 | Interrogation session must store Q&A turns (each question and response) | `handoff.md` §Core Data Model (turns[]) | High | **Gap: turns not persisted — only in-memory during session** |
| DR-004 | Decision entries must have a `status` field: draft | completed | locked | `handoff.md` §Core Data Model | High | **Gap: schema has only `lockedAt`; draft state is implicit** |
| DR-005 | Manual decision entries must be flagged as lower-confidence than interrogation entries | `user-stories.md` Story 10 AC | Medium | **Gap: no entry_type or confidence field in schema** |
| DR-006 | Free tags on decision entries must be stored | `prd.md` §Must-Have #3 | Medium | **Gap: no tags field in schema** |
| DR-007 | Notes on decision entries must be append-only and timestamped | `prd.md` §Must-Have #3; `user-stories.md` Story 11 | High | **Gap: no Notes entity in schema** |
| DR-008 | Reflection responses must store structured Q&A (three questions + answers) | `prd.md` §Must-Have #4; `user-stories.md` Story 12 | High | **Gap: schema stores only free-text `content`** |
| DR-009 | PatternAlertDecisions junction table must have composite PK `(pattern_alert_id, decision_id)` | `erd.md` §Design Notes | High | Implemented correctly in schema |
| DR-010 | User data cascade: deleting a user deletes all associated decisions, sessions, reflections, alerts | `schema.ts` (onDelete: cascade) | High | Implemented |
| DR-011 | Decisions.interrogation_count must increment on each new InterrogationSession | `erd.md` §Design Notes | High | Implemented in API |

### Integration Requirements

| ID | Requirement | Source | Confidence | Notes |
|---|---|---|---|---|
| INT-001 | Authentication via email magic link (Resend) | `auth.ts`; `prd.md` (implied) | High | Resend API key not configured in `.env.local` |
| INT-002 | LLM calls via Anthropic Claude (AI SDK) for interrogation turn generation | `interrogation/route.ts` | High | Using `claude-opus-4-8-20251101` — not latest model |
| INT-003 | LLM calls via Anthropic Claude for summary/recommendation generation | `interrogation/[sessionId]/summary/route.ts` | High | Using `claude-opus-4-8-20251101` |
| INT-004 | LLM calls via Anthropic Claude Haiku for pattern classification | `interrogation/[sessionId]/summary/route.ts` | High | Using `claude-haiku-4-5-20251001` |
| INT-005 | Reflection prompt delivery mechanism (push/email/in-app) | `prd.md` §Must-Have #4; `handoff.md` §Open Questions | Low | **Gap: mechanism not defined or implemented** |
| INT-006 | Otter AI transcript ingestion (P1) | `prd.md` §Nice-to-Have #2 | Low | Out of scope for v1; no specification |
| INT-007 | Scheduled background jobs for reflection prompt delivery | `user-stories.md` Story 12 Technical Note | Medium | **Gap: no scheduling mechanism defined or implemented** |

### Security Requirements

| ID | Requirement | Source | Confidence | Notes |
|---|---|---|---|---|
| SEC-001 | All API routes must validate authenticated session before returning data | `src/app/api/*/route.ts` | High | Implemented via `auth()` check on all routes |
| SEC-002 | Users must only be able to access their own decisions, reflections, and pattern alerts | All route files | High | Implemented via userId ownership checks |
| SEC-003 | Locked decisions must return 403 on write attempts | `decisions/[id]/route.ts` | High | Implemented |
| SEC-004 | Authentication credentials (API keys) must not be committed to the repository | `.env.local` | **Critical** | **Live Anthropic API key is present in `.env.local`; `.env.local` should be in `.gitignore`** |
| SEC-005 | All personal data (decision history, reasoning, psychological patterns) must be protected at rest | Not documented | Low | No encryption-at-rest specification exists |
| SEC-006 | Session tokens must use a secure, server-side strategy | `auth.ts` (JWT strategy) | High | JWT sessions used |

### Non-Functional Requirements

| ID | Requirement | Source | Confidence | Notes |
|---|---|---|---|---|
| NFR-001 | Onboarding must be completable in ≤15 minutes | `prd.md` §Must-Have #1 | High | Measurable |
| NFR-002 | LLM interrogation responses must be fast enough to feel conversational | `prd.md` (implied); `handoff.md` | Medium | No latency target defined |
| NFR-003 | Interrogation session counter-consideration must be accurate and specific enough to pass quality bar | `prd.md` §Timeline | High | Qualitative — must pass user test by end of week 2 |
| NFR-004 | Pattern classification must be consistent — the same decision should produce the same tags across re-runs | `handoff.md` §LLM Integration Notes | Medium | Determinism challenge with LLM classification |
| NFR-005 | Availability, performance, and scalability targets | Not documented | Low | **Gap: no NFRs defined for production** |
| NFR-006 | Web-first; responsive design; no native mobile app for v1 | `prd.md` §Future Considerations #5 | High | — |
| NFR-007 | Error handling for failed LLM calls | Not documented | Low | **Gap: no error handling specification** |

---

## 5. Persona Analysis

### Persona 1: Jordan — The Active Decision-Maker
*Source: `docs/personas.md` §Persona 1; `docs/prd.md` §User Stories Persona 1*

| Attribute | Detail |
|---|---|
| Goals | Make the right decision at a hard deadline; resist social/family pressure to choose prestige over fit |
| Key pain points | Emotional pressure from peers and family; cost differences feel abstract; no structured way to stress-test reasoning |
| Permissions | All standard user permissions |
| Primary actions | Complete onboarding, run interrogation, view decision log |
| Expected workflow | High-urgency, intensive use for a few weeks around decision, then dormant until next fork |
| Exceptional scenarios | Decision deadline arrives before interrogation is complete (draft save is critical) |
| Conflicts with other personas | Jordan's urgency conflicts with the profile's thoroughness requirement — tension between speed and cold-start value |
| Missing information | What happens when Jordan's decision deadline has passed and the chosen option can no longer be changed? Does the system handle regret logging differently from active decisions? |

### Persona 2: Priya — The Mid-Career Domain Piveter
*Source: `docs/personas.md` §Persona 2*

| Attribute | Detail |
|---|---|
| Goals | Test whether reasons for a major change are grounded in self-knowledge, not restlessness or others' stories |
| Key pain points | Long decision window reduces urgency; sunk cost anxiety; hard to separate signal from noise |
| Permissions | All standard user permissions |
| Primary actions | Multiple interconnected decisions over 6–12 months; reflection responses; profile evolution view (P1) |
| Expected workflow | Lower urgency, higher engagement horizon; uses product across multiple related decisions |
| Exceptional scenarios | User logs multiple interconnected sub-decisions (geographic move, salary, career path) — does the system handle decision trees? |
| Conflicts | None explicitly documented |
| Missing information | No journey for users who have a long decision window and may not return for weeks between sessions |

### Persona 3: Marcus — The Patterned Achiever
*Source: `docs/personas.md` §Persona 3*

| Attribute | Detail |
|---|---|
| Goals | Understand the structural pattern across past decisions; break a cycle |
| Key pain points | Therapy is slow; journaling doesn't surface patterns; no tool has the full cross-context picture |
| Permissions | All standard user permissions; highest investment in onboarding and historical entry reconstruction |
| Primary actions | Reconstruct past decisions at onboarding; receive pattern alerts; view profile evolution (P1) |
| Expected workflow | Retrospective-first, then forward-looking; does not churn once patterns start appearing |
| Exceptional scenarios | Reconstructed past entries are rationalizations — how does the system handle known-low-confidence historical data? |
| Conflicts | Marcus needs the pattern engine to work well immediately; the pattern engine requires multiple forward-logged decisions to be reliable |
| Missing information | **Confidence: Medium** — inferred, not directly named in the single founder interview |

### Persona 4: Alex — The Performance Pattern Logger
*Source: `docs/personas.md` §Persona 4*

| Attribute | Detail |
|---|---|
| Goals | Behavioral feedback loop for recurring high-stakes performance events |
| Permissions | Standard user permissions |
| Primary actions | Log attempt entries, connect Otter AI transcripts, view behavioral patterns |
| Expected workflow | High frequency of use; habit-forming |
| Exceptional scenarios | Transcript ingestion failure; API key revocation |
| Note | **Alex is explicitly a P1 persona.** V1 has no attempt logging, no transcript integration. Alex has no viable user journey in v1. |

### Persona Coverage Assessment

| User Type | Coverage Status |
|---|---|
| End users (active decision-makers) | **Fully covered** — Jordan persona |
| Users in cold-start phase (no log history) | **Partially covered** — Jordan and new-user stories; but cold-start behavior when profile is not yet rich is not defined |
| Users with mature log history | **Covered** — Marcus persona; pattern alert fires after sufficient entries |
| Administrators | **Not covered** — no admin persona exists |
| Support teams | **Not covered** — no support persona exists |
| System actors (reflection scheduler, pattern engine) | **Not covered** — system actors are not defined as actors in any document; no scheduler is specified or implemented |
| Institutional/cohort mode | **Explicitly excluded** — P2; no admin or institution persona |

**Proposed persona (not in documentation):** System Actor — Reflection Scheduler. A cron or background job that evaluates due reflections and delivers notifications. This actor's behavior (trigger conditions, retry policy, failure handling) is entirely undefined across all documents.

---

## 6. User Journey and Workflow Analysis

### Journey 1: New User → First Completed Interrogation
*Documented: `docs/prd.md` §Must-Have 1–3; `docs/user-stories.md` Stories 1, 4, 5, 6*

```
Sign up (magic link) → Onboarding profile [GATE: cannot skip] → New decision interrogation
→ Name decision + options → Socratic Q&A loop (min 5 questions) → System challenges reasoning
→ Session completes → Summary generated → Decision logged → 1mo + 3mo reflections scheduled
```

**Gaps in this journey:**
- What happens if the user closes the browser mid-interrogation? (Draft auto-save is specified but the trigger is unclear)
- The post-session "did this surface something?" prompt is defined as a success metric mechanism but has no documented UX placement

### Journey 2: Pattern Alert at Interrogation Start
*Documented: `docs/prd.md` §Must-Have #5; `docs/user-stories.md` Story 15*

```
User starts new interrogation → System scans past entries for structural attributes → 
IF ≥2 shared attributes found: show alert with matched entry + reflection outcome →
User dismisses or views matched entry → Proceeds to interrogation
```

**Gaps:**
- The structural attribute taxonomy (prestige vs. intimacy, financial sacrifice for status, etc.) is defined in the PRD but the seeded pattern taxonomy (binary_framing, external_validation, etc.) is a different vocabulary — these are not directly mapped
- The PRD describes a pairwise similarity check at interrogation start; the implementation classifies after summary generation — these are different trigger points

### Journey 3: Reflection Loop
*Documented: `docs/prd.md` §Must-Have #4; `docs/user-stories.md` Stories 12, 13, 14*

```
Decision logged → 1mo reflection scheduled → [1 month passes] → In-app notification →
User answers 3 structured questions → Reflection stored → Pattern engine updated →
[3 months passes] → Second prompt → [User may lock at any point]
```

**Gaps:**
- "In-app notification" — the mechanism is undefined. Is this a toast/banner on next login? A badge? There is no push notification or email notification implementation
- What happens if the user does not open the app for 2 months after a decision? The 1-month prompt will never be seen
- What happens when the user ignores prompts repeatedly? No escalation or fallback is documented

### Journey 4: Manual Entry (Reconstructed Past Decision)
*Documented: `docs/user-stories.md` Story 10*

```
User navigates to decision log → Creates manual entry → Enters: name, date, options, choice, free-text reasoning →
Entry labeled "manually logged" → Entry flagged as lower-confidence in pattern engine →
Reflection schedule does NOT auto-start (user must opt in)
```

**Gaps:**
- The current `POST /decisions` route always schedules 1mo and 3mo reflections — it does not distinguish manual from interrogation entries. This directly contradicts Story 10 AC.

---

## 7. ERD and Data Model Analysis

### Core Entities

| Entity | Purpose | Status |
|---|---|---|
| `users` | User identity + auth; includes `role`, `decisionContext`, `calibration` | Implemented; profile fields are thin compared to PRD spec |
| `decisions` | A single decision entry; core record | Implemented |
| `decisionOptions` | Options within a decision (pros/cons, position) | Implemented |
| `interrogationSessions` | One Q&A session for a decision | Implemented; no transcript/turns storage |
| `recommendations` | AI-generated summary at session end | Implemented; named differently from PRD ("session summary") |
| `patternTypes` | System-seeded pattern taxonomy | Implemented; 6 types |
| `patternAlerts` | A triggered pattern alert for a user | Implemented |
| `patternAlertDecisions` | Junction: which decisions contributed to an alert | Implemented |
| `reflections` | Scheduled or user-initiated reflection | Implemented; only free-text content field |
| `accounts`, `verificationTokens` | NextAuth adapter tables | Implemented; not in ERD documentation |

### Missing Entities (Documented but Not Implemented)

| Missing Entity | Documented In | Why Needed | Impact if Missing |
|---|---|---|---|
| `Profile` / `ProfileVersions` | `handoff.md` Core Data Model; `prd.md` §Must-Have #1; `user-stories.md` Story 3 | Versioned profile so past sessions reference the profile active at decision time | Cannot track profile evolution; profile personalization is unreliable over time |
| `Notes` | `prd.md` §Must-Have #3; `user-stories.md` Story 11 | Append-only timestamped notes on decisions | FR-016, Story 11 cannot be implemented |
| `InterrogationTurns` (or `turns[]` within session) | `handoff.md` Core Data Model | Transcript of Q&A exchanged during session | Interrogation history is lost on session end; pattern engine cannot re-read transcripts; debugging is impossible |

### Divergences Between Documented and Implemented Schema

| Attribute | Documented (ERD / Handoff) | Implemented (schema.ts) | Impact |
|---|---|---|---|
| Profile | First-class versioned entity with structured fields | Merged into `users` table as `role`, `decisionContext`, `calibration` (3 unstructured fields) | Cannot satisfy FR-002, FR-003, FR-004, RULE, Story 3 |
| Decision status | `draft \| completed \| locked` (handoff) | Only `lockedAt` timestamp (schema) | Draft state is not persistable; Story 7 (save draft) cannot be fully implemented without inferring status |
| Profile snapshot reference | `profileSnapshotId` on decision (handoff) | Not present | Past sessions cannot be reliably rehydrated with the profile that was active |
| Reflection content | Structured Q&A (3 questions + answers) (PRD) | Single `content: text` field | Three structured reflection questions cannot be stored or queried independently |
| Notes | Append-only notes entity on decisions (PRD) | No notes table | Story 11 has no data storage target |
| Recommendations naming | "Session summary" (PRD/user stories) | `recommendations` table | Naming inconsistency creates confusion about business purpose |
| Tags | `free tags` on decision entries (PRD) | Not in schema | FR-013 partially unsatisfied |
| Auth tables | Not in ERD | `accounts`, `verificationTokens` in schema | ERD is incomplete as an operational model |

### Referential Integrity Observations

- `decisions.chosenOptionId` is a nullable FK pointing back into `decisionOptions` for the same decision — the ERD notes this requires a deferred constraint; the Drizzle schema does NOT define a FK constraint on this column (it is typed as UUID but has no `.references()` call). This is a referential integrity gap.
- All `onDelete: 'cascade'` on user-owned tables is appropriate for a single-user account deletion scenario.
- No soft-delete is implemented anywhere. Deletion is permanent.

### Lifecycle and State Analysis

| Entity | Defined States | Modeled How | Gap |
|---|---|---|---|
| Decision | draft → completed → locked | Only `lockedAt` timestamp; no explicit status | Draft state implied by absence of summary; not queryable as a status |
| Interrogation Session | in-progress → completed | `createdAt` only; no completion timestamp | No way to query incomplete sessions |
| Reflection | pending → completed | `completedAt` nullable | Adequate |
| Pattern Alert | active → dismissed | `dismissedAt` nullable | Adequate; dismissed alerts can be re-activated |

### PII Fields

| Entity | PII Fields |
|---|---|
| `users` | `email`, `name`, `initials`, `role`, `decisionContext` |
| `decisions` | `title`, `summary`, `reasoning` (may contain personal reasoning) |
| `decisionOptions` | `label`, `pros`, `cons` (may contain financial/personal data) |
| `interrogationSessions` | `appealNote` (free text) |
| `recommendations` | `answer`, `rationale`, `evidence` (derived from personal reasoning) |
| `reflections` | `content` (highly personal) |

All PII is stored in PostgreSQL. No encryption-at-rest specification exists.

---

## 8. Contradiction Log

| ID | Topic | Source A | Source B | Conflict | Business Impact | Recommended Resolution | Severity |
|---|---|---|---|---|---|---|---|
| C-001 | Profile data model | `handoff.md` defines Profile as a versioned first-class entity with 6 structured fields (values[], riskTolerance, financialSituation, workLifeWeighting, careerStage, geographicConstraints) | `schema.ts` implements profile as 3 unstructured fields on `users` table (`role`, `decisionContext`, `calibration`) | The documented data model and the implemented data model are fundamentally different. The handoff spec cannot be satisfied by the current schema. | **Critical** — Profile personalization (FR-011), profile versioning (FR-003), and profile snapshot on decisions (FR-004) are all blocked. The cold-start value proposition depends on structured profile data. | Resolve before Sprint 1: define the authoritative profile model. Either expand the `users` table with structured profile fields (and a `ProfileVersions` table), or create a separate `profiles` table. Update `erd.md` to reflect the decision. | **Critical** |
| C-002 | Interrogation transcript storage | `handoff.md` defines `turns[]` stored in `interrogationSession` (each Q&A exchange) | `schema.ts` stores NO turns. `interrogationSessions` has only `id`, `decision_id`, `coaching_style`, `appeal_note`, `created_at`. Turns are passed as in-memory `messages` array to the LLM API. | Session transcripts are not persisted. If the user closes the browser, the conversation is lost. The pattern engine in production cannot re-read historical transcripts. The summary endpoint receives a `transcript` string from the client — transcript integrity is not server-controlled. | **Critical** — Loss of interrogation history undermines the longitudinal value proposition. Client-submitted transcripts are manipulable. | Either persist turns server-side in an `interrogation_turns` table (recommended), or accept that transcripts are reconstructed from client state and document the trust model. | **Critical** |
| C-003 | Decision draft status | `handoff.md` defines `status: "draft" \| "completed" \| "locked"` as a field on Decision Entry | `schema.ts` has no `status` field. Only `lockedAt` exists. Draft state is not explicitly represented. | Story 7 (save and resume draft) has no database field to mark an entry as a draft. "Draft entries are labeled as incomplete in the decision log" cannot be implemented without a status field or equivalent. | **High** — The draft save requirement (Story 7, P0) cannot be reliably implemented. | Add a `status` enum column to `decisions` (or infer draft from absence of `summary`/`chosenOptionId` and document the inference rule). | **High** |
| C-004 | Reflection structured responses | `prd.md` §Must-Have #4 specifies three structured questions; `user-stories.md` Story 12 AC specifies structured Q&A stored as "a timestamped reflection record" | `schema.ts` `reflections` table has only a `content: text` column — one free-text field. No structured Q&A schema. | The three reflection questions (how did this turn out? what do you wish you'd known? would you make the same choice again?) cannot be stored, queried, or indexed separately for the pattern engine. | **High** — Pattern engine cannot extract structured outcome signals from free-text content without additional LLM processing. Reflection response rate metric becomes harder to compute. | Either add structured JSON fields to `reflections` (e.g., `structured_responses: jsonb`) or add individual text columns per question. Document the decision. | **High** |
| C-005 | Notes entity | `prd.md` §Must-Have #3 requires append-only timestamped notes on decision entries; `user-stories.md` Story 11 (P0) specifies a dedicated notes UI | `schema.ts` has no `notes` table or notes field on `decisions` | Story 11 (P0) has no data storage target in the implemented schema | **High** — A P0 story cannot be built. | Add a `decision_notes` table with `id`, `decision_id`, `content`, `created_at`. Do not add edit or delete routes. | **High** |
| C-006 | Pattern alert trigger timing | `prd.md` §Must-Have #5 states "At interrogation start, system scans past decision entries... If a match is found... an alert is surfaced before the interrogation begins" | `interrogation/[sessionId]/summary/route.ts` — pattern classification runs at session end (after summary generation), not at interrogation start | Alerts are generated post-session, not pre-session. The PRD's intent (inform the user before they begin) is architecturally inverted. A user runs the interrogation before the system classifies the resulting patterns. | **High** — The pre-interrogation warning mechanic (the product's key "history rhymes" UX) does not function as specified. Alerts exist for past sessions but are not surfaced at the start of the next interrogation. | Either: (a) Surface existing pattern alerts before interrogation starts (read from `patternAlerts` table); or (b) Add a pre-interrogation similarity check that scans existing classified decisions before generating the first question. Option (a) is lower effort. Confirm with Product. | **High** |
| C-007 | Pattern similarity definition | `prd.md` §Must-Have #5 describes pairwise structural similarity: "≥2 shared structural attributes" between the new decision and a past decision | `seed.ts` + `interrogation/[sessionId]/summary/route.ts` classify individual decisions against 6 pattern types (binary_framing, external_validation, etc.). The similarity check is per-pattern-type, not pairwise between decisions. | The two systems use different vocabularies and different algorithms. The PRD's attributes (prestige vs. intimacy, financial sacrifice for status) are not the same as the seeded pattern types. The PRD implies a decision-level comparison; the implementation applies a per-session classification. | **Medium** — The functional outcome may be similar, but the surface mechanic, the user message ("this resembles your past decision" vs. "you display this pattern"), and the data model differ. The PRD may be describing an outdated design. | Clarify with Product which mental model is intended: (a) "this decision resembles decision X" (pairwise similarity), or (b) "you exhibit this pattern again" (pattern recurrence). The current implementation supports (b). Update the PRD to reflect the chosen model. | **Medium** |
| C-008 | Lock reversibility | `user-stories.md` Story 14 AC: "User can unlock an entry at any time; unlocking re-enables prompts starting from the next scheduled interval" | `src/app/api/decisions/[id]/lock/route.ts` — only a POST route to set `lockedAt`. No unlock route exists. `decisions/[id]/route.ts` PATCH route blocks writes on locked decisions. | An entry that is locked cannot be unlocked through any defined API endpoint. Story 14's unlock requirement is unimplemented. | **Medium** — Users who lock a decision prematurely have no recovery path. | Add a DELETE or PATCH route for `/api/decisions/[id]/lock` that sets `lockedAt: null`. Update the PATCH route to allow writes on unlocked decisions. | **Medium** |
| C-009 | Manual entries and reflection schedule | `user-stories.md` Story 10 AC: "Manual entry creation does not automatically start a reflection prompt schedule — user must opt in explicitly" | `src/app/api/decisions/route.ts` POST handler always inserts 1-month and 3-month reflection rows after every new decision — no distinction between manual and interrogation entries | Every decision, regardless of type, gets a reflection schedule. A reconstructed 3-year-old decision will prompt for a 1-month reflection immediately after logging. | **Medium** — Poor UX for Marcus (who reconstructs past decisions); reflection response data will be meaningless for historical entries; metric inflation | Add an `entry_type: "interrogation" \| "manual"` field to `decisions` and conditionally schedule reflections only for forward-logged interrogation entries (or let the user opt in for manual entries). | **Medium** |
| C-010 | Recommendations naming vs. summary | `user-stories.md` Story 6 uses "structured summary" throughout; `prd.md` §Must-Have #2 describes a "summary" | `schema.ts` names the entity `recommendations` with fields `answer`, `rationale`, `evidence[]` | The business document calls this a "session summary"; the schema calls it "recommendations." The schema's `answer` field sounds like a choice recommendation; the PRD intends it to be a reasoning record, not a directive. | **Low** — Internal consistency issue; may confuse engineers onboarding to the codebase | Agree on canonical naming and update either the schema or the documentation. If the product intent is to provide a recommendation (what to do), the schema name is correct. If the intent is a neutral reasoning summary, rename accordingly. | **Low** |

---

## 9. Requirements Gap Analysis

| ID | Missing Information | Why Needed | Impact if Unresolved | Owner | Blocking | Severity |
|---|---|---|---|---|---|---|
| GAP-001 | **Interrogation termination criteria** — what signals the system that the user has reached a defensible position vs. typed enough words | Without this, the core mechanic has no exit condition. Story 4 and Story 6 cannot be estimated or built. | Interrogation loop is infinite or arbitrary; summary generation has no trigger | Product + Engineering | **Blocking** | Critical |
| GAP-002 | **Structural attribute taxonomy for pattern alert** — the finite set of attributes that define structural similarity between two decisions | Without this, Story 15 cannot be built. The PRD's attribute list (prestige vs. intimacy, financial sacrifice, etc.) is not yet defined as a testable taxonomy | Pattern alert (Story 15) is a spike that cannot begin | Product + Engineering | **Blocking** | Critical |
| GAP-003 | **Profile data model** — structured fields for values[], riskTolerance, financialSituation, workLifeWeighting, careerStage, geographicConstraints | Without this defined and implemented, Stories 1, 2, 3 cannot be fully built. The LLM personalization in Story 2 has nothing to reference. | Cold-start value collapses; profile personalization is generic | Product + Engineering | **Blocking** | Critical |
| GAP-004 | **Reflection prompt delivery mechanism** — in-app only, push notification, email, or combination | Affects infrastructure decisions for Story 12. A user who never opens the app will never receive 1-month prompts, and the ≥50% reflection response rate goal becomes impossible. | Reflection response rate goal cannot be met; re-engagement mechanism is undefined | Engineering + Founder | **Blocking** | Critical |
| GAP-005 | **Interrogation transcript persistence strategy** — server-side turns table vs. client-submitted transcript string | The current implementation trusts the client to submit the transcript for summary generation, which is a data integrity and security risk. | Transcript manipulation; loss of session history; debugging impossible; pattern engine cannot re-read historical sessions | Engineering | **Blocking** | Critical |
| GAP-006 | **Notes data model** — `decision_notes` table must be added to the schema | Story 11 (P0) has no storage target | Story 11 cannot be implemented | Engineering | **Blocking** | High |
| GAP-007 | **Decision draft status representation** — formal `status` field or documented inference rule | Story 7 (P0) requires draft entries to be labeled distinctly in the log | Story 7 cannot be reliably implemented | Engineering | **Blocking** | High |
| GAP-008 | **Reflection structured response schema** — three questions stored separately vs. as JSONB vs. free text | Pattern engine needs structured signals to extract outcome data | Pattern engine quality degrades; reflection data is opaque | Engineering + Product | **Blocking** | High |
| GAP-009 | **Manual entry type flag** — `entry_type: "interrogation" \| "manual"` on `decisions` | Story 10 AC requires manual entries to be flagged as lower confidence; current POST route schedules reflections for all entries | Story 10 AC violated; reflection schedule fires incorrectly for historical entries | Engineering | **Blocking** | High |
| GAP-010 | **Minimum response length for interrogation answers** | Story 4 AC: "User cannot submit a response shorter than a defined minimum length without a prompt to expand." The actual value is not defined. | Cannot implement the minimum-response enforcement | Product | Non-blocking (can define during build) | Medium |
| GAP-011 | **Monetization model** — free trial length, price point, what is gated | Affects onboarding flow design, activation funnel, and the 15% subscription conversion metric | Subscription conversion goal cannot be designed toward; paywall placement is unknown | Founder | Non-blocking | Medium |
| GAP-012 | **Reconstructed past decision weighting** — how do manual historical entries affect pattern engine confidence | Pattern engine accuracy depends on this; Marcus's onboarding experience depends on it | Pattern engine may surface false positives based on rationalizations | Engineering + Product | Non-blocking | Medium |
| GAP-013 | **Profile update behavior** — when the user edits their profile, does the system surface the divergence to them? | The PRD mentions profile evolution view (P1). But even in v1, the edit should preserve versions. What does the user see when they change a value? | Profile versioning purpose is unclear; user trust in the profile mechanism is affected | Product + Design | Non-blocking | Medium |
| GAP-014 | **What happens when reflection prompts are repeatedly ignored** — escalation, fallback, cessation | The PRD says "dismissed prompts are not re-sent" but says nothing about unresponsiveness | 90-day retention may depend on a re-engagement mechanic that does not exist | Product | Non-blocking | Medium |
| GAP-015 | **Data retention and deletion policy** — how long is personal decision data retained; what does account deletion look like | Required for privacy compliance and for user trust in a sensitive data product | GDPR/CCPA exposure; user trust risk; no support runbook for deletion requests | Legal + Engineering | Non-blocking (needed before public launch) | Medium |
| GAP-016 | **Otter AI integration specification** — auth model, data format, webhook vs. poll, field mapping | P1 requirement needs enough design to ensure the P0 data model supports it | P1 integration may require schema migration if the data model is not designed with it in mind | Engineering + Product | Non-blocking (P1) | Low |
| GAP-017 | **Achievements/gamification system** — business rationale, unlock conditions, and UX placement | The system exists in code (`achievements.ts`) with no documentation | Undocumented feature may ship with unclear business intent; AB testing is impossible | Product | Non-blocking | Low |
| GAP-018 | **`calibration` field semantics** — the `users.calibration` integer exists in schema and demo data but is not defined in any requirements document | The demo data shows calibration = 0 (fresh) and calibration = 82 (seasoned), but the field's meaning, range, update rules, and display logic are undefined | Cannot implement or test the feature | Product + Engineering | Non-blocking (P1 at earliest) | Low |
| GAP-019 | **Onboarding completion check** — how does the system know onboarding is complete and the user may access the interrogation? | RULE-001 says onboarding cannot be skipped, but there is no `onboardingCompletedAt` or equivalent field in the schema | The gate condition cannot be enforced at the data layer | Engineering | **Blocking** | High |
| GAP-020 | **Availability, performance, and scalability targets** — response time SLA, uptime, concurrent users | Required for infrastructure sizing and Vercel configuration | Over/under-provisioned infrastructure; no performance baseline for beta | Engineering + Founder | Non-blocking (before public launch) | Low |

---

## 10. Assumptions Register

| ID | Assumption | Reason Inferred | Supporting Source | Risk if Incorrect | Validation Owner | Validation Question |
|---|---|---|---|---|---|---|
| A-001 | The product is single-user — no shared accounts, no organizational hierarchy, no admin roles in v1 | No admin persona; all API routes enforce single-user ownership; institutional/cohort mode is P2 | `prd.md` §Future Considerations; route implementations | If shared accounts are needed before v1, data model and permissions require significant rework | Founder | Is there any v1 use case where two users share a profile or see each other's decisions? |
| A-002 | The LLM for interrogation turn generation (Claude Opus) is called per user message turn, not in batch | `interrogation/route.ts` — streaming response per message | `src/app/api/interrogation/route.ts` | If batch/async model is preferred, the streaming architecture would need to change | Engineering | Should the interrogation feel like a real-time conversation (stream per turn) or a structured form with deliberate pacing? |
| A-003 | The `calibration` integer on `users` represents a user's "experience" or "calibration level" with the product, and drives the "seasoned vs. fresh" demo modes | Demo data uses calibration = 0 (fresh) and calibration = 82 (seasoned) | `src/lib/demo-data.ts` | If calibration means something else, the demo data and any dependent logic are wrong | Product | What does `calibration` represent, how is it updated, and what is its range? |
| A-004 | In-app notifications (web) are sufficient for v1 reflection prompts; push notifications and email are post-beta | `handoff.md` open questions flag this as blocking; but the current implementation has no notification mechanism at all | `handoff.md` §Open Questions | If email is required from day one, Resend (already integrated for auth) must be extended and the notification scheduler must be built before beta | Founder + Engineering | What is the minimum notification mechanism for August 14 beta? |
| A-005 | The pattern engine will not generate meaningful alerts for the private beta cohort (20–50 users, few decisions logged) | The pattern engine requires multiple sessions per user to reach detection thresholds (2–3 decisions) | `prd.md` §Timeline | If stakeholders expect pattern alerts in the beta, the threshold definitions need adjustment | Product | Is the pattern engine expected to produce real output during the 20–50 user private beta? |
| A-006 | The `recommendations` table is what the PRD calls a "session summary" | The PRD never uses the word "recommendation"; the schema and code use it consistently | `schema.ts`; `interrogation/[sessionId]/summary/route.ts` | If "recommendation" is a distinct concept from "session summary" (e.g., the system actually recommends a choice), the data model may underserve both functions | Product | Is the AI's output at session end intended to be a neutral reasoning summary or a prescriptive recommendation? |
| A-007 | The product assumes single-session decisions — one interrogation per decision per day. The draft mechanic allows resumption across sessions. | No explicit multi-session-per-decision design documentation | `handoff.md` | If users routinely run multiple full sessions on the same decision (appeal/re-interrogation), the turn storage gap becomes more urgent | Product | Can a user run multiple complete interrogation sessions on the same decision? What is the expected outcome? |
| A-008 | The `.env.local` file is not committed to the git repository (it is in `.gitignore`) | Standard Next.js practice; `.gitignore` exists in the repository | `.gitignore` (assumed) | If `.env.local` has been committed, the Anthropic API key in the file must be rotated immediately | Engineering | Confirm that `.env.local` is excluded from the repository. Run `git log --all -- .env.local` to verify. |
| A-009 | The Resend integration for authentication is sufficient for transactional email if email notification is needed | Resend is already configured for magic-link auth; extending it for notification emails is low-overhead | `auth.ts` | If Resend is not the chosen notification channel, additional email infrastructure is needed | Engineering | Should the same Resend integration handle reflection prompt email delivery, or is a separate notification system planned? |

---

## 11. Risk and Dependency Register

| ID | Description | Category | Impact | Likelihood | Severity | Mitigation / Next Action |
|---|---|---|---|---|---|---|
| R-001 | **Interrogation quality risk** — The counter-consideration quality is the product's highest-risk component. If the pushback feels generic ("have you considered your financial situation?") rather than precise, the product fails to differentiate itself from AI chatbots. | Product + AI | **Critical** — the entire value proposition is at risk | High | **Critical** | User-test Story 5 in isolation with 3–5 target users before proceeding to log/reflection infrastructure. Define a written quality bar (what makes a counter-consideration pass?). |
| R-002 | **Profile model divergence** — The documented profile model (versioned, 6 structured fields) does not match the implemented model (3 unstructured fields on `users`). Resolving this before engineering proceeds on Stories 1, 2, 3 is blocking. | Technical | High — all personalization and cold-start value depends on profile | High | **Critical** | Run Spike 0: define the authoritative profile schema before Sprint 1. |
| R-003 | **Transcript integrity risk** — The current implementation trusts the client to submit the full transcript string to the summary endpoint. A malicious or corrupted client could submit a fabricated transcript. | Security + Data | Medium — affects pattern classification accuracy and data integrity | Low (single-user consumer product) | **Medium** | Decision: either accept client trust (document the model) or persist turns server-side. Server-side persistence is the right long-term choice. |
| R-004 | **Cold start experience failure** — If Jordan (new user, imminent deadline) finds the profile onboarding form-like rather than insight-generating, they abandon before completing it. The activation metric collapses. | UX + Product | **Critical** — 70% onboarding completion is the leading activation metric | Medium | **High** | Profile onboarding is a design and copy problem, not an engineering problem. Requires a design sprint and user testing before engineering starts. |
| R-005 | **Reflection prompt delivery gap** — There is no push notification or email notification mechanism. If users do not proactively open the app, they never see reflection prompts. The ≥50% reflection response rate target is unreachable with in-app-only notifications. | Product + Engineering | High — lagging success metric depends on it | High | **High** | Define the minimum notification mechanism before August 14 (email via Resend is the lowest-effort path; Resend is already integrated). |
| R-006 | **Privacy risk** — The product stores deeply personal decision history and psychological pattern data (career anxiety, financial constraints, relationship stakes). A data breach would be significantly more damaging than a typical SaaS breach. | Privacy + Security | High — existential trust risk | Low (pre-scale) | **High** | Define and document data retention and deletion policy before public launch. Ensure encryption-at-rest is planned. Avoid committing secrets to git. |
| R-007 | **Timeline risk** — 4 weeks to August 14 private beta. Two blocking spikes (interrogation termination criteria, structural similarity algorithm) have not yet been resolved. If they are resolved in week 1, the build sequence is feasible. If they extend into week 2, the timeline collapses. | Delivery | High | Medium | **High** | Resolve both spikes in week 1. Scope private beta to only Stories 1–8 if spikes consume more than 5 business days. |
| R-008 | **Pattern engine latency to value** — The pattern engine needs multiple logged decisions to produce meaningful alerts. A private beta cohort of 20–50 users, each logging 1–3 decisions in a 4-week period, may not produce a single valid pattern alert. | Product | Medium — core differentiating feature is invisible in beta | High | **High** | Pre-seed the pattern engine with Marcus-type users who reconstruct 5+ past decisions at onboarding. Adjust detection thresholds for beta conditions. |
| R-009 | **AI hallucination / false pattern risk** — The LLM pattern classifier may surface pattern alerts that feel irrelevant or, worse, that mischaracterize the user's decision history. A bad alert is worse than no alert (Marcus churns and tells his network). | AI + Product | High for Marcus persona | Medium | **High** | Set detection thresholds conservatively. Add a quality review step to pattern alerts during beta (manual review before an alert fires). Define a "bad alert" reporting mechanism. |
| R-010 | **Scope divergence** — Decision logging and attempt logging (P1) are described as distinct mechanics in the PRD and personas. If the data model is not designed to accommodate attempt entries from day one, the P1 migration will require schema changes and backfill. | Technical | Medium | Low | **Medium** | Review the handoff's attempt logging requirements and ensure `decisions` table or a new `attempts` table can accommodate the P1 use case without migration. |
| R-011 | **Interrogation gaming risk** — Users may type long, plausible-sounding responses that satisfy the minimum length check without actually engaging with the pushback. The system cannot distinguish genuine reasoning from performative reasoning. | Product + AI | Medium — reduces long-term value but doesn't break day-one value | Medium | **Medium** | Accept as inherent limitation for v1. Monitor via the post-session "surfaced something new?" prompt. Design the counter-consideration to require specific, non-generic answers. |
| R-012 | **Dependency on Resend for auth** — Magic-link authentication requires Resend API key. The Resend API key is currently unset in `.env.local`. If Resend is not configured before beta, no user can sign in. | Technical | **Blocking** for any user | High | **Critical** | Configure Resend API key immediately. |
| R-013 | **Dependency on DATABASE_URL** — The PostgreSQL connection string is unset in `.env.local`. The application cannot read or write any data without it. | Technical | **Blocking** for any user | High | **Critical** | Configure DATABASE_URL before any development or testing. |

---

## 12. Documentation Readiness Scorecard

| Area | Score (1–5) | Evidence | Required to Improve |
|---|---|---|---|
| **Business clarity** | 4/5 | Problem statement is sharp, specific, and personal. Business objectives are defined with quantitative targets. Non-goals are explicit. The "stated vs. revealed preference" framing is clear and differentiating. | Monetization model needs definition to complete the business picture. |
| **Scope clarity** | 3/5 | P0/P1/P2 split is well-defined. But the boundary between "decision logging" and "attempt logging" is blurry — two P1 features (attempt logging, Otter AI) imply a qualitatively different product that shares a data model with v1. The boundary between the two is not architecturally defined. | Define the data model boundary between decisions and attempts. Clarify whether v1 schema must accommodate P1 without migration. |
| **Persona completeness** | 3.5/5 | Four personas are documented with depth. Journey maps are present. But: (a) Marcus's confidence is Medium (one founder interview); (b) no admin or support persona; (c) no system actor persona (reflection scheduler); (d) Alex (P1) has no viable v1 journey. | Add system actor documentation. Validate Marcus persona with at least one additional interview. |
| **Workflow completeness** | 3/5 | Primary happy-path journeys are documented. Exception and failure scenarios are largely absent (browser closure mid-session, app not opened during reflection window, repeated ignored prompts, failed LLM call). | Document at least 3 failure-mode scenarios per primary journey. |
| **Functional requirement completeness** | 3/5 | P0 requirements are enumerated and have acceptance criteria. But: termination criteria, minimum response length, notification mechanism, and structural similarity algorithm are all open. These are not details — they are core mechanics. | Resolve the 4 blocking open questions before sprint planning. |
| **Data model completeness** | 2/5 | The ERD models the core entities correctly. But the documented data model (handoff) and the implemented schema diverge on several critical entities (Profile, turns, notes, draft status, entry type). The ERD does not include auth adapter tables and is missing entities named in the handoff. | Produce a single authoritative ERD that matches the implemented schema and resolves the Profile, transcript, notes, and status gaps. |
| **Integration clarity** | 2/5 | Authentication and LLM integration are partially specified in code. No API documentation exists. Notification delivery is undefined. The Otter AI integration spec is absent. Two critical environment variables (DATABASE_URL, RESEND_API_KEY) are unset. | Document the API surface (at minimum, all routes). Define the notification delivery architecture. Configure missing environment variables. |
| **Security and privacy coverage** | 1.5/5 | Auth is implemented. Row-level ownership is enforced. But: no data retention policy, no encryption-at-rest specification, no privacy policy, a live API key in `.env.local`, no specification for handling deletion requests. | Write a minimum privacy and security specification before public beta. Rotate the exposed API key. |
| **Non-functional requirement coverage** | 1.5/5 | Only one NFR is explicitly quantified (onboarding ≤15 minutes). No latency, availability, scalability, or error handling targets exist. | Define minimum NFRs (latency, availability, error handling) before beta. |
| **Testability** | 2/5 | Acceptance criteria in user stories are present and specific for UX requirements. But: no test coverage defined, no Playwright tests written (playwright installed but no test files found), no observable success bar for LLM quality, and the quality of the counter-consideration is currently measured subjectively. | Define at least a smoke test suite covering the P0 stories. Define the quality bar for the counter-consideration as a testable rubric. |
| **Traceability** | 3.5/5 | User stories reference the PRD. The handoff references both. The ERD is standalone. Implemented routes are not referenced in any documentation. The achievements system has no traceability to any requirement. | Add traceability from implemented API routes back to user stories. Document the achievements system against a requirement. |
| **Overall readiness for solution design** | 2.5/5 | The product concept is clear enough to begin solution design on the core interrogation mechanic and decision log. But the profile model, transcript persistence, notifications, and pattern algorithm gaps must be resolved before design can be considered complete. | Resolve GAP-001 through GAP-009 before solution design is finalized. |
| **Overall readiness for backlog creation** | 2/5 | A backlog exists (15 stories). But 3 of those stories have unresolved spikes that block estimation. The data model divergence means several stories would produce technically incorrect implementations if built today. | Resolve spikes; reconcile the schema with the documented requirements; then re-estimate the backlog. |

---

## 13. Prioritized Stakeholder Questions

### Product (Founder)

| Priority | Question | Blocking |
|---|---|---|
| P0 | **What is the interrogation termination rubric?** How does the system evaluate whether the user has reached a defensible position? Is it: (a) minimum turn count + LLM quality score, (b) LLM evaluates each turn for completeness, or (c) user-declared completion gated by a minimum depth check? This must be a written rubric the LLM system prompt can encode. | Yes — Stories 4, 5, 6 |
| P0 | **What is the structural attribute taxonomy for pattern alerts?** The PRD lists examples (prestige vs. intimacy, financial sacrifice for status) but these are not the same as the implemented pattern types (binary_framing, external_validation). Which vocabulary is authoritative? Are the two vocabularies meant to coexist or replace each other? | Yes — Story 15 |
| P0 | **What is the authoritative profile data model?** The handoff defines 6 structured fields (values[], riskTolerance, financialSituation, workLifeWeighting, careerStage, geographicConstraints). The schema has 3 unstructured fields on the users table. Which is authoritative and what does the profile look like in the UI? | Yes — Stories 1, 2, 3 |
| P0 | **What is the minimum notification mechanism for the August 14 beta?** In-app only (badge on next login), email via Resend, or push notification? If users do not open the app, they cannot receive in-app prompts. The ≥50% reflection response rate goal depends on the answer. | Yes — Story 12 |
| P0 | **Is the AI output at session end a neutral "session summary" or a prescriptive "recommendation"?** The PRD and user stories call it a summary. The implemented schema and code call it a recommendation with an `answer` field. These have different implications for how the output is presented and how users react to it. | Yes — Story 6, schema design |
| P1 | **What is the monetization model?** Free trial length, price point, what is gated behind paywall vs. free. This affects onboarding funnel design and the 15% subscription conversion metric. | No — but affects onboarding flow |
| P1 | **What does the achievements/gamification system (in `achievements.ts`) represent?** Is this a documented product decision? What are the unlock conditions communicating to the user? How is it surfaced in the UI? | No — but undocumented code ships in beta |
| P1 | **What does the `calibration` field on the users table represent?** The demo data sets it to 0 (fresh) and 82 (seasoned). Is this a product concept? How is it updated? | No — but drives demo modes |

### Engineering

| Priority | Question | Blocking |
|---|---|---|
| P0 | **Should interrogation turns be persisted server-side?** The current implementation trusts the client to submit the full transcript for summary generation. Server-side persistence prevents data loss and manipulation, but requires a new `interrogation_turns` table and a streaming-to-persist architecture. Decision needed before Sprint 1. | Yes — architecture decision |
| P0 | **How is decision draft state represented?** Is a `status` enum column added to `decisions`, or is draft inferred from absence of `summary`/`chosenOptionId`? The inference approach is fragile; the enum approach is explicit. | Yes — Story 7 |
| P0 | **What is the reflection structured response schema?** JSON blob, individual text columns, or free text only? This determines what the pattern engine can extract from reflections. | Yes — Story 12 |
| P0 | **How is onboarding completion gated?** What field or record signals that the user has completed onboarding so the middleware/route can enforce RULE-001? | Yes — Story 1, middleware |
| P1 | **Is the `decisionOptions.pros/cons` JSONB array sufficient for the option data requirement?** The PRD specifies user-defined key/value pairs (salary, location, hours). Pros/cons is a more structured format. Is a separate `option_data: jsonb` field needed? | No — but affects UX for Story 9 |
| P1 | **How should the P1 attempt logging entity relate to decisions?** Should attempts be a separate entity, or a subtype of decisions? Resolving this now avoids a schema migration when P1 ships. | No |
| P2 | **What is the unlock route for decision entries?** The lock route sets `lockedAt`. There is no unlock route. Is unlocking in scope for v1 (Story 14 AC says yes)? | No — but Story 14 is P0 |

### Data

| Priority | Question | Blocking |
|---|---|---|
| P0 | **How does the pattern engine use reflection content?** Currently, reflection content is stored as free text. Does the pattern engine process it via LLM at reflection time? At query time? Or is it structured before storage? | No — affects P1 pattern engine quality |
| P1 | **How are reconstructed past decisions weighted differently from forward-logged decisions in the pattern engine?** Manual entries are flagged as lower confidence — but what does lower confidence mean for the classification threshold? | No — affects P1 pattern accuracy |
| P1 | **What are the data retention and deletion requirements?** This drives storage cost, compliance obligations, and the cascade delete behavior currently implemented. | No — needed before public launch |

### Design

| Priority | Question | Blocking |
|---|---|---|
| P0 | **What is the onboarding profile design?** The PRD specifies behavioral questions over categorical ranking. Has any design been produced for the profile flow? The current implementation has a thin `decisionContext` text field — the design needs to produce something the engineering team can build to. | Yes — Story 1 (UX design) |
| P1 | **Where does the post-session "did this surface something new?" prompt appear?** This is the primary leading success metric but has no UX placement defined. | No — but affects beta measurement |

### Security / Legal / Privacy

| Priority | Question | Blocking |
|---|---|---|
| P0 | **The Anthropic API key in `.env.local` must be rotated.** Is this key present in the git repository? Run `git log --all -- .env.local` to confirm. If committed, rotate immediately. | Yes — security |
| P1 | **What is the data retention and deletion policy?** How long is personal decision data retained? What does the user experience when they request deletion? Is the cascade delete on `users` sufficient or does it need to be audited? | No — but needed before public launch |
| P1 | **Is a privacy policy required before the August 14 private beta?** Even for a 20–50 user beta, collection of psychological pattern data likely requires a privacy policy in jurisdictions where beta users reside. | No — but legal exposure |

### Operations

| Priority | Question | Blocking |
|---|---|---|
| P0 | **DATABASE_URL and AUTH_RESEND_KEY are unset.** What is the target database (Vercel Postgres, Neon, Supabase, self-hosted)? Who is responsible for provisioning it before Sprint 1? | Yes — cannot run the application |
| P1 | **What is the scheduled job infrastructure for reflection prompts?** The 1-month and 3-month reflection prompts require a background scheduler. Options: Vercel Cron Jobs, external cron service, database-driven polling. Must be decided before Story 12. | No — affects Story 12 |
| P2 | **What are the availability, performance, and error handling targets for beta?** What constitutes a beta outage? Is there an on-call person? | No — but operations planning |

---

## 14. Recommended Next Steps for Pass 2

The following actions are prerequisites for Pass 2 (solution design and backlog finalization). They are ordered by blocking priority.

### Immediate (before Sprint 1, week of 2026-07-21)

1. **Rotate the Anthropic API key** visible in `.env.local`. Confirm whether `.env.local` was ever committed to git. If it was, the key has been exposed and must be replaced.

2. **Provision infrastructure**: Set `DATABASE_URL` (PostgreSQL) and `AUTH_RESEND_KEY` / `RESEND_API_KEY` so the application can run locally and in a preview environment.

3. **Resolve Spike 1: Interrogation Termination Criteria** (Owner: Product + Engineering). Output: a written rubric, encodable in a system prompt, defining what constitutes a complete interrogation session.

4. **Resolve Spike 2: Structural Attribute Taxonomy** (Owner: Product + Engineering). Output: a defined, testable taxonomy of structural decision attributes. Clarify whether this replaces or complements the existing 6 seeded pattern types.

5. **Define the authoritative profile data model** (Owner: Product + Engineering). Choose between: (a) expand `users` table with structured profile columns + a `profile_versions` table, or (b) create a separate `profiles` table. Update `erd.md` to reflect the decision.

6. **Resolve reflection notification mechanism** (Owner: Founder + Engineering). Minimum viable answer for beta: email via Resend (key is already integrated for auth) with a daily digest of due reflections.

### Sprint 1 Pre-Work (before coding begins)

7. **Add missing schema entities**: `decision_notes` table (Story 11), `entry_type` field on `decisions` (Story 10), `status` field on `decisions` (Story 7), structured reflection response schema (Story 12), and profile versioning tables.

8. **Decide on transcript persistence**: either add an `interrogation_turns` table and persist turns server-side, or document and accept the client-trust model for the private beta.

9. **Add unlock route** for decisions (`DELETE /api/decisions/[id]/lock` or `PATCH` with `lockedAt: null`).

10. **Fix the manual entry reflection scheduling bug**: `POST /api/decisions` currently schedules reflections for all entries. Add `entry_type` and conditionally schedule reflections only for interrogation-type entries.

### Before Beta Launch (2026-08-14)

11. **Produce a minimum privacy specification**: what data is collected, how long it is retained, how users can request deletion, and whether a privacy policy is required for the beta cohort.

12. **Define and implement the post-session quality prompt** ("Did this surface something you hadn't named?") as the primary leading metric mechanism.

13. **Define the beta success bar** as a testable set of conditions (the handoff defines this at a high level; it needs implementation-level instrumentation).

14. **Document the achievements system** or remove it from the codebase. Undocumented features shipping in beta cannot be measured, improved, or explained to users.

15. **Reconcile `erd.md` with `schema.ts`**: the ERD documentation is the team's shared data model reference. It must match the implementation.

---

*Analysis complete. All findings are traceable to source documents or explicitly labeled as assumptions. No user stories, epics, or implementation tasks were generated during this pass.*
