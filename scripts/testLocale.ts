/**
 * Unit tests for locale resolution and the localized content resolvers.
 *
 * Runs on plain Node via tsx — no DOM and no test runner — which is why
 * `src/i18n/locale.ts` is kept pure and side-effect free.
 */
import {
  DEFAULT_LOCALE,
  localeFromSearch,
  htmlLang,
  normalizeLocale,
  readSearchLocale,
  resolveInitialLocale,
} from "../src/i18n/locale";
import { dictionaryFor } from "../src/i18n";
import { FuguReviewError, fuguErrorMessage } from "../src/lib/fuguReviewError";
import { FUGU_USER_ANSWER_MAX_LENGTH } from "../src/lib/fuguReviewSchema";
import { localizedConcepts, localizedScenarios, localizedDrills } from "../src/i18n/content";
import { concepts } from "../src/data/concepts";

let passed = 0;
const failures: string[] = [];

const check = (name: string, actual: unknown, expected: unknown) => {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) {
    passed += 1;
    return;
  }
  failures.push(`${name}\n    expected: ${b}\n    actual:   ${a}`);
};

const ok = (name: string, condition: boolean) => check(name, condition, true);

// --- normalizeLocale -------------------------------------------------------
check("normalizeLocale('ja')", normalizeLocale("ja"), "ja");
check("normalizeLocale('en')", normalizeLocale("en"), "en");
check("normalizeLocale('EN') is case-insensitive", normalizeLocale("EN"), "en");
check("normalizeLocale('  ja  ') trims", normalizeLocale("  ja  "), "ja");
check("normalizeLocale('en-US') drops the region", normalizeLocale("en-US"), "en");
check("normalizeLocale('ja-JP') drops the region", normalizeLocale("ja-JP"), "ja");
check("normalizeLocale('en_GB') accepts underscores", normalizeLocale("en_GB"), "en");
check("normalizeLocale('fr') is unsupported", normalizeLocale("fr"), null);
check("normalizeLocale('') is no signal", normalizeLocale(""), null);
check("normalizeLocale(null) is no signal", normalizeLocale(null), null);
check("normalizeLocale(undefined) is no signal", normalizeLocale(undefined), null);
check("normalizeLocale('zh-en') keeps the base subtag", normalizeLocale("zh-en"), null);

// --- localeFromSearch ------------------------------------------------------
check("localeFromSearch('?lang=en')", localeFromSearch("?lang=en"), "en");
check("localeFromSearch('?lang=ja')", localeFromSearch("?lang=ja"), "ja");
check("localeFromSearch with other params", localeFromSearch("?a=1&lang=en&b=2"), "en");
check("localeFromSearch('?lang=fr') is ignored", localeFromSearch("?lang=fr"), null);
check("localeFromSearch('') is no signal", localeFromSearch(""), null);
check("localeFromSearch('?x=1') is no signal", localeFromSearch("?x=1"), null);

// --- readSearchLocale: absent vs present-but-unsupported must stay distinguishable ---
check("readSearchLocale('') is absent", readSearchLocale(""), { kind: "absent" });
check("readSearchLocale('?x=1') is absent", readSearchLocale("?x=1"), { kind: "absent" });
check("readSearchLocale('?lang=en') is supported", readSearchLocale("?lang=en"), {
  kind: "supported",
  locale: "en",
});
check("readSearchLocale('?lang=fr') is unsupported", readSearchLocale("?lang=fr"), {
  kind: "unsupported",
  raw: "fr",
});
check("readSearchLocale('?lang=') is unsupported, not absent", readSearchLocale("?lang="), {
  kind: "unsupported",
  raw: "",
});

