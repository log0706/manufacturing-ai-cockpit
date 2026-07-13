# Architecture

Manufacturing AI Cockpit is intentionally simple: a static React application with typed domain data and browser-local progress. The architecture is designed to be safe to show publicly because the default path does not require a backend, login, database, customer data, or production equipment connection.

## System overview

```text
Browser user
  -> Vite / React / TypeScript app
      -> Pages
          -> Cockpit
          -> Alignment Studio
          -> Beginner Choice
          -> Drill Deck
          -> Explain Gym
          -> Knowledge Booth
          -> Map Room
          -> Review Vault
      -> Components
          -> AppShell
          -> Glossary popover / bottom sheet
          -> UI cards and progress rings
      -> Domain data
          -> concepts / glossary / questions / scenarios / decision authority
      -> Hooks
          -> useProgress
          -> useBeginnerChoiceProgress
          -> useTrainingProgress
      -> browser localStorage
```

## Optional development-only AI review path

```text
Drill Deck answer
  -> fuguReviewClient.ts
      -> local Express server on 127.0.0.1
          -> external model endpoint configured by server-side env vars
          -> normalized JSON review result
      -> localStorage review cache
```

This path is disabled by default. The UI enables it only when both conditions are true:

1. the app is running in Vite development mode, and
2. `VITE_FUGU_ENABLED=true` is set locally.

The public static frontend does not need the Express server.

## Design decisions

| Decision | Reason |
|---|---|
| Static first | Recruiters can inspect and run the app without service credentials. |
| TypeScript data modules | Domain content is reviewable, typed, and auditable. |
| Local progress | No account, server, or personal data collection is needed. |
| Data audit scripts | Large learning datasets can be checked for count, IDs, required fields, and unsafe wording. |
| Optional server-side AI review | API keys stay outside the browser bundle and the core app remains usable without AI. |
| Human approval boundary content | Manufacturing AI demos should not imply autonomous safety, quality, shipment, or equipment-control decisions. |

## Recruiter review path

A reviewer can evaluate the project in three passes:

1. **Product pass:** run the UI and navigate Cockpit -> Alignment Studio -> Drill Deck -> Review Vault.
2. **Implementation pass:** inspect React pages, hooks, typed data, and glossary matching utilities.
3. **Quality pass:** run lint, typecheck, data audits, and build.
