# UI/UX audit — 2026-07-25

Baseline: `29f289c` running locally at 1440×1000 (desktop), 834×1112 (tablet),
390×844 (mobile). Findings were reproduced in the browser, not inferred from source.

## Product framing used for judgement

> A Manufacturing AI Cockpit for surfacing where the shop floor, quality assurance,
> IT/DX, and management disagree — and for learning where human approval and decision
> authority must stay when AI is introduced.

Design direction: manufacturing control room, decision support. Precise, trustworthy,
calm. Quality / safety / responsibility boundaries carry more weight than AI spectacle.
No cyberpunk styling. A recruiter must understand the product in three minutes. The
layout must hold in both Japanese and English.

## Severity legend

- **critical** — content is unreadable/unusable, or the product reads as broken.
- **major** — value is understood late, or a device class degrades badly.
- **minor** — polish; safe to defer.

---

## critical

### C-1 — Progress rail is white-on-white (invisible content)

- **Screen:** all screens (right rail `ProgressPanel`)
- **Problem:** `src/styles.css` carries two theme layers. The original dark theme sets
  `.metricRow strong, .metricRow span { color: var(--white) }`, `.railSummary strong
  { color: var(--white) }`, `.panelHeader p { color: var(--white) }`, and
  `.ringText` inherits white. The later `/* v0.2 MVP */` block re-themes
  `--sidebar` to `#ffffff` and repaints `.progressPanel/.metricRow/.railSummary`
  backgrounds to `var(--card)` (white) — but never overrides those white text colours.
  Measured in-browser: `.metricRow strong` → `rgb(255,255,255)` on a white card;
  `.ringText` → `rgba(255,255,255,0.62)`.
- **User impact:** the entire progress panel — Knowledge / Structure / Process / Risk /
  Explain metrics, percentages, concept and question counts — renders as blank boxes.
  Contrast ratio 1.0:1. The single most product-defining widget (progress across five
  competences) is invisible on every screen. A recruiter sees five empty circles.
- **Recommended fix:** in the v0.2 layer, override the rail text colours to
  `var(--text)` / `var(--muted)` and set `.ringText` to `var(--text)`. Add the metric
  label and value as real text next to each ring.
- **Cost:** small (CSS only).
- **Fix in this pass:** yes.

### C-2 — Mobile tab bar collapses into an unusable strip

- **Screen:** all screens at ≤820 px (`.mobileTabBar`)
- **Problem:** eight labels are laid into one row without scroll or wrap. At 390 px each
  tab gets ~45 px, the `.mobileTabDot` indicator detaches from its label, and the bar
  overlaps page content at the bottom of the viewport.
- **User impact:** primary navigation is unreadable and untappable on phones; tap
  targets fall far below the 44 px minimum. Reproduced at 390×844 — labels render as a
  single run-on line "Home Beginner Align Knowledge Map Train Explain Review".
- **Recommended fix:** make the bar horizontally scrollable with fixed-width tabs
  (≥64 px, ≥44 px tall), keep the active tab scrolled into view, give the bar a solid
  background plus safe-area padding, and reserve bottom padding on `.page` so content
  is never covered.
- **Cost:** small–medium (CSS only).
- **Fix in this pass:** yes.

### C-3 — Hero heading overflows its column

- **Screen:** Cockpit, Drill Deck top bar, result screens
- **Problem:** `.homeHeroCopy h1 { font-size: clamp(32px, 4vw, 58px) }` with no
  `overflow-wrap`. At 1440 px the heading box is 335 px wide but "Manufacturing" alone
  renders ~380 px at 58 px, so the word escapes the card and is clipped by the adjacent
  `.todayPanel`. Measured: h1 box `335.6 px` wide inside a `781.6 px` hero.
- **User impact:** the first thing a visitor reads is a broken product name. This gets
  strictly worse in English, where every heading is a long unhyphenated word run.
- **Recommended fix:** lower the clamp ceiling, add `overflow-wrap: anywhere` and
  `hyphens: auto` to display headings, and widen the hero copy column.
- **Cost:** small.
- **Fix in this pass:** yes.

### C-4 — Product value is not stated in the first screen

