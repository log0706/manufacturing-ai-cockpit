# Screenshots

Bilingual screenshots live in `ja/` and `en/`, captured at identical viewports so the
two locales can be compared side by side.

| File | Screen | Viewport |
|---|---|---|
| `01-cockpit.png` | Cockpit — first screen, human-approval boundary panel, module cards | 1440 × 980 |
| `02-alignment-studio.png` | Alignment Studio — stakeholder concerns, friction words, decision boundary | 1440 × 980 |
| `03-map-room.png` | Map Room — ERP / MES / MOM / PLM / QMS / SCADA / PLC / OT relationships | 1440 × 980 |
| `04-answer-confirmation.png` | Answer confirmation — correct answer, why, explanation, takeaway, caution | 1440 × 980 |
| `05-review-vault.png` | Review Vault — weak items, bookmarks, empty states, reset | 1440 × 980 |
| `06-cockpit-mobile.png` | Cockpit on a phone, including the scrollable tab bar | 390 × 844 |
| `07-language-switcher.png` | The ja/en switch in the sidebar | cropped from 1440 × 980 |

All captures use `deviceScaleFactor: 2`.

## `04-answer-confirmation.png` differs between locales — deliberately

The 200-item beginner bank and the 85-item intermediate bank are Japanese-only for now
(see [`../i18n/i18n-inventory.md`](../i18n/i18n-inventory.md)). So:

- `ja/04-answer-confirmation.png` shows the real answer-confirmation panel.
- `en/04-answer-confirmation.png` shows what an English reader actually sees on that
  module: an explicit notice that the bank has not been translated, plus a switch back
  to Japanese.

The pair keeps the same filename because that *is* the honest English state of that
screen today. It is not a missing screenshot.

## How these were captured

Progress is seeded first (bookmark a concept, mark it understood, self-score an
explanation drill) so Review Vault shows populated sections alongside its empty states
rather than an all-empty page.

The capture script is not committed because Playwright is not a project dependency. To
reproduce, run the app and drive it with any browser automation at the viewports above:

```bash
npm run dev          # http://127.0.0.1:5173
# then visit ?lang=ja and ?lang=en and capture the seven screens
```

## Safety checks before using screenshots externally

- Use only synthetic demo content — all app content already is.
- Hide browser chrome if it contains personal bookmarks or account names.
- Do not show `.env.local`, terminal tokens, local absolute paths, or private notes.
- These screenshots are of the local build on this branch. They do **not** claim to match
  the current Netlify deployment — that comparison is unresolved, see
  [`../audit/source-and-live-parity-20260725.md`](../audit/source-and-live-parity-20260725.md).
