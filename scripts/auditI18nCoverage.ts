/**
 * Localization coverage audit.
 *
 * `tsc` already guarantees that `en` has the same key set as `ja`, because
 * `Dictionary = typeof ja` and `en: Dictionary`. This script is the runtime net for
 * everything the type system cannot see:
 *
 * 1. a key present but empty, or accidentally left as the Japanese source string;
 * 2. a value whose type diverges between locales (string vs. array vs. function);
 * 3. content datasets missing an English overlay for one or more records;
 * 4. the question banks, whose coverage is reported rather than enforced.
 *
 * Exits non-zero on any failure so `npm test` blocks a half-translated dictionary.
 */
import { beginnerChoiceQuestions } from "../src/data/beginnerChoiceQuestions";
import { trainingQuestions } from "../src/data/trainingQuestions";
import { en } from "../src/i18n/en";
import { ja } from "../src/i18n/ja";
import { contentCoverage } from "../src/i18n/content";

const CJK = /[぀-ゟ゠-ヿ一-龯]/;

/**
 * Values that are legitimately identical across locales: proper nouns, acronyms,
 * numerals, and — for the language switcher — each language's own endonym.
 */
const ALLOWED_IDENTICAL = new Set([
  "language.ja",
  "language.en",
  "shell.brandName",
  "shell.progressTitle",
  "nav.labels.cockpit",
  "nav.labels.beginner",
  "nav.labels.align",
  "nav.labels.knowledge",
  "nav.labels.map",
  "nav.labels.drill",
  "nav.labels.explain",
  "nav.labels.review",
  "metrics.knowledge",
  "metrics.risk",
  "cockpit.eyebrow",
  "cockpit.beginnerEyebrow",
  "cockpit.intermediateEyebrow",
  "cockpit.beginnerSetEyebrow",
  "cockpit.intermediateSetEyebrow",
  "cockpit.knowledgeEyebrow",
  "cockpit.openAlign",
  "align.eyebrow",
  "align.frictionPlain",
  "align.frictionExpertQuestion",
  "align.canvasEmptyValue",
  "align.dialogueEyebrow",
  "align.stakeholderEyebrow",
  "align.frictionEyebrow",
  "align.boundaryEyebrow",
  "align.canvasEyebrow",
  "align.boundaryAi",
  "knowledge.eyebrow",
  "knowledge.kpis",
  "map.eyebrow",
  "map.kpis",
  "explain.eyebrow",
  "explain.thirtySecFace",
  "explain.threeMinFace",
  "review.eyebrow",
  "review.toDrill",
  "review.toExplain",
  "review.toKnowledge",
  "beginnerCategories.kpi",
  "glossaryCategories.kpi",
  "glossaryUi.relatedKpis",
  "drill.relatedKpis",
  "fugu.weaknessTags.kpi_connection",
  "beginner.englishNoticeTitle",
  "beginner.englishNoticeBody",
  "beginner.englishNoticeAction",
  "drill.englishNoticeTitle",
  "drill.englishNoticeBody",
  "drill.englishNoticeAction",
]);

type Unknown = Record<string, unknown>;

const failures: string[] = [];
const warnings: string[] = [];
let stringKeys = 0;
let functionKeys = 0;

const walk = (jaNode: Unknown, enNode: Unknown, path: string[] = []) => {
  for (const [key, jaValue] of Object.entries(jaNode)) {
    const keyPath = [...path, key];
    const dotted = keyPath.join(".");
    const enValue = (enNode as Unknown)[key];

    if (enValue === undefined) {
      failures.push(`missing English key: ${dotted}`);
      continue;
    }

    if (typeof jaValue !== typeof enValue) {
      failures.push(
        `type mismatch at ${dotted}: ja is ${typeof jaValue}, en is ${typeof enValue}`,
      );
      continue;
    }

    if (typeof jaValue === "function") {
      functionKeys += 1;
      // Formatters are invoked with representative arguments so an empty template or a
      // leftover Japanese particle is caught rather than shipped.
      try {
        const rendered = String((enValue as (...args: unknown[]) => unknown)(1, 1, 1));
        if (!rendered.trim()) failures.push(`English formatter renders empty: ${dotted}`);
        if (CJK.test(rendered) && !ALLOWED_IDENTICAL.has(dotted)) {
          failures.push(`English formatter contains Japanese text: ${dotted} -> "${rendered}"`);
        }
      } catch {
        warnings.push(`formatter ${dotted} could not be probed with sample arguments`);
      }
      continue;
    }

    if (Array.isArray(jaValue)) {
      if (!Array.isArray(enValue)) {
        failures.push(`expected array at ${dotted}`);
        continue;
      }
      if (jaValue.length !== enValue.length) {
        failures.push(
          `array length mismatch at ${dotted}: ja ${jaValue.length}, en ${enValue.length}`,
        );
      }
      enValue.forEach((item, index) => {
        stringKeys += 1;
        if (typeof item !== "string" || !item.trim()) {
          failures.push(`empty English array entry: ${dotted}[${index}]`);
          return;
        }
        if (CJK.test(item)) {
          failures.push(`untranslated English array entry: ${dotted}[${index}]`);
        }
      });
      continue;
    }

    if (typeof jaValue === "object" && jaValue !== null) {
      walk(jaValue as Unknown, enValue as Unknown, keyPath);
      continue;
    }

    stringKeys += 1;

    if (typeof enValue !== "string" || !enValue.trim()) {
      failures.push(`empty English value: ${dotted}`);
      continue;
    }

    if (CJK.test(enValue) && !ALLOWED_IDENTICAL.has(dotted)) {
      failures.push(`untranslated English value: ${dotted} -> "${enValue}"`);
    }

    if (enValue === jaValue && !ALLOWED_IDENTICAL.has(dotted)) {
      warnings.push(`identical in both locales: ${dotted} -> "${enValue}"`);
    }
  }

  for (const key of Object.keys(enNode)) {
    if (!(key in jaNode)) failures.push(`extra English key: ${[...path, key].join(".")}`);
  }
};

walk(ja as unknown as Unknown, en as unknown as Unknown);

console.log("i18n coverage audit");
console.log(`locales=ja,en`);
console.log(`ui string keys=${stringKeys}`);
console.log(`ui formatter keys=${functionKeys}`);
console.log("");
console.log("Content datasets (English overlays)");

for (const entry of contentCoverage) {
  const percent = entry.total ? Math.round((entry.translated / entry.total) * 100) : 100;
  console.log(`- ${entry.dataset}: ${entry.translated}/${entry.total} (${percent}%)`);
  if (entry.expectComplete && entry.translated !== entry.total) {
    failures.push(
      `${entry.dataset} is expected to be fully translated but is ${entry.translated}/${entry.total}`,
    );
  }
}

console.log("");
console.log("Deferred question banks (reported, not enforced)");
console.log(`- beginnerChoiceQuestions: 0/${beginnerChoiceQuestions.length} (0%)`);
console.log(`- trainingQuestions: 0/${trainingQuestions.length} (0%)`);
console.log(
  "  These two banks are Japanese-only by decision. The English locale shows an",
);
console.log(
  "  explicit notice on those modules instead of machine-translated content, so no",
);
console.log("  screen mixes the two languages. See docs/i18n/i18n-inventory.md.");

if (warnings.length) {
  console.log("");
  console.log("Warnings");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (failures.length) {
  console.log("");
  console.error("i18n coverage audit FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("");
console.log("i18n coverage audit passed");
