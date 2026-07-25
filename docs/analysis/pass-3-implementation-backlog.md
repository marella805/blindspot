# Blindspot — Pass 3: Implementation Backlog

**Date:** 2026-07-17  
**Revised:** 2026-07-17 (Pass 4 amendments applied — see Section 0)  
**Baseline:** Pass 2 Solution Definition v2.0  
**Sprint target:** August 14, 2026 private beta  
**Cohort:** 20–50 invited users  

---

## 0. Pass 4 Amendments

*Applied after independent review (`docs/analysis/pass-4-implementation-review.md`). All changes below supersede the original story entries in their respective sections.*

### 0.1 Story Splits

**BLND-012 split into three stories** (was 8 pts, now 2+3+3 = 8 pts total):

| New ID | Title | Points | Sprint | Depends On |
|---|---|---|---|---|
| BLND-012A | Track sessionId from interrogation API — call `POST /api/interrogation/session` before chat starts; store `{ decisionId, sessionId }` in React state; pass both in `useChat` body | 2 | Sprint 1 | BLND-011 |
| BLND-012B | `POST /api/interrogation/:sessionId/turns` — accept and persist turns JSONB array on `interrogationSessions.turns`; ownership check required | 3 | Sprint 1 | BLND-003, BLND-012A |
| BLND-012C | Wire `handleSave` — call turns endpoint → call summary endpoint → display recommendation → navigate to log; add save-error retry affordance | 3 | Sprint 1 | BLND-012A, BLND-012B |

**Status:** BLND-012A, 012B, and 012C implemented in code on 2026-07-17. ✅

### 0.2 Story Conversions

**BLND-015 converted to TE-08** (Technical Enabler). BLND-015 had untestable acceptance criteria ("2/3 sessions pass"). Converted to a technical enabler with outputs: (1) written prompt per coaching style, (2) quality rubric in `docs/testing/`, (3) manual test with 3 sessions documented. Quality gate moves to Sprint 1 Definition of Done. BLND-015 removed from story list.

**TE-08: Interrogation Prompt Engineering**
- Output 1: Written system prompt for advisor / supporter / critic styles
- Output 2: `docs/testing/interrogation-rubric.md` — 5-point quality rubric
- Output 3: 3 manual sessions run, scored, results documented
- Sprint: Sprint 1 (must complete before Sprint 1 DoD)
- **Pass gate:** All 3 sessions score ≥ 3/5 on the rubric

### 0.3 Story Merges

**BLND-041 + BLND-042 merged** into BLND-041 (4 pts). Pattern surfacing without dismissal is incomplete as a user-facing feature; they share the same component and API route. Merged DoD requires both display and dismiss to pass.

### 0.4 Stories Removed / Deferred

| Story | Action | Reason |
|---|---|---|
| BLND-053 (achievements display) | **Deferred to Track B** | No FR traceability; undefined business rationale |
| BLND-025 (decision tag UI) | **Deferred to Sprint 5 polish** | Schema column added in BLND-002; UI is not on critical path |

### 0.5 New Stories Added

**MS-01: Summary retry UI** (Sprint 4, 2 pts)  
*As a user whose summary generation failed after turns were saved, I can tap "Try again" to re-call the summary endpoint so that I am not permanently stuck in draft state.*

- AC: Given summary call fails after turns are persisted, when I tap "Try again", then `POST /api/interrogation/:sessionId/summary` is called again and the recommendation displayed on success.
- AC: Given summary retry also fails, then error message persists and "Try again" remains available.
- **Status:** Save-error retry affordance implemented inline in BLND-012C (basic version). Full persistent-draft retry (for page-reload scenario) is the remaining work in MS-01.
- Traceability: ADR-004

**TE-09: Infrastructure verification** (Sprint 0, 0.5 pts)  
*Verify Resend domain verification status and Vercel plan tier cron support before Sprint 1 starts.*
- Output: Confirmation note that cron is available at required schedule; domain DNS verified in Resend
- Blocker for: BLND-005 (auth), BLND-030 (reflection cron)

### 0.6 Sprint Changes

| Change | Reason |
|---|---|
| BLND-016 moved from Sprint 1 → Sprint 2 | Sprint 1 was 22+ pts; BLND-016 has no Sprint 1 downstream dependencies |
| BLND-050 moved from Sprint 5 → Sprint 4 | Sprint 4 was underpacked (9 pts); Sprint 5 shrinks to 2 days |
| BLND-053 removed from Sprint 5 | Deferred to Track B |
| TE-09 added to Sprint 0 | Infrastructure verification must happen before Sprint 1 |
| Sprint 5 reduced to 2 days | Frees 1 buffer day before August 14 deadline |

### 0.7 Open Product Decision (Required Before Sprint 1)

**Coaching style vs. push preference:** If a user's profile has `push = 5` (adversarial preference), does this override their `coachingStyle` selection, or is `push` informational only? Engineering must not make this call unilaterally. Default assumption: coaching style selection wins; push preference is informational and injected into the system prompt context. **Product must confirm or override before BLND-011 starts.**

### 0.8 Code Changes Applied

The following Pass 4 blockers were resolved directly in code (2026-07-17):

