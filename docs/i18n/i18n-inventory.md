# i18n string inventory — 2026-07-25

Baseline `29f289c`. Counts were produced by scanning every `.ts`/`.tsx` file under
`src/` for string literals and JSX text nodes containing Hiragana, Katakana, or Han
characters. They are an upper bound on translatable units (a few matches are code
comments or Japanese enum keys used as identifiers, which are *not* translated).

Live coverage is enforced by `npm run audit:i18n` (`scripts/auditI18nCoverage.ts`),
which fails the build on a missing UI dictionary key and prints per-dataset content
coverage. The numbers below are the plan; the script is the authority.

## Totals

| Layer | Approx. Japanese strings | Decision |
|---|---|---|
| UI chrome (`pages/`, `components/`, `lib/`, `App.tsx`) | ~460 | **fully translated** |
| Concepts + small/medium domain datasets | ~760 | **fully translated** |
| Question banks (`beginnerChoiceQuestions`, `trainingQuestions`, `questions`) | ~5 320 | **deferred, declared in-app** |
| Glossary (`glossary.ts`) | ~1 220 | **deferred with the question banks** (see N) |
| Code comments / Japanese enum keys | ~1 190 | not translated (not user-facing) |
| **Total scanned** | **~7 730** | |

## Per-file measurement

| File | JP string literals | JP JSX text |
|---|---|---|
| `src/data/beginnerChoiceQuestions.ts` | 3 993 | 0 |
| `src/data/glossary.ts` | 1 222 | 0 |
| `src/data/trainingQuestions.ts` | 936 | 0 |
| `src/data/concepts.ts` | 520 | 0 |
| `src/data/questions.ts` | 388 | 0 |
| `src/pages/DrillDeckPage.tsx` | 86 | 65 |
| `src/data/explainDrills.ts` | 86 | 0 |
| `src/data/scenarios.ts` | 80 | 0 |
| `src/pages/AlignmentStudioPage.tsx` | 43 | 12 |
| `src/data/glossaryFrictions.ts` | 36 | 0 |
| `src/pages/BeginnerChoicePage.tsx` | 26 | 26 |
| `src/pages/ReviewVaultPage.tsx` | 24 | 2 |
| `src/pages/CockpitPage.tsx` | 22 | 12 |
| `src/data/decisionAuthority.ts` | 20 | 0 |
| `src/data/expertDialogues.ts` | 20 | 0 |
| `src/lib/fuguReviewSchema.ts` | 18 | 0 |
| `src/lib/labels.ts` | 15 | 0 |
| `src/lib/beginnerChoiceLabels.ts` | 11 | 0 |
| `src/pages/KnowledgeBoothPage.tsx` | 5 | 13 |
| `src/pages/ExplainGymPage.tsx` | 3 | 5 |
| `src/components/GlossaryPopover.tsx` | 1 | 10 |
| `src/pages/MapRoomPage.tsx` | 0 | 5 |
| `src/components/QuestionGlossaryPanel.tsx` | 2 | 1 |
| `src/components/AppShell.tsx` | 0 | 2 |
| others (`ui.tsx`, `GlossaryTerm`, `GlossaryBottomSheet`, `ConceptDiagramView`, `App.tsx`, `fuguReviewClient`) | 9 | 0 |

## Classification A–P

### A. Common UI — **translated**
Buttons (start / next / retry / reset / bookmark / mark-weak / release), self-score
controls, `CautionBox` titles, `EmptyState`, `StatCard` labels, `ProgressRing` labels,
timer labels, copy/download status text, keyboard-shortcut help.
Location: `components/ui.tsx`, `components/AppShell.tsx`, page-local literals.

### B. Navigation — **translated**
8 view labels + 8 view descriptions (`lib/labels.ts`), sidebar brand name and tagline,
sidebar note, mobile tab labels, progress-rail headings.

### C. Cockpit — **translated**
Hero eyebrow/heading/lede, two CTAs, today panel, two learning-mode cards, mode cards
(4), section headers (3), support action buttons, caution box.

