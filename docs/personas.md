# User Research Report: Decision Intelligence Platform

**Date:** July 8, 2026
**Data sources:** Founder discovery interview (Notes.docx), domain knowledge of college admissions, career pivot, and high-stakes professional decision-making contexts
**Sample size:** Qualitative — 1 founder interview + exploratory research. All personas are hypotheses to validate, not validated findings.
**Informing:** Roadmap prioritization, positioning/messaging, onboarding design

---

## Executive Summary

The Decision Intelligence Platform addresses a psychologically distinct problem: the gap between stated preference and revealed preference in high-stakes decisions. Three user types emerge from the data, each with different urgency, time horizons, and entry points. The highest-urgency and most acquirable segment is the person facing an imminent, high-stakes choice with a hard deadline — a college applicant choosing between acceptances, someone weighing a job offer, anyone at a fork with a clock running. The highest long-term value segment is the Patterned Achiever — the user who has made enough decisions to suspect they repeat structural mistakes and is looking for something to name the pattern. Onboarding is the most critical design risk across all personas: the profile must feel like a meaningful exercise, not a form, or the cold start solution fails before the interrogation ever begins.

---

## Personas

### Persona 1: Jordan — "I worked too hard to settle for anything less than the best school I got into"
*The Prestige Trap Repeater — First High-Stakes Decision Maker*

- **Who:** 17–19, high-achieving, analytically capable but emotionally driven at decision forks. Has worked hard for years and now faces a consequential choice with a hard deadline — choosing between college acceptances, gap year options, or early career forks. Has 5–15 options that vary meaningfully in cost, environment, program strength, and long-term positioning.
- **Primary JTBD:** When I'm choosing between options and everyone around me says "go to the best name you can get into," I want to understand what I actually care about — cost, fit, environment, opportunity — so I don't choose a logo over a life.
- **Key pains:**
  - Social and family pressure to pick the most prestigious option makes anything else feel like failure
  - Parents, peers, and counselors all have opinions that reflect their priorities, not the student's
  - Cost differences ($50k+ over multiple years) are real but feel abstract at 18
  - No structured way to stress-test reasoning — the decision gets made emotionally, then justified
- **Key gains:** Wants permission to choose the right option for them without feeling like they failed. Values a tool that challenges their reasoning rather than validating whatever they already want to do.
- **Behavioral pattern:** High urgency, short decision window (college decisions due May 1; job offers have expiring deadlines). Will use the product intensively for a few weeks around the decision, then again at the next major fork. Likely to recommend to peers facing the same decision.
- **Prevalence:** ~2M college applicants annually in the US face this decision. Comparable volumes exist for early career job offers and gap year choices. High-intent during decision season (March–May for college; rolling for other forks). **Confidence: High** — the Vanderbilt/UVA story is the founder's own experience and the founding insight of the product.

---

### Persona 2: Priya — "I've been successful here. But I keep wondering if I'm in the wrong movie."
*The Mid-Career Domain Piveter*

- **Who:** 27–35, analytically strong, has built meaningful credentials in a first career (consulting, finance, tech, government). Considering a major domain change — graduate school, a different industry, a startup, a geographic move. Has a specific alternative in mind but has not committed.
- **Primary JTBD:** When I'm seriously considering leaving a successful career path, I want to test whether my reasons are grounded in real self-knowledge — not restlessness, sunk cost, or someone else's story — so I make a change I can defend three years from now.
- **Key pains:**
  - Everyone has an opinion; it's hard to separate signal (what she actually values) from noise (what sounds like the right narrative)
  - Sunk cost anxiety: the more successful she has been, the harder it is to walk away
  - Long decision window (months) means the problem doesn't feel urgent enough to force structured thinking
- **Key gains:** Wants the interrogation to surface the real driver — whether it's genuine pull toward the new path or push away from the current one. Values a tool that is honest with her rather than validating.
- **Behavioral pattern:** Lower urgency than Jordan but longer engagement horizon. Will use the product across multiple interconnected decisions over 6–12 months. High LTV if retained through the first pattern insight.
- **Prevalence:** Career pivots are extremely common — est. 27% of knowledge workers consider a major change annually. This persona is large, less community-concentrated, and harder to acquire through a single channel. **Confidence: High** — directly named in founder interview.

---

### Persona 3: Marcus — "I keep ending up in the same situation. Something is wrong with how I decide."
*The Patterned Achiever*

