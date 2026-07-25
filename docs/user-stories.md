# Backlog: Decision Intelligence Platform — v1

**Format:** User Stories
**Source:** Decision_Intelligence_Platform_PRD.md
**Total stories:** 15
**Scope:** P0 requirements only (August 14 launch)

---

## Stories

### Story 1: Complete Profile Onboarding

**As a new user, I want to complete a guided profile intake that captures my values, risk tolerance, financial priorities, and career stage so that the interrogation is calibrated to who I am from my very first session.**

Acceptance Criteria:
- [ ] New user is directed to profile onboarding before accessing any other feature — it cannot be skipped
- [ ] Profile captures: top 5 ranked values, risk tolerance (structured response), financial situation, work-life weighting, career stage, and geographic/dependency constraints
- [ ] User can complete onboarding in ≤15 minutes
- [ ] Profile is saved and accessible from account settings after completion
- [ ] Questions feel behavioral, not categorical (e.g., "Describe a time you turned down an opportunity — what was the reason?" rather than "Rank these values")

Priority: P0 | Effort: M | Dependencies: None

---

### Story 2: Profile Personalizes Interrogation Questions

**As a user who has completed onboarding, I want my interrogation session to reference my profile data so that the questions feel specific to my situation rather than generic.**

Acceptance Criteria:
- [ ] Interrogation includes at least one direct reference to the user's top-ranked value per session (e.g., "You said financial stability is your top value — how does this option compare to your baseline?")
- [ ] If the user's profile indicates high risk aversion, the interrogation surfaces a risk-related counter-consideration
- [ ] Questions do not repeat profile-collection questions already answered during onboarding
- [ ] Profile data in use at session time is timestamped so that if the profile is later edited, the original session context is preserved

Priority: P0 | Effort: M | Dependencies: Story 1

---

### Story 3: Edit Profile After Onboarding

**As a returning user, I want to update my profile to reflect how my values or circumstances have changed so that future interrogations remain accurate.**

Acceptance Criteria:
- [ ] User can access and edit all profile fields from account settings at any time
- [ ] Each edit is timestamped; prior versions are preserved
- [ ] Editing the profile does not retroactively alter summaries from past interrogation sessions
- [ ] User sees a confirmation that changes will apply to future sessions, not past ones

Priority: P0 | Effort: S | Dependencies: Story 1

---

### Story 4: Start a New Decision Interrogation

**As a user facing a high-stakes decision, I want to begin a Socratic questioning session so that I can stress-test my reasoning before committing.**

Acceptance Criteria:
- [ ] User can initiate a new interrogation from the home screen or decision log
- [ ] User names the decision and identifies the options being considered before questioning begins
- [ ] Session opens with an open-ended question (not a form field)
- [ ] User can see progress through the session (e.g., "Question 3 of at least 5")
- [ ] User cannot submit a response shorter than a defined minimum length without a prompt to expand

Priority: P0 | Effort: L | Dependencies: Story 1

> **Spike required:** Interrogation termination criteria must be defined before this story can be estimated. What signal indicates the user has reached a defensible position vs. simply typed enough words?

---

### Story 5: System Challenges Weak or Circular Reasoning

**As a user mid-interrogation, I want the system to push back when my reasoning is weak or circular so that I cannot complete the session with a rationalization.**

Acceptance Criteria:
- [ ] System detects when a follow-up response restates prior reasoning (circular) and explicitly prompts: "You've made this point before — can you offer a different angle?"
- [ ] System issues at least one counter-consideration per session specific to the decision and user profile — not a generic prompt
- [ ] System does not accept "I don't know" or single-sentence deflections without a follow-up probe
- [ ] User can flag a challenge as "not applicable" with a required explanation — the flag and explanation are logged
- [ ] The quality bar for a counter-consideration: it must name a specific tradeoff the user has not yet addressed, not a category they already covered

Priority: P0 | Effort: L | Dependencies: Story 4

> **Design note:** This is the highest-risk prompt engineering story. The counter-consideration must feel precise, not canned. Recommend user-testing this story in isolation before wiring it into the full session flow.

---

### Story 6: System Generates a Structured Session Summary

**As a user who has completed an interrogation, I want a structured summary of my reasoning so that I have a record I can return to when the outcome plays out.**

Acceptance Criteria:
- [ ] Summary is generated automatically when the session reaches a completion state
- [ ] Summary includes: decision name, options considered, option chosen (or deferred), top 3 factors articulated, key tradeoff acknowledged, and any counter-considerations the user addressed
- [ ] Summary is stored permanently in the decision log entry
- [ ] User can view the summary immediately after session ends and at any time from the log
- [ ] Summary is read-only — user cannot edit the AI-generated summary (but can add a separate note)

