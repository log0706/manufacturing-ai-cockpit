# Publication Readiness Checklist

This project is currently a local canonical source, not a Git repository. For external recruiter review, publish from a new sanitized repository rather than turning this working folder directly into a public source tree.

## Recommended allowlist

Include:

- `src/`
- `server/` if the optional local FUGU review helper is intentionally included
- `scripts/`
- `docs/`
- `index.html`
- `.env.example`
- `.gitignore`
- `eslint.config.js`
- `netlify.toml`
- `package.json`
- `package-lock.json`
- `README.md`
- `tsconfig*.json`
- `vite.config.ts`

Exclude:

- `AGENTS.md`
- `audit/`
- `reports/`
- `.playwright-cli/`
- `preview-*.log`
- `node_modules/`
- existing `dist/`
- `.env`, `.env.local`, `.env.*` except `.env.example`
- any internal orchestration, scratch, review-only, test-work, or zip-verify folders

## Secret and PII checks

Run equivalent scans against the final public copy before `git init` or before the first public push:

```bash
# Examples only; use available local tools.
grep -RInE 'BEGIN (RSA|OPENSSH|EC|DSA)? ?PRIVATE KEY|ghp_[A-Za-z0-9_]+|github_pat_|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}' .
grep -RInE '(/home/[^/[:space:]]+|C:\\Users\\[^\\[:space:]]+|wsl\.localhost|実クライアント|顧客名)' .
```

Expected result: no real secrets, no personal access tokens, no real client names, and no local absolute paths in public-facing files.

## Verification commands

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` currently runs the domain-data audit scripts. If a browser test suite is added later, keep these audits as part of CI because the app value depends heavily on data quality.

## Screenshot checklist

- No browser bookmarks, account names, local file paths, API keys, or private notes visible.
- Include synthetic/demo-data statement where appropriate.
- Capture both overall navigation and one detailed answer/review flow.
- Prefer 1440px desktop screenshots plus one mobile-width screenshot if time permits.

## Publication decision points

Do not publish until the owner approves:

1. public repository name,
2. whether to include the optional `server/` FUGU review helper,
3. continued use of the MIT License,
4. final screenshots/video,
5. final secret/PII scan result,
6. final lint/typecheck/test/build result.
