# Decision Intelligence Platform — v1 PRD
**Prepared:** July 8, 2026 | **Target launch:** August 14, 2026 | **Model:** Consumer

---

## Problem Statement

High-stakes decisions — firm recruiting, career pivots, school choices — are rarely made with clear reasoning. People construct rational justifications after decisions are made emotionally, repeat the same structural mistakes across different domains (a prestige trap in school choice, then the same trap in firm choice), and have no mechanism to connect the dots across separate parts of their lives. The cost is concrete: a $150k scholarship gap, years in the wrong environment, patterns that only become legible in hindsight when it is too late to act. No existing tool distinguishes between stated preference and revealed preference, or surfaces cross-context patterns that span a user's decision history.

---

## Goals

1. **≥70% of users who complete an interrogation session** report that it surfaced a consideration they had not explicitly named before (measured via post-session prompt)
2. **≥60% of users log at least 2 decisions** within their first 14 days (activation threshold)
3. **≥30% of users are still active at 90 days** post-signup (retention baseline for a longitudinal product)
4. **≥50% of 1-month reflection prompts are answered** (measures whether users trust the loop and stay engaged between active decisions)
5. **≥60% of users who receive a pattern alert** rate it as "relevant" or "highly relevant" (measures whether the pattern engine is delivering signal, not noise)

---

## Non-Goals

1. **Not a firm/school research database.** External option data is user-inputted. Pulling live data on 150 law firms is a separate infrastructure product. Resolves scope creep on v1.
2. **Not a habit tracker.** Habit formation is a different psychological loop and a different retention model. Out of scope permanently, not just for v1.
3. **Not a therapy or coaching app.** The tool surfaces patterns and stress-tests reasoning. It does not offer emotional support, professional advice, or crisis resources.
4. **Not a general AI chatbot.** The product is a structured system with specific mechanics. A freeform chat interface would undermine the interrogation's forcing function.
5. **Not a journaling app.** The value is not in recording thoughts — it is in the pattern engine that reads across entries. Prose notes without structure are not the product.

---

## Target Users

**Primary persona: High-stakes decision-maker at a meaningful life stage fork**

The user needs to be at a point where decisions carry lasting consequences and there is enough runway ahead for longitudinal patterns to matter.

**Concrete examples from discovery:**
- Law student recruiting across 150 firms — ranking and allocation problem with 3-year career consequences
- 27-year-old tech PM considering a pivot into law — open-ended deliberation, high option cost, identity-level stakes
- Anyone at a prestige vs. intimacy fork: school choice, firm choice, job offer, city choice, relationship commitment

**Explicit exclusions:**
- Users making reversible, low-consequence decisions
- Users in acute crisis requiring professional intervention
- Children making age-appropriate exploratory choices (the 12-year-old choosing math vs. science is not the user; the 15-year-old interrogating their identity and future direction may be)

---

## User Stories

### Persona 1: The Active Decision-Maker

*As a law student doing firm recruiting, I want to be walked through structured questioning about what I am actually optimizing for — not just salary, but environment, mentorship, identity — so that I can allocate my recruiting energy to firms that match my real priorities, not my stated ones.*

*As a user facing a fork, I want the system to push back when my reasoning is circular or emotionally driven so that I cannot escape the process by typing something that sounds rational.*

*As a user who has completed an interrogation, I want a summary of the key reasoning I articulated and the tradeoffs I acknowledged so that I have a record I can return to when the outcome plays out.*

*As a user mid-interrogation who is not ready to finish, I want to save my draft and return to it later so that the pressure of a live session does not force a shallow answer.*

### Persona 2: The Reflective User (6 months post-decision)

*As a user who chose a firm 6 months ago, I want to receive a prompt asking how the decision panned out so that the system has real outcome data, not just my stated reasoning at the time.*

*As a user writing a reflection, I want to answer structured questions (how did this turn out? what do you wish you had known? would you make the same choice again?) so that my reflection is useful to the pattern engine, not just free prose.*

*As a user who feels I have fully processed a past decision, I want to lock the entry so that I stop receiving follow-up prompts for it.*

### Persona 3: The Pattern-Aware User (3+ decisions logged)

*As a user beginning a new decision interrogation, I want the system to alert me if this decision structurally resembles a past one so that I can review what happened last time before committing.*

*As a user with 6+ months of log history, I want to see where my revealed preferences (what I reported feeling at outcome) diverged from my stated preferences (what I said I wanted at decision time) so that I can update my self-model.*

### Persona 4: The Onboarding User (day one)

*As a new user, I want to build a profile that captures my values, risk tolerance, financial situation, and work-life priorities so that the interrogation is calibrated to who I am from session one — not generic.*

