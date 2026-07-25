# Blindspot

> Stress-test your reasoning before you commit.

Blindspot is a consumer decision intelligence platform that helps people make better high-stakes decisions through Socratic interrogation, a structured decision log, and a pattern engine that surfaces cross-context insights across a user's decision history.

## What it does

1. **Interrogation** — Multi-turn AI questioning that pushes back on weak reasoning and surfaces the real driver behind a decision, not the rationalization. Useful on day one with no history.
2. **Decision log** — Structured entries capturing the decision, options, user-inputted data, and an AI-generated reasoning summary.
3. **Pattern engine** — Detects structural similarities across past decisions and surfaces them before a new one is made. Gets more powerful as the log accumulates.

## Structure

```
blindspot/
├── app/          Vite + React + TypeScript application
├── design/       Design prototypes (.dc.html)
└── docs/         Product docs — PRD, personas, user stories, handoff
```

## Running the app

```bash
cd app
npm install
npm run dev
```

## Target launch

August 14, 2026 — private beta.

## Docs

| File | Contents |
|---|---|
| [docs/prd.md](docs/prd.md) | Full product requirements document |
| [docs/personas.md](docs/personas.md) | User research — personas, segments, journey maps |
| [docs/user-stories.md](docs/user-stories.md) | 15 P0 user stories with acceptance criteria |
| [docs/handoff.md](docs/handoff.md) | Developer handoff — data model, build sequence, spikes |