Priority: P0 | Effort: M | Dependencies: Story 4, Story 5

---

### Story 7: Save and Resume a Draft Interrogation

**As a user who is not ready to finish a session, I want to save my progress and return to it later so that I do not have to rush to a conclusion I am not confident in.**

Acceptance Criteria:
- [ ] User can save a draft at any point during the session
- [ ] Draft is accessible from the home screen and the decision log
- [ ] On return, session resumes from the last question answered with full prior context preserved
- [ ] User can have only one active draft per decision at a time
- [ ] Draft entries are labeled as incomplete in the decision log and are not shown as completed entries

Priority: P0 | Effort: S | Dependencies: Story 4

---

### Story 8: View Decision Log Timeline

**As a user with logged decisions, I want to see all my past entries in a timeline so that I can review my decision history at a glance.**

Acceptance Criteria:
- [ ] Decision log displays all completed entries in reverse chronological order
- [ ] Each entry shows: decision name, date, option chosen, and entry type (interrogation session / manual entry / draft)
- [ ] User can tap or click any entry to open the full detail view
- [ ] Draft entries are shown separately from completed entries
- [ ] Empty state explains what the log is for and prompts the user to log their first decision

Priority: P0 | Effort: S | Dependencies: Story 6

---

### Story 9: Add Option-Level Data to a Decision Entry

**As a user comparing concrete options, I want to input key data about each option so that I can weigh them against my profile and refer back to the numbers later.**

Acceptance Criteria:
- [ ] User can add custom key/value data fields to any option within a decision entry (e.g., "Salary: $95k", "Location: Remote", "Hours: 50/week")
- [ ] Fields are user-defined — no fixed schema is required
- [ ] Data fields can be added during the interrogation flow or edited from the entry detail view afterward
- [ ] Option data is visible alongside the session summary in the entry detail view
- [ ] At least 2 options can be added per entry; no hard upper limit

Priority: P0 | Effort: S | Dependencies: Story 8

---

### Story 10: Create a Manual Decision Entry

**As a user logging a past decision without running an interrogation, I want to create an entry manually so that historical decisions are available to the pattern engine.**

Acceptance Criteria:
- [ ] User can create a manual entry from the decision log with: decision name, date, options considered, option chosen, and a free-text reasoning field
- [ ] Manual entries are labeled "manually logged" in the log, distinct from interrogation entries
- [ ] Manual entries are visible to the pattern engine but flagged internally as lower confidence than interrogation entries
- [ ] User can optionally add option-level data fields to manual entries
- [ ] Manual entry creation does not automatically start a reflection prompt schedule — user must opt in explicitly

Priority: P0 | Effort: S | Dependencies: Story 8

---

### Story 11: Add a Free-Form Note to an Existing Entry

**As a user with logged decisions, I want to add a note to an entry at any time so that I can capture new context as it emerges — even outside a scheduled reflection.**

Acceptance Criteria:
- [ ] User can add a timestamped note to any completed decision entry from the detail view
- [ ] Notes are appended in chronological order; existing notes are not editable or deletable
- [ ] Notes are visually distinct from the AI-generated session summary and from structured reflection responses
- [ ] Notes are accessible to the pattern engine as additional context
- [ ] No minimum length requirement for notes

Priority: P0 | Effort: S | Dependencies: Story 8

---

### Story 12: Receive and Respond to Scheduled Reflection Prompts

**As a user who logged a decision 1 or 3 months ago, I want to receive a prompt asking how it turned out so that the system can build outcome data and close the loop on my reasoning.**

Acceptance Criteria:
- [ ] User receives an in-app notification at 1 month and 3 months after a decision entry date
- [ ] Prompt presents three structured questions: (1) How did this turn out? (2) What do you wish you had known before deciding? (3) Would you make the same choice again — why or why not?
- [ ] User can respond directly from the notification or from the entry detail view
- [ ] Responses are stored as a timestamped reflection record linked to the decision entry
- [ ] User can dismiss a prompt without responding; dismissed prompts are not re-sent

Priority: P0 | Effort: M | Dependencies: Story 8

> **Infrastructure note:** Requires a scheduled job for timed notifications. Confirm whether in-app notification is sufficient for v1 or if push notifications (email/mobile) are needed.

---

### Story 13: Write a Free-Form Reflection at Any Time

**As a user who wants to capture how I feel about a past decision before a scheduled prompt arrives, I want to write a reflection on demand so that I do not lose the insight when it is fresh.**

Acceptance Criteria:
- [ ] User can initiate a reflection from any decision entry at any time via the entry detail view
- [ ] Reflection UI presents the same three structured questions as the scheduled prompt — answers are optional
- [ ] User can also write a free-text reflection with no structured questions if they prefer
- [ ] Unscheduled reflections are stored and labeled with the date written
- [ ] Writing an unscheduled reflection does not reset or cancel the scheduled prompt schedule