- **Who:** 30–42, accomplished professional — lawyer, consultant, operator, investor. Has made 8–15 major decisions over their career. Perceptive enough to sense they repeat structural mistakes (prestige over intimacy, financial sacrifice for status, underestimating environment) but has never had a tool to surface or name the pattern.
- **Primary JTBD:** When I look back at my major decisions and notice I keep ending up in the same situations, I want to understand the underlying pattern — not the individual mistakes — so I can finally make a decision that breaks the cycle.
- **Key pains:**
  - Therapy is slow, expensive, and addresses symptoms not decision architecture
  - Journaling doesn't surface patterns — it just accumulates content
  - Smart people around them can name individual mistakes but no one has the full cross-context picture
- **Key gains:** The "history rhymes" moment — when the tool says, *the last time you made this tradeoff, here is what happened to your satisfaction at 6 months.* This is the product's most powerful moment and Marcus is the persona it will hit hardest.
- **Behavioral pattern:** Will invest heavily in onboarding and reconstructing past decisions. Engagement is retrospective-first, then forward-looking. Will not churn easily once patterns start emerging — the product gets more valuable the more they use it. Highest LTV of all personas.
- **Prevalence:** Smaller than Personas 1 and 2 but highest willingness to pay and lowest churn. Likely acquired through word-of-mouth and thought leadership rather than performance marketing. **Confidence: Medium** — inferred from product concept; not directly named as a distinct user type in the interview.

---

### Persona 4: Alex — "I know I have a tell. I just don't know what it is yet."
*The Performance Pattern Logger — Primary relevance: P1 features (attempt logging + transcription integration)*

- **Who:** 26–40, professional who makes frequent high-stakes performance attempts — presentations, negotiations, pitches, difficult conversations. Has a vague sense of behavioral patterns (e.g., "I hedge when I feel outranked") but no structured feedback loop to confirm or track them.
- **Primary JTBD:** When I debrief after a high-stakes performance event, I want to capture what happened and compare it against my own patterns over time so I can systematically improve — not just feel bad for 20 minutes and move on.
- **Key pains:**
  - Informal debriefs don't produce structured data
  - Coaching is expensive and not always available post-event
  - No tool connects behavioral patterns (hedging in high-pressure moments) to identity-level patterns (underestimating own standing)
- **Key gains:** The cross-context connection moment — when the tool links a behavioral pattern in performance events to a psychological pattern in major decisions. Deeply validating and practically useful.
- **Behavioral pattern:** High frequency of use (multiple attempts per month), lower per-session depth than decision interrogation. Uses it as an ongoing workflow tool, not just at forks.
- **Prevalence:** Large potential market. Dependent on P1 transcription integration for the full experience — manual logging reduces stickiness significantly. **Confidence: Medium** — named in the interview but contingent on P1 features shipping.

---

## User Segments

| Segment | Size | Primary JTBD | Product Fit (v1) | Value | Growth |
|---|---|---|---|---|---|
| Active Decision-Makers (facing a fork now) | Medium — concentrated in application and offer seasons | Stress-test reasoning before committing | **High** — interrogation mechanic works immediately | High urgency, converts fast | Seasonal spikes |
| Pre-Decision Researchers (fork in 3–6 months) | Large — career pivoters, grad school applicants | Build self-knowledge before the decision arrives | **Medium** — profile onboarding delivers value; pattern engine needs time | Lower urgency, higher LTV | High — evergreen |
| Retrospective Pattern-Seekers (no active decision) | Small — accomplished professionals | Understand why I keep repeating structural mistakes | **Medium** — strong if they reconstruct past decisions at onboarding | Highest LTV, lowest churn | Low volume, high word-of-mouth |
| Performance Loggers (frequent high-stakes attempts) | Large — professionals across industries | Behavioral feedback loop for recurring events | **Low (v1)** — attempt logging is P1 | High frequency, habit-forming | Dependent on P1 shipping |

**Highest-value segment for v1 acquisition:** Active Decision-Makers (Jordan). High urgency, short sales cycle, strong word-of-mouth within peer cohorts — college applicants talk to other college applicants; professionals share tools with colleagues facing the same fork.

**Highest long-term value segment:** Retrospective Pattern-Seekers (Marcus). Lowest churn, highest willingness to pay, drives the product's most differentiated value proposition.

---

## Customer Journey Map

### Persona 1: Jordan (Active Decision-Maker with Hard Deadline)

