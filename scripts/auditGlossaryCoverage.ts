import { beginnerChoiceQuestions } from "../src/data/beginnerChoiceQuestions";
import { trainingQuestions } from "../src/data/trainingQuestions";
import { glossaryTermById } from "../src/data/glossary";
import { collectTerms, segmentText } from "../src/utils/glossaryMatcher";

/**
 * 用語辞書のインライン適用範囲を監査する。
 * - 初級200問 / 中級85問の主要テキストから辞書語が検出できるか
 * - relatedGlossaryTerms が glossary.ts に存在するか
 * - 用語が1つも検出されない問題の一覧
 * - チップ化過多になりそうな問題の一覧
 *
 * 検出ロジックは実描画と同じ segmentText / collectTerms を使うため、
 * 「画面で実際にチップ化される語」と監査結果がずれない。
 */

const CHIP_WARN_THRESHOLD = 14; // 1問あたりのチップ総数がこれを超えたら過多候補。

const errors: string[] = [];
const warnings: string[] = [];

const countChips = (texts: Array<string | undefined | null>): number => {
  const usedCounts = new Map<string, number>();
  let chips = 0;
  for (const text of texts) {
    if (!text) continue;
    for (const segment of segmentText(text, { usedCounts })) {
      if (segment.kind === "term") chips += 1;
    }
  }
  return chips;
};

// ---- 初級200問 ----
const beginnerNoTerm: string[] = [];
const beginnerChipHeavy: string[] = [];

for (const question of beginnerChoiceQuestions) {
  for (const termId of question.relatedGlossaryTerms) {
    if (!glossaryTermById[termId]) {
      errors.push(`${question.id}: relatedGlossaryTerms「${termId}」が glossary.ts に存在しません`);
    }
  }

  const primaryTexts = [
    question.prompt,
    ...question.choices.map((choice) => choice.text),
    question.explanation,
    question.keyTakeaway,
  ];
  const allTexts = [
    ...primaryTexts,
    question.whyCorrect,
    question.whyWrong.A,
    question.whyWrong.B,
    question.whyWrong.C,
    question.whyWrong.D,
    question.caution,
    question.bridgeToAdvancedQuestion,
    ...(question.relatedKpis ?? []),
    ...(question.relatedDepartments ?? []),
  ];

  if (collectTerms(primaryTexts).length === 0) {
    beginnerNoTerm.push(question.id);
  }
  if (countChips(allTexts) > CHIP_WARN_THRESHOLD) {
    beginnerChipHeavy.push(question.id);
  }
}

// ---- 中級85問 ----
const trainingNoTerm: string[] = [];
const trainingChipHeavy: string[] = [];

for (const question of trainingQuestions) {
  const primaryTexts = [
    question.prompt,
    question.expectedAnswer,
    question.modelAnswer30Sec,
    question.modelAnswer90Sec,
  ];
  const allTexts = [
    ...primaryTexts,
    question.hint,
    question.responsibilityBoundary,
    ...(question.answerTemplate ?? []),
    ...question.keyPoints,
    ...question.ngPatterns,
    ...question.scoringRubric,
    ...question.mustIncludeKeywords,
    ...(question.relatedKpis ?? []),
    ...(question.riskNotes ?? []),
  ];

  if (collectTerms(primaryTexts).length === 0) {
    trainingNoTerm.push(question.id);
  }
  if (countChips(allTexts) > CHIP_WARN_THRESHOLD) {
    trainingChipHeavy.push(question.id);
  }
}

if (beginnerNoTerm.length) {
  warnings.push(
    `初級: 主要テキストから用語を検出できない問題 ${beginnerNoTerm.length}件 -> ${beginnerNoTerm.join(", ")}`,
  );
}
if (trainingNoTerm.length) {
  warnings.push(
    `中級: 主要テキストから用語を検出できない問題 ${trainingNoTerm.length}件 -> ${trainingNoTerm.join(", ")}`,
  );
}
if (beginnerChipHeavy.length) {
  warnings.push(
    `初級: チップ化過多候補(>${CHIP_WARN_THRESHOLD}) ${beginnerChipHeavy.length}件 -> ${beginnerChipHeavy.join(", ")}`,
  );
}
if (trainingChipHeavy.length) {
  warnings.push(
    `中級: チップ化過多候補(>${CHIP_WARN_THRESHOLD}) ${trainingChipHeavy.length}件 -> ${trainingChipHeavy.join(", ")}`,
  );
}

console.log("Glossary coverage audit");
console.log(`beginnerQuestions=${beginnerChoiceQuestions.length}`);
console.log(`trainingQuestions=${trainingQuestions.length}`);
console.log(`beginnerWithPrimaryTerms=${beginnerChoiceQuestions.length - beginnerNoTerm.length}`);
console.log(`trainingWithPrimaryTerms=${trainingQuestions.length - trainingNoTerm.length}`);

if (warnings.length) {
  console.warn("\nWarnings");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error("\nAudit failed");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("\nAudit passed (relatedGlossaryTerms are all present in glossary.ts)");
}