| Fix | File(s) | Description |
|---|---|---|
| Pattern threshold gate | `src/app/api/patterns/route.ts` | GET now filters: only returns alerts where `decisions.length >= patternType.detectionThreshold` |
| Unlock route | `src/app/api/decisions/[id]/lock/route.ts` | Added `DELETE` handler that clears `lockedAt` |
| Profile answers persistence | `src/app/api/user/route.ts` | `PATCH /api/user` now accepts `profileAnswers` and `onboardingCompleted` |
| Schema additions | `src/lib/db/schema.ts` | Added `profile_answers`, `onboarding_completed_at` to users; `profile_snapshot`, `turns` to interrogation_sessions |
| Session creation | `src/app/api/interrogation/session/route.ts` (new) | `POST /api/interrogation/session` creates decision + session + schedules reflections; returns `{ decisionId, sessionId }` |
| Turns persistence | `src/app/api/interrogation/[sessionId]/turns/route.ts` (new) | `POST /api/interrogation/:sessionId/turns` persists turn array to `interrogationSessions.turns` |
| handleSave wiring | `src/components/real-interrogation.tsx` | Full save flow: session creation → turns persist → summary generation → recommendation display; retry affordance added |
| Migration | `src/lib/db/migrations/0001_profile_and_session_fields.sql` | SQL for new columns (run `npm run db:migrate` once DATABASE_URL is configured) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Initiative Breakdown](#2-initiative-breakdown)
3. [Epic Catalog](#3-epic-catalog)
4. [Feature Catalog](#4-feature-catalog)
5. [User Stories](#5-user-stories)
6. [Technical Tasks](#6-technical-tasks)
7. [Technical Enablers](#7-technical-enablers)
8. [Testing Backlog](#8-testing-backlog)
9. [Sprint Plan](#9-sprint-plan)
10. [Deferred Backlog](#10-deferred-backlog)
11. [Traceability Matrix](#11-traceability-matrix)
12. [Delivery Risks](#12-delivery-risks)
13. [Overall Readiness](#13-overall-readiness)

---

## 1. Executive Summary

| Metric | Count |
|---|---|
| Initiatives | 8 |
| Epics | 14 |
| Features | 28 |
| User Stories | 38 |
| Technical Enablers | 7 |
| Technical Tasks | ~140 |
| Sprints (MVP) | 6 (Sprint 0–5) |
| Sprint 6 (Track B, deferred) | 1 |
| Deferred Track B items | 12 |
| Deferred Track C items | 8 |
| FR coverage | 25 / 25 (100%) |

**Delivery philosophy:** The interrogation engine is the product's entire value proposition and is the highest-risk component. Sprint 0–1 front-loads the four confirmed blocking gaps and the schema foundation. Nothing else ships until the interrogation flow is end-to-end complete and manually user-tested.

**Scope boundary:** This backlog covers Track A (MVP) only. Track B (attempt logging, Otter AI, full reflection schedule, profile evolution view) and Track C (privacy, legal, security audit, production access controls) are documented in Section 10 and must not be included in any Sprint 0–5 sprint.

---

## 2. Initiative Breakdown

| ID | Initiative | Description |
|---|---|---|
| IN-01 | Technical Foundations | Environment, schema migrations, auth, LLM provider, observability scaffolding |
| IN-02 | User Onboarding and Profile | 7-question behavioral profile intake, persistence, versioning, onboarding gate |
| IN-03 | Decision Interrogation Engine | Socratic stress test, coaching style selection, turn persistence, summary generation |
| IN-04 | Decision Log and Entry Management | Log timeline, manual entry, options, notes, tags, lock/unlock |
| IN-05 | Reflection Loop and Scheduler | Scheduled reflections, structured responses, dismissal, Vercel Cron |
| IN-06 | Pattern Engine | Pattern classification, threshold logic, alert surfacing, dismissal |
| IN-07 | Notifications | In-app badge counts, pending reflection signals |
| IN-08 | Quality Assurance and Beta Readiness | E2E tests, manual testing protocol, pre-launch verification |

---

## 3. Epic Catalog

### EP-01 — Technical Foundation and Infrastructure

**Initiative:** IN-01  
**Business Objective:** Establish the operational baseline — every other epic depends on this being correct and stable.  
**Scope:** Database schema and migrations for all new and modified tables; environment configuration; auth flow verification; LLM provider integration; seed data.  
**Out of Scope:** Application features, UI, Track B/C work.  
**Dependencies:** None — this is the root dependency for everything else.  
**Risks:** DATABASE_URL not yet configured; AUTH_RESEND_KEY not yet configured — both must be resolved on Day 1 of Sprint 0 or no auth flow, no database reads/writes work.  
**Success Criteria:** A developer can sign in via magic link, read/write to the database, call the LLM API, and verify seed data is present.  
**Definition of Done:** All migrations applied to dev and staging; all env vars configured; seed script verified idempotent; auth flow end-to-end verified; LLM call returns a streamed response.

---

### EP-02 — Profile Onboarding

**Initiative:** IN-02  
**Business Objective:** Capture behavioral profile data that personalizes every interrogation session from day one. This is the cold-start solution.  
**Scope:** 7-question profile UI (already implemented in `profile.tsx`); PATCH /api/user with profile_answers JSONB; onboarding_completed_at gate; profile accessible/editable from settings.  
**Out of Scope:** Profile versioning beyond profile_snapshot on session (full version history is P1); profile evolution view (P1).  
**Dependencies:** EP-01 (schema migration adding profile_answers and onboarding_completed_at to users).  
**Risks:** Profile must feel behavioral not form-like — copy quality is the risk, not engineering. The 7 questions are already implemented; persistence is the gap.  
**Success Criteria:** User completes profile in ≤15 minutes; profile_answers stored in DB; onboarding_completed_at set; user cannot reach interrogation until profile is complete.  
**Definition of Done:** Profile persisted to DB; onboarding gate server-enforced; profile data injected into interrogation LLM prompt; profile editable from /profile page without resetting onboarding.

---

### EP-03 — Decision Interrogation Core

**Initiative:** IN-03  
**Business Objective:** Deliver the product's primary value proposition — a Socratic AI session that stress-tests a decision and produces a structured reasoning record.  
**Scope:** Coaching style selection; multi-turn Socratic questioning (min 5 user turns); turn persistence at save time; profile snapshot captured at session start; LLM prompt wired with profile + active patterns; session summary (recommendation) generation.  
**Out of Scope:** LLM quality gate for termination (P1 — ADR-002); attempt logging (Track B); real-time turn streaming to DB.  
**Dependencies:** EP-01 (schema: interrogation_turns table, profile_snapshot column on sessions), EP-02 (profile answers available to inject).  
**Risks:** handleSave in real-interrogation.tsx is currently broken/incomplete — this is the highest-priority engineering fix. Counter-consideration quality is a prompt engineering risk. LLM failures mid-session must degrade gracefully.  
**Success Criteria:** ≥70% of manual test sessions surface a consideration the tester hadn't named (per pass/fail rubric); summary generated and stored; turns persisted; session can be resumed (draft state).  
**Definition of Done:** End-to-end session: enter decision → select coaching style → min 5 Q&A turns → generate summary → summary stored in recommendations table → turns stored in interrogation_turns → navigate to log.

---

### EP-04 — Decision Log

**Initiative:** IN-04  
**Business Objective:** Build the accumulating record that powers the pattern engine and reflection loop.  
**Scope:** Chronological timeline; decision detail view; manual entry creation; option data (pros/cons, editing); decision tags; append-only notes; lock and unlock mechanic.  
**Out of Scope:** Option data enrichment via search (P2); decision export/sharing (P2).  
**Dependencies:** EP-01 (schema: source field, tags field, decision_notes table), EP-03 (interrogation entries feed the log).  
**Risks:** Manual entry reflection scheduling bug must be fixed (FR-025) — currently all entries auto-schedule regardless of source.  
**Success Criteria:** User can view all decisions in timeline; create manual entry without triggering auto-reflection; add notes without character limit; lock stops all future prompts; unlock resumes them.  
**Definition of Done:** All stories pass acceptance criteria; manual vs. interrogation entries visually distinct; lock state enforced at API level (403 on write); notes append-only enforced.

---

### EP-05 — Reflection Scheduler

**Initiative:** IN-05  
**Business Objective:** Close the feedback loop between decision time and outcome — without this, the pattern engine has no outcome signal and the product's long-term value never materializes.  
**Scope:** Auto-schedule 1-month and 3-month reflections for interrogation entries only; daily Vercel Cron job; in-app pending reflection badge; structured 3-question reflection response; free-form reflection; dismissal.  
**Out of Scope:** Email delivery (Track B); full reflection schedule beyond 3 months (P1: 6mo, 9mo, 12mo, 18mo, 24mo, 36mo); reflection-to-pattern indexing (P1).  
**Dependencies:** EP-01 (schema: dismissed_at, notified_at, structured_responses, is_active on patternAlerts; Vercel Cron config); EP-04 (decisions must exist to schedule reflections).  
**Risks:** Vercel Cron requires correct configuration in vercel.json and a CRON_SECRET env var; if not configured before beta, no reflection prompts fire. Reflection for locked decisions must be skipped.  
**Success Criteria:** Cron fires daily; pending reflections appear as badge in app shell; user can answer structured questions; dismissal prevents re-notification; locked decisions are skipped.  
**Definition of Done:** Cron job verified in staging (can be tested by setting scheduled_for to today); reflection responses persisted with structured_responses and content; dismissed_at set on dismissal.

---

### EP-06 — Pattern Engine

**Initiative:** IN-06  
**Business Objective:** Surface cross-context decision patterns that the user cannot see themselves — this is the product's differentiating long-term value.  
**Scope:** Pattern classification runs async after each session summary; threshold-based alert creation (fix current bug); active pattern alerts surfaced at interrogation start; pattern dismissal; reflection outcome included in alert context.  
**Out of Scope:** Cross-context patterns spanning decisions AND attempts (Track B); pattern versioning beyond re-activation; pattern manual review dashboard.  
**Dependencies:** EP-01 (schema: is_active on patternAlerts), EP-03 (sessions must produce summaries to classify), EP-05 (reflection outcomes feed alert context — FR-022).  
**Risks:** Current bug creates alert on first detection — must be fixed before any beta user sees a spurious alert. Pattern quality risk: a bad alert is worse than no alert for the Marcus persona. Haiku classification must be consistent.  
**Success Criteria:** Alert only appears when detection threshold reached; alert surfaced before first interrogation question; alert includes contributing decision titles and reflection outcomes (if available); dismissal persists.  
**Definition of Done:** Pattern alert threshold bug fixed and verified in staging; pattern surfacing verified end-to-end with 2+ sessions exhibiting same pattern type; alert dismissal persists across sessions.

---

### EP-07 — Notifications (In-App)

**Initiative:** IN-07  
**Business Objective:** Signal to users that they have pending reflections and active pattern insights, without requiring them to proactively check.  
**Scope:** Pending reflection badge in AppShell (already partially wired from layout.tsx); active pattern alert count badge; badge driven by DB query on page load.  
**Out of Scope:** Push notifications (Track C); email notifications (Track B); mobile push (P2).  
**Dependencies:** EP-05, EP-06.  
**Success Criteria:** Correct badge counts shown; badge disappears when all reflections completed/dismissed and all patterns dismissed.  
**Definition of Done:** AppShell badge counts accurate across all test scenarios.

---

### EP-08 — Quality Assurance and Beta Readiness

**Initiative:** IN-08  
**Business Objective:** Verify the system works end-to-end before real users encounter it.  
**Scope:** Playwright E2E test for primary journey (sign up → onboard → interrogate → log → reflect → see pattern alert); manual interrogation quality rubric test (3 sessions per persona type); user isolation privacy test; pre-beta smoke test checklist.  
**Out of Scope:** Load testing (Track C); security audit (Track C); full automated regression suite (Track C).  
**Dependencies:** All EP-01 through EP-07 complete.  
**Success Criteria:** Primary E2E test passes in CI; manual quality rubric: ≥2 of 3 test sessions rate the counter-consideration as "precise not generic"; user isolation: zero cross-user data leakage confirmed.  
**Definition of Done:** E2E test in CI; manual test sign-off documented; privacy test pass recorded; beta go/no-go checklist complete.

---

### EP-09 — LLM Provider Integration

**Initiative:** IN-01  
**Business Objective:** Ensure the LLM integration is reliable, observable, and cost-bounded.  
**Scope:** Anthropic API client setup (already implemented in ai.ts); cost logging per call; token usage tracking; graceful failure handling; model selection per use case.  
**Out of Scope:** Model fine-tuning (future); alternative provider fallback (future).  
**Dependencies:** EP-01 (ANTHROPIC_API_KEY configured).  
**Success Criteria:** LLM cost logged per call; failures return user-friendly error; no raw prompt content in logs.  
**Definition of Done:** Token usage logged for all three LLM call types (interrogation, summary, classification); failure path returns 502 with user message; cost monitoring alert configured.

---

### EP-10 — Authentication

**Initiative:** IN-01  
**Business Objective:** Ensure users can sign in and their sessions are secure.  
**Scope:** NextAuth.js magic link via Resend; JWT session; /login page; middleware protection; AUTH_RESEND_KEY configuration.  
**Out of Scope:** OAuth providers (future); SSO (future).  
**Dependencies:** AUTH_RESEND_KEY and AUTH_SECRET must be configured.  
**Success Criteria:** User can sign in via magic link email; session persists across browser refreshes; unauthenticated requests to /app/* redirect to /login.  
**Definition of Done:** End-to-end sign-in verified in dev and staging; middleware config verified.

---

### EP-11 — Observability

**Initiative:** IN-08  
**Business Objective:** Ensure the team can debug issues and monitor system health during private beta.  
**Scope:** Request ID in API responses; LLM call logging (no PII); reflection cron run logging; error capture; LLM daily cost alert.  
**Out of Scope:** Production APM (Track C); user behavior analytics (future).  
**Dependencies:** EP-01.  
**Success Criteria:** Can trace an LLM call from request to response via logs; daily cron run produces a log entry with outcome counts; errors captured with stack trace.  
**Definition of Done:** Logging implemented on all LLM endpoints; cron logs outcome; daily cost threshold alert configured.

---

### EP-12 — Deployment

**Initiative:** IN-01  
**Business Objective:** Reliable, reproducible deployment to Vercel for both staging and production.  
**Scope:** Vercel project configuration; environment variable setup (staging and production); Vercel Cron configuration; Next.js build verification; DB migration CI step.  
**Out of Scope:** Blue/green deployment (future); feature flags (future).  
**Dependencies:** DATABASE_URL (staging and production).  
**Success Criteria:** `vercel deploy` produces a working build; cron appears in Vercel dashboard; staging environment has separate DB from production.  
**Definition of Done:** Staging deployment verified; production deployment verified; cron verified in Vercel dashboard; rollback tested (Vercel instant rollback).

---

### EP-13 — Achievements Display

**Initiative:** IN-04  
**Business Objective:** Surface progress indicators that reinforce logging behavior. Business rationale is TBD (Product to confirm); the code exists and must be documented before beta.  
**Scope:** Display achievement cards in profile view; unlock state driven by existing achievements.ts logic; document unlock criteria for beta users.  
**Out of Scope:** New achievement types; achievement notifications; social sharing.  
**Dependencies:** EP-02, EP-03, EP-04, EP-05, EP-06 (achievements read from AppData).  
**Success Criteria:** Achievements display correctly in demo and live mode; unlock criteria documented.  
**Definition of Done:** Achievements shown in profile; unlock logic verified against schema data; business rationale documented in README or handoff note.

---

### EP-14 — Manual Testing Protocol

**Initiative:** IN-08  
**Business Objective:** Validate interrogation quality before any real user encounters the system.  
**Scope:** Written rubric for evaluating counter-consideration quality; 3 test sessions per persona archetype; user isolation test; beta smoke test checklist.  
**Out of Scope:** Automated quality scoring (future).  
**Dependencies:** EP-03 complete.  
**Success Criteria:** Rubric exists; 3 sessions completed; sign-off documented.  
**Definition of Done:** Written test results stored in docs/testing/; go/no-go decision recorded.

---

## 4. Feature Catalog

| ID | Parent Epic | Description | Business Value | Dependencies | Acceptance Summary |
|---|---|---|---|---|---|
| FT-01-1 | EP-01 | Database schema migrations | All data model additions from Pass 2 applied | None | Drizzle migrations apply cleanly; schema matches Pass 2 spec |
| FT-01-2 | EP-01 | Environment configuration | App can run in dev, staging, production | None | All env vars set; auth and DB connectivity verified |
| FT-01-3 | EP-01 | Pattern type seed data | 6 pattern types available for classification | FT-01-1 | db:seed runs idempotently; 6 rows in pattern_types |
| FT-02-1 | EP-02 | Profile intake UI (7 questions) | Users self-categorize behavioral tendencies | FT-01-1 | UI renders; all 7 questions answerable; completable in <15min |
| FT-02-2 | EP-02 | Profile persistence | Profile answers saved to DB | FT-01-1 | PATCH /api/user saves profile_answers; onboarding_completed_at set |
| FT-02-3 | EP-02 | Onboarding gate | No user can reach interrogation without profile | FT-02-2 | Unauthenticated OR pre-onboarding users redirected to /profile |
| FT-02-4 | EP-02 | Profile editing | Profile stays current as circumstances change | FT-02-2 | Edits saved; onboarding_completed_at not reset; past sessions unchanged |
| FT-03-1 | EP-03 | Coaching style selection | User chooses how Blindspot pushes back | FT-01-1 | Three styles selectable; selection stored on session creation |
| FT-03-2 | EP-03 | Socratic turn loop | Core Socratic stress test | FT-02-2, EP-09 | Min 5 user turns; min 50-char responses; AI streams next question |
| FT-03-3 | EP-03 | Turn persistence | Interrogation history survives browser close | FT-01-1 | All turns saved to interrogation_turns at save time |
| FT-03-4 | EP-03 | Session summary generation | Structured reasoning record | FT-03-3, EP-09 | recommendation row written; answer, rationale, evidence present |
| FT-03-5 | EP-03 | Profile injection into LLM | Interrogation personalized from day one | FT-02-2, FT-03-1 | profile_snapshot copied to session; 7-question data in system prompt |
| FT-03-6 | EP-03 | Draft save and resume | User can leave and return mid-session | FT-03-3 | Draft retrievable from /log; resumes from last turn |
| FT-04-1 | EP-04 | Decision log timeline | All decisions visible in one place | FT-03-4 | Reverse-chrono list; entries labeled by type; empty state present |
| FT-04-2 | EP-04 | Manual entry creation | Historical decisions available to pattern engine | FT-01-1 | source='manual'; no auto-reflection; labeled "Manually logged" |
| FT-04-3 | EP-04 | Option data editing | Concrete comparison data attached to decisions | FT-04-1 | Key/value pairs editable; visible in entry detail |
| FT-04-4 | EP-04 | Decision notes | Capture emerging context between scheduled reflections | FT-01-1 | Notes append-only; timestamped; not editable/deletable |
| FT-04-5 | EP-04 | Lock and unlock | User signals decision is fully processed | FT-01-1 | Lock stops prompts; unlock resumes; locked entries read-only |
| FT-04-6 | EP-04 | Decision tags | User-defined categorization | FT-01-1 | Tags editable; stored as text[] |
| FT-05-1 | EP-05 | Reflection scheduling | 1mo + 3mo follow-ups automatically created | FT-01-1 | Rows created for interrogation entries only; skipped for manual |
| FT-05-2 | EP-05 | Vercel Cron job | Reflection prompts fire on schedule | FT-01-2 | Cron runs daily; marks due reflections as notified |
| FT-05-3 | EP-05 | Structured reflection response | Three-question outcome record | FT-05-1 | structured_responses JSONB stored; content also stored for display |
| FT-05-4 | EP-05 | Free-form reflection | Ad-hoc reflection outside scheduled schedule | FT-05-1 | Creates reflection row with custom interval; does not reset scheduled prompts |
| FT-05-5 | EP-05 | Reflection dismissal | User can decline a prompt without answering | FT-05-1 | dismissed_at set; prompt not re-shown |
| FT-06-1 | EP-06 | Pattern classification (async) | Sessions tagged with cognitive pattern types | FT-03-4 | Classification runs after summary; detectedPatterns stored |
| FT-06-2 | EP-06 | Pattern alert threshold logic | Alerts only fire when evidence threshold reached | FT-01-1 | Alert NOT created on first detection; is_active=true only at threshold |
| FT-06-3 | EP-06 | Pattern surfacing at session start | User warned of pattern before next decision | FT-06-2 | Alert shown before first Q; includes contributing decision titles |
| FT-06-4 | EP-06 | Pattern alert dismissal | User can clear an alert | FT-06-3 | dismissed_at set; alert removed from UI |
| FT-07-1 | EP-07 | In-app notification badges | Passive signal of pending work | FT-05-2, FT-06-3 | Badge counts accurate in AppShell |

---

## 5. User Stories

> **Story point scale:** 1 = trivial (<2h), 2 = small (half-day), 3 = medium (1 day), 5 = large (2 days), 8 = very large (split recommended)

---

### BLND-001 — Configure development environment

**Feature:** FT-01-2 | **Priority:** P0 — Sprint 0, Day 1 | **Points:** 1 | **Risk:** Blocker

**User Story:** As a developer, I want the local development environment fully configured so that I can run the application end-to-end without external dependencies failing.

**Description:** Configure DATABASE_URL (local PostgreSQL or Neon dev branch) and AUTH_RESEND_KEY so that magic-link auth and DB reads/writes work. Verify ANTHROPIC_API_KEY is present (already in .env.local). Document the .env.local template.

**Acceptance Criteria:**
- Given a fresh clone of the repo, when a developer follows the setup instructions, then `npm run dev` starts without errors
- Given DATABASE_URL is set, when `npm run db:migrate` runs, then all migrations apply without error
- Given AUTH_RESEND_KEY is set, when a user submits the sign-in form, then a magic-link email is sent within 30 seconds
- Given ANTHROPIC_API_KEY is set, when a test LLM call is made, then a streamed response is returned

**Error Handling:** Missing env var must produce a clear startup error message naming the missing variable, not a cryptic runtime failure.

**Security:** .env.local must never be committed (confirmed: .env* is in .gitignore). Document this in README.

**Definition of Done:** Developer can sign in, reach /app/log, make a DB query, and receive an LLM response in local dev.

**Traceability:** SEC-004, NFR-005, ENV-01 | Workflow: Prerequisites

**Tasks:** BLND-001-T-1: Configure DATABASE_URL (Neon or local PG). BLND-001-T-2: Configure AUTH_RESEND_KEY in .env.local. BLND-001-T-3: Configure AUTH_URL. BLND-001-T-4: Verify ANTHROPIC_API_KEY present. BLND-001-T-5: Write .env.local.example template. BLND-001-T-6: Update README setup instructions.

---

### BLND-002 — Apply database schema migrations (Phase 1: User and Decision tables)

**Feature:** FT-01-1 | **Priority:** P0 — Sprint 0 | **Points:** 3 | **Risk:** High — schema is foundational; errors cascade to all other stories

**User Story:** As an engineer, I want all new database columns and tables from Pass 2 applied via Drizzle migrations so that application code can read and write them.

**Description:** Apply the following changes from the Pass 2 schema additions to `src/lib/db/schema.ts` and generate/apply Drizzle migrations:
- `users`: add `profile_answers jsonb`, `onboarding_completed_at timestamp nullable`
- `decisions`: add `source text not null default 'interrogation'`, `tags text[] not null default '{}'`
- `interrogationSessions`: add `profile_snapshot jsonb nullable`, `completed_at timestamp nullable`
- `reflections`: add `dismissed_at timestamp nullable`, `notified_at timestamp nullable`, `structured_responses jsonb nullable`
- `patternAlerts`: add `is_active boolean not null default false`
- Fix `decisions.chosenOptionId`: add proper FK reference with deferred constraint

**Business Rules:**
- `source` default is `'interrogation'` so existing decisions are correctly typed
- `is_active` default is `false` so existing alerts (if any) are not incorrectly activated
- `chosenOptionId` FK: use `onDelete: 'set null'` to allow option deletion without blocking

**Acceptance Criteria:**
- Given the Drizzle schema is updated, when `npm run db:generate` runs, then migration files are created
- Given migration files exist, when `npm run db:migrate` runs in dev, then all columns exist and schema is valid
- Given an existing user row, when migration applies, then `profile_answers` is null and `onboarding_completed_at` is null (no data loss)
- Given an existing decision row, when migration applies, then `source = 'interrogation'` and `tags = '{}'`

**Error Handling:** If migration fails, rollback must leave the database in its prior state. Document rollback procedure.

**Definition of Done:** Migrations verified in dev and staging; schema diff shows all expected columns; no existing data lost.

**Traceability:** DR-001, DR-002, DR-003, DR-004, DR-005, DR-006, FR-002, FR-003, FR-012, FR-013, FR-020 | ADR-005

**Tasks:** BLND-002-T-1: Update schema.ts with all new columns. BLND-002-T-2: `npm run db:generate` and review generated SQL. BLND-002-T-3: Apply migration to dev DB; verify with db:studio. BLND-002-T-4: Apply migration to staging DB. BLND-002-T-5: Write integration test verifying all columns exist. BLND-002-T-6: Document rollback procedure.

---

### BLND-003 — Apply database schema migrations (Phase 2: New tables)

**Feature:** FT-01-1 | **Priority:** P0 — Sprint 0 | **Points:** 3 | **Risk:** Medium

**User Story:** As an engineer, I want the `interrogation_turns` and `decision_notes` tables created via migration so that turns and notes can be persisted.

**Description:** Add two new tables to schema.ts and generate migrations:
- `interrogation_turns`: id uuid PK, session_id uuid FK(interrogation_sessions, cascade), turn_number integer not null, role text not null ('user'|'assistant'), content text not null, created_at timestamp defaultNow(). Composite unique(session_id, turn_number).
- `decision_notes`: id uuid PK, decision_id uuid FK(decisions, cascade), content text not null, created_at timestamp defaultNow(). No update or delete routes.

**Acceptance Criteria:**
- Given migrations applied, when a turn row is inserted with a duplicate (session_id, turn_number), then a unique constraint error is returned
- Given migrations applied, when a decision is deleted, then its notes are cascade deleted
- Given migrations applied, when a session is deleted, then its turns are cascade deleted

**Definition of Done:** Both tables exist in dev and staging; unique constraint on turns verified; cascade delete verified.

**Traceability:** DR-003, FR-010, FR-016 | ADR-004

**Tasks:** BLND-003-T-1: Add interrogation_turns and decision_notes to schema.ts. BLND-003-T-2: Add Drizzle relations. BLND-003-T-3: Generate and apply migrations. BLND-003-T-4: Write integration tests for cascade delete and unique constraint.

---

### BLND-004 — Verify and seed pattern types

**Feature:** FT-01-3 | **Priority:** P0 — Sprint 0 | **Points:** 1 | **Risk:** Low

**User Story:** As an engineer, I want the 6 pattern types seeded in every environment so that the pattern engine can classify sessions immediately.

**Description:** Run `npm run db:seed` (`src/lib/db/seed.ts`). Verify idempotency (onConflictDoNothing). Confirm 6 rows: binary_framing, external_validation, career_over_alignment, recency_bias, sunk_cost, authority_deference with correct thresholds.

**Acceptance Criteria:**
- Given seed runs once, then 6 rows exist in pattern_types
- Given seed runs twice, then still exactly 6 rows (no duplicates)
- Given a pattern type slug in the code matches a slug in the DB, classification succeeds

**Definition of Done:** db:seed part of deployment runbook; 6 rows verified in dev and staging.

**Tasks:** BLND-004-T-1: Run db:seed in dev. BLND-004-T-2: Run db:seed in staging. BLND-004-T-3: Add db:seed to deployment documentation. BLND-004-T-4: Write test verifying all 6 slugs present after seed.

---

### BLND-005 — Verify end-to-end authentication flow

**Feature:** FT-01-2 | **Priority:** P0 — Sprint 0 | **Points:** 2 | **Risk:** High — no user can sign in without this

**User Story:** As a new user, I want to receive a magic-link email and sign in securely so that I can access my private account.

**Description:** Verify the complete NextAuth.js magic-link flow: user enters email on /login → Resend sends email → user clicks link → JWT session created → redirect to /app/profile (if not onboarded) or /app/log. Test unauthenticated redirect from /app/* to /login.

**Acceptance Criteria:**
- Given AUTH_RESEND_KEY is configured, when user submits email, then email arrives within 60 seconds
- Given user clicks magic link, when link is valid, then session is created and user is redirected
- Given magic link is expired (>24h), when user clicks it, then error page shown with "request a new link" action
- Given user is not authenticated, when they visit /app/log, then they are redirected to /login
- Given user is authenticated, when they visit /login, then they are redirected to /app/log

**Error Handling:** If Resend fails, show "Could not send email — please try again" with retry button. Log Resend error server-side.

**Security:** JWT stored in httpOnly cookie. Magic link is single-use and expires in 24 hours (NextAuth default).

**Definition of Done:** Sign-in flow verified in dev and staging; unauthenticated redirect verified; expired link handled.

**Traceability:** SEC-001, SEC-006, INT-001 (auth) | Workflow: Authentication

**Tasks:** BLND-005-T-1: Verify Resend provider sends email in dev. BLND-005-T-2: Verify JWT session persists across page refresh. BLND-005-T-3: Verify middleware redirects unauthenticated users. BLND-005-T-4: Test expired magic link. BLND-005-T-5: Playwright test: sign-in happy path.

---

### BLND-010 — Complete profile onboarding (7-question intake)

**Feature:** FT-02-1, FT-02-2, FT-02-3 | **Priority:** P0 — Sprint 1 | **Points:** 5 | **Risk:** High — profile persistence is a confirmed blocking gap

**User Story:** As a new user, I want to complete a 7-question behavioral profile so that every interrogation session is calibrated to who I am and how I make decisions.

**Description:** The UI (`src/components/profile.tsx`) already implements the 7 questions. The gaps are: (1) PATCH /api/user does not save profile_answers; (2) onboarding_completed_at is not set; (3) the onboarding gate is client-side only. This story fixes all three.

Questions captured: areas (multi-select), struggles (multi-select), risk (scale 1-5), pace (scale 1-5), triggers (multi-select), push (scale 1-5), consult (multi-select).

**Business Rules:**
- Profile cannot be skipped (RULE-001)
- Profile stores answers as JSONB: `{ areas: string[], struggles: string[], risk: number, pace: number, triggers: string[], push: number, consult: string[] }`
- `onboarding_completed_at` set on first profile submission, never reset
- Profile must be completable in ≤15 minutes (FR-001)

**Acceptance Criteria:**
- Given a new authenticated user, when they land on any /app/* page, then they are redirected to /app/profile
- Given user completes all 7 questions and submits, when submission succeeds, then `users.profile_answers` contains their answers and `users.onboarding_completed_at` is set
- Given onboarding_completed_at is set, when user visits /app/profile, then they see the edit view (not the onboarding flow)
- Given a question has a `min: 1` constraint, when user tries to advance without answering it, then an inline error prevents progression
- Given PATCH /api/user fails, when user submits, then error message shown and answers not lost from local state

**Validation Rules:** Each question with min=1 requires at least one selection before advancing. Scale questions require a selection (no zero value).

**Error Handling:** Network failure on submit: show "Could not save your profile — please try again." Local state preserved for retry.

**Security:** PATCH /api/user verifies session.user.id before writing. User can only update their own profile.

**Audit:** onboarding_completed_at timestamp records when onboarding was completed. Profile_answers JSONB records the answers.

**Definition of Done:** profile_answers saved to DB on first submission; onboarding_completed_at set; gate redirects pre-onboarding users; profile completable in <15min in manual test.

**Traceability:** FR-001, FR-002, BR-007, RULE-001, UX-001, UX-008 | Workflow 1

**Tasks:** BLND-010-T-1: Update PATCH /api/user to accept and save profile_answers and set onboarding_completed_at. BLND-010-T-2: Add onboarding gate to AppLayout (server-side redirect if onboarding_completed_at is null). BLND-010-T-3: Wire profile component submit button to call PATCH /api/user. BLND-010-T-4: Handle API error in profile component (show error, preserve state). BLND-010-T-5: Unit test: PATCH /api/user with profile_answers saves correctly. BLND-010-T-6: Unit test: onboarding gate redirects unauthenticated or pre-onboarding user. BLND-010-T-7: E2E test: complete onboarding → verify DB row updated → verify redirect to /app/log.

---

### BLND-011 — Profile personalization of interrogation

**Feature:** FT-03-5 | **Priority:** P0 — Sprint 1 | **Points:** 3 | **Risk:** Medium — requires profile answers in correct format for LLM injection

**User Story:** As a user who has completed onboarding, I want the interrogation to reference my behavioral profile so that questions feel specific to how I make decisions, not generic.

**Description:** At interrogation session creation, copy `users.profile_answers` into `interrogationSessions.profile_snapshot`. Inject profile_snapshot into the LLM system prompt alongside coaching style and active patterns. Replace the current thin `decisionContext` string with the full 7-answer profile context.

**Business Rules:**
- Profile snapshot must be taken at session start (not at summary time) so that profile edits after the session don't affect the record (FR-004)
- The 7-question profile must be formatted as human-readable text in the system prompt: "User struggles with: overthink, others. Risk tolerance: 3/5. Pushback preference: 4/5. Decision triggers to watch: pressure, fomo."

**Acceptance Criteria:**
- Given a user with completed profile, when they start an interrogation, then interrogationSessions.profile_snapshot contains the profile_answers at that moment
- Given push=5 (adversarial) in the profile, when the interrogation runs, then the coaching style applied is 'critic' regardless of coaching_style selection (or: coaching_style selection overrides push — Product to confirm; default: coaching style selection wins, push is informational)
- Given user has 'struggles: [sunk_cost]' in profile, when interrogation generates a counter-consideration, then the prompt includes "this user tends to anchor to sunk costs" as context
- Given user edits profile after a session, when viewing the past session summary, then the profile_snapshot on the session still reflects the original answers

**Error Handling:** If profile_answers is null (incomplete migration or pre-onboarding edge case), proceed without profile context (graceful degradation — session still works, just generic).

**Definition of Done:** profile_snapshot written on session creation; system prompt includes formatted profile text; past sessions unaffected by profile edits.

**Traceability:** FR-003, FR-004, FR-011 | ADR-005 | Workflow 2

**Tasks:** BLND-011-T-1: Update POST /api/interrogation to read users.profile_answers and copy to interrogationSessions.profile_snapshot. BLND-011-T-2: Update buildSystemPrompt() to format profile_snapshot as human-readable text. BLND-011-T-3: Remove old decisionContext-only profile injection; replace with full profile. BLND-011-T-4: Unit test: profile_snapshot contains correct answers at session start. BLND-011-T-5: Unit test: buildSystemPrompt includes all 7 profile dimensions.

---

### BLND-012 — Fix interrogation save flow (turns persistence + summary wiring)

**Feature:** FT-03-3, FT-03-4 | **Priority:** P0 — Sprint 1 | **Points:** 8 | **Risk:** Critical — handleSave is currently broken

**User Story:** As a user who has completed an interrogation, I want to save my session and receive a structured summary so that my reasoning is recorded and I can review it later.

**Description:** The `handleSave` function in `real-interrogation.tsx` is currently a placeholder. This story completes it. Required: (1) track sessionId from first message creation; (2) persist all turns via POST /api/interrogation/:sessionId/turns; (3) call POST /api/interrogation/:sessionId/summary with turns from DB; (4) display recommendation; (5) navigate to decision detail on success. Also: update summary route to read transcript from interrogation_turns table rather than accepting client-submitted string.

**Business Rules:**
- Turns must be persisted BEFORE summary is generated (summary reads from DB)
- Session can only be summarized once (recommendations are never updated per RULE-009; re-interrogation creates new session)
- Summary is read-only once generated (RULE-003)
- Draft state: decision exists but has no recommendation → shown as draft in log

**Acceptance Criteria:**
- Given user completes 5+ turns and clicks "Generate Summary", when save succeeds, then all turns are in interrogation_turns, a recommendation row exists, and user is shown the summary
- Given turns are persisted, when summary route is called, then it reads transcript from interrogation_turns (not client body)
- Given save fails mid-way (turns saved but summary fails), when user retries, then summary generation can be retried without duplicate turns (idempotent turn insert via ON CONFLICT DO NOTHING on turn_number)
- Given summary is generated, when user views the decision in /log, then the recommendation is visible
- Given user closes browser after turn 3 (no save), when user returns and navigates to the decision, then no turns are persisted (intentional — client-initiated save is the trigger)

**Error Handling:** 
- LLM failure during summary: return 502; show "Couldn't generate summary — your turns are saved, try again"; decision remains in draft state
- Network failure during turn upload: show error; allow retry; turns are idempotent

**Security:** Session ID tracked in React state; turns endpoint verifies session belongs to authenticated user before writing.

**Definition of Done:** Full save flow works end-to-end; turns in DB; recommendation in DB; summary displayed in UI; summary route reads from DB.

**Traceability:** FR-009, FR-010, ADR-004 | Workflow 2, Workflow 3

**Tasks:** BLND-012-T-1: Add sessionId state to RealInterrogation component; set from first POST /api/interrogation response. BLND-012-T-2: Create POST /api/interrogation/:sessionId/turns endpoint; accepts messages array; inserts to interrogation_turns; idempotent via ON CONFLICT DO NOTHING. BLND-012-T-3: Update summary route to read transcript from interrogation_turns instead of req.body.transcript. BLND-012-T-4: Wire handleSave: (a) upload turns, (b) call summary, (c) display result, (d) navigate. BLND-012-T-5: Update decisions.completed_at via interrogationSessions when summary is generated. BLND-012-T-6: Handle partial failure (turns saved, summary failed): show retry; keep draft state. BLND-012-T-7: Unit test: turns endpoint idempotent (duplicate insert no-ops). BLND-012-T-8: Integration test: full save flow from turns to recommendation. BLND-012-T-9: E2E test: complete 5+ turn session → save → verify recommendation in DB and displayed.

---

### BLND-013 — Minimum response length enforcement

**Feature:** FT-03-2 | **Priority:** P0 — Sprint 1 | **Points:** 2 | **Risk:** Low

**User Story:** As a user mid-interrogation, I want the system to prompt me to expand shallow responses so that I cannot complete the session with one-line deflections.

**Description:** Enforce a minimum response length (default: 50 characters — **TBD by Product**) client-side before allowing submission. Show inline prompt: "Your answer needs a bit more depth — can you expand on that?" The minimum is enforced as a soft prompt (user sees message) not a hard block (submit button remains active after warning).

**Business Rules:**
- Minimum length: 50 characters (placeholder — Product must confirm)
- Enforcement is client-side (soft prompt); not server-side validation
- Empty or whitespace-only responses are hard-blocked (submit disabled)

**Acceptance Criteria:**
- Given user types fewer than 50 characters and submits, when the check runs, then inline prompt appears: "Your answer needs more depth — try expanding your reasoning."
- Given user types 50+ characters, when they submit, then the message is sent without warning
- Given user types only whitespace, when submit is pressed, then button is disabled and nothing is sent
- Given user sees the prompt, when they add more text and resubmit, then the message is sent normally

**Traceability:** FR-005, UX-010

**Tasks:** BLND-013-T-1: Add character count check to handleSubmit in RealInterrogation. BLND-013-T-2: Render inline prompt when count < threshold. BLND-013-T-3: Disable submit for whitespace-only input. BLND-013-T-4: Unit test: boundary conditions at 49, 50, 51 chars. BLND-013-T-5: Document 50-char default as "TBD by Product" in a comment and in open decisions.

---

### BLND-014 — Session progress indicator and minimum turns gate

**Feature:** FT-03-2 | **Priority:** P0 — Sprint 1 | **Points:** 2 | **Risk:** Low

**User Story:** As a user in an interrogation, I want to see my session progress so that I know how far I've gone and when I can choose to finalize.

**Description:** Display a progress indicator: "Turn N of at least 5" where N is the count of completed user turns. "Generate Summary" button is disabled and visually indicates "inactive" until N ≥ 5 (already partially implemented via `canSave`). At turn 10+, add optional nudge: "You've covered the key angles — ready to record your decision?"

**Acceptance Criteria:**
- Given user is on turn 3, when they view the UI, then indicator shows "Turn 3 of at least 5" and Generate Summary is disabled
- Given user has completed 5+ turns, when they view the UI, then Generate Summary is active
- Given user is on turn 10, when AI responds, then UI adds a suggestion: "You've covered the key angles — ready to record your decision?"

**Traceability:** FR-006, UX-010, ADR-002

**Tasks:** BLND-014-T-1: Add turn count display to interrogation UI. BLND-014-T-2: Ensure Generate Summary disabled until canSave=true. BLND-014-T-3: Add turn-10 completion nudge to AI response rendering. BLND-014-T-4: Unit test: button state at 4, 5, 6 turns.

---

### BLND-015 — LLM system prompt: counter-consideration and circular reasoning

**Feature:** FT-03-2 | **Priority:** P0 — Sprint 1 | **Points:** 5 | **Risk:** High — prompt engineering quality is the primary product risk

**User Story:** As a user mid-interrogation, I want the system to challenge weak or circular reasoning so that I cannot complete the session with a rationalization.

**Description:** Refine the LLM system prompt in `interrogation/route.ts` to explicitly instruct the model to: (1) issue at least one counter-consideration per session naming a specific unaddressed tradeoff; (2) detect circular reasoning (restating prior point) and redirect with "You've made this point — can you offer a different angle?"; (3) not accept "I don't know" or single-sentence deflections without a follow-up probe.

**Business Rules:**
- Counter-consideration must name a SPECIFIC tradeoff, not a category (FR-007)
- Circular reasoning: if user response is semantically equivalent to a prior user response, redirect (FR-008)
- Quality rubric for manual testing: counter-consideration must feel precise not canned

**Acceptance Criteria:**
- Given user provides identical reasoning twice in different words, when AI evaluates, then AI responds with: "You've made this point — can you offer a different angle?"
- Given user has not acknowledged a key tradeoff by turn 5, when AI generates question 5, then it explicitly names the unaddressed tradeoff
- Given user responds with "I don't know", when AI evaluates, then AI follows up with a specific probing question rather than moving on

**Error Handling:** If LLM response does not follow the format, the raw response is shown (never blank). Log malformed responses for review.

**Definition of Done:** Updated system prompt deployed; manual test rubric executed (3 sessions); at least 2/3 sessions receive a precise counter-consideration rating.

**Traceability:** FR-007, FR-008, UX-002, BR-005 | ADR-001

**Tasks:** BLND-015-T-1: Refine advisor/supporter/critic system prompts with explicit counter-consideration instruction. BLND-015-T-2: Add circular reasoning detection instruction (semantic equivalence check). BLND-015-T-3: Add "I don't know" handling instruction. BLND-015-T-4: User-test refined prompt with 3 sessions (Jordan, Priya, Marcus archetypes). BLND-015-T-5: Document pass/fail per session in docs/testing/interrogation-quality-rubric.md.

---

### BLND-016 — Draft save and resume

**Feature:** FT-03-6 | **Priority:** P1 — Sprint 1 (after core save flow) | **Points:** 3 | **Risk:** Low

**User Story:** As a user who is not ready to finalize a session, I want to save my progress and return later so that I do not have to rush to a conclusion I am not confident in.

**Description:** A decision in `source='interrogation'` state with no recommendation row is a draft. Drafts appear in /log clearly labeled "In progress." Clicking a draft resumes the session from the last turn.

**Business Rules:**
- Draft: decision exists, interrogationSession exists, recommendations row does NOT exist (RULE-004)
- Draft is shown in log but not in the completed entries count
- User can have one active interrogation draft at a time per decision (not a global one-draft limit)

**Acceptance Criteria:**
- Given user starts an interrogation but does not generate summary, when they navigate to /log, then the decision appears labeled "In progress"
- Given user clicks a draft entry, when page loads, then interrogation resumes showing all prior turns
- Given user has a draft, when they start a NEW decision interrogation, then they can do so (multiple drafts allowed, one per decision)

**Traceability:** FR-010, RULE-004, UX-005

**Tasks:** BLND-016-T-1: Define draft state as "decision with no recommendation" in GET /api/decisions query. BLND-016-T-2: Label draft entries in decision log timeline UI. BLND-016-T-3: Load existing turns when resuming a session. BLND-016-T-4: Unit test: draft detection logic. BLND-016-T-5: E2E test: start session → navigate away → return → verify turns reloaded.

---

### BLND-020 — Decision log timeline view

**Feature:** FT-04-1 | **Priority:** P0 — Sprint 2 | **Points:** 3 | **Risk:** Low

**User Story:** As a user with logged decisions, I want to see all my past entries in a timeline so that I can review my decision history at a glance.

**Description:** Timeline in reverse chronological order. Each entry shows: title, date, category, type label (Interrogation / Manually logged / In progress), lock indicator. Tapping opens detail view. Empty state explains the log and prompts first decision.

**Acceptance Criteria:**
- Given user has 3 decisions, when they view /log, then all 3 appear in reverse chronological order
- Given decision is source='manual', when shown in list, then label reads "Manually logged"
- Given decision has lockedAt set, when shown in list, then lock icon displayed
- Given decision has no recommendation, when shown in list, then labeled "In progress"
- Given user has no decisions, when they view /log, then empty state explains purpose and shows "Log a decision" CTA

**Traceability:** FR-014, UX-003, UX-005, UX-006, UX-007

**Tasks:** BLND-020-T-1: Implement decision list component with type labels. BLND-020-T-2: Implement empty state. BLND-020-T-3: Add lock icon to locked entries. BLND-020-T-4: Unit test: list ordering and label logic. BLND-020-T-5: E2E test: create 2 decisions (1 manual, 1 interrogation) → verify both appear with correct labels.

---

### BLND-021 — Manual decision entry creation

**Feature:** FT-04-2 | **Priority:** P0 — Sprint 2 | **Points:** 3 | **Risk:** Medium — FR-025 bug must be fixed here

**User Story:** As a user logging a past decision, I want to create an entry manually so that historical decisions are available to the pattern engine.

**Description:** Manual entry form: decision title, date (past dates allowed), options (at least 2), option chosen, free-text reasoning. On creation: `source = 'manual'`; reflections are NOT auto-scheduled. Entry labeled "Manually logged." Visible to pattern engine but lower confidence weight (documented; weight implementation deferred to P1).

**Business Rules:**
- `source = 'manual'` (FR-012)
- No reflection auto-schedule for manual entries (FR-025 bug fix)
- Manual entries must accept past dates
- Pattern engine receives manual entries but treats them as lower confidence (FR-024 — weighting is P1; flag is MVP)

**Acceptance Criteria:**
- Given user creates manual entry, when POST /api/decisions is called with source='manual', then no reflection rows are created
- Given user sets date to 2 years ago, when entry is saved, then `decisions.created_at` reflects that date (or a separate `decision_date` field — confirm with Product; default: use created_at with user-provided date)
- Given user creates manual entry, when it appears in /log, then label reads "Manually logged"
- Given source='interrogation' is submitted, when POST /api/decisions is called, then reflections ARE created (existing behavior preserved)

**Error Handling:** Validation: title required; at least 2 options required; decision_date required.

**Traceability:** FR-012, FR-024, FR-025, RULE-010 (manual entries visible to pattern engine)

**Tasks:** BLND-021-T-1: Add manual entry form UI to /log page. BLND-021-T-2: Update POST /api/decisions to check source and skip reflection creation when source='manual'. BLND-021-T-3: Add "Manually logged" label logic to decision list. BLND-021-T-4: Unit test: POST /api/decisions with source='manual' creates 0 reflection rows. BLND-021-T-5: Unit test: POST /api/decisions with source='interrogation' creates 2 reflection rows (regression test for existing behavior).

---

### BLND-022 — Option data editing

**Feature:** FT-04-3 | **Priority:** P1 — Sprint 2 | **Points:** 2 | **Risk:** Low

**User Story:** As a user comparing options, I want to input and edit key data about each option so that I can weigh concrete factors and reference them later.

**Description:** Users can add/edit pros and cons on each DecisionOption. The existing schema supports `pros jsonb` and `cons jsonb` as string arrays. UI should allow inline editing of these arrays from the decision detail view.

**Acceptance Criteria:**
- Given user opens decision detail, when they edit an option's pros/cons, then changes are saved via PATCH /api/decisions/:id (or a dedicated option route)
- Given decision is locked, when user tries to edit options, then edit is blocked (403)
- Given user adds a pro, when saved, then it appears immediately in the detail view

**Traceability:** FR-015

**Tasks:** BLND-022-T-1: Add inline option editing UI to decision detail. BLND-022-T-2: Create PATCH /api/decisions/:id/options/:optionId endpoint. BLND-022-T-3: Block edits for locked decisions. BLND-022-T-4: Unit test: edit option; locked decision returns 403.

---

### BLND-023 — Append-only notes on decision entries

**Feature:** FT-04-4 | **Priority:** P0 — Sprint 2 | **Points:** 2 | **Risk:** Low

**User Story:** As a user with logged decisions, I want to add a note to any entry at any time so that I can capture context as it emerges without waiting for a scheduled reflection.

**Description:** Append-only timestamped notes via `decision_notes` table. Note add form in decision detail. Notes displayed in chronological order below main entry. No edit or delete. Available even for locked entries.

**Business Rules:**
- Notes are append-only (RULE-005)
- No minimum length
- Notes available on locked entries (locking stops reflection prompts, not notes)
- Notes accessible to pattern engine as additional context (P1 — indexing)

**Acceptance Criteria:**
- Given user opens decision detail, when they type a note and submit, then note appears with timestamp
- Given user submits an empty note, when validation runs, then submission is blocked with "Note cannot be empty"
- Given decision is locked, when user adds a note, then note is saved (lock does not prevent notes)
- Given 3 notes exist, when user views detail, then notes appear in creation order (oldest first)

**Traceability:** FR-016, RULE-005

**Tasks:** BLND-023-T-1: Create POST /api/decisions/:id/notes endpoint (decision_notes table). BLND-023-T-2: Build note input UI in decision detail. BLND-023-T-3: Display notes in chronological order. BLND-023-T-4: Validate empty note (server and client). BLND-023-T-5: Unit test: POST creates note; GET /decisions/:id returns notes.

---

### BLND-024 — Lock and unlock decision entry

**Feature:** FT-04-5 | **Priority:** P0 — Sprint 2 | **Points:** 3 | **Risk:** Low

**User Story:** As a user who has fully processed a past decision, I want to lock the entry to stop receiving prompts, and unlock it if I change my mind.

**Description:** Lock: POST /api/decisions/:id/lock → sets `lockedAt`. Unlock: DELETE /api/decisions/:id/lock → sets `lockedAt = null`. Locked entries are read-only (PATCH returns 403). Locking stops future reflection prompts (cron job skips locked decisions). Unlocking resumes prompts from the next scheduled interval.

**Business Rules:**
- Locking makes entry read-only except for notes (RULE-002)
- Locking stops all future scheduled reflection prompts
- Unlocking re-enables prompts from next scheduled interval (RULE-008)
- Locking does not delete or hide existing reflection data

**Acceptance Criteria:**
- Given user locks a decision, when they try to PATCH its title, then 403 is returned
- Given user locks a decision, when cron runs next day, then that decision's reflections are skipped
- Given user unlocks a decision, when cron runs, then pending reflections for that decision are again eligible
- Given user adds a note to a locked decision, when note is submitted, then note is saved (lock does not prevent notes)
- Given entry is locked, when shown in /log, then lock icon is displayed

**Traceability:** FR-020, RULE-002, RULE-008, UX-006

**Tasks:** BLND-024-T-1: DELETE /api/decisions/:id/lock route (sets lockedAt = null). BLND-024-T-2: Lock/unlock UI control in decision detail. BLND-024-T-3: Update cron to skip locked decisions. BLND-024-T-4: Unit test: lock → PATCH blocked (403); note still allowed. BLND-024-T-5: Unit test: unlock → PATCH allowed again.

---

### BLND-025 — Decision tags

**Feature:** FT-04-6 | **Priority:** P2 — Sprint 2 | **Points:** 1 | **Risk:** Low

**User Story:** As a user, I want to add tags to decision entries so that I can filter and organize my log.

**Description:** `decisions.tags` is a `text[]` column. Simple tag input UI in decision detail. No predefined tag list. Tags editable at any time (even locked — TBD; default: tags editable on locked entries since they don't affect integrity).

**Acceptance Criteria:**
- Given user adds tags "career" and "high-stakes", when saved, then tags[] = ['career', 'high-stakes']
- Given user removes a tag, when saved, then tag is removed from array

**Traceability:** FR-013

**Tasks:** BLND-025-T-1: Tag input UI (multi-value input). BLND-025-T-2: PATCH /api/decisions/:id to accept tags[]. BLND-025-T-3: Unit test: add/remove tag.

---

### BLND-030 — Reflection scheduling and Vercel Cron setup

**Feature:** FT-05-1, FT-05-2 | **Priority:** P0 — Sprint 3 | **Points:** 5 | **Risk:** High — cron infrastructure is new; misconfiguration means no prompts fire

**User Story:** As a user who logged a decision, I want to receive a notification at 1 month and 3 months so that I am prompted to record how it actually turned out.

**Description:** At decision creation (source='interrogation'), auto-schedule two reflection rows with `scheduled_for` = creation_date + 1mo and + 3mo. Daily Vercel Cron at 08:00 UTC calls `POST /api/cron/reflections` (protected by CRON_SECRET in Authorization header). Cron: query reflections where `scheduled_for <= today AND completed_at IS NULL AND dismissed_at IS NULL AND notified_at IS NULL AND decision.locked_at IS NULL`. For each match, set `notified_at = now()`. In-app badge count increments.

**Business Rules:**
- Only source='interrogation' decisions get auto-scheduled reflections (FR-025 bug fix — already in BLND-021 but must be verified here)
- Cron skips locked decisions
- Cron is idempotent: once `notified_at` is set, the reflection is not re-processed
- Only standard intervals: `1mo` and `3mo` for MVP (full schedule is P1)

**Acceptance Criteria:**
- Given a new interrogation decision is created, then exactly 2 reflection rows exist (1mo, 3mo)
- Given a new manual decision is created, then 0 reflection rows are created
- Given a reflection is due (scheduled_for = today) and notified_at IS NULL, when cron runs, then notified_at is set
- Given a reflection is due and decision is locked, when cron runs, then reflection is skipped (notified_at NOT set)
- Given cron runs twice on the same day, when second run, then no reflection is notified twice (idempotent)
- Given CRON_SECRET is invalid, when cron is called, then 401 returned

**Error Handling:** Individual reflection notification failure: log error, continue to next reflection. Cron itself does not fail for per-row errors.

**Security:** CRON_SECRET checked in Authorization header. Cron route not accessible without secret.

**Definition of Done:** Cron configured in vercel.json; CRON_SECRET in staging env vars; end-to-end test with backdated reflection; badge count verified.

**Traceability:** FR-017, RULE-006, ADR-006 | Workflow 3

**Tasks:** BLND-030-T-1: Add vercel.json with cron config: `{ "crons": [{ "path": "/api/cron/reflections", "schedule": "0 8 * * *" }] }`. BLND-030-T-2: Create POST /api/cron/reflections route with CRON_SECRET auth check. BLND-030-T-3: Implement cron query: due, not notified, not locked, not dismissed, not completed. BLND-030-T-4: Set notified_at on matched reflections. BLND-030-T-5: Unit test: cron with backdated reflection → notified_at set. BLND-030-T-6: Unit test: cron with locked decision → reflection skipped. BLND-030-T-7: Unit test: cron idempotency (second run → no change). BLND-030-T-8: Unit test: unauthorized request returns 401.

---

### BLND-031 — In-app pending reflection badge

**Feature:** FT-07-1 | **Priority:** P0 — Sprint 3 | **Points:** 2 | **Risk:** Low

**User Story:** As a user who has not checked the app in a while, I want to see a badge count of pending reflections when I open the app so that I know there is something waiting for me.

**Description:** AppShell already queries pending reflection count from layout.tsx. The gap: the query currently does not filter for `notified_at IS NOT NULL` (only notified reflections should show as "pending action" — otherwise they show before the scheduled time). Also ensure badge resets when all reflections are completed or dismissed.

**Acceptance Criteria:**
- Given 2 reflections are notified (notified_at IS NOT NULL) and not yet completed or dismissed, when user opens app, then badge shows "2"
- Given user completes 1 reflection, when they return to home, then badge shows "1"
- Given all reflections are dismissed or completed, when user opens app, then badge is gone
- Given a reflection is due but notified_at IS NULL (not yet notified by cron), when user opens app, then badge does NOT show (cron must fire first)

**Traceability:** FR-017, UX-009 (pending notification signal)

**Tasks:** BLND-031-T-1: Update AppLayout pending reflection count query to filter by notified_at IS NOT NULL. BLND-031-T-2: Unit test: badge count scenarios (0, 1, 2, all-complete).

---

### BLND-032 — Structured reflection response

**Feature:** FT-05-3 | **Priority:** P0 — Sprint 3 | **Points:** 3 | **Risk:** Medium — structured_responses JSONB schema must be agreed before building

**User Story:** As a user who received a reflection prompt, I want to answer three structured questions about how a decision turned out so that the system can build outcome data and close the learning loop.

**Description:** Reflection UI presents three questions: (1) "How did this turn out?" (free text); (2) "What do you wish you had known before deciding?" (free text); (3) "Would you make the same choice again?" (yes/no/unsure + reason). Answers stored in `structured_responses: { turnedOut: string, wishKnown: string, sameChoice: 'yes'|'no'|'unsure', sameChoiceReason: string }`. Also store concatenated text in `content` for display. Set `completed_at = now()`.

**Business Rules:**
- All three question fields are optional individually; but at least one must be answered before submission is allowed
- Structured responses and content are stored together
- completed_at set on submission

**Acceptance Criteria:**
- Given user answers all 3 questions, when they submit, then structured_responses contains all 4 fields and completed_at is set
- Given user answers only question 1, when they submit, then structured_responses.turnedOut is set, others are null
- Given user submits with all fields empty, when validation runs, then error: "Please answer at least one question"
- Given reflection is completed, when user views the decision detail, then reflection response is displayed with timestamp

**Traceability:** FR-018, RULE-007 | Workflow 4

**Tasks:** BLND-032-T-1: Reflection response UI: 3-question form. BLND-032-T-2: PATCH /api/reflections/:id with structured_responses and content. BLND-032-T-3: Validate at least one field non-empty. BLND-032-T-4: Set completed_at on save. BLND-032-T-5: Display completed reflection in decision detail. BLND-032-T-6: Unit test: valid submission; empty submission blocked.

---

### BLND-033 — Free-form reflection at any time

**Feature:** FT-05-4 | **Priority:** P1 — Sprint 3 | **Points:** 2 | **Risk:** Low

**User Story:** As a user who wants to capture a fresh insight, I want to write a reflection on any decision at any time without waiting for a scheduled prompt.

**Description:** "Add reflection" action on decision detail (separate from scheduled prompts). Creates a new reflection row with interval_type='custom', custom_interval_days=0 (or a computed value from decision date). Same 3-question form as structured reflection, but all fields optional. Does NOT reset or cancel scheduled prompts (RULE-007).

**Acceptance Criteria:**
- Given user initiates reflection from decision detail, when they submit, then new reflection row created with interval_type='custom'
- Given user completes a free-form reflection, when they view scheduled prompts, then scheduled prompts are unaffected
- Given decision has both a scheduled and a free-form reflection, when viewed in detail, then both appear with their respective labels

**Traceability:** FR-019, RULE-007

**Tasks:** BLND-033-T-1: "Add reflection" button in decision detail. BLND-033-T-2: POST /api/reflections with custom interval. BLND-033-T-3: Display free-form reflections alongside scheduled ones with label "Added by you". BLND-033-T-4: Unit test: scheduled prompts unaffected by free-form entry.

---

### BLND-034 — Reflection dismissal

**Feature:** FT-05-5 | **Priority:** P0 — Sprint 3 | **Points:** 1 | **Risk:** Low

**User Story:** As a user who received a reflection prompt, I want to dismiss it without answering so that it does not clutter my queue.

**Description:** "Dismiss" action on reflection prompt. Sets `dismissed_at = now()`. Dismissed reflection does not re-appear in pending queue and does not count in badge. Dismissed reflection is not re-notified (idempotent).

**Acceptance Criteria:**
- Given user dismisses a reflection prompt, when dismissed_at is set, then prompt disappears from pending queue
- Given a reflection is dismissed, when cron runs again, then dismissed reflection is skipped
- Given user dismisses 1 of 2 pending reflections, when badge is shown, then count is 1

**Traceability:** FR-017, RULE-006

**Tasks:** BLND-034-T-1: Dismiss button on reflection prompt UI. BLND-034-T-2: PATCH /api/reflections/:id to set dismissed_at. BLND-034-T-3: Update cron to skip dismissed_at IS NOT NULL. BLND-034-T-4: Update badge count query to exclude dismissed.

---

### BLND-040 — Pattern alert threshold logic fix

**Feature:** FT-06-1, FT-06-2 | **Priority:** P0 — Sprint 4 | **Points:** 5 | **Risk:** High — current bug creates alerts immediately on first detection; a spurious alert on first session is a product failure for the Marcus persona

**User Story:** As a user, I want pattern alerts to only appear when a pattern has been observed across multiple decisions so that alerts reflect real patterns, not noise from a single session.

**Description:** Fix the pattern classification handler in `src/app/api/interrogation/[sessionId]/summary/route.ts`. Current bug: creates a `patternAlert` row immediately on first detection regardless of threshold. Fix: track pre-threshold evidence in `patternAlertDecisions` without creating a `patternAlert`. Create `patternAlert` (and set `is_active = true`) only when count of `patternAlertDecisions` for this user + pattern type reaches `patternType.detectionThreshold`.

**Business Rules:**
- `patternAlertDecisions` records accumulate silently below threshold
- `patternAlert` is created (or reactivated) only at threshold
- `is_active = true` only when threshold is reached
- Alerts surface in UI only when `is_active = true AND dismissed_at IS NULL`

**Acceptance Criteria:**
- Given binary_framing threshold = 3, when user completes 1st session exhibiting binary_framing, then patternAlertDecisions has 1 row; patternAlerts has 0 rows
- Given 2nd session exhibiting same pattern, then patternAlertDecisions has 2 rows; patternAlerts still 0 rows
- Given 3rd session, then patternAlerts has 1 row with is_active=true; patternAlertDecisions has 3 rows
- Given user dismisses alert, then dismissed_at IS NOT NULL; alert not shown in UI
- Given 4th session after dismissal, then dismissed_at is cleared, detected_at updated, is_active remains true

**Error Handling:** Pattern classification failure (async): log error; no alert created; user session unaffected.

**Definition of Done:** Threshold logic verified in staging with manually lowered threshold (set binary_framing threshold=2 in staging seed, run 2 sessions, verify alert appears on 2nd).

**Traceability:** ADR-007, ADR-008, RULE-011 | Workflow 5

**Tasks:** BLND-040-T-1: Refactor classifyAndUpdatePatterns() — separate pre-threshold accumulation from alert creation. BLND-040-T-2: Before creating patternAlert, query count of patternAlertDecisions for user+patternType. BLND-040-T-3: Create patternAlert with is_active=true only at threshold; else just insert patternAlertDecisions row. BLND-040-T-4: On re-detection of dismissed pattern: clear dismissed_at, set is_active=true, update detected_at. BLND-040-T-5: Unit test: first detection → no alert. BLND-040-T-6: Unit test: at threshold → alert created with is_active=true. BLND-040-T-7: Integration test: 3 sessions → alert appears in GET /api/patterns.

---

### BLND-041 — Pattern alert surfacing at interrogation start

**Feature:** FT-06-3 | **Priority:** P0 — Sprint 4 | **Points:** 3 | **Risk:** Medium

**User Story:** As a user beginning a new interrogation, I want to see a pattern alert if this decision structurally resembles a past one so that I can review what happened before committing.

**Description:** Before the first interrogation question is generated, the frontend queries `GET /api/patterns` for active (is_active=true, dismissed_at IS NULL) pattern alerts. If any exist, display an alert card with: pattern title, description, contributing decision titles, and any reflection outcome data from those decisions (FR-022).

**Business Rules:**
- Alert shown BEFORE first question (RULE-012 — surfaced at interrogation start, not end)
- User can dismiss the alert and proceed, or open the matched entry (FR-023)
- No alert shown if no active patterns exist (RULE-013)
- Active patterns injected into interrogation system prompt for context

**Acceptance Criteria:**
- Given user has an active pattern alert (is_active=true, dismissed_at IS NULL), when they navigate to /interrogation, then alert card is shown before the first question
- Given alert includes a decision that has a completed reflection, when alert is shown, then reflection outcome quote is displayed (e.g., "At 1 month you said: 'I wish I had known...'")
- Given user dismisses alert, when they proceed to interrogation, then session continues without alert; pattern context still injected into system prompt
- Given user has no active pattern alerts, when they navigate to /interrogation, then no alert is shown

**Traceability:** FR-021, FR-022, FR-023, RULE-012, RULE-013 | Workflow 6

**Tasks:** BLND-041-T-1: Update GET /api/patterns to include contributing decisions and their reflection outcomes (JOIN decisions + reflections). BLND-041-T-2: Add pre-interrogation alert UI to RealInterrogation intro phase. BLND-041-T-3: Dismiss alert action calls PATCH /api/patterns/:id. BLND-041-T-4: Inject active (pre-dismiss) pattern context into interrogation system prompt. BLND-041-T-5: Unit test: GET /api/patterns returns only is_active=true, dismissed_at IS NULL alerts. BLND-041-T-6: E2E test: complete 3 sessions with same pattern → verify alert on 4th session start.

---

### BLND-042 — Pattern alert dismissal

**Feature:** FT-06-4 | **Priority:** P0 — Sprint 4 | **Points:** 1 | **Risk:** Low

**User Story:** As a user who has seen a pattern alert, I want to dismiss it so that it stops appearing at the start of every session.

**Description:** PATCH /api/patterns/:id route already exists and sets dismissed_at. Verify it's wired to the alert dismiss button. Dismissed alerts are excluded from GET /api/patterns response. Pattern context is still injected into LLM prompt (dismissed ≠ ignored by engine).

**Acceptance Criteria:**
- Given user clicks "Dismiss" on a pattern alert, when PATCH /api/patterns/:id runs, then dismissed_at is set
- Given alert is dismissed, when user starts next interrogation, then alert card not shown; but pattern context still in system prompt
- Given new evidence re-triggers the pattern (4th detection after 3rd triggered threshold), when session completes, then dismissed_at is cleared and alert reappears

**Traceability:** FR-023, ADR-008

**Tasks:** BLND-042-T-1: Wire dismiss button to PATCH /api/patterns/:id (may already be implemented). BLND-042-T-2: Verify dismissed alerts excluded from GET /api/patterns. BLND-042-T-3: Verify dismissed pattern context still injected in system prompt.

---

### BLND-050 — End-to-end test: primary user journey

**Feature:** EP-08 | **Priority:** P0 — Sprint 5 | **Points:** 5 | **Risk:** Medium

**User Story:** As an engineer, I want an automated end-to-end test covering the primary user journey so that regressions are caught before they reach beta users.

**Description:** Playwright test covering: sign up (mocked magic link) → complete onboarding → start interrogation → complete 5 turns → generate summary → view in log → view scheduled reflections → lock entry.

**Acceptance Criteria:**
- Given the E2E test runs in CI, when all steps complete, then test passes in < 3 minutes
- Given a regression is introduced in any covered step, when CI runs, then the E2E test fails with a descriptive error message

**Traceability:** All FR-001 through FR-020 implicitly | Testing

**Tasks:** BLND-050-T-1: Playwright test: auth (mock Resend). BLND-050-T-2: Playwright test: onboarding flow. BLND-050-T-3: Playwright test: interrogation (mock LLM responses). BLND-050-T-4: Playwright test: log view. BLND-050-T-5: Playwright test: lock entry. BLND-050-T-6: CI configuration to run Playwright on every PR. BLND-050-T-7: Document test data seeding approach.

---

### BLND-051 — Observability: LLM cost and error monitoring

**Feature:** EP-11 | **Priority:** P0 — Sprint 5 | **Points:** 3 | **Risk:** Medium — without cost monitoring, LLM spend could spike undetected during beta

**User Story:** As an engineer, I want to see LLM call costs and errors logged so that I can detect problems and control costs during beta.

**Description:** Log token usage and estimated cost for every LLM call using AI SDK usage callback. Log reflection cron run outcomes. Redact all user content from logs (decision titles, reflection content, turn content). Alert on daily LLM cost > $10 (proposed threshold for 20–50 users).

**Acceptance Criteria:**
- Given an LLM call completes, when logs are viewed, then model, session_id, input_tokens, output_tokens, estimated_cost are logged with NO user content
- Given cron runs, when logs are viewed, then { run_at, due_reflections_found, notifications_marked, errors } is logged
- Given daily LLM cost exceeds $10, when alert triggers, then notification reaches the engineering team (Vercel alerting or email)

**Traceability:** OBS-001, NFR (LLM cost per session) | ADR-001

**Tasks:** BLND-051-T-1: Add AI SDK onFinish callback to log token usage. BLND-051-T-2: Create cost estimation helper (tokens × model rate). BLND-051-T-3: Add cron run logging. BLND-051-T-4: Verify no PII in logs (review logging calls). BLND-051-T-5: Configure Vercel log drain or alert for cost threshold. BLND-051-T-6: Unit test: LLM logger redacts content, logs metadata.

---

### BLND-052 — Pre-beta manual testing and go/no-go

**Feature:** EP-14 | **Priority:** P0 — Sprint 5 | **Points:** 3 | **Risk:** Low (process, not technical)

**User Story:** As a product owner, I want documented evidence that the interrogation quality and user isolation meet the bar before any real user accesses the system.

**Description:** Written test protocol in `docs/testing/pre-beta-checklist.md`. Three interrogation sessions (one per persona archetype), scored against the quality rubric. One user isolation test (two accounts, cross-contamination check). Pattern detection smoke test (lower threshold in staging; verify alert fires). Document results and sign off.

**Acceptance Criteria:**
- Given protocol exists, when 3 sessions are run, then results are recorded in docs/testing/
- Given counter-consideration rubric is applied, then ≥2/3 sessions rated "precise not generic"
- Given two test accounts, when each reads the other's API endpoints, then 0 cross-user data is returned
- Given pattern alert smoke test passes, then go/no-go checklist is signed and committed

**Traceability:** BR-005, NFR-003, SEC-002 | EP-14

**Tasks:** BLND-052-T-1: Write pre-beta-checklist.md with rubric. BLND-052-T-2: Run 3 interrogation sessions; record results. BLND-052-T-3: Run user isolation test; record results. BLND-052-T-4: Run pattern smoke test in staging. BLND-052-T-5: Commit sign-off to repo.

---

### BLND-053 — Achievement display and documentation

**Feature:** EP-13 | **Priority:** P2 — Sprint 5 | **Points:** 1 | **Risk:** Low

**User Story:** As a user, I want to see my achievements so that I have a sense of progress as I build my decision history.

**Description:** Achievements already implemented in `achievements.ts` and displayed in the profile component. This story ensures the business rationale is documented and the display is wired to live data rather than demo data.

**Acceptance Criteria:**
- Given user has logged 1 decision, when they view profile, then "First Step" achievement is unlocked
- Given achievement logic in `achievements.ts`, when evaluated against live AppData, then correct achievements are shown as unlocked
- Given achievements.ts criteria, when product owner reviews, then rationale for each achievement is documented in docs/

**Traceability:** (undocumented feature — achievement system) | FR: None directly; supports engagement

**Tasks:** BLND-053-T-1: Wire achievements to live DB data (not demo data). BLND-053-T-2: Document achievement system in docs/features/achievements.md.

---

## 6. Technical Tasks Summary

Full task listings are embedded in each story above. Summary by type:

| Task Type | Estimated Count |
|---|---|
| Database / Migration | 22 |
| Backend / API | 38 |
| Frontend / UI | 32 |
| AI / LLM / Prompt | 12 |
| Testing (unit) | 28 |
| Testing (integration) | 14 |
| Testing (E2E / Playwright) | 10 |
| Infrastructure / Deployment | 8 |
| Observability | 6 |
| Documentation | 8 |
| **Total** | **~178** |

---

## 7. Technical Enablers

| ID | Name | Description | Sprint | Blocks |
|---|---|---|---|---|
| TE-01 | Local PostgreSQL setup | Provision a local or Neon dev-branch DB; configure DATABASE_URL | Sprint 0 | BLND-002, BLND-003 |
| TE-02 | Resend API configuration | Configure AUTH_RESEND_KEY for magic-link auth | Sprint 0 | BLND-005 |
| TE-03 | Drizzle migration pipeline | Verify `db:generate` and `db:migrate` work reliably in dev and CI | Sprint 0 | BLND-002, BLND-003 |
| TE-04 | LLM provider framework | Verify ANTHROPIC_API_KEY, createAnthropic() client, streaming; add cost logging callback | Sprint 0 | BLND-011, BLND-012, BLND-015 |
| TE-05 | Vercel project and env setup | Create Vercel project; configure all env vars for staging; verify deployment | Sprint 0 | BLND-030 (cron) |
| TE-06 | Playwright setup | Verify Playwright runs in CI; create test fixtures (mock auth, mock LLM) | Sprint 5 | BLND-050 |
| TE-07 | CRON_SECRET configuration | Generate and configure CRON_SECRET in staging and production Vercel env vars | Sprint 3 | BLND-030 |

---

## 8. Testing Backlog

### Sprint 0 Tests
- Verify DB connection and migration apply (BLND-002-T-5)
- Verify seed idempotency (BLND-004-T-4)
- Verify auth magic-link flow (BLND-005-T-5 — Playwright)
- Verify LLM call returns streamed response (TE-04 spike)

### Sprint 1 Tests
- Profile persistence: unit test PATCH /api/user saves profile_answers (BLND-010-T-5)
- Onboarding gate: unit test redirect for pre-onboarding user (BLND-010-T-6)
- E2E: complete onboarding → verify DB row (BLND-010-T-7)
- Profile snapshot: unit test session creation copies profile (BLND-011-T-4)
- Turns persistence: idempotency on duplicate insert (BLND-012-T-7)
- Full save flow integration test: turns → recommendation (BLND-012-T-8)
- E2E: complete interrogation → verify DB (BLND-012-T-9)
- Min length boundary conditions (BLND-013-T-4)
- Turn count gate at 4, 5, 6 turns (BLND-014-T-4)
- Prompt engineering: 3 manual sessions with rubric (BLND-015-T-4, T-5)

### Sprint 2 Tests
- Decision list ordering and label logic (BLND-020-T-4)
- E2E: create 2 decisions → verify labels (BLND-020-T-5)
- Manual entry: 0 reflection rows created (BLND-021-T-4)
- Manual entry: interrogation entry still creates 2 reflections (BLND-021-T-5 — regression)
- Option edit; locked returns 403 (BLND-022-T-4)
- Notes: append; empty blocked (BLND-023-T-4, T-5)
- Lock/unlock: PATCH blocked when locked; note allowed; unlock re-enables (BLND-024-T-4, T-5)

### Sprint 3 Tests
- Cron: backdated reflection → notified_at set (BLND-030-T-5)
- Cron: locked decision skipped (BLND-030-T-6)
- Cron idempotency (BLND-030-T-7)
- Cron unauthorized request → 401 (BLND-030-T-8)
- Badge count scenarios (BLND-031-T-2)
- Reflection submission: valid; empty blocked (BLND-032-T-6)
- Scheduled prompts unaffected by free-form (BLND-033-T-4)

### Sprint 4 Tests
- Pattern threshold: first detection → no alert (BLND-040-T-5)
- Pattern threshold: at threshold → alert created (BLND-040-T-6)
- Pattern integration: 3 sessions → alert in GET /api/patterns (BLND-040-T-7)
- GET /api/patterns returns only active, non-dismissed (BLND-041-T-5)
- E2E: 3 sessions → alert on 4th interrogation start (BLND-041-T-6)
- Dismiss: dismissed_at set; alert not shown; context still in prompt (BLND-042-T-1, T-2, T-3)

### Sprint 5 Tests
- Full E2E primary journey (BLND-050)
- User isolation: two accounts, zero cross-contamination (BLND-052-T-3)
- Pre-beta checklist execution (BLND-052)
- LLM logger: metadata logged, no PII (BLND-051-T-6)

---

## 9. Sprint Plan

### Sprint 0 — Technical Foundations (2 days)

**Objective:** Remove all environment and infrastructure blockers. By end of Sprint 0, any engineer can run the app locally, connect to a DB, sign in, and make an LLM call.

**Stories:** BLND-001, BLND-002, BLND-003, BLND-004, BLND-005  
**Enablers:** TE-01, TE-02, TE-03, TE-04, TE-05, TE-07  
**Dependencies:** None — this is the root  
**Risks:** DATABASE_URL and AUTH_RESEND_KEY may require account setup (Neon, Resend) — allow 1 day buffer if accounts need provisioning  
**Definition of Sprint Done:** Developer can sign in via magic link; DB connected; LLM call returns response; seed data present; staging deployment successful

---

### Sprint 1 — Profile and Interrogation Core (5 days)

**Objective:** Profile is persisted. Interrogation completes end-to-end. These are the two halves of the product's core value proposition. Nothing else ships until both work.

**Stories:** BLND-010, BLND-011, BLND-012, BLND-013, BLND-014, BLND-015, BLND-016  
**Dependencies:** Sprint 0 complete; TE-04 (LLM framework)  
**Risks:** BLND-012 (handleSave fix) is the highest-risk story — estimate may be off if the React state management is more tangled than it appears. BLND-015 (prompt engineering) quality is not guaranteed — build it early enough to iterate.  
**Quality gate:** After Sprint 1, run manual interrogation test. If counter-consideration quality fails rubric (< 2/3 sessions pass), do not proceed to Sprint 2 until prompt is refined.  
**Definition of Sprint Done:** End-to-end interrogation journey works: onboard → interrogate (5+ turns) → save → summary displayed → decision in log → draft state visible

---

### Sprint 2 — Decision Log and Entry Management (5 days)

**Objective:** Decision log is fully functional: timeline, manual entry, options, notes, tags, lock/unlock.

**Stories:** BLND-020, BLND-021, BLND-022, BLND-023, BLND-024, BLND-025  
**Dependencies:** Sprint 1 complete (interrogation entries feed the log); BLND-002 (schema — source, tags fields)  
**Risks:** Manual entry reflection scheduling bug (BLND-021) is a confirmed bug that must be fixed here — regression tests from BLND-021-T-5 are critical.  
**Definition of Sprint Done:** User can create manual and interrogation entries; log timeline shows all with correct labels; notes append; lock/unlock works; options editable

---

### Sprint 3 — Reflection Loop and Scheduler (5 days)

**Objective:** Reflection prompts fire on schedule; users can respond; dismissal works. This closes the feedback loop that the pattern engine depends on.

**Stories:** BLND-030, BLND-031, BLND-032, BLND-033, BLND-034  
**Enablers:** TE-07 (CRON_SECRET), vercel.json cron config  
**Dependencies:** Sprint 2 complete (decisions must exist); TE-05 (Vercel deployment for cron)  
**Risks:** Vercel Cron requires a paid plan tier or the free daily cron limit. Verify plan covers this before sprint starts. Cron testing in staging requires backdating a reflection row manually.  
**Definition of Sprint Done:** Cron runs in staging (verified via logs); badge count shows pending reflections; user can answer structured questions; dismissal works; free-form reflection creates separate row without affecting schedule

---

### Sprint 4 — Pattern Engine (5 days)

**Objective:** Pattern engine detects correctly (threshold logic fixed); alerts surface before interrogations; dismissal works; reflection outcome data included in alert context.

**Stories:** BLND-040, BLND-041, BLND-042  
**Dependencies:** Sprint 3 (reflections provide outcome data for FR-022); Sprint 1 (sessions produce summaries for classification); BLND-002 (is_active column)  
**Risks:** Pattern detection requires multiple sessions to reach threshold. Testing requires either lowered thresholds in staging or multiple test sessions. BLND-040 threshold fix is architectural — must be careful not to break existing patternAlertDecisions data (if any).  
**Definition of Sprint Done:** Alert threshold verified (3 sessions → alert); alert surfaced before first interrogation question; dismiss works; alert includes reflection outcome if available

---

### Sprint 5 — Polish and Beta Readiness (3 days)

**Objective:** The system is end-to-end verified, observable, and ready for 20–50 real users.

**Stories:** BLND-050, BLND-051, BLND-052, BLND-053  
**Enablers:** TE-06 (Playwright)  
**Dependencies:** All Sprint 0–4 stories complete  
**Risks:** Manual testing may surface a critical interrogation quality issue that delays go/no-go. Allow 1 day buffer.  
**Definition of Sprint Done:** E2E Playwright test passes in CI; pre-beta manual test rubric passed; user isolation verified; LLM cost logging active; go/no-go checklist signed off

---

### Sprint 6 — Track B: Attempt Logging and Transcript Ingestion (DEFERRED)

See Section 10.

---

## 10. Deferred Backlog

### Track B — Enhanced Product (P1, ~4 weeks post-beta)

| ID | Item | Description | Blocking Dependency |
|---|---|---|---|
| TB-001 | Attempt logging entity | New `attempts` table; separate from decisions | None |
| TB-002 | Attempt log UI | Create/view high-stakes performance events | TB-001 |
| TB-003 | Otter AI OAuth integration | User connects Otter account | TB-001 |
| TB-004 | Transcript ingestion pipeline | Pull transcripts, extract behavioral flags | TB-003 |
| TB-005 | Full reflection schedule | 6mo, 9mo, 12mo, 18mo, 24mo, 36mo intervals | Sprint 3 complete |
| TB-006 | Profile evolution view | Side-by-side stated vs. revealed preference | 3+ reflections with structured_responses |
| TB-007 | Email reflection prompts via Resend | Send email when reflection is due | TE-02, TB-005 |
| TB-008 | LLM interrogation quality gate | Per-turn completion criteria evaluation | Sprint 1 complete |
| TB-009 | Cross-context pattern detection | Patterns spanning decisions AND attempts | TB-001, Sprint 4 complete |
| TB-010 | Reflection-to-pattern indexing | Structure reflection responses for pattern engine | BLND-032 complete |
| TB-011 | Profile versioning (full) | Separate profile_versions table with full history | Sprint 1 complete |
| TB-012 | Richer pattern types | Expand beyond 6 seeded types based on beta data | Sprint 4 complete; beta data |

### Track C — Real-User Readiness (before any public launch)

| ID | Item | Description |
|---|---|---|
| TC-001 | Privacy policy | Data categories, retention periods, third-party processors |
| TC-002 | Consent flow | Explicit consent on sign-up for sensitive data collection |
| TC-003 | Data retention policy | 3 years from last activity (proposed) — must be confirmed by legal |
| TC-004 | Right to erasure | Account deletion flow with confirmed cascade delete |
| TC-005 | Security audit | Before public launch |
| TC-006 | Legal review | Before public launch |
| TC-007 | Production access controls | DB access restricted to app service account; no developer direct access |
| TC-008 | Key rotation procedures | Document and schedule API key rotation |

### Technical Debt

| ID | Item | Fix When |
|---|---|---|
| TD-001 | chosenOptionId FK not enforced in Drizzle | Before Track B (integrity risk grows as data accumulates) |
| TD-002 | Calibration field semantics undefined | Before Track B (product must define formula) |
| TD-003 | AppShell onboarding gate is client-side only | Should be server-enforced; medium risk for private beta |
| TD-004 | No automated regression suite beyond E2E | Before public launch |
| TD-005 | Pattern context injection reads dismissed alerts | After Sprint 4 — clarify: inject all patterns or only active? |
| TD-006 | decisionContext field on users (legacy) | Can be removed once profile_answers is in production use |

---

## 11. Traceability Matrix

| FR ID | Requirement | Story ID(s) | Status |
|---|---|---|---|
| FR-001 | Onboarding ≤15 minutes | BLND-010 | Sprint 1 |
| FR-002 | Profile fields (7 questions) | BLND-010 | Sprint 1 |
| FR-003 | Profile versioning (partial MVP: snapshot) | BLND-011 | Sprint 1 |
| FR-004 | Profile snapshot at decision time | BLND-011 | Sprint 1 |
| FR-005 | Minimum response length enforcement | BLND-013 | Sprint 1 |
| FR-006 | Minimum 5 interrogation questions | BLND-014 | Sprint 1 |
| FR-007 | Counter-consideration per session | BLND-015 | Sprint 1 |
| FR-008 | Circular reasoning detection | BLND-015 | Sprint 1 |
| FR-009 | Structured session summary | BLND-012 | Sprint 1 |
| FR-010 | Draft save and resume | BLND-016 | Sprint 1 |
| FR-011 | Profile personalizes interrogation | BLND-011 | Sprint 1 |
| FR-012 | Interrogation + manual entry | BLND-021 | Sprint 2 |
| FR-013 | Decision entry fields (name, options, tags) | BLND-021, BLND-025 | Sprint 2 |
| FR-014 | Decision log timeline view | BLND-020 | Sprint 2 |
| FR-015 | Edit option data | BLND-022 | Sprint 2 |
| FR-016 | Append-only notes | BLND-023 | Sprint 2 |
| FR-017 | In-app notification 1mo/3mo | BLND-030, BLND-031 | Sprint 3 |
| FR-018 | Structured reflection questions | BLND-032 | Sprint 3 |
| FR-019 | Free-form reflection | BLND-033 | Sprint 3 |
| FR-020 | Lock and unlock | BLND-024 | Sprint 2 |
| FR-021 | Pattern alert at interrogation start | BLND-041 | Sprint 4 |
| FR-022 | Pattern alert includes reflection outcome | BLND-041 | Sprint 4 |
| FR-023 | Dismiss pattern alert | BLND-042 | Sprint 4 |
| FR-024 | Manual entries lower confidence | BLND-021 (source flag; weight = P1) | Sprint 2 |
| FR-025 | Manual entries no auto-reflection | BLND-021 | Sprint 2 |

**Coverage:** 25 / 25 FRs covered. ✓

---

## 12. Delivery Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RISK-01 | handleSave refactor (BLND-012) is more complex than estimated — session ID tracking in React state is entangled with useChat | Medium | High | Spike first day of Sprint 1; if blocked, create a simpler synchronous save flow and defer streaming optimization |
| RISK-02 | Counter-consideration quality (BLND-015) fails manual rubric — prompt doesn't feel precise | Medium | Critical | Run prompt tests in Sprint 1; iterate; do not proceed to Sprint 2 until 2/3 sessions pass |
| RISK-03 | Vercel Cron not available on current plan tier | Low | High | Verify plan before Sprint 3 starts; fallback: GitHub Actions scheduled workflow calling cron endpoint |
| RISK-04 | Pattern engine produces no alerts in 20-50 user beta (too few sessions per user to reach threshold) | High | Medium | Lower thresholds in staging for pre-beta smoke test; communicate to beta users that patterns emerge over 2-3 decisions |
| RISK-05 | Resend account misconfiguration delays auth (BLND-005) | Low | High | Configure and test on Day 1 of Sprint 0; have fallback domain verified in Resend |
| RISK-06 | Neon or PostgreSQL provisioning takes >1 day | Low | High | Use local PG in dev initially; Neon provisioning is <10 min if account exists |
| RISK-07 | Draft resume (BLND-016) requires complex state reconstruction from DB | Low | Medium | Simplify: on resume, load turns from DB into useChat messages state; test with 10-turn session |
| RISK-08 | August 14 deadline leaves no buffer for Sprint 1 quality gate failure | Medium | High | If quality gate fails after Sprint 1, rescope Sprint 2–4 to essentials; delay pattern engine to post-beta |
| RISK-09 | LLM cost exceeds budget during beta if users run many long sessions | Low | Medium | Set maxTokens=400 per turn (already set); add daily per-user limit (5 sessions/day) |
| RISK-10 | chosenOptionId FK not enforced — data integrity drift before TD-001 is fixed | Low | Medium | Monitor via db:studio during beta; fix before Track B ships |

---

## 13. Overall Readiness

**Implementation readiness score: 4.0 / 5**

| Dimension | Score | Notes |
|---|---|---|
| Architecture clarity | 5/5 | Pass 2 resolved all major architecture questions. Eight ADRs documented. |
| Backlog completeness | 4/5 | 25 FRs covered; 38 stories written; one open decision (min response length) needs Product confirmation. |
| Story quality | 4/5 | All stories have GWT ACs and DoD. BLND-012 is large (8 pts) and could be split further. |
| Task breakdown | 4/5 | ~178 tasks. Prompt engineering tasks (BLND-015) are hard to estimate reliably. |
| Traceability | 5/5 | Every FR mapped to at least one story. Every story mapped to FRs and architecture components. |
| Testing coverage | 3/5 | Test tasks specified per story; E2E suite planned; no tests exist yet. Testing is the weakest dimension. |
| Sprint sequencing | 5/5 | Dependency order is correct. Interrogation ships first. Quality gate after Sprint 1 prevents compounding risk. |
| Delivery confidence | 4/5 | 6 sprints over ~25 working days to August 14 is tight but achievable if Sprint 1 quality gate passes. |

**The one genuine blocker before engineering can begin:** Product must confirm the minimum response length (FR-005). The backlog uses 50 characters as a placeholder. Everything else can start immediately.

**Go / No-Go for handing to engineering:** **Go**, with the following conditions:
1. Product confirms minimum response length within 24 hours of Sprint 0 start
2. DATABASE_URL and AUTH_RESEND_KEY are configured on Sprint 0 Day 1
3. Vercel plan tier supports at least 1 daily cron job (verify before Sprint 3 starts)
4. Sprint 1 quality gate (counter-consideration rubric) must pass before Sprint 2 begins
