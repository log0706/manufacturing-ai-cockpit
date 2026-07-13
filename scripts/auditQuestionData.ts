import { trainingQuestions } from "../src/data/trainingQuestions";

const expectedQuestionCount = 85;

const requiredStringFields = [
  "expectedAnswer",
  "modelAnswer30Sec",
  "modelAnswer90Sec",
] as const;

const requiredArrayFields = [
  "keyPoints",
  "ngPatterns",
  "scoringRubric",
  "mustIncludeKeywords",
] as const;

const coreTopics = [
  { id: "compare-erp-mes", label: "ERPとMESの違い" },
  { id: "compare-mes-mom", label: "MESとMOMの違い" },
  { id: "compare-plm-qms", label: "PLMとQMSの関係" },
  { id: "compare-it-ot", label: "ITとOTの違い" },
  { id: "compare-engineering-control", label: "生産技術と生産管理の違い" },
  { id: "compare-qa-qc", label: "品質保証と品質管理の違い" },
  { id: "compare-poc-production", label: "PoCが本番化しない理由" },
  { id: "compare-it-ot", label: "OTセキュリティが重要な理由" },
  { id: "judge-scale-out", label: "複数工場への横展開が難しい理由" },
  { id: "judge-first-area", label: "製造業AIで最初に狙うべき領域" },
  { id: "rebuttal-mes-can-do", label: "それは既存MESでできませんか？" },
  { id: "rebuttal-qa-guarantee", label: "品質保証上、AIの回答を誰が保証するのですか？" },
  { id: "rebuttal-production-maintenance", label: "PoCで良くても本番で誰が保守するのですか？" },
  { id: "rebuttal-no-shop-input", label: "現場が入力しない場合どうしますか？" },
  { id: "rebuttal-responsibility", label: "AIが間違えた時、誰が責任を持つのですか？" },
];

const prohibitedWords = [
  "応募先名",
  "採用",
  "面談",
  "選考",
  "実クライアント名",
];

const dangerousPhrases = [
  "AIで何でも自動化できます",
  "AIが品質保証を代替します",
  "AIが出荷判定します",
  "AIがライン停止・再開を判断します",
  "AIが作業者を評価します",
  "AIが設備を自動制御します",
  "既存システムは不要です",
];

const failures: string[] = [];
const questionIds = new Set<string>();

if (trainingQuestions.length !== expectedQuestionCount) {
  failures.push(`総問題数が${expectedQuestionCount}件ではありません: ${trainingQuestions.length}件`);
}

for (const question of trainingQuestions) {
  if (questionIds.has(question.id)) {
    failures.push(`IDが重複しています: ${question.id}`);
  }
  questionIds.add(question.id);

  for (const field of requiredStringFields) {
    if (!question[field]?.trim()) {
      failures.push(`${question.id}: ${field} が空です`);
    }
  }

  for (const field of requiredArrayFields) {
    if (!question[field]?.length) {
      failures.push(`${question.id}: ${field} が空です`);
    }
  }

  const auditText = [
    question.prompt,
    question.expectedAnswer,
    question.modelAnswer30Sec,
    question.modelAnswer90Sec,
    ...question.keyPoints,
    ...question.ngPatterns,
    ...question.scoringRubric,
    ...question.mustIncludeKeywords,
    ...(question.riskNotes ?? []),
    question.responsibilityBoundary,
  ].join("\n");

  for (const word of prohibitedWords) {
    if (auditText.includes(word)) {
      failures.push(`${question.id}: 禁止ワード「${word}」を含みます`);
    }
  }

  for (const phrase of dangerousPhrases) {
    if (auditText.includes(phrase)) {
      failures.push(`${question.id}: 危険表現「${phrase}」を含みます`);
    }
  }
}

for (const core of coreTopics) {
  const question = trainingQuestions.find((item) => item.id === core.id);
  if (!question) {
    failures.push(`核問題が見つかりません: ${core.label} (${core.id})`);
    continue;
  }

  if (question.modelAnswer30Sec.length < 70) {
    failures.push(`${core.id}: 核問題「${core.label}」の30秒回答が薄いです`);
  }
  if (question.modelAnswer90Sec.length < 180) {
    failures.push(`${core.id}: 核問題「${core.label}」の90秒回答が薄いです`);
  }
  if (question.keyPoints.length < 4) {
    failures.push(`${core.id}: 核問題「${core.label}」の要点が4件未満です`);
  }
  if (question.ngPatterns.length < 3) {
    failures.push(`${core.id}: 核問題「${core.label}」のNG回答が3件未満です`);
  }
  if (question.mustIncludeKeywords.length < 5) {
    failures.push(`${core.id}: 核問題「${core.label}」の必須キーワードが5件未満です`);
  }
}

const answeredCount = trainingQuestions.filter((question) => question.expectedAnswer.trim()).length;
const answer30Count = trainingQuestions.filter((question) => question.modelAnswer30Sec.trim()).length;
const answer90Count = trainingQuestions.filter((question) => question.modelAnswer90Sec.trim()).length;
const keyPointCount = trainingQuestions.filter((question) => question.keyPoints.length).length;
const ngPatternCount = trainingQuestions.filter((question) => question.ngPatterns.length).length;
const keywordCount = trainingQuestions.filter((question) => question.mustIncludeKeywords.length).length;

console.log("Question data audit");
console.log(`total=${trainingQuestions.length}`);
console.log(`expectedAnswer=${answeredCount}`);
console.log(`modelAnswer30Sec=${answer30Count}`);
console.log(`modelAnswer90Sec=${answer90Count}`);
console.log(`keyPoints=${keyPointCount}`);
console.log(`ngPatterns=${ngPatternCount}`);
console.log(`mustIncludeKeywords=${keywordCount}`);
console.log(`coreTopics=${coreTopics.length}`);

if (failures.length) {
  console.error("\nAudit failed");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("Audit passed");
}
