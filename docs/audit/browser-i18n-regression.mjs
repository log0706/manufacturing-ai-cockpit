#!/usr/bin/env node
/**
 * Browser i18n + regression evidence entry point.
 *
 * This path is referenced from the PR description and the audit notes as the
 * browser-level evidence for this branch. It is deliberately a thin shim rather than a
 * second copy of the checks: the maintained suite lives in `scripts/testBrowser.ts` and
 * runs in CI via `npm run test:browser`.
 *
 * The first version of this file was a standalone ad-hoc script, and it had two defects
 * that made it unfit to keep frozen:
 *
 *   1. it imported Playwright from an absolute path inside one container
 *      (`/opt/node22/lib/node_modules/playwright`), so it could not run anywhere else;
 *   2. it asserted the older locale rule, where an unsupported `?lang=` fell through to
 *      the stored preference. The current contract resolves an explicit unsupported
 *      `?lang=` to Japanese, so that assertion is now wrong.
 *
 * Delegating keeps one suite as the single source of truth.
 *
 * Usage:
 *   node docs/audit/browser-i18n-regression.mjs
 *   npm run test:browser          # identical, and the form CI uses
 */
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const child = spawn("npm", ["run", "test:browser"], {
  cwd: repoRoot,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Browser suite terminated by signal ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(`Could not start the browser suite: ${error.message}`);
  process.exit(1);
});
