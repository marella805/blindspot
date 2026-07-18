# Blindspot — Entity Relationship Diagram

```mermaid
erDiagram
    Users {
        uuid        id              PK
        string      email           UK
        string      name
        string      initials
        string      role
        text        decision_context
        int         calibration
        timestamp   created_at
        timestamp   updated_at
    }

    Decisions {
        uuid        id              PK
        uuid        user_id         FK
        string      title
        text        summary
        enum        category
        int         interrogation_count
        uuid        chosen_option_id FK "nullable"
        text        reasoning
        timestamp   locked_at       "nullable"
        timestamp   created_at
        timestamp   updated_at
    }

    DecisionOptions {
        uuid        id              PK
        uuid        decision_id     FK
        string      label
        jsonb       pros
        jsonb       cons
        int         position
    }

    InterrogationSessions {
        uuid        id              PK
        uuid        decision_id     FK
        enum        coaching_style
        text        appeal_note     "nullable — what user said was missing from prior rec"
        timestamp   created_at
    }

    Recommendations {
        uuid        id              PK
        uuid        decision_id     FK
        uuid        interrogation_session_id FK
        text        answer
        text        rationale
        jsonb       evidence        "array of {pattern, finding}"
        timestamp   accepted_at
        timestamp   created_at
    }

    PatternTypes {
        uuid        id              PK
        string      slug            UK
        string      title
        text        description
        int         detection_threshold
    }

    PatternAlerts {
        uuid        id              PK
        uuid        user_id         FK
        uuid        pattern_type_id FK
        timestamp   detected_at
        timestamp   dismissed_at    "nullable"
    }

    PatternAlertDecisions {
        uuid        pattern_alert_id FK
        uuid        decision_id      FK
    }

    Reflections {
        uuid        id              PK
        uuid        decision_id     FK
        date        scheduled_for
        enum        interval_type   "standard | custom"
        enum        interval_label  "nullable — 1mo 3mo 6mo 9mo 12mo 18mo 24mo 36mo"
        int         custom_interval_days "nullable"
        timestamp   completed_at    "nullable"
        text        content         "nullable"
        timestamp   created_at
    }

    Users             ||--o{ Decisions              : "owns"
    Decisions         ||--o{ DecisionOptions        : "has"
    Decisions         }o--o| DecisionOptions        : "chosen_option (nullable)"
    Decisions         ||--o{ InterrogationSessions  : "interrogated via"
    InterrogationSessions ||--o| Recommendations   : "produces"
    Decisions         ||--o{ Recommendations        : "receives"
    Users             ||--o{ PatternAlerts          : "flagged by"
    PatternTypes      ||--o{ PatternAlerts          : "instantiates"
    PatternAlerts     ||--o{ PatternAlertDecisions  : ""
    Decisions         ||--o{ PatternAlertDecisions  : "cited in"
    Decisions         ||--o{ Reflections            : "scheduled for"
```

---

## Enums

### `category`
`career` | `financial` | `relationship` | `health` | `education` | `housing` | `business` | `personal_growth` | `other`

### `coaching_style`
`advisor` | `supporter` | `critic`

### `interval_type`
`standard` | `custom`

### `interval_label`
`1mo` | `3mo` | `6mo` | `9mo` | `12mo` | `18mo` | `24mo` | `36mo`

---

## Key design notes

**`Decisions.chosen_option_id → DecisionOptions`**
A nullable FK that points back into the same decision's options. Deferred constraint to avoid the circular insert problem. Set only once the user commits.

**`InterrogationSessions.appeal_note`**
Stores what the user said was *missing* from the previous recommendation — not a response to a question, but free text filed before the new interrogation begins. Null on the first session for a given decision.

**`Recommendations`**
Only written when the user accepts or ends an interrogation. Never updated — if a user re-interrogates and accepts again, a new row is inserted. Query the latest by `accepted_at` to get the current standing recommendation for a decision.

**`PatternTypes`**
System-seeded rows (binary framing, external validation, career over alignment, etc.). Not user-editable. `detection_threshold` is the minimum number of matching decisions required to fire an alert.

**`PatternAlertDecisions`**
Junction table — which specific decisions contributed evidence to a given alert. Composite PK `(pattern_alert_id, decision_id)`.

**`Reflections.custom_interval_days`**
Set when `interval_type = custom`. `interval_label` is null in that case. For standard intervals, `interval_label` drives the UX display and `custom_interval_days` is null.

**`Decisions.interrogation_count`**
Incremented each time an `InterrogationSession` is created for this decision. Drives question variation (new questions, new framing on re-interrogation) without storing the prior Q&A.

**`Decisions.locked_at`**
Once set, the decision is read-only. Reflections can still be completed after lock.
