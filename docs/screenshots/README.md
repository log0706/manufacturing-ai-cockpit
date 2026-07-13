# Screenshot Capture Guide

Place final recruiter-facing screenshots in this folder.

## Recommended files

1. `01-cockpit.png`  
   Show the main navigation, progress rail, and module cards. This proves the app is more than a single page.

2. `02-alignment-studio.png`  
   Show stakeholder concerns, better/worse responses, and the agreement canvas. This highlights the business/domain design.

3. `03-answer-confirmation.png`  
   Show a question, answer/result state, explanation, glossary or responsibility-boundary content. This highlights interaction and feedback design.

4. `04-review-vault.png`  
   Show weak questions, bookmarks, review counts, or reset confirmation. This highlights state management and review loops.

## Safety checks before using screenshots externally

- Use only synthetic demo content.
- Hide browser chrome if it contains personal bookmarks or account names.
- Do not show `.env.local`, terminal tokens, local absolute paths, or private notes.
- If the Netlify demo is used, make sure the visible content matches the README claims.

## Suggested capture flow

```bash
npm run dev
# Open the Vite local URL in a browser.
```

Then navigate:

1. Cockpit
2. Alignment Studio
3. Beginner Choice or Drill Deck
4. Review Vault

Use a consistent viewport such as 1440 x 1000 for desktop screenshots.