// --- precedence: URL > stored > browser > default --------------------------
check(
  "URL beats both stored and browser",
  resolveInitialLocale({ search: "?lang=en", stored: "ja", languages: ["ja-JP"] }),
  "en",
);
check(
  "URL beats stored in the other direction too",
  resolveInitialLocale({ search: "?lang=ja", stored: "en", languages: ["en-US"] }),
  "ja",
);
check(
  "stored beats browser when there is no URL param",
  resolveInitialLocale({ stored: "en", languages: ["ja-JP"] }),
  "en",
);
check(
  "browser is used when nothing is stored",
  resolveInitialLocale({ languages: ["en-GB", "ja"] }),
  "en",
);
check(
  "unsupported browser languages are skipped, not fatal",
  resolveInitialLocale({ languages: ["fr-FR", "de", "ja-JP"] }),
  "ja",
);
check("no signal at all falls back to Japanese", resolveInitialLocale({}), DEFAULT_LOCALE);
check("default locale is Japanese", DEFAULT_LOCALE, "ja");
// --- an explicit but unsupported ?lang= is authoritative: it resolves to Japanese
// rather than deferring to the stored choice or the browser. The four cases below are
// the contract stated in the README. ---
check(
  "?lang=fr with saved=en resolves to Japanese",
  resolveInitialLocale({ search: "?lang=fr", stored: "en", languages: ["en-US"] }),
  "ja",
);
check(
  "?lang=invalid with an en-US browser resolves to Japanese",
  resolveInitialLocale({ search: "?lang=invalid", languages: ["en-US"] }),
  "ja",
);
check(
  "no lang parameter with saved=en resolves to English",
  resolveInitialLocale({ stored: "en" }),
  "en",
);
check(
  "no lang parameter with an en-US browser resolves to English",
  resolveInitialLocale({ languages: ["en-US"] }),
  "en",
);
check(
  "an empty ?lang= is treated as an explicit unsupported value",
  resolveInitialLocale({ search: "?lang=", stored: "en", languages: ["en-US"] }),
  "ja",
);
check(
  "an unrelated query parameter does not suppress the stored choice",
  resolveInitialLocale({ search: "?utm_source=x", stored: "en" }),
  "en",
);
check(
  "a corrupted stored value falls through to the browser",
  resolveInitialLocale({ stored: "{}", languages: ["en"] }),
  "en",
);

// --- htmlLang --------------------------------------------------------------
check("htmlLang('ja')", htmlLang("ja"), "ja");
check("htmlLang('en')", htmlLang("en"), "en");

// --- dictionaries ----------------------------------------------------------
ok("ja dictionary resolves", dictionaryFor("ja").meta.title.length > 0);
ok("en dictionary resolves", dictionaryFor("en").meta.title.length > 0);
ok(
  "the two dictionaries differ",
  dictionaryFor("ja").cockpit.title !== dictionaryFor("en").cockpit.title,
);
ok(
  "en meta description is English",
  !/[぀-ゟ゠-ヿ一-龯]/.test(dictionaryFor("en").meta.description),
);

// --- FUGU errors: the client throws codes, the UI resolves them per locale -------
const jaDict = dictionaryFor("ja");
const enDict = dictionaryFor("en");
const CJK_RE = /[぀-ゟ゠-ヿ一-龯]/;

for (const code of ["emptyAnswer", "jsonParse", "timeout", "failed"] as const) {
  const error = new FuguReviewError(code);
  ok(`FUGU ${code} renders Japanese in ja`, CJK_RE.test(fuguErrorMessage(error, jaDict)));
  ok(`FUGU ${code} renders English in en`, !CJK_RE.test(fuguErrorMessage(error, enDict)));
  ok(
    `FUGU ${code} differs between locales`,
    fuguErrorMessage(error, jaDict) !== fuguErrorMessage(error, enDict),
  );
}

const tooLong = new FuguReviewError("tooLong", { max: FUGU_USER_ANSWER_MAX_LENGTH });
ok(
  "FUGU tooLong includes the character limit in ja",
  fuguErrorMessage(tooLong, jaDict).includes(String(FUGU_USER_ANSWER_MAX_LENGTH)),
);
ok(
  "FUGU tooLong includes the character limit in en",
  fuguErrorMessage(tooLong, enDict).includes(String(FUGU_USER_ANSWER_MAX_LENGTH)),
);
ok("FUGU tooLong renders English in en", !CJK_RE.test(fuguErrorMessage(tooLong, enDict)));
check(
  "a server-supplied message is shown verbatim rather than replaced",
  fuguErrorMessage(new FuguReviewError("failed", { serverMessage: "model unavailable" }), enDict),
  "model unavailable",
);
check(
  "an unexpected non-FuguReviewError still resolves to locale text",
  fuguErrorMessage(new TypeError("fetch failed"), enDict),
  enDict.errors.fuguFailed,
);
ok(
  "an unexpected error in ja does not leak the raw English exception",
  CJK_RE.test(fuguErrorMessage(new TypeError("fetch failed"), jaDict)),
);

