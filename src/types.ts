import type { UnknownReason } from "./types/glossary";
import type { FuguReviewResult, WeaknessTag } from "./types/fuguReview";

export type { UnknownReason, GlossaryTerm, GlossaryCategory } from "./types/glossary";
export type {
  FuguJudgement,
  FuguReviewResult,
  FuguReviewStatus,
  RiskyExpressionRewrite,
  WeaknessTag,
} from "./types/fuguReview";

export type ViewId =
  | "cockpit"
  | "beginner"
  | "align"
  | "knowledge"
  | "map"
  | "drill"
  | "explain"
  | "review";

export type TrainingMode = "daily10" | "quick3" | "weakReview" | "random";

export type BeginnerChoiceId = "A" | "B" | "C" | "D";

export type BeginnerChoiceMode = "daily10" | "quick3" | "category" | "weakReview" | "random";

export type BeginnerChoiceCategory =
  | "systems"
  | "departments"
  | "management_kpi"
  | "quality_maintenance_safety"
  | "ai_use_cases"
  | "poc_deployment";

export interface BeginnerChoiceProgress {
  questionId: string;
  answeredCount: number;
  correctCount: number;
  lastAnsweredAt?: string;
  lastSelectedChoiceId?: BeginnerChoiceId;
  isWeak: boolean;
  nextReviewAt?: string;
  correctStreak: number;
  unknownCount: number;
}

export interface BeginnerChoiceSession {
  sessionId: string;
  mode: BeginnerChoiceMode;
  startedAt: string;
  completedAt?: string;
  category?: BeginnerChoiceCategory;
  questionIds: string[];
  answeredQuestionIds: string[];
  correctQuestionIds: string[];
  wrongQuestionIds: string[];
}

export interface BeginnerChoiceStats {
  answeredToday: number;
  totalAnsweredCount: number;
  accuracy: number;
  weakCount: number;
  totalQuestionCount: number;
  categoryProgress: Record<BeginnerChoiceCategory, { answered: number; total: number }>;
}

export type TrainingCategory =
  | "用語説明"
  | "比較問題"
  | "判断問題"
  | "反論対応"
  | "KPI接続"
  | "危険領域判定"
  | "ケース問題";

export type TrainingDifficulty = "basic" | "standard" | "advanced";

export type TrainingAudience =
  | "general"
  | "factory_manager"
  | "it_dx"
  | "quality"
  | "maintenance"
  | "production_control"
  | "shop_floor";

export interface TrainingQuestion {
  id: string;
  category: TrainingCategory;
  subCategory?: string;
  topic: string;
  title: string;
  prompt: string;
  answerTimeSec: 30 | 90 | 180;
  difficulty: TrainingDifficulty;
  audience?: TrainingAudience;
  situation?: string;
  expectedAnswer: string;
  modelAnswer30Sec: string;
  modelAnswer90Sec: string;
  keyPoints: string[];
  ngPatterns: string[];
  scoringRubric: string[];
  mustIncludeKeywords: string[];
  relatedKpis?: string[];
  riskNotes?: string[];
  responsibilityBoundary?: string;
  existingSystemContext?: string;
  hint?: string;
  answerTemplate?: string[];
  tags: string[];
  similarQuestionGroupId?: string;
  variantType?: string;
  reviewPriority?: "low" | "normal" | "high";
}

export interface UserQuestionProgress {
  questionId: string;
  lastAnsweredAt?: string;
  answerCount: number;
  lastScore?: 0 | 1 | 2 | 3;
  bestScore?: 0 | 1 | 2 | 3;
  isWeak: boolean;
  nextReviewAt?: string;
  reviewIntervalDays?: number;
  lastUserAnswer?: string;
  memo?: string;
  /** 「わからない」を押した時に選んだ理由の履歴。 */
  unknownReasons?: UnknownReason[];
  /** この問題で開いた用語IDの履歴（重複あり）。 */
  openedGlossaryTermIds?: string[];
  /** この問題で用語説明を開いた回数の累計。 */
  glossaryOpenCount?: number;
  fuguReviewCount?: number;
  lastFuguReviewAt?: string;
  lastFuguScore?: 0 | 1 | 2 | 3;
  lastFuguReview?: FuguReviewResult;
  lastFuguWeaknessTags?: WeaknessTag[];
}