- **Screen:** Cockpit
- **Problem:** the hero reads `v0.2 MVP` / "Manufacturing AI Training" / a sentence about
  drilling vocabulary, departments, KPIs and PoC decisions in beginner and intermediate
  question sets. It describes a *quiz app*. Nothing in the first viewport mentions
  stakeholder misalignment, human approval gates, or decision authority — the actual
  product thesis, and the thing the README leads with.
- **User impact:** a recruiter's first 30 seconds produce "flashcard app", not
  "decision-support cockpit for manufacturing AI alignment". The strongest
  differentiator (responsibility boundaries) sits at the very bottom of the page in a
  small caution box, below six other sections.
- **Recommended fix:** restate the hero around the alignment/approval thesis, add a
  short "what this is / who it's for" line, promote the human-approval stance into the
  first viewport as a first-class panel rather than a footnote, and label the eyebrow
  with the product category instead of an internal version number.
- **Cost:** medium (copy + layout).
- **Fix in this pass:** yes.

### C-5 — Application is Japanese-only

- **Screen:** all
- **Problem:** every user-facing string is hard-coded Japanese; `<html lang="ja">` and
  the document title are static. Approximately 7 700 Japanese string literals exist
  across `src/`, of which ~460 are UI chrome and ~5 300 are question-bank content.
- **User impact:** the portfolio cannot be read by non-Japanese reviewers at all.
- **Recommended fix:** typed locale dictionaries with a `ja`/`en` switch, URL and
  `localStorage` precedence, dynamic `lang`/`title`/`meta description`.
- **Cost:** large.
- **Fix in this pass:** yes for infrastructure, UI chrome, and small/medium datasets;
  question banks are explicitly deferred and reported (see `docs/i18n/i18n-inventory.md`).

---

## major

### M-1 — No global focus-visible style

- **Screen:** all
- **Problem:** only three selectors define `:focus-visible`
  (`.choiceCard[role="button"]`, `.glossaryChip`, `.canvasField textarea:focus`).
  Every other button, nav item, tab, chip and `details` summary falls back to the UA
  default outline, which is nearly invisible against the accent and card colours.
- **User impact:** keyboard users lose their position while navigating an app whose
  primary interaction is button-driven. Reproduced: first `Tab` lands on a button whose
  computed outline is `auto 1px rgb(16,16,16)` — effectively unreadable on dark accents.
- **Recommended fix:** one global `:focus-visible` rule with a 2 px accent outline plus
  offset, applied to all interactive roles.
- **Cost:** small.
- **Fix in this pass:** yes.

### M-2 — Cards are uniform; no visual priority

- **Screen:** Cockpit
- **Problem:** the hero, two learning-mode cards, four stat cards, four mode cards, and
  three support panels all share the same white card, same border, same radius, same
  shadow. Only `.learningModeCard.primary` differs, and only by border tint.
- **User impact:** with ~14 equal-weight cards stacked vertically, there is no reading
  order and no obvious next action. Everything looks equally important, so nothing does.
- **Recommended fix:** establish three tiers — one primary action surface, secondary
  module cards, and quiet metric/support surfaces — differentiated by background, border
  weight and type scale rather than by shadow alone.
- **Cost:** medium.
- **Fix in this pass:** yes.

### M-3 — Progress states do not distinguish complete / in-progress / not-started

- **Screen:** Cockpit, Knowledge Booth, Review Vault
- **Problem:** Knowledge Booth concept cards show only the words `Complete` / `Open`;
  Cockpit category meters show raw counts with no completion indication; progress rings
  render identically at 0 % and are (per C-1) invisible anyway.
- **User impact:** a learner cannot tell what is finished, what is partially done, and
  what is untouched — which is the core loop of the product.
- **Recommended fix:** explicit tri-state treatment (done / in progress / not started)
  with a colour plus a non-colour cue, and completion ratios on category meters.
- **Cost:** medium.
- **Fix in this pass:** partially — Cockpit and the progress rail are addressed; the
  Knowledge Booth card treatment is improved but its per-booth breakdown is deferred.

### M-4 — Current location is weak outside the sidebar

- **Screen:** all
- **Problem:** the active nav item is marked only by a pale background tint
  (`--hint-bg`, a very light green). No page-level breadcrumb or title echo ties the
  main stage to the nav. On mobile the indicator dot detaches (see C-2).