*As a new user with no logged decisions yet, I want the interrogation to be useful on day one based on my profile alone so that I do not have to wait for pattern data before getting value.*

---

## Requirements

### Must-Have — P0 (Required for August 14 launch)

**1. User Profile Onboarding**
Structured intake that captures who the user is across five dimensions: values (ranked or weighted), risk tolerance, financial priorities and constraints, work-life weighting, and career stage/dependencies. This is the cold start solution — the tool must be useful from session one before any decisions are logged.

- [ ] New user can complete onboarding in ≤15 minutes
- [ ] Profile captures: top 5 ranked values, risk tolerance (structured response, not slider), financial situation (income level, debt, dependents), work-life weighting (hours vs. compensation vs. growth vs. environment), career stage, and geographic constraints
- [ ] Profile data is actively used to personalize interrogation questions from session one (e.g., a user who ranked "mentorship" high gets probing questions about mentorship when logging a firm choice)
- [ ] Profile is editable after onboarding; changes are timestamped so the system knows which profile was active at decision time
- [ ] Skipping onboarding is not permitted — the interrogation mechanic degrades without profile data

**2. Decision Interrogation Mechanic**
Socratic multi-turn questioning flow. Not a form. Not a pros/cons list. The system pushes back when reasoning is weak or circular. The session ends when the user has articulated a defensible position, not when they have typed enough words.

- [ ] Session asks minimum 5 substantive follow-up questions per decision
- [ ] System explicitly challenges at least one piece of reasoning per session with a counter-consideration or alternative framing
- [ ] System detects and flags circular reasoning (user restating the same point in different words) and prompts for a new angle
- [ ] User cannot submit a one-line answer to a follow-up — minimum response depth enforced with a soft prompt to expand
- [ ] Session produces a structured summary: decision name, options considered, option chosen, key factors, articulated reasoning, acknowledged tradeoffs
- [ ] User can save a draft mid-session and return to complete it before making the decision
- [ ] Session is aware of user profile and references relevant profile data in questions (e.g., "You said financial stability is your top value — how does this option's compensation compare to your baseline?")

**3. Decision Log**
Create, view, and edit entries. Each entry is the output of either an interrogation session or a manual log.

- [ ] User can create an entry via the interrogation flow (primary path) or manually (secondary path for past decisions)
- [ ] Each entry stores: decision name, date, options considered with user-inputted data fields (key/value pairs: salary, hours, location, firm size, etc.), option chosen, interrogation summary, and free tags
- [ ] User can view all past entries in a chronological timeline
- [ ] User can edit option data fields after entry creation
- [ ] User can add a note to any entry at any time outside the reflection schedule

**4. Reflection Prompts (1-month and 3-month)**
Tool-initiated check-ins that close the loop between stated reasoning at decision time and actual outcome at follow-up. V1 ships with 1-month and 3-month prompts; full schedule is P1.

- [ ] User receives an in-app notification at 1 month and 3 months post-decision
- [ ] Reflection prompt asks three structured questions: (1) How did this turn out? (2) What do you wish you had known before deciding? (3) Would you make the same choice again — why or why not?
- [ ] User can write a free-form reflection at any time outside the scheduled prompts
- [ ] User can lock an entry — locking stops all future prompts for that entry
- [ ] Reflection responses are stored alongside the original decision entry and are visible to the pattern engine

**5. Basic Pattern Alert**
When a user begins a new decision interrogation, the system checks for structural similarity to past logged decisions and surfaces the most relevant match.

- [ ] At interrogation start, system scans past decision entries for structural overlap (prestige vs. intimacy tradeoff, financial sacrifice for status, environment preference pattern, risk tolerance mismatch)
- [ ] If a match is found with ≥2 shared structural attributes, an alert is surfaced before the interrogation begins: "This decision resembles your [entry name] from [date]" with a one-sentence summary
- [ ] Alert includes any reflection data from the matched entry if available (e.g., "At 3 months you reported feeling overlooked and undervalued")
- [ ] User can dismiss the alert or open the matched entry before proceeding
- [ ] No alert is surfaced if no past entries exist or no structural match is found

---

### Nice-to-Have — P1 (Target: 4 weeks post-launch)

1. **Attempt logging** — Manual log entries for high-stakes performance events (depositions, cold calls, interviews) with structured fields: event type, stated goal, what happened, self-assessed outcome, behavioral flags
2. **Otter AI transcript integration** — Connect a transcript to an attempt entry; system flags behavioral patterns (e.g., hedging language) against the user's stated goal for that event type
3. **Full reflection schedule** — Expand beyond 1+3 months to the full schedule: 6 months, 9 months, 1 year, 2 years, 3 years
4. **Cross-context psychological pattern detection** — Pattern engine surfaces deeper theme-level patterns (external validation-seeking, prestige trap, risk aversion mismatch) that span both decisions and attempts
5. **Profile evolution view** — Side-by-side view of stated preferences at onboarding vs. revealed preferences accumulated through reflection data

