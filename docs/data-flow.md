# Data Flow

## Default static app flow

```text
src/data/*.ts
  -> typed domain objects
  -> React pages/components
  -> user interactions
  -> progress hooks
  -> browser localStorage
  -> review and progress UI
```

The app uses synthetic manufacturing-learning data checked into source. There is no production database and no real factory connection.

## Main data groups

| Data group | Files | Purpose |
|---|---|---|
| Concept cards | `src/data/concepts.ts` | ERP, MES, MOM, QMS, SCADA, PLC, OT, KPIs, departments, AI touchpoints |
| Beginner questions | `src/data/beginnerChoiceQuestions.ts` | 200 four-choice questions for basic manufacturing AI literacy |
| Intermediate training | `src/data/trainingQuestions.ts` | explanation prompts, model answers, rubrics, risks, responsibility boundaries |
| Explanation drills | `src/data/explainDrills.ts` | 30-second and 3-minute spoken-answer practice |
| Stakeholder scenarios | `src/data/scenarios.ts` | concerns and safer responses for plant manager, QA, maintenance, IT/DX, etc. |
| Glossary | `src/data/glossary.ts` | inline definitions and context-aware explanations |
| Friction words | `src/data/glossaryFrictions.ts` | terms whose meaning can drift across AI and manufacturing teams |
| Decision authority | `src/data/decisionAuthority.ts` | AI support role vs. human decision authority |

## Local storage

Progress stays in the user's browser. The app tracks items such as answered questions, weak questions, bookmarks, explanation scores, glossary opens, and streaks.

If localStorage writes fail, the UI shows a notice and keeps the current session usable. This is important because storage failure should not block the learning flow.

## Optional FUGU review data flow

The optional review flow sends a bounded payload to the local review server:

- question ID and prompt metadata
- model answer/rubric fields needed for review
- normalized user answer
- selected unknown reasons
- opened glossary term IDs
- answer hash for cache consistency

It does **not** send arbitrary private notes, API keys, or browser storage contents.

## Demo data statement

All source data is synthetic training/demo data. It is not client data, plant data, or confidential project material.