- **User impact:** on wide screens with long pages, users lose track of which module
  they are in.
- **Recommended fix:** stronger active affordance (accent left border plus weight),
  `aria-current="page"` on the active nav item, and a consistent page eyebrow.
- **Cost:** small.
- **Fix in this pass:** yes.

### M-5 — Information density too high below the fold on Cockpit

- **Screen:** Cockpit
- **Problem:** seven distinct sections on one page: hero + today panel, two learning-mode
  cards, four stat cards, four mode cards, three support panels, caution box. The four
  stat cards restate numbers already shown in the learning-mode cards
  (answered / accuracy / weak / today).
- **User impact:** the page is long and repetitive; the eye has nowhere to rest and
  duplicated metrics reduce trust in the numbers.
- **Recommended fix:** remove the duplicated stat row, group the remainder into clearly
  titled bands with generous separation.
- **Cost:** small–medium.
- **Fix in this pass:** yes.

### M-6 — Long English text will break several fixed layouts

- **Screen:** Cockpit mode cards, Alignment Studio chip rails, Knowledge Booth cards,
  Map Room nodes
- **Problem:** several components size on the assumption of compact Japanese labels —
  `.mapNode` and `.alignmentChip` rely on short strings; `.categoryMeter` is a two-column
  row; button labels are short verbs. English equivalents are 2–3× longer.
- **User impact:** clipped labels, misaligned rows, and overflowing chip rails once the
  English locale ships.
- **Recommended fix:** allow wrapping on chips and nodes, replace fixed widths with
  `minmax()` grids, set `min-width: 0` on grid children, and verify at 390/834/1440 px in
  English.
- **Cost:** medium.
- **Fix in this pass:** yes.

### M-7 — Save-failure notice is easy to miss

- **Screen:** all (`.storageNotice` in `App.tsx`)
- **Problem:** the localStorage write-failure banner renders as a plain inline bar at the
  very top of the main stage with `role="status"`, no icon, and no distinct colour tier.
- **User impact:** a learner can invest a full session and never notice that nothing is
  being saved. `role="status"` is also the wrong politeness level for a failure.
- **Recommended fix:** give it a warning treatment with an icon, keep it sticky within
  the stage, and use `role="alert"`.
- **Cost:** small.
- **Fix in this pass:** yes.

---

## minor

### m-1 — Sidebar brand block wraps awkwardly
"Manufacturing AI Training" wraps to two lines against the 42 px mark, misaligning the
sub-label. **Fix in this pass:** yes (part of the shell refresh).

### m-2 — `v0.2 MVP` eyebrow leaks internal versioning
An internal milestone label is the first text a visitor reads. **Fix in this pass:** yes.

### m-3 — Empty states are text-only
The seven Review Vault sections and the Knowledge Booth detail panel show a bare
title + sentence with no next action, so a fresh profile looks like a broken page.
**Fix in this pass:** yes for Review Vault (each section already has an action button;
the empty state now reads as guidance rather than absence). Icon treatment deferred.

### m-4 — Mixed metric vocabulary
The rail uses English competence names (Knowledge / Structure / Process / Risk /
Explain) while the page body is Japanese. Resolved as a side effect of localization.
**Fix in this pass:** yes.

### m-5 — Intermediate category meters print raw enum values
`trainingQuestionCountsByCategory` keys are Japanese `TrainingCategory` union members
rendered directly, so they cannot be localized without a display map.
**Fix in this pass:** yes (display map added).

### m-6 — 896 kB single JS chunk
Exceeds Vite's warning threshold; affects first paint on mobile networks.
**Fix in this pass:** no — code-splitting is out of scope and risks touching every page.

### m-7 — 40 beginner questions have no detected primary glossary term
Pre-existing `audit:glossary` warning. Content curation, not UI.
**Fix in this pass:** no.

---

## Summary

| Severity | Found | Fixing now | Deferred |
|---|---|---|---|
| critical | 5 | 5 | 0 |
| major | 7 | 7 (M-3 partial) | 0 |
| minor | 7 | 5 | 2 |

Deferred items (m-6 bundle size, m-7 glossary coverage warnings) are both pre-existing
at `29f289c`, are content/build concerns rather than UI defects, and are recorded in
`docs/audit/source-and-live-parity-20260725.md` §6.