| Stage | Touchpoints | Emotion | Pain Points | Opportunities |
|---|---|---|---|---|
| **Awareness** | Peer word-of-mouth, college admissions communities, decision-anxiety search | Anxious, overwhelmed by options | "Everyone just says go to the best name — that's not actually helpful" | Position as the anti-prestige-trap tool; application decision season (March–May) is a natural trigger |
| **Consideration** | Landing page, first 60 seconds of product | Skeptical — "is this just a fancy pros/cons list?" | No existing tool has felt meaningfully different from a spreadsheet | The interrogation must feel unlike anything they've tried in the first 3 questions |
| **Onboarding** | Profile intake | Impatient — wants to get to the decision, not fill out a form | Profile feels like friction before the value | Reframe profile as "calibration" — the first question should feel insightful, not administrative |
| **First Value** | First interrogation session | Surprised — "I didn't realize that was what I was actually optimizing for" | Session feels too long, or pushback feels generic | The counter-consideration is the make-or-break moment — it must feel precise, not canned |
| **Active Use** | Decision log, 1-month reflection prompt | Satisfied if outcomes confirm; frustrated if ignored | Long gap between decision and follow-up prompt | Pattern alert on a second decision is the retention hook |
| **Advocacy** | Telling peers about it during the next decision cycle | Proud to have had a structured process | Product must be ready when word spreads — no rough edges | The "surfaced something I didn't know" story is the acquisition unit |

---

### Persona 2: Priya (Career Piveter)

| Stage | Touchpoints | Emotion | Pain Points | Opportunities |
|---|---|---|---|---|
| **Awareness** | Career change communities, LinkedIn, coaching content | Unsettled — "I keep thinking about this and can't get clarity" | No single trigger moment; arrives via ambient search | Position as "clarity before commitment" — for decisions you can't stop thinking about |
| **Consideration** | Landing page, value prop | Intrigued but cautious — "will this actually push back or just validate me?" | Worried it will tell her what she wants to hear | Lead with the pushback mechanic explicitly in positioning |
| **Onboarding** | Profile intake | Thoughtful — this persona fills out the profile carefully | May over-index on aspirational values rather than revealed ones | Ask behavioral questions, not value labels ("when have you been most energized at work?" not "rank these values") |
| **First Value** | First interrogation session | Emotionally resonant — the session surfaces the real driver | Session doesn't feel complete; she wants to keep going | Offer follow-up sessions on related sub-decisions |
| **Active Use** | Multiple interconnected decisions over 6–12 months | Deepening trust as the pattern engine accumulates data | Long gaps between active decisions reduce engagement | Proactive check-in: "You logged a decision 2 months ago — is this still on your mind?" |
| **Expansion** | Pattern engine, profile evolution view (P1) | High delight at the "history rhymes" moment | P1 features are needed for this persona's full value | Design P1 features with Priya in mind — she is the user who tells others when the pattern engine works |

---

### Persona 3: Marcus (Patterned Achiever)

| Stage | Touchpoints | Emotion | Pain Points | Opportunities |
|---|---|---|---|---|
| **Awareness** | Thought leadership content, word-of-mouth from Priya | Intrigued — "someone finally named the thing I've been trying to articulate" | Hard to describe the problem to; requires sophisticated positioning | The "history rhymes" framing is the hook — lead with it in positioning for this segment |
| **Consideration** | Landing page, product tour | High intent but high bar — "I've tried journaling and it didn't work" | Will compare to journaling and therapy; needs clear differentiation | Explicitly position against journaling: "not a notes app — a pattern engine" |
| **Onboarding** | Profile intake + reconstructed past decisions | Invested — will spend significant time here | Reconstructed past decisions are rationalizations; tool should signal this | Flag reconstructed entries as "lower confidence" and explain why forward-logging is more accurate |
| **First Value** | First pattern alert | Potentially the most powerful first-value moment of any persona | Alert may not fire until 2–3 decisions are logged | Surface preliminary observations even without a confirmed match: "Based on your profile, watch for prestige-over-environment tradeoffs in your next decision" |
| **Active Use** | Ongoing reflection loop, pattern alerts | High engagement once the product delivers — Marcus does not churn easily | If the pattern engine underdelivers, Marcus churns fast and tells people | Pattern quality is existential for this persona — a bad alert is worse than no alert |
| **Advocacy** | Highly analytical networks (professionals, investors, operators) | Evangelical when the product works | Requires the product to genuinely perform | Marcus is the word-of-mouth engine into the highest-value user cohort |

---

## Key Insights