export interface TrainingSession {
  sessionId: string;
  mode: TrainingMode;
  startedAt: string;
  completedAt?: string;
  questionIds: string[];
  completedQuestionIds: string[];
  scores: Record<string, 0 | 1 | 2 | 3>;
  weakAddedCount: number;
  /** このセッションで選ばれた「わからない」理由の集計。 */
  unknownReasonCounts?: Partial<Record<UnknownReason, number>>;
  /** このセッションで開いた用語ID（重複あり、開いた順）。 */
  openedGlossaryTermIds?: string[];
  fuguReviewedQuestionIds?: string[];
  averageFuguScore?: number;
  fuguWeaknessTagCounts?: Partial<Record<WeaknessTag, number>>;
}

export interface TrainingStats {
  answeredToday: number;
  weekAnswerCount: number;
  weakCount: number;
  dueTomorrowCount: number;
  streak: number;
  totalAnsweredCount: number;
  averageScore: number;
}

export type Domain =
  | "system"
  | "department"
  | "process"
  | "risk"
  | "global"
  | "ai-usecase"
  | "explanation";

export type QuestionType =
  | "multiple-choice"
  | "true-false"
  | "caution"
  | "scenario";

export interface Concept {
  id: string;
  title: string;
  booth: string;
  domain: Domain;
  oneLine: string;
  whyImportant: string;
  departments: string[];
  kpis: string[];
  aiTouchpoint: string;
  caution: string;
  thirtySecond: string;
  miniQuestion: {
    prompt: string;
    answer: string;
  };
  /** 中学生でもイメージできる「一言でいうと」。 */
  juniorSummary?: string;
  /** アプリ内で描く軽量な概念図（入力→仕組み→出力の流れ）。 */
  conceptDiagram?: ConceptDiagram;
  /** 利用シーン（箇条書き）。 */
  usageScene?: string[];
  /** たとえばこう使う（箇条書き）。 */
  exampleScene?: string[];
  /** AIとどうつながるか。 */
  aiConnection?: string;
}

/**
 * 概念図の最小データ。外部画像やライブラリを使わず HTML/CSS だけで描くため、
 * 「複数の入力 → 中心の仕組み → 出力（多段可・省略可）」という共通の流れに正規化する。
 */
export interface ConceptDiagram {
  /** 左側に積む入力ノード。 */
  inputs: string[];
  /** 中心となる仕組みノード。 */
  hub: string;
  /** 右側へ流れる出力ノード。空配列なら出力なし、複数なら段階的な流れ。 */
  outputs: string[];
  /** 図の下に添える一言補足（任意）。 */
  note?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  domain: Domain;
  category: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  options: QuestionOption[];
  correctOptionIds: string[];
  explanation: string;
  relatedConceptIds: string[];
  cautionExpression?: string;
}

export interface ExplainDrill {
  id: string;
  title: string;
  thirtySecondAnswer: string;
  threeMinuteAnswer: string;
  keywords: string[];
  caution: string;
  relatedConcepts: string[];
}

export interface Scenario {
  id: string;
  stakeholder: string;
  concern: string;
  reason: string;
  goodResponse: string;
  poorResponse: string;
  aiTalentTrap: string;
  agreedGoal: string;
  nextQuestions: string[];
  relatedConcepts: string[];
}

export interface FrictionWord {
  id: string;
  term: string;
  plain: string;
  aiSideMeaning: string;
  manufacturingRisk: string;
  alignmentDefinition: string;
  expertQuestion: string;
}

export interface DecisionAuthority {
  id: string;
  area: string;
  aiRole: string;
  humanRole: string;
  evidenceToLeave: string;
}

export interface ExpertDialogueCard {
  id: string;
  phase: string;
  weakQuestion: string;
  strongQuestion: string;
  whyItWorks: string;
}

export interface DomainScores {
  system: number;
  department: number;
  process: number;
  risk: number;
  global: number;
  "ai-usecase": number;
  explanation: number;
}

export interface StudyProgress {
  completedConceptIds: string[];
  answeredQuestionIds: string[];
  correctQuestionIds: string[];
  wrongQuestionIds: string[];
  weakQuestionIds: string[];
  bookmarkedConceptIds: string[];
  explainScores: Record<string, number>;
  weakExplainIds: string[];
  lastStudiedAt: string | null;
  streak: number;
  domainScores: DomainScores;
}

export interface AnswerResult {
  questionId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
}
