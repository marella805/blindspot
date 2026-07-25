# Blindspot — Pass 4: Implementation Readiness Review

**Date:** 2026-07-17  
**Reviewer role:** Independent Principal Engineer, Distinguished Solution Architect, Technical Program Manager  
**Document reviewed:** `docs/analysis/pass-3-implementation-backlog.md`  
**Baseline:** `docs/analysis/pass-2-solution-definition.md`  
**Stance:** Critical. Assume mistakes, omissions, and overengineering may exist.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Overall Health Score](#2-overall-health-score)
3. [Architecture Review](#3-architecture-review)
4. [Backlog Review](#4-backlog-review)
5. [Story Review](#5-story-review)
6. [Dependency Review](#6-dependency-review)
7. [Sprint Review](#7-sprint-review)
8. [Missing Work](#8-missing-work)
9. [Unnecessary Work](#9-unnecessary-work)
10. [Overengineering Review](#10-overengineering-review)
11. [Technical Debt Review](#11-technical-debt-review)
12. [Delivery Risks](#12-delivery-risks)
13. [Recommendations](#13-recommendations)
14. [Go / No-Go Assessment](#14-go--no-go-assessment)

---

## 1. Executive Summary

The Pass 3 backlog is structurally sound and represents a serious attempt at complete coverage. All 25 functional requirements are mapped. The sprint sequence respects the correct dependency order — interrogation before log before reflection before pattern. The four confirmed blocking gaps from Pass 2 are each addressed by a named story. The traceability matrix is complete.

However, six issues require action before handing to engineering:

1. **BLND-012 is too large.** At 8 story points with 9 sub-tasks, it contains at least three independently shippable units of work. Splitting it is not optional — it is the highest-risk story in the backlog and its size makes failure detection slow.

2. **The interrogation termination decision is still not resolved.** Pass 2 deferred it to "minimum 5 turns + user discretion." Pass 3 spreads the implementation across BLND-012, BLND-013, and BLND-014 without ever writing down the termination rubric as a testable acceptance criterion. A developer building BLND-015 (counter-consideration prompt) currently has no definition of "session complete" to work against.

3. **BLND-015 (prompt engineering) has no measurable acceptance criteria.** "At least 2/3 sessions pass" is not a testable AC for a story — it is a manual QA activity. The prompt engineering work should be a technical enabler (TE) with a formal quality gate, not a user story with ambiguous ACs.

4. **The reflection scheduler has a missing edge case:** what happens when a user completes onboarding and immediately logs a decision with a past date? The 1-month reflection would be scheduled for a date in the past, meaning the cron would fire it immediately on first run. This is untested and unaddressed in BLND-030.

5. **Pattern engine integration with reflection outcomes (FR-022) is under-specified.** BLND-041 says "reflection outcome quote is displayed." But the data path is not defined: the GET /api/patterns endpoint must join `patternAlertDecisions → decisions → reflections` to fetch reflection content. This join is complex and is mentioned in one task line (BLND-041-T-1) with no schema guidance or query specification.

6. **No error recovery for a failed summary generation mid-session.** If the LLM fails after turns are persisted but before the recommendation is written, the decision is permanently in "draft" state with no way for the user to regenerate the summary. BLND-012 mentions "retry" but no API route or UI state for retry is defined.

None of these are blockers that require architecture changes. All can be resolved with story splits, AC rewrites, and one new story. Engineering can start Sprint 0 immediately.

---

## 2. Overall Health Score

| Dimension | Score | Evidence |
|---|---|---|
| Architecture | 4.5/5 | Pass 2 ADRs are sound. Schema additions are precise. LLM model allocation is appropriate. One gap: chosenOptionId FK deferred is a known integrity risk. |
| Backlog completeness | 4/5 | All 25 FRs covered. Missing: summary retry (BLND-012 gap), past-date reflection scheduling edge case (BLND-030 gap), GET /api/patterns join complexity (BLND-041 gap). |
| Story quality | 3.5/5 | BLND-012 too large. BLND-015 has untestable ACs. Most other stories are INVEST-compliant. |
| Task quality | 4/5 | Tasks are specific and actionable. Some AI/LLM tasks (BLND-015 prompt refinement) lack concrete success criteria. |
| Traceability | 5/5 | Every FR appears in the traceability matrix. Every story has Traceability field. |
| Testing | 3/5 | Tests are specified per story but none exist. E2E test (BLND-050) is in Sprint 5 — too late. Interrogation quality testing needs more rigor. |
| Security | 4/5 | Auth, ownership checks, CRON_SECRET, cost ceiling all addressed. PII in logs addressed. Track C correctly deferred. |
| Operational readiness | 3.5/5 | Cron, observability, and deployment covered. Rollback procedure documented (Vercel). DB migration rollback is manual — needs more detail. |
| Maintainability | 4/5 | Stories are decomposed logically. Deferred backlog is clearly separated. Technical debt identified. |
| Delivery confidence | 3.5/5 | 25 working days to August 14 is achievable IF Sprint 1 quality gate passes. The 8-point BLND-012 is the primary schedule risk. |
| **Overall** | **3.8 / 5** | Ready to start with targeted corrections. |

---

## 3. Architecture Review

### Confirmed sound

- Three-tier LLM allocation (Opus streaming → Opus generateObject → Haiku classification) is appropriate and already partially implemented. Cost profile is sensible.
- Schema additions are at the column level — concrete, not abstract. Engineers do not need to make design decisions.
- Profile as JSONB snapshot on interrogation sessions (not a separate versions table) is the right MVP call. Avoids join complexity without sacrificing the data.
- Async fire-and-forget pattern classification (ADR-003) is correct. Classification does not block the session completion response.
- Vercel Cron for reflection scheduler is appropriate for 20–50 users. Daily at 08:00 UTC is fine.

### Architecture gaps not resolved in Pass 3

**Gap A: Summary retry path.** Pass 2 (ADR-004) states that if summary generation fails, the decision remains in draft state and the user can retry. Pass 3 mentions this in BLND-012 error handling but defines no API route for retry. The turns are already persisted (POST /api/interrogation/:sessionId/turns). The summary endpoint (POST /api/interrogation/:sessionId/summary) can simply be called again — it is already idempotent in its DB write (it always inserts a new row). The gap is in the UI: the user in "saving" state with a failed summary has no UI affordance to retry. This needs a story, not a new architecture decision.

**Gap B: GET /api/patterns join complexity.** FR-022 requires pattern alerts to include reflection outcome data from contributing decisions. The current GET /api/patterns implementation (from the repo) returns alerts with decisions via the junction table but does NOT join reflections. The required join path is: `patternAlerts → patternAlertDecisions → decisions → reflections (where completed_at IS NOT NULL)`. This is a non-trivial query that needs to be specified before BLND-041 is estimated. The task "BLND-041-T-1: Update GET /api/patterns to include contributing decisions and their reflection outcomes" understates the complexity.

**Gap C: Past-date reflection scheduling.** When a user creates an interrogation decision today but names it with a date from last year (or simply creates a decision and the scheduled_for = today + 30 days but then creates the decision on a device with clock skew), the cron could fire a reflection that was due in the past immediately. The current cron query (`scheduled_for <= today`) will catch it on the next run. This is acceptable behavior but should be documented as a known limitation, not silently handled.

**Gap D: Coaching style vs. push preference conflict.** BLND-011 notes an unresolved Product question: "If push=5 (adversarial) in the profile, does coaching_style selection override push?" Pass 3 defaults to "coaching_style selection wins, push is informational" but this decision is not documented in a story or ADR. An engineer implementing BLND-011 will encounter this and may make a different choice.

### Verdict
Architecture is implementation-ready. Gaps B and D require specification before BLND-011 and BLND-041 enter development. Gaps A and C require a new story and a documentation update respectively.

---

## 4. Backlog Review

### Hierarchy validation

| Level | Count | Issues |
|---|---|---|
| Initiatives | 8 | Correct. No orphaned initiatives. |
| Epics | 14 | EP-09 (LLM Provider Integration) and EP-10 (Authentication) could be merged into EP-01 (Technical Foundations) — they are enablers, not independent epics. Minor; no engineering impact. |
| Features | 28 | FT-06-1 (Pattern classification) and FT-06-2 (Threshold logic) are tightly coupled and should be a single feature. Separating them implies they could ship independently; they cannot. |
| User Stories | 38 | BLND-012 must be split (see Section 5). All other stories are appropriately sized. |
| Technical Enablers | 7 | All appropriate. TE-06 (Playwright) placed in Sprint 5 is late — see Sprint Review. |

### Coverage check

- All 25 FRs appear in at least one story: ✓
- All Pass 2 architecture components have implementation stories: ✓ (interrogation, pattern engine, reflection scheduler, profile service, notification badges, auth, observability, deployment)
- All Pass 2 workflows have implementation coverage: ✓ (Workflows 1–8 covered across Sprint 0–4)
- Track C items not present in MVP backlog: ✓
- Track B items clearly deferred: ✓

### Missing stories

| ID | Description | Severity |
|---|---|---|
| MS-01 | Summary regeneration / retry UI state | High — user is permanently stuck in draft with no recovery path |
| MS-02 | GET /api/patterns: reflection outcome join query | Medium — FR-022 cannot be implemented without this; BLND-041-T-1 understates the work |
| MS-03 | Past-date reflection scheduling behavior documented | Low — edge case; acceptable to document rather than build a workaround |
| MS-04 | Coaching style vs. push preference resolution documented in code | Low — prevents engineer from silently making wrong choice |

---

## 5. Story Review

### Stories to split

**BLND-012 — Fix interrogation save flow (8 points)**

This is three stories:

| New ID | Title | Points | Sprint | Dependencies |
|---|---|---|---|---|
| BLND-012A | Track session ID from interrogation first message | 2 | Sprint 1 | BLND-011 |
| BLND-012B | Create POST /api/interrogation/:sessionId/turns endpoint | 3 | Sprint 1 | BLND-003 (schema), BLND-012A |
| BLND-012C | Wire handleSave: upload turns → call summary → display result → navigate | 3 | Sprint 1 | BLND-012A, BLND-012B |

Splitting immediately: reduces schedule risk, allows parallel work (12A and 12B have different owners — frontend vs. backend), enables independent testing.

**Why it matters:** BLND-012 is the highest-risk delivery item. An 8-point story with a complex React state change (session ID tracking in useChat) AND a new API endpoint AND a UI flow change AND a summary route refactor is too much. A failure in any piece blocks the whole story. Split it.

---

### Stories to merge

**BLND-041 + BLND-042 — Pattern alert surfacing + dismissal (3 + 1 = 4 points)**

These can be merged. Pattern alert surfacing without dismissal is incomplete as a user-facing feature. They share the same UI component, the same API route, and the same acceptance scenario. Combined they are 4 points — appropriately sized.

**BLND-024 — Lock and unlock (3 points)**

Lock and unlock could be split (lock = 1 pt, unlock = 2 pt — unlock requires a new route). However, at 3 points total they are appropriately sized. Keep together but ensure BLND-024-T-1 (DELETE /lock route) is the first task.

---

### Stories with problematic acceptance criteria

**BLND-015 — LLM system prompt: counter-consideration and circular reasoning**

Current AC includes: "When AI evaluates" — this is not testable in an automated test. The "evaluation" is the LLM, which is non-deterministic.

**Problems:**
1. "At least 2/3 sessions pass" is a QA gate, not an AC. It belongs in EP-14 (Manual Testing), not BLND-015.
2. "Given user provides identical reasoning twice" — how does the test verify the AI detected it? The AI response is non-deterministic.
3. BLND-015 should be a **Technical Enabler** (TE-08: Interrogation Prompt Engineering) with a defined rubric document and a manual-test gate. It is not a user story.

**Recommendation:** Convert BLND-015 to TE-08 with the following outputs: (1) Written prompt for each coaching style; (2) Written quality rubric in docs/testing/; (3) Manual test with 3 sessions and documented results. Remove BLND-015 from the user story list. Move quality gate to Sprint 1 Definition of Done.

**BLND-011 — Profile personalization of interrogation**

AC: "Given push=5 (adversarial) in the profile, when the interrogation runs, then the coaching style applied is 'critic' regardless of coaching_style selection (or: coaching_style selection overrides push — Product to confirm; default: coaching style selection wins, push is informational)"

This is an **open decision embedded in an acceptance criterion**. An engineer picking this up cannot write the code without a decision. 

**Recommendation:** Before BLND-011 enters development, Product must answer: "Does push=5 override coaching_style selection, or is push informational only?" Document the answer and rewrite the AC without the conditional.

---

### Stories with missing error handling

**BLND-030 — Reflection scheduling and Vercel Cron**

Missing: What happens if the reflections table has a row with `scheduled_for` = a date in the past (created from a manual decision where user entered a historical date, or from a future migration issue)? The cron will fire immediately on next run. This is acceptable but must be a documented known behavior.

Also missing: the cron route error response when `Authorization` header is present but incorrect. The story says "CRON_SECRET checked" but BLND-030-T-8 tests "unauthorized request → 401." Verify: Vercel's cron service sends `Authorization: Bearer <value>` — the route must parse and validate this header, not just check if it exists.

**BLND-040 — Pattern alert threshold logic fix**

Missing: What happens to existing `patternAlertDecisions` rows that were inserted by the old buggy code (which created alerts on first detection)? The fix changes the creation logic going forward but does not address pre-existing data. For the private beta with 20–50 users, this is unlikely to matter (fresh DB), but the migration guide should note: "Run this story against a fresh DB or manually review existing patternAlerts for pre-threshold entries."

---

### Stories that are correctly sized and well-written

BLND-001, BLND-004, BLND-005 — Sprint 0 stories are appropriately small and actionable.
BLND-010 — Well-specified. ACs are testable. Error handling is clear.
BLND-020 — Good. Empty state and type labels are explicitly called out.
BLND-021 — Critical bug fix (FR-025) correctly identified and tested with regression.
BLND-030 — Comprehensive. Idempotency, cron security, and skip logic all addressed.
BLND-040 — Threshold logic fix is clearly specified with before/after behavior.

---

## 6. Dependency Review

### Critical Path

```
BLND-001 (env config)
  └── BLND-002 (schema Phase 1)
  │     └── BLND-010 (profile persistence)
  │     │     └── BLND-011 (profile injection)
  │     │           └── BLND-012A (session ID tracking)
  │     │                 └── BLND-012B (turns endpoint)
  │     │                       └── BLND-012C (handleSave wiring)
  │     │                             └── BLND-020 (log timeline)
  │     │                             │     └── BLND-021 (manual entry)
  │     │                             │     └── BLND-023 (notes)
  │     │                             │     └── BLND-024 (lock/unlock)
  │     │                             └── BLND-030 (reflection scheduling)
  │     │                                   └── BLND-032 (reflection response)
  │     │                                   └── BLND-034 (dismissal)
  │     │                                         └── BLND-040 (pattern threshold fix)
  │     │                                               └── BLND-041+042 (pattern surfacing)
  └── BLND-003 (schema Phase 2)
  │     └── BLND-012B (turns endpoint)
  │     └── BLND-023 (notes)
  └── BLND-005 (auth)
```

**Critical path length:** BLND-001 → BLND-002 → BLND-010 → BLND-011 → BLND-012A → BLND-012B → BLND-012C → BLND-021 → BLND-030 → BLND-040 → BLND-041 = **11 sequential stories**. This is achievable in 25 working days if Sprint 1 is not blocked by quality issues.

### Parallel work opportunities

These can run in parallel with the critical path:
- BLND-003 (new tables) can run in parallel with BLND-010
- BLND-005 (auth) can run in parallel with BLND-002
- BLND-004 (seed) can run immediately after BLND-002
- BLND-013 and BLND-014 can run in parallel with BLND-012A
- BLND-022 (option editing) and BLND-025 (tags) can run in parallel with BLND-021

### Hidden dependencies

**BLND-041 depends on BLND-032 more than Pass 3 acknowledges.** FR-022 requires pattern alerts to include reflection outcome data. But if BLND-032 (structured reflection responses) ships after BLND-041, the pattern alert UI will show empty outcome data for all beta users. This is technically acceptable (outcome data is optional in the alert) but should be documented in BLND-041's ACs: "If no completed reflections exist for contributing decisions, outcome section is absent."

**BLND-030 depends on Vercel plan tier.** This is noted in RISK-03 but is not tracked as a formal dependency in the sprint plan. If Vercel's free tier limits cron to 1 job/day but not to the specific schedule, it may still work. But if the free tier has no cron support at all, Sprint 3 is blocked. **Verify before Sprint 3 starts — ideally in Sprint 0.**

**BLND-015 (prompt engineering) is a dependency for BLND-012C, not just a parallel story.** If the counter-consideration prompt is not good enough, the summary that BLND-012C generates from it will also be poor. The Sprint 1 quality gate exists for this reason, but the dependency should be made explicit: BLND-012C's acceptance criteria include "session summary is generated and stored" — but a summary generated from a bad prompt is a bad summary. The quality gate must evaluate prompt quality before BLND-012C is considered done.

### No circular dependencies detected.

---

## 7. Sprint Review

### Sprint 0 (2 days) — Assessment: Correct

Two days is tight but achievable if env vars are set up same-day. DATABASE_URL (Neon provisioning) may take up to 2 hours. AUTH_RESEND_KEY requires a Resend account with a verified domain — if the domain `blindspot.app` is not yet verified in Resend, this could take 24–48 hours for DNS propagation. **Risk:** Auth may not work until Day 2 of Sprint 0.

**Recommendation:** Add TE-09 to Sprint 0: "Verify Resend domain verification and Vercel plan tier for cron" — this unblocks both BLND-005 and BLND-030 and takes 2 hours.

### Sprint 1 (5 days) — Assessment: Too heavy

Sprint 1 contains 7 stories: BLND-010 (5 pts), BLND-011 (3 pts), BLND-012 (8 pts → split into 12A+12B+12C: 2+3+3=8 pts), BLND-013 (2 pts), BLND-014 (2 pts), TE-08 (prompt engineering, ~3 pts), BLND-016 (3 pts). That is approximately **26 points** for a 5-day sprint for what appears to be a 1-2 engineer team.

At a sustainable velocity of ~10–12 points/day/engineer, Sprint 1 requires at least 2 engineers to complete on time.

**Recommendation:** Move BLND-016 (draft save and resume) to Sprint 2. It has no downstream dependencies in Sprint 1. Draft state is inferred automatically from absence of recommendation — the log display can show it in Sprint 2.

**Revised Sprint 1:** BLND-010, BLND-011, BLND-012A, BLND-012B, BLND-012C, BLND-013, BLND-014, TE-08 = **~22 points**. Still heavy for a solo engineer.

### Sprint 2 (5 days) — Assessment: Reasonable

6 stories. BLND-020 (3), BLND-021 (3), BLND-022 (2), BLND-023 (2), BLND-024 (3), BLND-025 (1) = 14 points. This is correct for a 5-day sprint. Moving BLND-016 here adds 3 points (17 total) — still fine.

### Sprint 3 (5 days) — Assessment: Correct

5 stories: BLND-030 (5), BLND-031 (2), BLND-032 (3), BLND-033 (2), BLND-034 (1) = 13 points. Well-paced.

**Issue:** The quality gate should be moved to Sprint 3 entry. After Sprint 1, the team must manually run 3 interrogation sessions against the rubric BEFORE Sprint 2 begins. Pass 3 places this gate "after Sprint 1" but does not allocate time for it in the sprint plan. Allow 0.5 days at the start of Sprint 2 for quality gate execution.

### Sprint 4 (5 days) — Assessment: Underpacked

3 stories: BLND-040 (5), BLND-041+042 merged (4) = 9 points. At 5 days, this is very light. Sprint 4 has slack. Options:
- Move BLND-050 (E2E test) into Sprint 4 — it can start once Sprint 2 is done
- Add the missing story for summary retry (MS-01) to Sprint 4

**Recommendation:** Move BLND-050 to Sprint 4. Reduce Sprint 5 from 3 days to 1–2 days (just manual testing and sign-off).

### Sprint 5 (3 days) — Assessment: Should shrink

With BLND-050 moved to Sprint 4, Sprint 5 contains only BLND-051 (3 pts), BLND-052 (3 pts), BLND-053 (1 pt) = 7 points. This can be done in 2 days, not 3. Sprint 5 should be 2 days, freeing 1 day of buffer before August 14.

### Sprint 6 (deferred) — Track B only. Correctly deferred.

### Overall schedule verdict

**25 working days, 2 engineers: Achievable.**  
**25 working days, 1 engineer: Very risky.** Sprint 1 at 22+ points is not feasible solo. Interrogation core is where most of the complexity sits.

**If solo:** Compress Sprint 1 to interrogation essentials (BLND-012A, 12B, 12C, BLND-013, BLND-014) and defer BLND-010 (profile full persistence) to Sprint 1.5. The product still works day one — generic interrogation (no profile) is better than no interrogation. Profile injection (BLND-011) follows immediately after.

---

## 8. Missing Work

| ID | Description | Severity | Recommended Sprint | Source Evidence |
|---|---|---|---|---|
| MS-01 | Summary retry story: if summary generation fails after turns are persisted, user needs a "Try again" button that re-calls POST /api/interrogation/:sessionId/summary | High | Sprint 4 (has slack) | BLND-012 error handling section; Pass 2 ADR-004 |
| MS-02 | GET /api/patterns reflection outcome join: specify the Drizzle query joining patternAlerts → patternAlertDecisions → decisions → reflections; add to BLND-041-T-1 | Medium | Sprint 4 | FR-022; BLND-041 task underspecification |
| MS-03 | Coaching style vs. push preference decision: Product must answer and engineer must implement before BLND-011 starts | Medium | Sprint 0 (Product answer) / Sprint 1 (implementation) | BLND-011 AC ambiguity |
| MS-04 | Vercel plan tier cron verification: add to Sprint 0 as a discovery task | High (for Sprint 3) | Sprint 0 | RISK-03 |
| MS-05 | Past-date reflection scheduling: document behavior; add test to BLND-030 | Low | Sprint 3 | Gap C in Architecture Review |
| MS-06 | BLND-040 data migration note: document behavior of pre-existing patternAlerts rows from buggy code | Low | Sprint 4 | BLND-040 story; DB migration guide |
| MS-07 | TE-08 (prompt engineering) added as Technical Enabler | Medium | Sprint 1 | BLND-015 AC analysis — should be enabler, not story |
| MS-08 | TE-09: Domain verification and plan tier check | Medium | Sprint 0 | Sprint 0 assessment |

---

## 9. Unnecessary Work

| Story/Task | Assessment | Recommendation |
|---|---|---|
| BLND-053 (achievements display and documentation) | Achievements are a cosmetic feature with no FR traceability and unclear business rationale. Documenting a system without understanding its purpose is waste. | Defer to Track B. Remove from Sprint 5. If beta users ask about achievements, document then. |
| BLND-025 (decision tags) | Tags have FR-013 traceability but FR-013 says "name, date, options, tags" — tags are mentioned as a list item, not a dedicated requirement. The schema column exists. Adding tag input UI in Sprint 2 consumes a story point when the product could launch without tag UI entirely. | Defer tag UI to Sprint 5 polish. Schema column is already added in BLND-002. |
| FT-01-3 (pattern type seed) as a separate Feature | This is a single `npm run db:seed` command. It does not need to be a Feature in the Feature Catalog. | Merge into FT-01-1 (Database schema migrations) as a task. Remove as standalone Feature. |
| EP-09 (LLM Provider Integration) as a separate Epic | LLM integration is 3 tasks: verify API key, add cost logging, handle failures. These fit inside EP-01 (Technical Foundations) and EP-03 (Interrogation Core). Creating a separate Epic with its own DoD for what is essentially an enabler is overhead. | Merge EP-09 into EP-01. Reduce Epic count by 1. |
| EP-10 (Authentication) as a separate Epic | Same rationale as EP-09. Authentication is Sprint 0 infrastructure. One story (BLND-005). | Merge EP-10 into EP-01. |

---

## 10. Overengineering Review

### Not overengineered

- **Profile as JSONB**: Correct MVP call. Avoids premature schema normalization.
- **Pattern classification async**: Correct. No user waits for it.
- **Vercel Cron for scheduler**: Simple and appropriate for 20–50 users. Any more sophisticated solution would be overengineering.
- **Interrogation turns stored at save time (not streaming)**: Correct tradeoff. Real-time relay architecture would be significantly more complex for no beta-period benefit.

### Potentially overengineered

**The reflection schedule (6 interval_label values seeded in schema):** The ERD pre-defines 8 interval labels (1mo through 36mo) even though only 1mo and 3mo are implemented in Sprint 3. The enum values exist in the DB but cannot be triggered by any UI or cron logic. This creates dead schema — not harmful, but it means any engineer who looks at `interval_label` enum will wonder what 6mo–36mo is for. **Recommendation:** Add a code comment in schema.ts: "6mo–36mo interval labels are seeded for Track B (full reflection schedule). Only 1mo and 3mo are used in MVP."

**Pattern type detection thresholds in DB (not config):** The `detection_threshold` column on `patternTypes` allows per-pattern threshold configuration. For MVP with 20–50 users, thresholds will need to be adjusted based on beta data — and the only way to do this is a DB update or a re-seed. This is correct for a product that will evolve, but it does mean the threshold is not configurable without a DB write. **Recommendation:** In the seed, set binary_framing and career_over_alignment thresholds to 2 (not 3) for beta — 3 decisions exhibiting the same pattern is statistically meaningful for a 50-user cohort, but 2 will produce more observable alerts during the 4-week beta window. This is a data decision, not an engineering change.

**8 ADRs for a 5-sprint project:** The ADR overhead is appropriate given the AI/LLM complexity and the number of open decisions that existed in Pass 1. Not overengineered.

---

## 11. Technical Debt Review

### Should fix before August 14 private beta

| ID | Item | Risk if Deferred | Effort |
|---|---|---|---|
| TD-003 | Onboarding gate is client-side only | Low for 20-50 known users; high for public launch | 2 hrs — add server redirect in AppLayout |
| TD-000 (new) | Summary retry UI | Users permanently stuck in draft state | 3 hrs — new story MS-01 |

**Note on TD-003:** BLND-010 adds the gate logic, but the current code comment in AppLayout says "handled client-side in AppShell for simplicity." The server-side redirect is more reliable and should be done in BLND-010-T-2. It is not separate technical debt — it is already in the story.

### Can wait until Track B

| ID | Item | Notes |
|---|---|---|
| TD-001 | chosenOptionId FK not enforced in Drizzle | Integrity risk grows slowly; Track B data volume makes it worthwhile |
| TD-002 | Calibration field semantics undefined | Achievements display (BLND-053 deferred) depends on this |
| TD-004 | No automated regression suite beyond E2E | BLND-050 covers primary path; full suite = Track B |

### Can wait until Track C (public launch)

| ID | Item |
|---|---|
| TC-001–TC-008 | All Track C items correctly deferred |

### Never worth fixing

| Item | Reason |
|---|---|
| decisionContext field on users (legacy) | Remove when profile_answers is in production use and decisionContext is confirmed zero-populated. Not worth the migration risk during beta. |
| EP-09 and EP-10 as separate Epics | Document overhead only — no engineering cost to leave them. |

---

## 12. Delivery Risks

Risks from Pass 3 that require updated assessment:

| ID | Risk | Pass 3 Assessment | Updated Assessment |
|---|---|---|---|
| RISK-01 | handleSave complexity | Medium / High | **Elevated to High** after story split analysis. BLND-012A (session ID tracking in useChat) is the unpredictable part. useChat API may not expose sessionId from server response headers in the expected way. Spike on Day 1 of Sprint 1. |
| RISK-02 | Counter-consideration prompt quality | Medium / Critical | **Confirmed Critical**. There is no automated test for this. Manual test is the only signal. If it fails after Sprint 1, the only option is to iterate the prompt and retest — which takes 1–2 days. Allow this buffer. |
| RISK-03 | Vercel Cron plan tier | Low / High | **Upgraded to High** because it is not being verified until Sprint 3. Move verification to Sprint 0. |
| RISK-04 | Pattern engine no alerts in beta | High / Medium | **Confirmed Medium**. Lowering thresholds in staging to 2 (from 3 for binary/career patterns) is the right mitigation. Document for beta users: "Patterns emerge after 2–3 decisions." |
| RISK-08 | No buffer for Sprint 1 quality gate failure | Medium / High | **Confirmed High** if solo engineer. **Medium** if 2 engineers. Quality gate failure is the most likely cause of missing August 14. |

**New risk identified by this review:**

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RISK-11 | useChat session ID tracking is incompatible with current streaming API design — BLND-012A may require re-architecting the interrogation API response format | Medium | High | Spike on Day 1 Sprint 1. Fallback: generate and track sessionId client-side (UUID), send on every message, have server upsert session on first message. |
| RISK-12 | Resend domain verification for blindspot.app delays Sprint 0 auth verification | Medium | High | Start Resend domain setup 48h before Sprint 0. |

---

## 13. Recommendations

**Critical (do before Sprint 0 starts):**

1. **Split BLND-012 into BLND-012A, BLND-012B, BLND-012C** as specified in Section 5. This is the single most important backlog change.

2. **Convert BLND-015 to TE-08** (Technical Enabler: Interrogation Prompt Engineering). Remove it from the user story list. Add its rubric output to Sprint 1 Definition of Done.

3. **Add MS-01 (summary retry story)** to Sprint 4. If summary generation fails, the user has no recovery path today.

4. **Add TE-09 to Sprint 0:** "Verify Resend domain verification and Vercel cron plan tier." Takes 2 hours; prevents Sprint 3 and Sprint 5 from being blocked by infrastructure decisions made too late.

5. **Get Product answer on coaching style vs. push preference** before BLND-011 starts. This is a 1-sentence product decision that must not be made by an engineer.

**High (do before Sprint 1 starts):**

6. **Specify the GET /api/patterns reflection outcome join** as a concrete Drizzle query or at minimum a field list. Add as BLND-041-T-0 (precondition task).

7. **Lower pattern detection thresholds to 2 in beta seed data** (binary_framing, career_over_alignment, authority_deference). Three-decision threshold is too high to observe in a 4-week beta with 20–50 users.

8. **Verify Vercel plan supports cron in Sprint 0** (TE-09). Do not wait until Sprint 3 to discover a plan upgrade is needed.

**Medium (do before Sprint 2 starts):**

9. **Move BLND-016 (draft save and resume) to Sprint 2.** Sprint 1 is already at 22+ points. Draft display requires only a label in the log — the state already exists (decision with no recommendation = draft).

10. **Move BLND-050 (E2E test) to Sprint 4.** Sprint 4 is underpacked. E2E testing can begin once Sprint 2 is complete. This reduces Sprint 5 from 3 to 2 days and adds a buffer day before August 14.

11. **Defer BLND-053 (achievements) entirely.** Achievements have no FR traceability. Documenting an undocumented system creates documentation debt. Defer to Track B when the business rationale is defined.

12. **Add a code comment to schema.ts** explaining the 6mo–36mo interval labels are Track B — prevents engineer confusion.

---

## 14. Go / No-Go Assessment

### "If this backlog were handed to a team of senior engineers tomorrow, what would prevent them from immediately starting implementation?"

**Genuine blockers (things that prevent starting):**

| Blocker | Resolution |
|---|---|
| DATABASE_URL not configured | Must be provisioned before `npm run db:migrate` can run. Engineering cannot start DB work without it. | 
| AUTH_RESEND_KEY not configured | Must be set before auth flow can be tested. Engineering can build without it, but cannot verify. |
| BLND-012 not split | BLND-012 as written is too large for reliable estimation and parallel work. Engineers will argue about who owns which piece. Split it. Takes 15 minutes to rewrite. |
| BLND-015 as a user story with untestable ACs | Engineers cannot write a "done" check for "at least 2/3 sessions pass the rubric." This needs to be a Technical Enabler with manual test gate. |
| Open decision: coaching style vs. push preference | BLND-011 cannot be implemented without this answer. |

**Things that look like blockers but aren't:**

- *Minimum response length undefined:* Default of 50 chars is in the code. Product can change it later with a one-line config update. Not a blocker.
- *Calibration formula undefined:* Not needed until Track B. Not a blocker.
- *Achievements purpose undefined:* Story deferred. Not a blocker.
- *Track C items not implemented:* Correctly deferred. Not a blocker for private beta.
- *Pattern thresholds:* Suggestion to lower to 2 for beta is data tuning, not a code blocker.

### Verdict: **Conditional Go**

The backlog is 90% ready. The five blockers above are 2–4 hours of work total (split BLND-012, convert BLND-015, get Product answer on push preference, provision DB and Resend). None require architecture changes. None require new stories (except MS-01 which is a Sprint 4 item — not Sprint 0).

**Engineering can start Sprint 0 now** while the blockers are resolved in parallel:
- Infrastructure team: provision DB and Resend
- Product: answer coaching style vs. push preference question  
- Backlog owner: split BLND-012, convert BLND-015 to TE-08, add TE-09

**Engineering must not start Sprint 1 until:**
- BLND-012 is split
- BLND-015 is converted to TE-08 with rubric written
- Coaching style vs. push preference is resolved
- DATABASE_URL confirmed working

**Overall readiness score: 3.8 / 5 → Conditional Go**

| Dimension | Score |
|---|---|
| Architecture | 4.5/5 |
| Backlog | 4.0/5 |
| Story quality | 3.5/5 |
| Task quality | 4.0/5 |
| Traceability | 5.0/5 |
| Testing | 3.0/5 |
| Security | 4.0/5 |
| Operational readiness | 3.5/5 |
| Maintainability | 4.0/5 |
| Delivery confidence | 3.5/5 |
| **Overall** | **3.9/5** |

---

*Pass 4 complete. Next step: resolve the 5 pre-Sprint-1 blockers, then hand to engineering.*