### D. Alignment Studio — **translated**
Page header, 3 overview cells, 5 panel headers, 14 canvas field labels, canvas
placeholder, 3 canvas actions, 4 copy-status messages, Markdown preview summary,
friction-card mode labels (5), dialogue labels (weak/strong/why), decision-authority row
labels (AI / human & existing process / evidence to leave), `[未入力]` placeholder in the
exported Markdown.

### E. Beginner Choice — **translated (chrome only)**
Top screen, session header, choice list, answer-confirmation panel labels
(correct / why correct / your choice / explanation / takeaway / caution / related terms /
next drill), history panel, keyboard help, result screen.
Question **content** is category M.

### F. Drill Deck — **translated (chrome only)**
Mode labels (4), audience labels (7), self-score labels (0–3), unknown-reason options (5)
and their hints, side-panel definition list, shortcut help, answer-sheet section headings
(1–8), self-score panel, FUGU consent/notice/result labels, note panel, result screen,
glossary summary, FUGU summary.
Question **content** is category M.

### G. Explain Gym — **translated**
Page header, drill-list score labels, timer labels and segmented control, 3 timer
actions, speak prompt, model-answer headings, self-score panel.
Drill content is category O and **is translated**.

### H. Knowledge Booth — **translated**
Page header, booth tabs, card state labels (`Complete` / `Open` / `Bookmarked`), detail
list labels (why it matters / departments / KPIs / AI touchpoint), junior-section labels
(in one line / diagram / when it comes up / example / how AI connects), mini-question,
30-second summary, 2 actions, empty state.
Concept content is category N and **is translated**.

### I. Map Room — **translated**
Page header and lede, map aria-label, detail labels (nearby work / AI touchpoint / KPIs
to watch). Node names are concept titles (category N).

### J. Review Vault — **translated**
Page header, 7 section titles + 7 action labels, 6 empty states, training-data summary,
release buttons, reset confirmation dialog text.

### K. Error / save / confirmation messages — **translated**
localStorage write-failure banner (global + Beginner-local), clipboard failure, canvas
required-field notice, training-data reset `window.confirm`, and the FUGU review errors
(JSON parse, empty answer, length limit, timeout, generic failure).

The FUGU errors are localized indirectly, because `src/lib/fuguReviewClient.ts` is a
library and must not depend on a React context. It throws a `FuguReviewError` carrying a
locale-independent `code`; `fuguErrorMessage(error, t)` in `src/lib/fuguReviewError.ts`
resolves that code against the active dictionary at the call site in `DrillDeckPage`. An
error message supplied by the local review server is shown verbatim instead, since the
server knows more about the specific failure than the client does. Covered by
`npm run test:locale`.

### L. `aria-label` / `alt` — **translated**
Main navigation, mobile navigation, progress rail, session progress, PC shortcuts,
stuck-reason group, self-evaluation, 30s/90s answer grid, FUGU panels, glossary summary,
concept diagram, glossary term open/close, bottom sheet, stakeholder scenarios, friction
words, expert dialogue phases, knowledge booth categories, choice list, progress bar.
No `alt` text exists in the app (no `<img>`); README images carry alt text.

### M. Question data — **DEFERRED**
| Dataset | Items | EN coverage |
|---|---|---|
| `beginnerChoiceQuestions` | 200 | 0 |
| `trainingQuestions` | 85 | 0 |
| `questions` (legacy drill bank) | — | 0 |

Not machine-translated. Japanese originals untouched, IDs unchanged. In the `en` locale
these modules show an explicit English notice stating that the item bank is
Japanese-only, rather than silently rendering Japanese inside an English page or showing
a blank. See "Deferred content policy" below.

### N. Concepts — **translated**. Glossary — **deferred**

| Dataset | Items | EN coverage | Fields |
|---|---|---|---|
| `concepts` | 39 | **100%** | `title`, `oneLine`, `departments`, `kpis`, `aiTouchpoint`, `caution`, plus the plain-language enrichment (summary, diagram, usage, example, AI connection) for the 15 that have it |
| `glossary` | 82 | 0% | — |