Priority: P0 | Effort: S | Dependencies: Story 12

---

### Story 14: Lock a Decision Entry

**As a user who has fully processed a past decision, I want to lock the entry so that I stop receiving follow-up prompts for it.**

Acceptance Criteria:
- [ ] User can lock any decision entry from the entry detail view
- [ ] Locking immediately stops all future scheduled reflection prompts for that entry
- [ ] Locked entries are visually distinguished in the decision log (e.g., a lock icon)
- [ ] User can unlock an entry at any time; unlocking re-enables prompts starting from the next scheduled interval
- [ ] Locking does not delete, hide, or alter any existing reflection data

Priority: P0 | Effort: S | Dependencies: Story 12

---

### Story 15: Pattern Alert at Interrogation Start

**As a user beginning a new interrogation, I want to be alerted if this decision structurally resembles a past logged decision so that I can review what happened last time before I commit.**

Acceptance Criteria:
- [ ] Before the first interrogation question, system scans past decision entries for structural overlap across defined attributes (prestige vs. intimacy tradeoff, financial sacrifice for status, environment preference, risk tolerance mismatch)
- [ ] If a match with ≥2 shared structural attributes is found, an alert is shown: "This decision resembles your [entry name] from [date]" with a one-sentence summary
- [ ] Alert includes any reflection outcome data from the matched entry if available (e.g., "At 3 months you reported feeling overlooked and undervalued")
- [ ] User can dismiss the alert and proceed, or open the matched entry in full before continuing
- [ ] No alert is shown if no past entries exist or no structural match is found — silence is never a false positive

Priority: P0 | Effort: L | Dependencies: Story 4, Story 6, Story 8

> **Spike required:** Structural similarity attributes must be defined and testable before this story can be built. See PRD open question: "Structural Similarity Definition."

---

## Story Map

```
MUST-HAVE (Week 1–2: build first — everything depends on these)
────────────────────────────────────────────────────────────────
Story 1   Complete profile onboarding
Story 4   Start a new decision interrogation          [SPIKE: termination criteria]
Story 5   System challenges weak / circular reasoning [SPIKE: counter-consideration quality]
Story 6   System generates structured session summary

SHOULD-HAVE (Week 3: unblocked by above)
────────────────────────────────────────────────────────────────
Story 2   Profile personalizes interrogation questions
Story 7   Save and resume a draft interrogation
Story 8   View decision log timeline
Story 9   Add option-level data to a decision entry
Story 10  Create a manual decision entry
Story 12  Receive and respond to scheduled reflection prompts

NICE-TO-HAVE (Week 4: lower dependency, complete before QA)
────────────────────────────────────────────────────────────────
Story 3   Edit profile after onboarding
Story 11  Add a free-form note to an existing entry
Story 13  Write a free-form reflection at any time
Story 14  Lock a decision entry
Story 15  Pattern alert at interrogation start         [SPIKE: similarity algorithm]
```

---

## Technical Notes

- **Stories 5, 6, 15** require LLM integration with prompt engineering. Each has a spike dependency that must be resolved before estimation. Recommend prototyping and user-testing Story 5 (the counter-consideration) in week 1 before committing to the full interrogation flow — it is the highest-risk story in the backlog.
- **Story 2** requires profile data to be structured and queryable at interrogation time. Data model for the profile must be finalized before engineering starts on Story 4.
- **Story 12** requires a scheduled notification job (1-month and 3-month timers). Confirm infrastructure approach — cron job, background worker, or third-party notification service — before sprint planning.
- **Story 15** requires a structural similarity algorithm. The set of "structural attributes" must be defined by Product before Engineering can build the matching logic. This is a blocking open question (see PRD).
- **Core data model** implied by these stories: `User → Profile (versioned) → Decision Entry → [Interrogation Session | Manual Entry] → Option Data → Reflection Records`. This model must be designed before any P0 stories go into active development.

---

## Open Questions

| Question | Blocks | Owner |
|---|---|---|
| What is the interrogation termination signal — what tells the system the user has reached a defensible position? | Stories 4, 5, 6 | Product + Engineering |
| What attributes define "structural similarity" between two decisions for the pattern alert? | Story 15 | Product + Engineering |
| What is the minimum response length (in characters or sentences) that satisfies a follow-up question? | Story 4 | Product |
| Is in-app notification sufficient for reflection prompts (v1), or do we need push/email from day one? | Story 12 | Engineering + Founder |
| Should manual entries (Story 10) ever trigger the reflection prompt schedule? If the user reconstructed a 3-year-old decision, a 1-month prompt is meaningless. | Story 10, Story 12 | Product |
