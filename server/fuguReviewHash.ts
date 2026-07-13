import { FUGU_PROMPT_VERSION } from "./fuguReviewSchema";

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

export const buildFuguServerCacheKey = ({
  mode,
  questionId,
  answerHash,
}: {
  mode: string;
  questionId: string;
  answerHash: string;
}): string => `${FUGU_PROMPT_VERSION}:${mode}:${questionId}:${answerHash}`;