`whyImportant`, `thirtySecond`, and `miniQuestion` are template-derived in the Japanese
data rather than authored per concept, so `localizeConcept` applies equivalent English
templates instead of duplicating 39 generated sentences.

**Why the glossary is deferred rather than translated.** Every consumer of
`glossary.ts` — `GlossaryPopover`, `GlossaryBottomSheet`, `QuestionGlossaryPanel`, and
`glossaryMatcher` — is reached only from question text in `DrillDeckPage` or
`BeginnerChoicePage`. Both of those banks are Japanese-only (category M), so in the
English locale the glossary is unreachable: translating its 82 terms would add roughly
1 200 strings that no English screen can display today. It is therefore scheduled with
the question banks it serves, not separately. `glossaryCategoryLabels` *is* translated,
because it is UI-level.

Term IDs, aliases used for matching, and category keys are unchanged.

### O. Scenarios and dialogues — **translated**
| Dataset | Items |
|---|---|
| `scenarios` (stakeholder concerns) | 8 |
| `glossaryFrictions` (friction words) | 6 |
| `expertDialogues` | 5 |
| `decisionAuthority` | 5 |
| `explainDrills` | 10 |

### P. README / public description — **translated**
README restructured as English summary first, then Japanese overview. `index.html` title
and meta description switch with the locale at runtime.

## Deferred content policy

Rules observed for the deferred question banks:

1. Existing IDs are unchanged.
2. Japanese originals are never deleted or overwritten.
3. `ja` and `en` are structurally separate: English lives in id-keyed overlay modules
   under `src/i18n/content/`, never inline in the Japanese data files.
4. Manufacturing terminology is not generalized away (e.g. 直行率 → "first-pass yield",
   not "efficiency"; 出荷判定 → "shipment release decision", not "approval").
5. No wording implies AI decides. `human approval`, `human decision authority`,
   `decision authority` are preserved.
6. Safety, quality assurance, shipment, and line-stop responsibility boundaries are
   preserved verbatim in meaning.
7. Counts are verified mechanically by `scripts/auditI18nCoverage.ts`, which fails on any
   missing UI dictionary key and reports content coverage per dataset.

A partially translated state is **not** reported as "English version complete". The
publication verdict in the final report reflects the deferred question banks.

## Remaining work to reach full English parity

| Item | Units | Rough effort |
|---|---|---|
| `beginnerChoiceQuestions` — 200 × (prompt, 4 choices, explanation, whyCorrect, 3× whyWrong, keyTakeaway, caution, bridge, KPIs, departments) | ~3 990 strings | 3–4 focused sessions with terminology review |
| `trainingQuestions` — 85 × (title, prompt, situation, expectedAnswer, 2 model answers, keyPoints, ngPatterns, rubric, keywords, riskNotes, responsibilityBoundary) | ~940 strings | 2–3 sessions |
| `questions` legacy bank | ~390 strings | 1 session |
| `glossary` — 82 terms × (term, shortDefinition, plainExplanation, manufacturingContext, aiContext, caution, relatedKpis, relatedDepartments, usageSituation) | ~1 220 strings | 1-2 sessions, best done with the question banks |
| Native-speaker review of manufacturing terminology across all of the above | — | 1 review pass |

Translating the question banks — and, with them, the glossary they surface — is the only
blocker to declaring a complete English release.

## Verified coverage as built

`npm run audit:i18n` on this branch reports:

```text
ui string keys=541
ui formatter keys=34

Content datasets (English overlays)
- concepts: 39/39 (100%)
- scenarios: 8/8 (100%)
- glossaryFrictions: 6/6 (100%)
- expertDialogues: 5/5 (100%)
- decisionAuthority: 5/5 (100%)
- explainDrills: 10/10 (100%)

Deferred question banks (reported, not enforced)
- beginnerChoiceQuestions: 0/200 (0%)
- trainingQuestions: 0/85 (0%)
```

The audit exits non-zero if any `expectComplete` dataset regresses below 100%, or if any
English dictionary value is missing, empty, type-divergent, or still contains Japanese.
