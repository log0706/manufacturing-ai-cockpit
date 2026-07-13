import { beginnerChoiceQuestions } from "../src/data/beginnerChoiceQuestions";
import { glossaryTermById } from "../src/data/glossary";
import type { BeginnerChoiceCategory, BeginnerChoiceId } from "../src/types";

const expectedCategoryCounts: Record<BeginnerChoiceCategory, number> = {
  systems: 40,
  departments: 30,
  management_kpi: 35,
  quality_maintenance_safety: 35,
  ai_use_cases: 35,
  poc_deployment: 25,
};

const choiceIds: BeginnerChoiceId[] = ["A", "B", "C", "D"];

const forbiddenPatterns = [
  /FUGU/i,
  /API\s*key/i,
  /ログイン必須/,
  /外部送信すればよい/,
  /外部送信で解決/,
  /自動で停止/,
  /AIが最終判断/,
  /AIに任せるだけ/,
];

const errors: string[] = [];

const fail = (message: string) => {
  errors.push(message);
};

if (beginnerChoiceQuestions.length !== 200) {
  fail(`question count expected 200, actual ${beginnerChoiceQuestions.length}`);
}

const idSet = new Set<string>();
const categoryCounts: Partial<Record<BeginnerChoiceCategory, number>> = {};
const answerCounts: Record<BeginnerChoiceId, number> = { A: 0, B: 0, C: 0, D: 0 };

for (const question of beginnerChoiceQuestions) {
  if (idSet.has(question.id)) fail(`${question.id}: duplicated id`);
  idSet.add(question.id);

  categoryCounts[question.category] = (categoryCounts[question.category] ?? 0) + 1;
  answerCounts[question.correctChoiceId] += 1;

  if (question.choices.length !== 4) fail(`${question.id}: choices must be 4`);
  const choiceIdSet = new Set(question.choices.map((choice) => choice.id));
  for (const choiceId of choiceIds) {
    if (!choiceIdSet.has(choiceId)) fail(`${question.id}: missing choice ${choiceId}`);
    if (!Object.prototype.hasOwnProperty.call(question.whyWrong, choiceId)) {
      fail(`${question.id}: missing whyWrong.${choiceId}`);
    }
  }
  if (!choiceIdSet.has(question.correctChoiceId)) {
    fail(`${question.id}: correctChoiceId ${question.correctChoiceId} does not exist`);
  }
  if (!question.explanation.trim()) fail(`${question.id}: explanation is empty`);
  if (!question.whyCorrect.trim()) fail(`${question.id}: whyCorrect is empty`);
  if (!question.keyTakeaway.trim()) fail(`${question.id}: keyTakeaway is empty`);
  if (!question.relatedGlossaryTerms.length) fail(`${question.id}: relatedGlossaryTerms is empty`);

  for (const termId of question.relatedGlossaryTerms) {
    if (!glossaryTermById[termId]) fail(`${question.id}: glossary term not found: ${termId}`);
  }

  const textBlob = [
    question.prompt,
    question.explanation,
    question.whyCorrect,
    question.keyTakeaway,
    question.caution,
    question.bridgeToAdvancedQuestion,
    ...question.choices.map((choice) => choice.text),
    ...Object.values(question.whyWrong),
  ].join("\n");
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(textBlob)) fail(`${question.id}: forbidden expression matched ${pattern}`);
  }
}

for (const [category, expected] of Object.entries(expectedCategoryCounts) as Array<
  [BeginnerChoiceCategory, number]
>) {
  const actual = categoryCounts[category] ?? 0;
  if (actual !== expected) fail(`${category}: expected ${expected}, actual ${actual}`);
}

for (const choiceId of choiceIds) {
  if (answerCounts[choiceId] !== 50) {
    fail(`correct answer distribution ${choiceId}: expected 50, actual ${answerCounts[choiceId]}`);
  }
}

if (errors.length) {
  console.error("Beginner choice audit failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Beginner choice audit passed.");
console.log(`questions=${beginnerChoiceQuestions.length}`);
console.log(
  `categories=${Object.entries(expectedCategoryCounts)
    .map(([category, expected]) => `${category}:${categoryCounts[category as BeginnerChoiceCategory]}/${expected}`)
    .join(", ")}`,
);
console.log(
  `answers=${choiceIds.map((choiceId) => `${choiceId}:${answerCounts[choiceId]}`).join(", ")}`,
);
