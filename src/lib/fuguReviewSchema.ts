import type {
  FuguJudgement,
  FuguReviewResult,
  RiskyExpressionRewrite,
  WeaknessTag,
} from "../types/fuguReview";

export const FUGU_PROMPT_VERSION = "fugu-review-v1";
export const FUGU_USER_ANSWER_MAX_LENGTH = 2000;
export const FUGU_REVIEW_TIMEOUT_MS = 20_000;

export const weaknessTagValues = [
  "term",
  "structure",
  "kpi_connection",
  "responsibility_boundary",
  "safety_quality",
  "ai_overclaim",
  "concrete_example",
  "audience_fit",
] as const satisfies readonly WeaknessTag[];

export const weaknessTagLabels: Record<WeaknessTag, string> = {
  term: "用語理解",
  structure: "回答構造",
  kpi_connection: "KPI接続",
  responsibility_boundary: "責任分界",
  safety_quality: "安全・品質",
  ai_overclaim: "AI過信表現",
  concrete_example: "具体例",
  audience_fit: "相手適合",
};

export const judgementByScore: Record<0 | 1 | 2 | 3, FuguJudgement> = {
  0: "not_yet",
  1: "partial",
  2: "good",
  3: "strong",
};

export const judgementLabels: Record<FuguJudgement, string> = {
  not_yet: "要再学習",
  partial: "部分理解",
  good: "実務説明可",
  strong: "現場会議で使える",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const coerceString = (value: unknown, fallback: string, maxLength = 500): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLength);
};

const coerceStringArray = (
  value: unknown,
  maxItems: number,
  maxLength = 180,
): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
};

const coerceScore = (value: unknown): 0 | 1 | 2 | 3 => {
  if (value === 0 || value === 1 || value === 2 || value === 3) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const rounded = Math.round(value);
    if (rounded <= 0) return 0;
    if (rounded >= 3) return 3;
    return rounded as 0 | 1 | 2 | 3;
  }
  return 0;
};

const coerceWeaknessTags = (value: unknown): WeaknessTag[] => {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<WeaknessTag>(weaknessTagValues);
  const legacyMap: Partial<Record<string, WeaknessTag>> = {
    answer_structure: "structure",
    question_intent: "structure",
    example: "concrete_example",
    risk_boundary: "responsibility_boundary",
    stakeholder_alignment: "audience_fit",
  };
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => legacyMap[item] ?? item)
        .filter((item): item is WeaknessTag => allowed.has(item as WeaknessTag)),
    ),
  ).slice(0, 5);
};

const coerceRiskyExpressionTexts = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim().slice(0, 160);
      if (isRecord(item)) {
        return coerceString(item.from ?? item.before, "", 160);
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 5);
};

const coerceRiskyExpressionRewrites = (value: unknown): RiskyExpressionRewrite[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((item) => ({
      from: coerceString(item.from ?? item.before, "", 120),
      to: coerceString(item.to ?? item.after, "", 160),
      reason: coerceString(item.reason, "", 180),
    }))
    .filter((item) => item.from || item.to || item.reason)
    .slice(0, 4);
};

export const coerceFuguReviewResult = (raw: unknown): FuguReviewResult => {
  const source = isRecord(raw) ? raw : {};
  const score = coerceScore(source.score);

  return {
    score,
    judgement: judgementByScore[score],
    summary: coerceString(source.summary, "回答の観点を整理しました。", 420),
    goodPoints: coerceStringArray(source.goodPoints, 4),
    missingPoints: coerceStringArray(source.missingPoints, 5),
    weaknessTags: coerceWeaknessTags(source.weaknessTags),
    riskyExpressions: coerceRiskyExpressionTexts(source.riskyExpressions),
    riskyExpressionRewrites: coerceRiskyExpressionRewrites(
      source.riskyExpressionRewrites ?? source.riskyExpressions,
    ),
    recommendedKeywords: coerceStringArray(source.recommendedKeywords ?? source.importantKeywords, 8, 80),
    kpiConnectionFeedback: coerceString(
      source.kpiConnectionFeedback ?? source.kpiFeedback,
      "KPIとの接続をもう一段具体化してください。",
      240,
    ),
    responsibilityBoundaryFeedback: coerceString(
      source.responsibilityBoundaryFeedback ?? source.responsibilityFeedback,
      "AIが支援する範囲と人が判断する範囲を分けてください。",
      240,
    ),
    safetyQualityFeedback: coerceString(
      source.safetyQualityFeedback ?? source.safetyFeedback,
      "安全・品質・ライン停止への影響を明示してください。",
      240,
    ),
    improved30SecAnswer: coerceString(
      source.improved30SecAnswer ?? source.improvedAnswerShort,
      "目的、対象、判断基準を一文で補うと説明しやすくなります。",
      360,
    ),
    improved90SecAnswer: coerceString(
      source.improved90SecAnswer ?? source.improvedAnswerPractical,
      "現場の業務、KPI、責任分界、安全・品質影響を順に結びつけて説明してください。",
      700,
    ),
    followUpQuestions: coerceStringArray(source.followUpQuestions, 4),
    nextPracticeTopics: coerceStringArray(source.nextPracticeTopics, 4),
  };
};
