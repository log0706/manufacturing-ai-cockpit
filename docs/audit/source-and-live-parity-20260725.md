# Source / canonical / live parity audit — 2026-07-25

## Scope

Verify the three-way relationship between:

1. the GitHub source (`log0706/manufacturing-ai-cockpit`),
2. any local canonical working copy that is outside Git,
3. the public Netlify deployment (<https://manufacturing-ai-cockpit.netlify.app/>).

No application code was changed while producing this document.

## 1. Environment and baseline

| Item | Value |
|---|---|
| Repository | `log0706/manufacturing-ai-cockpit` |
| Visibility | public |
| Default branch | `main` |
| Remote URL | `http://local_proxy@127.0.0.1:<port>/git/log0706/manufacturing-ai-cockpit` (session git proxy for `github.com/log0706/manufacturing-ai-cockpit`) |
| Base SHA | `29f289c0af906847df11518ea1f9b91b85e60de3` (`feat: prepare manufacturing AI portfolio`) |
| `origin/main` SHA | `29f289c0af906847df11518ea1f9b91b85e60de3` (identical to base) |
| Working branch | `claude/ui-i18n-refresh-20260725-5apk5w` |
| Working tree at start | clean (`git status --short` empty) |
| Total commits in repo | 1 |
| Node.js | v22.22.2 |
| npm | 10.9.7 |
| Package manager | npm (`package-lock.json` committed, `npm ci` reproducible) |

Top-level directory structure at baseline:

```text
.env.example  LICENSE  README.md  eslint.config.js  index.html  netlify.toml
package.json  package-lock.json  tsconfig*.json  vite.config.ts
docs/     architecture.md, data-flow.md, human-approval-gates.md,
          publication-readiness.md, screenshots/{01..04}.png
scripts/  auditBeginnerChoiceQuestions.ts, auditGlossaryCoverage.ts, auditQuestionData.ts
server/   fuguReviewHash.ts, fuguReviewPrompt.ts, fuguReviewSchema.ts, fuguReviewServer.ts
src/      App.tsx, main.tsx, styles.css, types.ts
          components/ (11 files)  data/ (10 files)  hooks/ (3)  lib/ (5)
          pages/ (8)  types/ (2)  utils/ (1)
```

## 2. Local canonical entity — search result

The README states:

> 現行ローカルソースはGit管理外のcanonical実体です。

**Finding: no such out-of-Git canonical copy exists in this environment.**

Evidence:

- This session runs in an ephemeral remote container. The repository was cloned
  fresh at container start.
- `/home/user/` contains exactly one entry: `manufacturing-ai-cockpit`, which **is**
  the Git clone (`.git` present, working tree clean at `29f289c`).
- A filesystem search for other candidate directories
  (`find / -maxdepth 4 -name "manufacturing-ai*"`) returned only that path.

Per the instruction not to guess at a substitute canonical, **no other directory was
treated as canonical.** If the owner holds a newer non-Git working copy on their own
machine, it is not reachable from this session and this branch is *not* based on it.

Consequence: within this environment, the GitHub repository at `29f289c` is the only
existing source. It is self-consistent and complete — it installs, type-checks, lints,
passes all three content audits, and builds (see §3).

## 3. Local verification of the GitHub source

All commands run against a clean `npm ci` install of `29f289c`.

| Command | Result | Notes |
|---|---|---|
| `npm ci` | pass | lockfile resolved, no audit-blocking failure |
| `npm run lint` | pass | eslint, zero findings |
| `npm run typecheck` | pass | `tsc -b`, zero errors |
| `npm test` | pass | maps to the three content-audit scripts |
| → `audit:questions` | pass | `modelAnswer30Sec=85, modelAnswer90Sec=85, keyPoints=85, ngPatterns=85, mustIncludeKeywords=85, coreTopics=15` |
| → `audit:beginner` | pass | `questions=200`; categories `systems 40, departments 30, management_kpi 35, quality_maintenance_safety 35, ai_use_cases 35, poc_deployment 25`; answer balance `A:50 B:50 C:50 D:50` |
| → `audit:glossary` | pass with warnings | `beginnerQuestions=200, trainingQuestions=85`; 40 beginner questions have no auto-detected primary glossary term; 1 intermediate item (`compare-it-ot`) exceeds the 14-chip cap |
| `npm run build` | pass | `dist/index.html` 0.61 kB, CSS 58.56 kB, JS 896.61 kB (Vite warns >500 kB chunk) |

No command was skipped.

### 3.2 Local runtime check

`npm run dev` serves on `http://127.0.0.1:5173/`. All eight views render and are
reachable from the sidebar with **zero console errors and zero page errors**:

| View | Renders | Notes |
|---|---|---|
| Cockpit (`Home`) | yes | hero, two learning-mode cards, 4 stat cards, mode grid, 3 support panels, caution box |
| Beginner Choice | yes | 200-question bank, session start, answer → explanation flow |
| Alignment Studio | yes | stakeholder scenarios, friction words, expert dialogue, decision-authority table, Markdown canvas |
| Drill Deck (`Train`) | yes | 85 explanation cards, self-scoring, glossary panel, FUGU panel hidden (dev flag off) |
| Explain Gym | yes | 10 drills, 30 s / 3 min timer, self-score 1–5 |
| Knowledge Booth | yes | booth tabs, 39 concept cards, detail panel, mini-question |
| Map Room | yes | layered system map (ERP → MES/MOM/PLM/QMS → CMMS/EAM → SCADA/PLC/DCS/OT → departments) + 6 satellites |
| Review Vault | yes | 7 review sections, all currently in empty state on a fresh profile |

Data volumes observed in the running app match the audit scripts: 200 beginner
questions, 85 intermediate explanation questions, 39 concepts, 82 glossary terms,
10 explain drills, 8 stakeholder scenarios, 6 friction words, 5 decision-authority
rows, 5 expert-dialogue cards.

## 4. Comparison against the public Netlify deployment

**Status: BLOCKED — not verifiable from this session.**

`manufacturing-ai-cockpit.netlify.app` is not permitted by this session's outbound
egress policy. Both attempts failed at the proxy, not in the application:

```text
curl https://manufacturing-ai-cockpit.netlify.app/
  → curl: (56) CONNECT tunnel failed, response 403

agent proxy status → recentRelayFailures:
  { kind: "connect_rejected",
    detail: "gateway answered 403 to CONNECT (policy denial or upstream failure)",
    host: "manufacturing-ai-cockpit.netlify.app:443" }
```

Per the proxy's own guidance, an organization policy denial must be reported rather
than retried or routed around. No attempt was made to bypass it.

Therefore the following comparisons **could not be performed** and remain open for the
owner to confirm from an unrestricted network:

| Comparison item | Status |
|---|---|
| Page composition | not verified |
| Navigation | not verified |
| Modules displayed | not verified |
| Data counts | not verified |
| Layout | not verified |
| Colour / typography | not verified |
| Interaction flow | not verified |
| Responsive behaviour | not verified |
| README claims vs. live site | partially verified (source side only) |

### 4.1 What the owner can check in one step

Vite emits content-hashed asset names, so a hash match is a byte-level proof that the
deployment was built from this commit. Building `29f289c` locally produces:

```text
dist/index.html                  <title>Manufacturing AI Training</title>, <html lang="ja">
dist/assets/index-CGqQA6ip.css   58 559 bytes   md5 c9e092779290217f66283a6d2e343a70
dist/assets/index-DZPWtvu-.js   896 614 bytes   md5 77d2a09c5625f504960cd54bd4de4304
```

If `view-source:` on the live site references `assets/index-CGqQA6ip.css` and
`assets/index-DZPWtvu-.js`, the deployment is built from `29f289c` and source-to-deploy
parity is confirmed. Different hashes mean the live build came from other sources.

**This check has not been performed and must not be recorded as passing.**

## 5. Determination

**B — the GitHub source is a valid base for this work.**

Reasoning:

- The GitHub source is complete, self-consistent, and passes every quality gate; it is
  the only source that exists in this environment (§2, §3).
- It is *not* upgraded to determination A, because the README's claim of an out-of-Git
  canonical copy could not be disproved — only shown to be unreachable here — and the
  live deployment could not be compared at all (§4).
- It is *not* C: there is no evidence of divergence. Divergence was not *observed*; it
  was simply not *testable*. Nothing in the source suggests it is stale.
- It is *not* D: source canonicity within this environment is determinable, and the
  build is reproducible and hash-verifiable.

Work therefore proceeds on `29f289c` as the base.

## 6. Open items carried to the owner

1. **Live parity check (blocking for publication claims).** Compare the live asset
   hashes to §4.1. Until done, no README or PR text may claim source-to-deploy parity.
2. **Local canonical reconciliation.** If a newer non-Git working copy exists on the
   owner's machine, this branch must be rebased onto it before merge; otherwise newer
   local work would be silently overwritten.
3. **Glossary audit warnings.** 40 beginner questions carry no auto-detected primary
   term, and `compare-it-ot` exceeds the chip cap. Pre-existing at `29f289c`, not
   introduced by this branch, and not fixed here.
4. **Bundle size.** 896 kB single JS chunk exceeds Vite's 500 kB warning threshold.
   Pre-existing; code-splitting is out of scope for this branch.
