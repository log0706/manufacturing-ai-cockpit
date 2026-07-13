import express from "express";
import { buildFuguServerCacheKey, hashFuguAnswer, normalizeFuguAnswer } from "./fuguReviewHash";
import {
  buildFuguReviewUserPrompt,
  FUGU_REVIEW_SYSTEM_PROMPT,
  type FuguReviewServerPayload,
} from "./fuguReviewPrompt";
import {
  coerceFuguReviewResult,
  FUGU_PROMPT_VERSION,
  FUGU_REVIEW_TIMEOUT_MS,
  FUGU_USER_ANSWER_MAX_LENGTH,
} from "./fuguReviewSchema";
import type { FuguReviewResult } from "../src/types/fuguReview";

const app = express();
const port = Number(process.env.FUGU_REVIEW_PORT ?? 8787);
const inFlightReviews = new Map<string, Promise<FuguReviewResult>>();

app.use(express.json({ limit: "32kb" }));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const coerceStringArray = (value: unknown, limit = 12): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, limit)
    : [];

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value.trim() : fallback;

const parsePayload = (body: unknown): FuguReviewServerPayload => {
  if (!isRecord(body) || !isRecord(body.question)) {
    throw new Error("講評リクエストの形式が不正です。");
  }

  const promptVersion = asString(body.promptVersion);
  if (promptVersion !== FUGU_PROMPT_VERSION) {
    throw new Error("講評プロンプトのバージョンが一致しません。");
  }

  const questionId = asString(body.question.id);
  const userAnswer = normalizeFuguAnswer(asString(body.userAnswer));
  if (!questionId || !userAnswer) {
    throw new Error("問題IDと回答本文が必要です。");
  }
  if (userAnswer.length > FUGU_USER_ANSWER_MAX_LENGTH) {
    throw new Error(`回答本文は${FUGU_USER_ANSWER_MAX_LENGTH}文字以内にしてください。`);
  }

  const answerHash = asString(body.answerHash);
  const expectedHash = hashFuguAnswer(userAnswer);
  if (answerHash && answerHash !== expectedHash) {
    throw new Error("回答ハッシュが一致しません。");
  }

  return {
    promptVersion,
    mode: asString(body.mode, "daily10"),
    question: {
      id: questionId,
      category: asString(body.question.category),
      topic: asString(body.question.topic),
      prompt: asString(body.question.prompt),
      answerTimeSec:
        typeof body.question.answerTimeSec === "number" ? body.question.answerTimeSec : 0,
      difficulty: asString(body.question.difficulty),
      expectedAnswer: asString(body.question.expectedAnswer),
      modelAnswer30Sec: asString(body.question.modelAnswer30Sec),
      modelAnswer90Sec: asString(body.question.modelAnswer90Sec),
      keyPoints: coerceStringArray(body.question.keyPoints, 8),
      ngPatterns: coerceStringArray(body.question.ngPatterns, 6),
      scoringRubric: coerceStringArray(body.question.scoringRubric, 8),
      mustIncludeKeywords: coerceStringArray(body.question.mustIncludeKeywords, 12),
      relatedKpis: coerceStringArray(body.question.relatedKpis, 8),
      riskNotes: coerceStringArray(body.question.riskNotes, 8),
      responsibilityBoundary: asString(body.question.responsibilityBoundary),
    },
    userAnswer,
    unknownReasons: coerceStringArray(body.unknownReasons, 8),
    openedGlossaryTermIds: coerceStringArray(body.openedGlossaryTermIds, 20),
    answerHash: expectedHash,
  };
};

const parseJsonText = (text: string): unknown => {
  const trimmed = text.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("FUGU応答がJSONではありません。");
    return JSON.parse(match[0]);
  }
};

const extractFuguJson = (raw: unknown): unknown => {
  if (typeof raw === "string") return parseJsonText(raw);
  if (!isRecord(raw)) return raw;
  const choice = Array.isArray(raw.choices) && isRecord(raw.choices[0]) ? raw.choices[0] : null;
  const message = choice && isRecord(choice.message) ? choice.message : null;
  if (typeof message?.content === "string") return parseJsonText(message.content);
  if (typeof raw.output_text === "string") return parseJsonText(raw.output_text);
  if (isRecord(raw.result)) return raw.result;
  if (typeof raw.content === "string") return parseJsonText(raw.content);
  return raw;
};

const callFuguApi = async (payload: FuguReviewServerPayload): Promise<FuguReviewResult> => {
  const apiKey = process.env.FUGU_API_KEY;
  const apiBase = process.env.FUGU_API_BASE;
  const model = process.env.FUGU_MODEL;
  if (!apiKey || !apiBase || !model) {
    throw new Error("FUGU_API_KEY / FUGU_API_BASE / FUGU_MODEL を設定してください。");
  }

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), FUGU_REVIEW_TIMEOUT_MS);
  try {
    const response = await fetch(apiBase, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: FUGU_REVIEW_SYSTEM_PROMPT },
          { role: "user", content: buildFuguReviewUserPrompt(payload) },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`FUGU API error: ${response.status}`);
    }
    return coerceFuguReviewResult(extractFuguJson(parseJsonText(text)));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("FUGU API request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timerId);
  }
};

app.get("/api/fugu-review/health", (_request, response) => {
  response.json({
    ok: true,
    promptVersion: FUGU_PROMPT_VERSION,
    hasApiKey: Boolean(process.env.FUGU_API_KEY),
    hasApiBase: Boolean(process.env.FUGU_API_BASE),
    hasModel: Boolean(process.env.FUGU_MODEL),
  });
});

app.post("/api/fugu-review", async (request, response) => {
  try {
    const payload = parsePayload(request.body);
    const cacheKey = buildFuguServerCacheKey({
      mode: payload.mode,
      questionId: payload.question.id,
      answerHash: payload.answerHash,
    });

    const existing = inFlightReviews.get(cacheKey);
    const reviewPromise = existing ?? callFuguApi(payload);
    if (!existing) inFlightReviews.set(cacheKey, reviewPromise);

    try {
      const result = await reviewPromise;
      response.json({ result, promptVersion: FUGU_PROMPT_VERSION });
    } finally {
      if (!existing) inFlightReviews.delete(cacheKey);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "FUGU講評に失敗しました。";
    const status = message.includes("設定してください") ? 503 : 400;
    response.status(status).json({ error: message });
  }
});

app.listen(port, "127.0.0.1", () => {
  console.log(`FUGU review server listening on http://127.0.0.1:${port}`);
});
