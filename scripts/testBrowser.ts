/**
 * Browser regression suite.
 *
 * Starts Vite on a fixed port, drives Chromium through both locales, and shuts the
 * server down again — so `npm run test:browser` is a single self-contained command in
 * CI and locally.
 *
 * Scope (matches docs/i18n/i18n-inventory.md and the README's language-switching
 * contract):
 *   - every main screen renders in ja and in en
 *   - no Japanese leaks into English chrome
 *   - switching applies immediately, and <html lang> / title / meta description follow
 *   - the choice persists across a reload
 *   - ?lang=ja and ?lang=en both work and outrank the stored choice
 *   - an explicit but unsupported ?lang= falls back to Japanese
 *   - no horizontal overflow at 390 / 834 / 1440 px in English
 *   - answer -> explanation -> next -> weak -> bookmark -> Review Vault
 *   - zero console errors and zero page errors throughout
 */
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

const PORT = Number(process.env.TEST_BROWSER_PORT ?? 4390);
const BASE = `http://127.0.0.1:${PORT}`;
const LOCALE_KEY = "manufacturing-ai-cockpit-locale-v1";
const CJK = /[぀-ゟ゠-ヿ一-龯]/;
const VIEWS = ["Home", "Beginner", "Align", "Knowledge", "Map", "Train", "Explain", "Review"];

interface Result {
  ok: boolean;
  name: string;
  note?: string;
}

const results: Result[] = [];
const record = (ok: boolean, name: string, note?: string) => {
  results.push({ ok, name, note });
  // Printed as they happen: a suite that streams its progress tells you where it
  // stopped, which a summary-at-the-end suite cannot.
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  (${note})` : ""}`);
};
const expectTrue = (name: string, value: boolean, note?: string) => record(value, name, note);
const expectEqual = (name: string, actual: unknown, expected: unknown) =>
  record(
    actual === expected,
    name,
    actual === expected ? undefined : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  );

/**
 * Starts the dev server and resolves once it answers a request.
 *
 * The local Vite binary is launched directly rather than through `npx`: `npx` is a
 * wrapper process, so SIGTERM reaches the wrapper and leaves Vite orphaned, and its
 * still-attached stdio pipes then keep this process alive after the tests finish.
 * `detached` puts Vite in its own process group so the whole group can be signalled.
 */
