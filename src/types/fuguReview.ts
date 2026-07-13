export type WeaknessTag =
  | "term"
  | "structure"
  | "kpi_connection"
  | "responsibility_boundary"
  | "safety_quality"
  | "ai_overclaim"
  | "concrete_example"
  | "audience_fit";

export type FuguJudgement = "not_yet" | "partial" | "good" | "strong";

export type RiskyExpressionRewrite = {
  from: string;
  to: string;
  reason: string;
};

export type FuguReviewResult = {
  score: 0 | 1 | 2 | 3;
  judgement: FuguJudgement;
  summary: string;
  goodPoints: string[];
  missingPoints: string[];
  weaknessTags: WeaknessTag[];
  riskyExpressions: string[];
  riskyExpressionRewrites: RiskyExpressionRewrite[];
  recommendedKeywords: string[];
  kpiConnectionFeedback?: string;
  responsibilityBoundaryFeedback?: string;
  safetyQualityFeedback?: string;
  improved30SecAnswer: string;
  improved90SecAnswer: string;
  followUpQuestions: string[];
  nextPracticeTopics: string[];
};

export type FuguReviewStatus = "idle" | "consent" | "loading" | "success" | "error";
