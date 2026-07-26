import type { TrainingMode, TrainingQuestion, UnknownReason } from "../types";
import type { FuguReviewResult } from "../types/fuguReview";
import {
  coerceFuguReviewResult,
  FUGU_PROMPT_VERSION,
  FUGU_REVIEW_TIMEOUT_MS,
  FUGU_USER_ANSWER_MAX_LENGTH,
} from "./fuguReviewSchema";
import { FuguReviewError } from "./fuguReviewError";

export const FUGU_REVIEW_CONSENT_KEY = "fuguReviewConsentAccepted";

export type FuguReviewRequest = {
  endpoint: string;
  mode: TrainingMode;
  question: TrainingQuestion;
  userAnswer: string;
  unknownReasons: UnknownReason[];
  openedGlossaryTermIds: string[];
};

export type FuguReviewResponse = {
  result: FuguReviewResult;
  cacheKey: string;
  fromCache: boolean;
};

export const normalizeFuguAnswer = (answer: string): string =>
  answer.replace(/\u3000/g, " ").replace(/\s+/g, " ").trim();

export const hashFuguAnswer = (answer: string): string => {
  let hash = 0x811c9dc5;
  const normalized = normalizeFuguAnswer(answer);
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const buildFuguReviewCacheKey = (
  mode: TrainingMode,
  questionId: string,
  answerHash: string,
): string => `fuguReview:${FUGU_PROMPT_VERSION}:${mode}:${questionId}:${answerHash}`;

const readCachedReview = (cacheKey: string): FuguReviewResult | null => {
  try {
    const cached = window.localStorage.getItem(cacheKey);
    if (!cached) return null;
    return coerceFuguReviewResult(JSON.parse(cached));
  } catch {
    return null;
  }
};

const writeCachedReview = (cacheKey: string, result: FuguReviewResult) => {
  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch {
    // The cache is only a convenience, so a write failure must not block the review.
  }
};

const parseReviewResponse = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new FuguReviewError("jsonParse");
  }
};

export const requestFuguReview = async ({
  endpoint,
  mode,
  question,
  userAnswer,
  unknownReasons,
  openedGlossaryTermIds,
}: FuguReviewRequest): Promise<FuguReviewResponse> => {
  const normalizedAnswer = normalizeFuguAnswer(userAnswer);
  if (!normalizedAnswer) {
    throw new FuguReviewError("emptyAnswer");
  }
  if (normalizedAnswer.length > FUGU_USER_ANSWER_MAX_LENGTH) {
    throw new FuguReviewError("tooLong", { max: FUGU_USER_ANSWER_MAX_LENGTH });
  }

  const answerHash = hashFuguAnswer(normalizedAnswer);
  const cacheKey = buildFuguReviewCacheKey(mode, question.id, answerHash);
  const cached = readCachedReview(cacheKey);
  if (cached) {
    return { result: cached, cacheKey, fromCache: true };
  }

  const controller = new AbortController();
  const timerId = window.setTimeout(() => controller.abort(), FUGU_REVIEW_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        promptVersion: FUGU_PROMPT_VERSION,
        mode,
        question: {
          id: question.id,
          category: question.category,
          topic: question.topic,
          prompt: question.prompt,
          answerTimeSec: question.answerTimeSec,
          difficulty: question.difficulty,
          expectedAnswer: question.expectedAnswer,
          modelAnswer30Sec: question.modelAnswer30Sec,
          modelAnswer90Sec: question.modelAnswer90Sec,
          keyPoints: question.keyPoints,
          ngPatterns: question.ngPatterns,
          scoringRubric: question.scoringRubric,
          mustIncludeKeywords: question.mustIncludeKeywords,
          relatedKpis: question.relatedKpis ?? [],
          riskNotes: question.riskNotes ?? [],
          responsibilityBoundary: question.responsibilityBoundary ?? "",
        },
        userAnswer: normalizedAnswer,
        unknownReasons,
        openedGlossaryTermIds,
        answerHash,
      }),
      signal: controller.signal,
    });

    const parsed = await parseReviewResponse(response);
    if (!response.ok) {
      const serverMessage =
        typeof parsed === "object" &&
        parsed !== null &&
        "error" in parsed &&
        typeof parsed.error === "string"
          ? parsed.error
          : undefined;
      throw new FuguReviewError("failed", { serverMessage });
    }

    const rawResult =
      typeof parsed === "object" && parsed !== null && "result" in parsed
        ? parsed.result
        : parsed;
    const result = coerceFuguReviewResult(rawResult);
    writeCachedReview(cacheKey, result);
    return { result, cacheKey, fromCache: false };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new FuguReviewError("timeout");
    }
    throw error;
  } finally {
    window.clearTimeout(timerId);
  }
};