const startServer = async (): Promise<ChildProcess> => {
  const viteBin = resolve(import.meta.dirname, "..", "node_modules", ".bin", "vite");
  if (!existsSync(viteBin)) {
    throw new Error(`Vite binary not found at ${viteBin}. Run \`npm ci\` first.`);
  }

  const child = spawn(
    viteBin,
    ["--host", "127.0.0.1", "--port", String(PORT), "--strictPort"],
    { stdio: ["ignore", "pipe", "pipe"], detached: true },
  );

  let log = "";
  child.stdout?.on("data", (chunk) => (log += String(chunk)));
  child.stderr?.on("data", (chunk) => (log += String(chunk)));

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Vite exited early (code ${child.exitCode}):\n${log}`);
    }
    try {
      const response = await fetch(BASE, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return child;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  await stopServer(child);
  throw new Error(`Vite did not become ready on ${BASE} within 60s:\n${log}`);
};

/** Signals the whole Vite process group, then releases its stdio handles. */
const signalGroup = (child: ChildProcess, signal: NodeJS.Signals) => {
  try {
    if (child.pid !== undefined) process.kill(-child.pid, signal);
  } catch {
    // Already gone, or the group no longer exists.
  }
};

const stopServer = async (child: ChildProcess) => {
  if (child.exitCode === null) {
    signalGroup(child, "SIGTERM");
    await new Promise<void>((done) => {
      const timer = setTimeout(() => {
        signalGroup(child, "SIGKILL");
        done();
      }, 5000);
      child.once("exit", () => {
        clearTimeout(timer);
        done();
      });
    });
  }
  // Detach the pipes explicitly: an attached stdio stream is a live libuv handle and
  // would keep Node running after the tests are done.
  child.stdout?.destroy();
  child.stderr?.destroy();
  child.unref();
};

/** Collects console errors and uncaught page errors for the lifetime of a page. */
/** Per-context timeouts: a stuck locator must fail fast, not hang the run. */
const ACTION_TIMEOUT_MS = 15_000;
const NAVIGATION_TIMEOUT_MS = 30_000;

const prepare = (context: BrowserContext) => {
  context.setDefaultTimeout(ACTION_TIMEOUT_MS);
  context.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
  return context;
};

const watchErrors = (page: Page, sink: string[]) => {
  page.on("console", (message) => {
    if (message.type() === "error") sink.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => sink.push(`pageerror: ${error.message}`));
};

const navigate = async (page: Page, label: string, mobile = false) => {
  const selector = mobile ? ".mobileTab" : ".navItem";
  await page.locator(selector, { hasText: new RegExp(`^${label}`) }).first().click();
  await page.waitForTimeout(250);
};

/**
 * Navigates and waits for the app shell to be present.
 *
 * `waitUntil: "networkidle"` is deliberately avoided: the Vite dev server holds an HMR
 * WebSocket open, so the network never goes idle and navigation stalls. Waiting for the
 * rendered shell is both faster and an actual assertion that React mounted.
 */
const open = async (page: Page, path: string) => {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.locator(".appShell").waitFor({ state: "visible" });
};

const htmlLang = (page: Page) => page.evaluate(() => document.documentElement.lang);
const metaDescription = (page: Page) =>
  page.evaluate(
    () => document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
  );

/**
 * Visible text of the app shell, excluding the language switcher and the
 * Japanese-only-content notice action. Both intentionally show the endonym 日本語 in
 * either locale, so including them would make a language-purity assertion meaningless.
 */
const chromeText = (page: Page) =>
  page.evaluate(() => {
    const shell = document.querySelector(".appShell");
    if (!shell) return "";
    const clone = shell.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".languageSwitcher, .localeNoticeAction").forEach((node) => node.remove());
    return clone.innerText;
  });

const run = async (browser: Browser) => {
  const errors: string[] = [];

  // --- both locales render every main screen ------------------------------------
  for (const locale of ["ja", "en"] as const) {
    const context = prepare(await browser.newContext({ viewport: { width: 1440, height: 1000 } }));
    const page = await context.newPage();
    watchErrors(page, errors);
    await open(page, `/?lang=${locale}`);

    for (const view of VIEWS) {
      await navigate(page, view);
      expectTrue(`${locale}: ${view} renders`, await page.locator(".page").first().isVisible());

      if (locale === "en") {
        const text = await chromeText(page);
        const leak = text.match(/.{0,30}[぀-ゟ゠-ヿ一-龯].{0,30}/)?.[0];
        expectTrue(`en: ${view} has no Japanese in chrome`, !CJK.test(text), leak);
      }
    }
    await context.close();
  }

  // --- switching is immediate and updates document metadata ---------------------
  {
    const context = prepare(await browser.newContext({ viewport: { width: 1440, height: 1000 } }));
    const page = await context.newPage();
    watchErrors(page, errors);
    await open(page, "/?lang=ja");

    const jaTitle = await page.locator(".homeHeroCopy h1").innerText();
    const jaDocTitle = await page.title();
    const jaMeta = await metaDescription(page);
    expectEqual("ja: html lang is ja", await htmlLang(page), "ja");
    expectTrue("ja: document title is Japanese", CJK.test(jaDocTitle));
    expectTrue("ja: meta description is Japanese", CJK.test(jaMeta));

    await page.locator(".languageOption[lang=en]").click();
    await page.waitForTimeout(200);

    const enTitle = await page.locator(".homeHeroCopy h1").innerText();
    expectTrue("switching applies without a reload", enTitle !== jaTitle && !CJK.test(enTitle));
    expectEqual("html lang updates on switch", await htmlLang(page), "en");
    expectTrue("document title updates on switch", (await page.title()) !== jaDocTitle);
    expectTrue("document title is English after switch", !CJK.test(await page.title()));
    expectTrue("meta description updates on switch", !CJK.test(await metaDescription(page)));
    expectTrue("?lang= is written into the URL on switch", page.url().includes("lang=en"));

    // --- the choice persists across a reload with no query parameter ------------
    await open(page, "/");
    expectEqual("stored choice survives a reload", await htmlLang(page), "en");
    expectEqual(
      "the locale is persisted in localStorage",
      await page.evaluate((key) => localStorage.getItem(key), LOCALE_KEY),
      "en",
    );

    // --- ?lang= outranks the stored choice in both directions -------------------
    await open(page, "/?lang=ja");
    expectEqual("?lang=ja overrides a stored en", await htmlLang(page), "ja");
    await open(page, "/?lang=en");
    expectEqual("?lang=en overrides a stored ja", await htmlLang(page), "en");

    // --- an explicit but unsupported ?lang= falls back to Japanese --------------
    // The stored choice here is "en", so falling through would yield en; the contract
    // requires ja.
    await open(page, "/?lang=fr");
    expectEqual("?lang=fr with a stored en falls back to ja", await htmlLang(page), "ja");
    await open(page, "/?lang=invalid");
    expectEqual("?lang=invalid falls back to ja", await htmlLang(page), "ja");
    await open(page, "/?lang=");
    expectEqual("an empty ?lang= falls back to ja", await htmlLang(page), "ja");

    // --- keyboard operation of the switcher ------------------------------------
    await open(page, "/?lang=ja");
    expectTrue("switcher exposes a radiogroup", (await page.locator("[role=radiogroup]").count()) > 0);
    await page.locator(".languageOption[lang=ja]").focus();
    expectEqual(
      "the selected option is the group's tab stop",
      await page.locator(".languageOption[lang=ja]").getAttribute("tabindex"),
      "0",
    );
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(150);
    expectEqual("ArrowRight moves the selection", await htmlLang(page), "en");
    expectTrue(
      "focus follows the selection",
      await page.locator(".languageOption[lang=en]").evaluate((el) => el === document.activeElement),
    );
    expectEqual(
      "aria-checked tracks the selection",
      await page.locator(".languageOption[lang=en]").getAttribute("aria-checked"),
      "true",
    );
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(150);
    expectEqual("ArrowLeft moves back", await htmlLang(page), "ja");
    await page.locator(".languageOption[lang=en]").focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(150);
    expectEqual("Enter selects an option", await htmlLang(page), "en");

    await context.close();
  }

  // --- browser-language fallback, in a context with no stored choice ------------
  for (const [locale, expected] of [
    ["fr-FR", "ja"],
    ["en-GB", "en"],
    ["ja-JP", "ja"],
  ] as const) {
    const context = prepare(await browser.newContext({
      locale,
      viewport: { width: 1280, height: 900 },
    }));
    const page = await context.newPage();
    watchErrors(page, errors);
    await open(page, "/");
    expectEqual(`a ${locale} browser with nothing stored resolves to ${expected}`, await htmlLang(page), expected);
    await context.close();
  }

  // --- no horizontal overflow in English at three widths -----------------------
  for (const width of [390, 834, 1440]) {
    const context = prepare(await browser.newContext({ viewport: { width, height: 900 } }));
    const page = await context.newPage();
    watchErrors(page, errors);
    await open(page, "/?lang=en");

    let worst = 0;
    let worstView = "";
    for (const view of VIEWS) {
      await navigate(page, view, width <= 820);
      const [scrollWidth, clientWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      if (scrollWidth - clientWidth > worst) {
        worst = scrollWidth - clientWidth;
        worstView = view;
      }
    }
    expectTrue(
      `en: no horizontal overflow at ${width}px`,
      worst <= 0,
      worst > 0 ? `${worst}px on ${worstView}` : undefined,
    );
    await context.close();
  }

  // --- regression path: answer -> explanation -> next -> weak -> bookmark -> vault
  {
    const context = prepare(await browser.newContext({ viewport: { width: 1440, height: 1000 } }));
    const page = await context.newPage();
    watchErrors(page, errors);
    await open(page, "/?lang=ja");

    await navigate(page, "Beginner");
    await page.locator(".beginnerModeCard").first().click();
    await page.waitForTimeout(400);
    expectTrue("a beginner session starts", await page.locator(".choiceCardList").isVisible());

    await page.locator(".choiceCard").first().click();
    await page.waitForTimeout(350);
    expectTrue("answering reveals the confirmation panel", await page.locator(".feedbackPanel").isVisible());
    expectTrue(
      "the confirmation panel includes the explanation",
      (await page.locator(".feedbackPanel").innerText()).includes("解説"),
    );

    await page.locator("button", { hasText: /^次へ$/ }).first().click();
    await page.waitForTimeout(300);
    expectTrue("next advances to another question", await page.locator(".choiceCardList").isVisible());

    await page.locator("button", { hasText: /^後で復習$/ }).first().click();
    await page.waitForTimeout(200);
    const beginnerKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => key.includes("beginner")),
    );
    expectTrue("beginner progress is written to localStorage", beginnerKeys.length > 0, beginnerKeys.join(","));

    await navigate(page, "Knowledge");
    await page.locator(".conceptCard").first().click();
    await page.waitForTimeout(150);
    await page.locator(".detailActions button").nth(1).click();
    await page.waitForTimeout(150);
    expectTrue(
      "bookmarking toggles the button label",
      (await page.locator(".detailActions button").nth(1).innerText()).includes("解除"),
    );
    await page.locator(".detailActions button").first().click();
    await page.waitForTimeout(200);
    expectTrue(
      "marking a concept understood updates the progress rail",
      (await page.locator(".railSummary strong").first().innerText()) !== "0/39",
    );

    await navigate(page, "Review");
    expectTrue("Review Vault lists the bookmarked card", (await page.locator(".reviewItem").count()) > 0);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator(".appShell").waitFor({ state: "visible" });
    await navigate(page, "Review");
    expectTrue("progress survives a reload", (await page.locator(".reviewItem").count()) > 0);

    await navigate(page, "Train");
    expectEqual(
      "the FUGU panel stays hidden while the dev flag is off",
      await page.locator(".fuguReviewPanel").count(),
      0,
    );

    await context.close();
  }

  expectTrue("no console errors and no page errors during the run", errors.length === 0, errors.slice(0, 5).join(" | "));
};

const main = async () => {
  const server = await startServer();
  const browser = await chromium.launch();
  try {
    await run(browser);
  } finally {
    await browser.close();
    await stopServer(server);
  }

  const failed = results.filter((result) => !result.ok);
  for (const result of results) {
    console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.name}${result.note ? `  (${result.note})` : ""}`);
  }
  console.log("");
  console.log(`Browser tests: ${results.length - failed.length}/${results.length} passed`);

  if (failed.length) {
    console.error("");
    console.error("Browser tests FAILED");
  }

  // Explicit exit: the suite has produced its verdict, and a stray handle from the dev
  // server or the browser must not turn a finished run into a hung CI job.
  process.exit(failed.length ? 1 : 0);
};

await main();