---

### Future Considerations — P2 (Design to support, do not build now)

1. **Institutional/cohort mode** — Law school or employer purchases access for a group; requires admin controls, cohort management, aggregate reporting. Out of scope; would require a separate go-to-market motion.
2. **Option data enrichment via search** — System uses web search to pre-populate firm/school data for the user. Out of scope for v1; user inputs all option data manually.
3. **Additional transcription integrations** — Fireflies, Rev, native audio upload. Otter AI first.
4. **Decision summary export and sharing** — User can export a formatted summary of a decision + reflection history as PDF or shareable link.
5. **Mobile native app** — Web-first for v1; design responsive but do not build native.

---

## Success Metrics

### Leading Indicators (evaluate at 2 weeks and 4 weeks post-launch)

| Metric | Target | Measurement |
|---|---|---|
| Onboarding completion rate | ≥70% of signups complete full profile | % of signups who reach the first interrogation screen |
| Interrogation completion rate | ≥60% of started sessions completed | % of sessions with a structured summary generated |
| Decision entries per active user at Day 14 | ≥2 | Average entries per user who has returned at least once |
| Day-7 retention | ≥40% | % of signups who open the app on day 7 |
| Post-interrogation rating | ≥70% rate it "surfaced something new" | Post-session single-question prompt |

### Lagging Indicators (evaluate at 60 and 90 days post-launch)

| Metric | Target | Measurement |
|---|---|---|
| 30-day retention | ≥30% | % of signups active at day 30 |
| 90-day retention | ≥20% | % of signups active at day 90 |
| Reflection response rate | ≥50% | % of 1-month prompts answered within 7 days |
| Pattern alert relevance | ≥60% rated "relevant" or "highly relevant" | Post-alert single-question prompt |
| Subscription conversion | ≥15% | % of trial users who convert (once monetization is defined) |

---

## Open Questions

### Blocking — must resolve before build starts

| Question | Owner |
|---|---|
| **Interrogation termination criteria**: How does the system know the user has reasoned their way to a defensible position vs. just typed enough words? What signals completion vs. capitulation? Without this, the core mechanic has no exit condition. | Product + Engineering |
| **Onboarding fidelity design**: What makes the profile feel worth filling out thoroughly rather than skimming? If users treat it as a form, the cold start solution fails and day-one value collapses. Needs a concrete design approach before engineering starts. | Design |

### Non-blocking — can resolve during build

| Question | Owner |
|---|---|
| **Reconstructed past decisions**: If users log historical decisions during onboarding, how does the system weight these vs. forward-logged decisions? Reconstructed entries are likely rationalizations — this affects pattern engine confidence scoring. | Engineering / Data |
| **Reflection-to-pattern indexing**: How does a reflection response ("I feel overlooked and undervalued at 6 months") get structured and indexed so the pattern engine can use it as outcome data? Requires a data model decision before the P1 pattern engine expansion is built. | Engineering |
| **Structural similarity definition**: What attributes define that two decisions are "structurally similar" for the P0 pattern alert? Must be defined and testable before the alert logic is built. | Product + Engineering |
| **Monetization mechanics**: Free trial length, price point, what is behind the paywall vs. free. Affects onboarding flow design and activation funnel. | Founder |

---

## Timeline Considerations

**Hard deadline:** August 14, 2026 (5.5 weeks from spec date)

### Recommended Build Sequence

| Week | Focus | Rationale |
|---|---|---|
| Week 1–2 | Profile onboarding + interrogation mechanic | These are dependencies for everything else; interrogation quality requires iteration and prompt engineering — highest-risk component |
| Week 3 | Decision log + manual reflection entry | Unblocked once interrogation produces a structured summary output |
| Week 4 | Scheduled reflection prompts + basic pattern alert | Requires decision log data to be in place |
| Week 5 | QA, edge cases, onboarding polish | Buffer for interrogation prompt iteration |
| **August 14** | **Private beta / soft launch** | See note below |

**Recommendation on launch scope:** Given 5.5 weeks and the interrogation mechanic's dependence on prompt engineering quality, recommend August 14 as a **private beta with a limited cohort** (20–50 users) rather than a full public launch. The pattern engine's value is longitudinal — the first meaningful pattern data will not exist until 30–90 days post-launch. A private beta gives time to validate the interrogation mechanic's quality before acquiring users who will churn before the long-term value is visible.

**Primary risk:** The interrogation mechanic is the entire product's value proposition and has no prior art to benchmark against. Build and user-test this first. If it does not pass the bar ("surfaced something I had not named") by end of week 2, re-evaluate scope before proceeding.