1. **The product has two distinct value timelines that must both work.** Day-one value comes from the interrogation mechanic — a single session that surfaces something the user had not named. Long-term value comes from the pattern engine, which requires months of logged decisions. Onboarding must explicitly set the expectation that the product gets dramatically more powerful over time. Users who expect full pattern intelligence on day one will churn.

2. **The onboarding profile is the product's most fragile moment.** All three primary personas arrive with some impatience. Jordan has a deadline and wants to get to it. Priya has been living with the question for months and wants to dig in. Marcus came to understand patterns, not fill out a form. The profile cannot feel like a prerequisite — it must feel like the first act of the interrogation itself.

3. **The counter-consideration is the moment of trust.** Every persona arrives having tried something that validated rather than challenged them — journaling, talking to friends, a generic AI chat. If the product's pushback feels generic ("have you considered your financial situation?") the user will not believe it's different. If it feels precise ("you've said environment matters but you haven't named a single environment quality — just institutional prestige") it earns trust immediately. This is the highest-risk prompt engineering challenge in the build.

4. **"Stated vs. revealed preference" is the core insight — but it requires a long time horizon to prove.** The most powerful moments (the pattern alert, the "history rhymes" notification) only emerge after 6–12 months of data. The product must generate enough early-session value to keep users logging through the period before the long-term value materializes. The post-interrogation prompt ("did this surface something you hadn't named?") is the proxy for whether the product is earning that trust.

5. **Persona 1 is the acquisition vector; Persona 3 is the retention anchor.** Jordan acquires fast, converts quickly, and generates word-of-mouth within peer cohorts during decision season. Marcus stays for years and tells analytically sophisticated networks when the pattern engine performs. Both are necessary — build for Jordan first, design for Marcus from the start.

6. **Attempt logging (P1) unlocks a qualitatively different user.** Alex, the Performance Logger, is a habit-forming user with high frequency and a different retention dynamic than decision-loggers. Keeping it P1 is correct for scope but the data model should support it from day one.

---

## Recommendations

### Roadmap Prioritization

1. **Build the interrogation for Jordan first.** Jordan's use case is the most bounded, most time-pressured, and most community-concentrated. Use it as the interrogation design test bed — if it works for a high-stakes, deadline-driven decision, it will scale to Priya and Marcus's more complex situations.
2. **Treat onboarding as a product design problem, not an engineering problem.** The profile must feel like the first act of the interrogation. This requires design and copy work as sharp as the interrogation questions themselves. User-test onboarding with 3–5 target users in week 1 of build.
3. **Ship the pattern alert even if it is simple.** A basic structural match alert ("this decision resembles your [X] decision") sets the expectation that the product is watching for patterns. Users who see an alert — even a simple one — will understand the long-term value proposition immediately.

### Positioning / Messaging

4. **Lead with the pushback, not the pattern.** The pattern engine is the defensible long-term value, but it requires months to prove. The interrogation is provable in 20 minutes. Lead with "the tool that pushes back on your reasoning" — not "the tool that finds your patterns."
5. **Target decision-season communities for v1 launch.** College admissions communities, career transition forums, and professional peer networks all have concentrated moments of high decision anxiety. Word-of-mouth within these cohorts is fast and the problem is acutely felt.

### Onboarding Design

6. **Make the profile feel behavioral, not categorical.** Instead of "rank your top 5 values," ask: "Describe a time you turned down an opportunity — what was the reason?" or "What aspect of your current situation would you protect even if it cost you money?" These surface revealed preferences rather than aspirational self-images, and make the profile feel like insight, not intake.

---

## Open Questions for Follow-Up Research

| Question | Research method | Priority |
|---|---|---|
| Does the interrogation actually surface something users hadn't named, or does it feel like a sophisticated version of what they already knew? | User-test the interrogation with 5 target users before shipping — grade each counter-consideration for precision | **Blocking** |
| What is the right profile length? Too long loses Jordan; too short loses Marcus. | A/B test two onboarding flows with early beta users — measure completion rate and first-session satisfaction | **High** |
| How do users describe this product when they explain it to a friend? | Post-session open prompt: "How would you describe what you just did?" — use verbatim to refine positioning | **High** |
| What is the trigger that brings users back between active decisions? | Monitor return visit triggers in beta cohort — is it the reflection prompt, a pattern alert, or an upcoming decision? | **Medium** |
| Is there meaningful demand outside the college admissions and career pivot contexts? | Monitor organic signups from outside target channels in first 30 days | **Low (post-launch)** |