// --- content resolvers -----------------------------------------------------
check(
  "ja concepts are the untouched source objects",
  localizedConcepts.ja[0] === concepts[0],
  true,
);
check(
  "en concepts preserve count and ids",
  localizedConcepts.en.map((c) => c.id),
  concepts.map((c) => c.id),
);
ok(
  "no en concept retains Japanese in its one-line definition",
  localizedConcepts.en.every((c) => !/[぀-ゟ゠-ヿ一-龯]/.test(c.oneLine)),
);
ok(
  "no en concept retains Japanese in its caution",
  localizedConcepts.en.every((c) => !/[぀-ゟ゠-ヿ一-龯]/.test(c.caution)),
);
ok(
  "en concepts derive whyImportant / thirtySecond / miniQuestion in English",
  localizedConcepts.en.every(
    (c) =>
      !/[぀-ゟ゠-ヿ一-龯]/.test(c.whyImportant) &&
      !/[぀-ゟ゠-ヿ一-龯]/.test(c.thirtySecond) &&
      !/[぀-ゟ゠-ヿ一-龯]/.test(c.miniQuestion.prompt),
  ),
);
// The plain-language enrichment is optional per concept, so a dropped overlay would be
// invisible at runtime. Assert the ja/en sets match and carry no Japanese.
const enriched = <T extends { juniorSummary?: string; conceptDiagram?: unknown; usageScene?: string[]; exampleScene?: string[]; aiConnection?: string }>(
  items: T[],
) =>
  items.filter(
    (c) =>
      c.juniorSummary || c.conceptDiagram || c.usageScene?.length || c.exampleScene?.length || c.aiConnection,
  );
check(
  "the same concepts carry plain-language enrichment in both locales",
  enriched(localizedConcepts.en).length,
  enriched(concepts).length,
);
ok(
  "no enriched en concept retains Japanese",
  localizedConcepts.en.every(
    (c) =>
      !/[぀-ゟ゠-ヿ一-龯]/.test(
        JSON.stringify([c.juniorSummary, c.conceptDiagram, c.usageScene, c.exampleScene, c.aiConnection]),
      ),
  ),
);
ok(
  "en scenarios keep the responsibility wording",
  localizedScenarios.en.some((s) => /shipment release/i.test(s.goodResponse)),
);
ok(
  "no en scenario retains Japanese",
  localizedScenarios.en.every((s) => !/[぀-ゟ゠-ヿ一-龯]/.test(s.concern + s.goodResponse)),
);
ok(
  "no en drill retains Japanese",
  localizedDrills.en.every(
    (d) => !/[぀-ゟ゠-ヿ一-龯]/.test(d.title + d.thirtySecondAnswer + d.threeMinuteAnswer),
  ),
);

// Wording guardrails from the brief: the English side must not overclaim.
const englishCorpus = [
  JSON.stringify(dictionaryFor("en")),
  JSON.stringify(localizedConcepts.en),
  JSON.stringify(localizedScenarios.en),
  JSON.stringify(localizedDrills.en),
].join(" ");

for (const banned of [
  "fully autonomous",
  "AI replaces human judgment",
  "guaranteed improvement",
  "production-ready MES",
  "real-time factory integration",
  "proven ROI",
]) {
  ok(`English content avoids "${banned}"`, !new RegExp(banned, "i").test(englishCorpus));
}

// --- report ----------------------------------------------------------------
console.log("Locale tests");
console.log(`passed=${passed}`);

if (failures.length) {
  console.error(`failed=${failures.length}`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Locale tests passed");
