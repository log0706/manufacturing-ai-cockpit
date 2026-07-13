import { useEffect, useMemo, useState } from "react";
import { trainingQuestions, trainingQuestionsById } from "../data/trainingQuestions";
import { coerceFuguReviewResult, weaknessTagValues } from "../lib/fuguReviewSchema";
import type { FuguReviewResult, WeaknessTag } from "../types/fuguReview";
import type {
  TrainingMode,
  TrainingQuestion,
  TrainingSession,
  TrainingStats,
  UnknownReason,
  UserQuestionProgress,
} from "../types";

const STORAGE_KEY = "manufacturing-ai-training-v2";

type TrainingStore = {
  questionProgress: Record<string, UserQuestionProgress>;
  sessions: TrainingSession[];
  activeSessionId?: string;
  lastStudiedAt?: string;
  streak: number;
};

const defaultStore: TrainingStore = {
  questionProgress: {},
  sessions: [],
  activeSessionId: undefined,
  lastStudiedAt: undefined,
  streak: 0,
};

const scoreIntervals: Record<0 | 1 | 2 | 3, number> = {
  0: 1,
  1: 3,
  2: 7,
  3: 14,
};

const modeLimit: Record<TrainingMode, number> = {
  daily10: 10,
  quick3: 3,
  weakReview: 999,
  random: 10,
};

const unique = (items: string[]) => Array.from(new Set(items));

const dateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWeek = (date = new Date()) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const hashString = (input: string) => {
  let hash = 2166136261;
  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const shuffle = <T,>(items: T[]): T[] => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const coerceScore = (value: unknown): 0 | 1 | 2 | 3 | undefined =>
  value === 0 || value === 1 || value === 2 || value === 3 ? value : undefined;

const unknownReasonValues: UnknownReason[] = [
  "term",
  "question_intent",
  "answer_structure",
  "example",
  "kpi_connection",
];

const isUnknownReason = (value: unknown): value is UnknownReason =>
  typeof value === "string" && (unknownReasonValues as string[]).includes(value);

const coerceStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const coerceUnknownReasons = (value: unknown): UnknownReason[] =>
  Array.isArray(value) ? value.filter(isUnknownReason) : [];

const isWeaknessTag = (value: unknown): value is WeaknessTag =>
  typeof value === "string" && (weaknessTagValues as readonly string[]).includes(value);

const coerceWeaknessTags = (value: unknown): WeaknessTag[] => {
  if (!Array.isArray(value)) return [];
  const legacyMap: Partial<Record<string, WeaknessTag>> = {
    answer_structure: "structure",
    question_intent: "structure",
    example: "concrete_example",
    risk_boundary: "responsibility_boundary",
    stakeholder_alignment: "audience_fit",
  };
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => legacyMap[item] ?? item)
    .filter(isWeaknessTag);
};

const coerceWeaknessTagCounts = (
  value: unknown,
): Partial<Record<WeaknessTag, number>> =>
  value && typeof value === "object"
    ? Object.entries(value).reduce<Partial<Record<WeaknessTag, number>>>((counts, [key, count]) => {
        if (typeof count !== "number") return counts;
        const [tag] = coerceWeaknessTags([key]);
        if (tag) counts[tag] = (counts[tag] ?? 0) + count;
        return counts;
      }, {})
    : {};

const coerceQuestionProgress = (
  questionId: string,
  value: unknown,
): UserQuestionProgress => {
  const source = value && typeof value === "object" ? (value as Partial<UserQuestionProgress>) : {};

  return {
    questionId,
    lastAnsweredAt: typeof source.lastAnsweredAt === "string" ? source.lastAnsweredAt : undefined,
    answerCount: typeof source.answerCount === "number" ? source.answerCount : 0,
    lastScore: coerceScore(source.lastScore),
    bestScore: coerceScore(source.bestScore),
    isWeak: Boolean(source.isWeak),
    nextReviewAt: typeof source.nextReviewAt === "string" ? source.nextReviewAt : undefined,
    reviewIntervalDays:
      typeof source.reviewIntervalDays === "number" ? source.reviewIntervalDays : undefined,
    lastUserAnswer: typeof source.lastUserAnswer === "string" ? source.lastUserAnswer : undefined,
    memo: typeof source.memo === "string" ? source.memo : undefined,
    unknownReasons: coerceUnknownReasons(source.unknownReasons),
    openedGlossaryTermIds: coerceStringArray(source.openedGlossaryTermIds),
    glossaryOpenCount:
      typeof source.glossaryOpenCount === "number" ? source.glossaryOpenCount : 0,
    fuguReviewCount: typeof source.fuguReviewCount === "number" ? source.fuguReviewCount : 0,
    lastFuguReviewAt:
      typeof source.lastFuguReviewAt === "string" ? source.lastFuguReviewAt : undefined,
    lastFuguScore: coerceScore(source.lastFuguScore),
    lastFuguReview: source.lastFuguReview
      ? coerceFuguReviewResult(source.lastFuguReview)
      : undefined,
    lastFuguWeaknessTags: coerceWeaknessTags(source.lastFuguWeaknessTags),
  };
};

const coerceSession = (value: unknown): TrainingSession | null => {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<TrainingSession>;
  if (
    typeof source.sessionId !== "string" ||
    (source.mode !== "daily10" &&
      source.mode !== "quick3" &&
      source.mode !== "weakReview" &&
      source.mode !== "random") ||
    typeof source.startedAt !== "string" ||
    !Array.isArray(source.questionIds)
  ) {
    return null;
  }

  const scores =
    source.scores && typeof source.scores === "object"
      ? Object.fromEntries(
          Object.entries(source.scores)
            .map(([id, score]) => [id, coerceScore(score)] as const)
            .filter((entry): entry is [string, 0 | 1 | 2 | 3] => entry[1] != null),
        )
      : {};

  return {
    sessionId: source.sessionId,
    mode: source.mode,
    startedAt: source.startedAt,
    completedAt: typeof source.completedAt === "string" ? source.completedAt : undefined,
    questionIds: source.questionIds.filter((id): id is string => typeof id === "string"),
    completedQuestionIds: Array.isArray(source.completedQuestionIds)
      ? source.completedQuestionIds.filter((id): id is string => typeof id === "string")
      : [],
    scores,
    weakAddedCount: typeof source.weakAddedCount === "number" ? source.weakAddedCount : 0,
    unknownReasonCounts:
      source.unknownReasonCounts && typeof source.unknownReasonCounts === "object"
        ? Object.fromEntries(
            Object.entries(source.unknownReasonCounts)
              .filter(([key, count]) => isUnknownReason(key) && typeof count === "number")
              .map(([key, count]) => [key, count as number]),
          )
        : {},
    openedGlossaryTermIds: coerceStringArray(source.openedGlossaryTermIds),
    fuguReviewedQuestionIds: coerceStringArray(source.fuguReviewedQuestionIds),
    averageFuguScore:
      typeof source.averageFuguScore === "number" ? source.averageFuguScore : undefined,
    fuguWeaknessTagCounts: coerceWeaknessTagCounts(source.fuguWeaknessTagCounts),
  };
};

const coerceStore = (value: unknown): TrainingStore => {
  if (!value || typeof value !== "object") return defaultStore;
  const source = value as Partial<TrainingStore>;
  const questionProgress =
    source.questionProgress && typeof source.questionProgress === "object"
      ? Object.fromEntries(
          Object.entries(source.questionProgress).map(([id, progress]) => [
            id,
            coerceQuestionProgress(id, progress),
          ]),
        )
      : {};

  const sessions = Array.isArray(source.sessions)
    ? source.sessions.map(coerceSession).filter((session): session is TrainingSession => session != null)
    : [];

  return {
    questionProgress,
    sessions,
    activeSessionId:
      typeof source.activeSessionId === "string" ? source.activeSessionId : undefined,
    lastStudiedAt: typeof source.lastStudiedAt === "string" ? source.lastStudiedAt : undefined,
    streak: typeof source.streak === "number" ? source.streak : 0,
  };
};

const touchStudy = (store: TrainingStore, now = new Date()): TrainingStore => {
  const today = dateKey(now);
  if (store.lastStudiedAt === today) return store;

  const yesterday = dateKey(addDays(now, -1));
  return {
    ...store,
    lastStudiedAt: today,
    streak: store.lastStudiedAt === yesterday ? store.streak + 1 : 1,
  };
};

const progressRank = (
  question: TrainingQuestion,
  progress: UserQuestionProgress | undefined,
  today: string,
  seed: string,
) => {
  const due = Boolean(progress?.nextReviewAt && progress.nextReviewAt <= today);
  const weak = Boolean(progress?.isWeak);
  const lowScore = progress?.lastScore === 0 || progress?.lastScore === 1;
  const unanswered = !progress || progress.answerCount === 0;

  if (weak && due) return 0;
  if (weak) return 1;
  if (lowScore) return 2;
  if (unanswered) return 3;
  return 4 + (hashString(`${seed}:${question.id}`) % 1000) / 1000;
};

const selectQuestions = (
  mode: TrainingMode,
  questionProgress: Record<string, UserQuestionProgress>,
  now = new Date(),
) => {
  if (mode === "random") {
    return shuffle(trainingQuestions)
      .slice(0, modeLimit.random)
      .map((question) => question.id);
  }

  const today = dateKey(now);
  const seed = `${today}:${mode}`;
  const candidates =
    mode === "weakReview"
      ? trainingQuestions.filter((question) => {
          const progress = questionProgress[question.id];
          return progress?.isWeak || progress?.lastScore === 0 || progress?.lastScore === 1;
        })
      : trainingQuestions;

  return candidates
    .map((question) => ({
      question,
      rank: progressRank(question, questionProgress[question.id], today, seed),
      tie: hashString(`${seed}:tie:${question.id}`),
    }))
    .sort((left, right) => left.rank - right.rank || left.tie - right.tie)
    .slice(0, modeLimit[mode])
    .map(({ question }) => question.id);
};

const buildStats = (store: TrainingStore): TrainingStats => {
  const today = dateKey();
  const weekStart = startOfWeek();
  const completedSessions = store.sessions.filter((session) => session.completedQuestionIds.length);
  const answeredToday = completedSessions
    .filter((session) => dateKey(new Date(session.startedAt)) === today)
    .reduce((sum, session) => sum + session.completedQuestionIds.length, 0);
  const weekAnswerCount = completedSessions
    .filter((session) => new Date(session.startedAt) >= weekStart)
    .reduce((sum, session) => sum + session.completedQuestionIds.length, 0);
  const progressValues = Object.values(store.questionProgress);
  const weakCount = progressValues.filter(
    (progress) => progress.isWeak || progress.lastScore === 0 || progress.lastScore === 1,
  ).length;
  const tomorrow = dateKey(addDays(new Date(), 1));
  const dueTomorrowCount = progressValues.filter(
    (progress) => progress.nextReviewAt && progress.nextReviewAt <= tomorrow,
  ).length;
  const scores = progressValues
    .map((progress) => progress.lastScore)
    .filter((score): score is 0 | 1 | 2 | 3 => score != null);

  return {
    answeredToday,
    weekAnswerCount,
    weakCount,
    dueTomorrowCount,
    streak: store.streak,
    totalAnsweredCount: progressValues.filter((progress) => progress.answerCount > 0).length,
    averageScore: scores.length
      ? Math.round((scores.reduce((sum: number, score) => sum + score, 0) / scores.length) * 10) / 10
      : 0,
  };
};

export type GlossarySummary = {
  /** 今日よく開いた用語ID（回数の多い順）。 */
  topTermIdsToday: Array<{ termId: string; count: number }>;
  /** 全期間でよく開いた用語トップ5。 */
  topTermIdsAllTime: Array<{ termId: string; count: number }>;
  /** 「用語が分からない」で詰まった問題数。 */
  termStuckQuestionCount: number;
  /** 「わからない」理由の集計（全期間）。 */
  unknownReasonCounts: Partial<Record<UnknownReason, number>>;
  /** 次に覚えるべき用語ID（詰まった問題に多い用語などから）。 */
  nextTermIds: string[];
};

export type FuguSummary = {
  reviewedQuestionCount: number;
  averageFuguScore: number;
  topWeaknessTags: Array<{ tag: WeaknessTag; count: number }>;
  scoreGap: number | null;
  nextPracticeTopics: string[];
};

const rankCounts = (counts: Map<string, number>, limit?: number) => {
  const ranked = Array.from(counts.entries())
    .map(([termId, count]) => ({ termId, count }))
    .sort((left, right) => right.count - left.count);
  return limit != null ? ranked.slice(0, limit) : ranked;
};

const buildGlossarySummary = (store: TrainingStore): GlossarySummary => {
  const today = dateKey();

  const todayCounts = new Map<string, number>();
  const allTimeCounts = new Map<string, number>();
  const reasonCounts: Partial<Record<UnknownReason, number>> = {};

  for (const session of store.sessions) {
    const isToday = dateKey(new Date(session.startedAt)) === today;
    for (const termId of session.openedGlossaryTermIds ?? []) {
      allTimeCounts.set(termId, (allTimeCounts.get(termId) ?? 0) + 1);
      if (isToday) todayCounts.set(termId, (todayCounts.get(termId) ?? 0) + 1);
    }
    for (const [reason, count] of Object.entries(session.unknownReasonCounts ?? {})) {
      if (isUnknownReason(reason)) {
        reasonCounts[reason] = (reasonCounts[reason] ?? 0) + (count ?? 0);
      }
    }
  }

  const termStuckQuestionCount = Object.values(store.questionProgress).filter((progress) =>
    (progress.unknownReasons ?? []).includes("term"),
  ).length;

  // 次に覚えるべき用語: 「用語が分からない」で止まった問題で開かれた用語を優先。
  const stuckTermCounts = new Map<string, number>();
  for (const progress of Object.values(store.questionProgress)) {
    if (!(progress.unknownReasons ?? []).includes("term")) continue;
    for (const termId of progress.openedGlossaryTermIds ?? []) {
      stuckTermCounts.set(termId, (stuckTermCounts.get(termId) ?? 0) + 1);
    }
  }
  const nextFromStuck = rankCounts(stuckTermCounts).map((entry) => entry.termId);
  const nextFromTop = rankCounts(allTimeCounts).map((entry) => entry.termId);
  const nextTermIds = Array.from(new Set([...nextFromStuck, ...nextFromTop])).slice(0, 3);

  return {
    topTermIdsToday: rankCounts(todayCounts, 5),
    topTermIdsAllTime: rankCounts(allTimeCounts, 5),
    termStuckQuestionCount,
    unknownReasonCounts: reasonCounts,
    nextTermIds,
  };
};

const rankWeaknessTagCounts = (
  counts: Partial<Record<WeaknessTag, number>>,
  limit?: number,
) => {
  const ranked = Object.entries(counts)
    .filter(
      (entry): entry is [WeaknessTag, number] =>
        isWeaknessTag(entry[0]) && typeof entry[1] === "number" && entry[1] > 0,
    )
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count);
  return limit != null ? ranked.slice(0, limit) : ranked;
};

const buildFuguSummary = (store: TrainingStore): FuguSummary => {
  const reviewed = Object.values(store.questionProgress).filter(
    (progress) => progress.lastFuguScore != null,
  );
  const averageFuguScore = reviewed.length
    ? Math.round(
        (reviewed.reduce((sum, progress) => sum + (progress.lastFuguScore ?? 0), 0) /
          reviewed.length) *
          10,
      ) / 10
    : 0;

  const fuguCounts: Partial<Record<WeaknessTag, number>> = {};
  const topics: string[] = [];
  for (const progress of reviewed) {
    for (const tag of progress.lastFuguWeaknessTags ?? []) {
      fuguCounts[tag] = (fuguCounts[tag] ?? 0) + 1;
    }
    for (const topic of progress.lastFuguReview?.nextPracticeTopics ?? []) {
      topics.push(topic);
    }
  }

  const selfScores = reviewed
    .map((progress) => progress.lastScore)
    .filter((score): score is 0 | 1 | 2 | 3 => score != null);
  const selfAverage = selfScores.length
    ? Math.round((selfScores.reduce<number>((sum, score) => sum + score, 0) / selfScores.length) * 10) / 10
    : null;

  return {
    reviewedQuestionCount: reviewed.length,
    averageFuguScore,
    topWeaknessTags: rankWeaknessTagCounts(fuguCounts, 5),
    scoreGap: selfAverage == null ? null : Math.round((selfAverage - averageFuguScore) * 10) / 10,
    nextPracticeTopics: Array.from(new Set(topics)).slice(0, 4),
  };
};

export const useTrainingProgress = () => {
  const [storageWriteFailed, setStorageWriteFailed] = useState(false);
  const [store, setStore] = useState<TrainingStore>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? coerceStore(JSON.parse(raw)) : defaultStore;
    } catch {
      return defaultStore;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      setStorageWriteFailed((current) => (current ? false : current));
    } catch {
      setStorageWriteFailed(true);
    }
  }, [store]);

  const activeSession = useMemo(
    () => store.sessions.find((session) => session.sessionId === store.activeSessionId),
    [store.activeSessionId, store.sessions],
  );

  const activeQuestions = useMemo(
    () =>
      activeSession
        ? activeSession.questionIds
            .map((id) => trainingQuestionsById[id])
            .filter((question): question is TrainingQuestion => question != null)
        : [],
    [activeSession],
  );

  const startSession = (mode: TrainingMode) => {
    const now = new Date();
    const questionIds = selectQuestions(mode, store.questionProgress, now);
    const session: TrainingSession = {
      sessionId: `${mode}-${now.getTime()}`,
      mode,
      startedAt: now.toISOString(),
      questionIds,
      completedQuestionIds: [],
      scores: {},
      weakAddedCount: 0,
    };

    setStore((current) =>
      touchStudy({
        ...current,
        activeSessionId: session.sessionId,
        sessions: [session, ...current.sessions].slice(0, 50),
      }),
    );
    return session;
  };

  const markQuestionWeak = (questionId: string) => {
    setStore((current) => ({
      ...touchStudy(current),
      questionProgress: {
        ...current.questionProgress,
        [questionId]: {
          ...coerceQuestionProgress(questionId, current.questionProgress[questionId]),
          questionId,
          isWeak: true,
          nextReviewAt: dateKey(addDays(new Date(), 1)),
          reviewIntervalDays: 1,
        },
      },
    }));
  };

  const recordUnknownReason = ({
    sessionId,
    questionId,
    reason,
  }: {
    sessionId?: string;
    questionId: string;
    reason: UnknownReason;
  }) => {
    setStore((current) => {
      const existing = coerceQuestionProgress(questionId, current.questionProgress[questionId]);
      const sessions = current.sessions.map((session) => {
        if (session.sessionId !== sessionId) return session;
        const counts = { ...(session.unknownReasonCounts ?? {}) };
        counts[reason] = (counts[reason] ?? 0) + 1;
        return { ...session, unknownReasonCounts: counts };
      });
      return {
        ...touchStudy(current),
        questionProgress: {
          ...current.questionProgress,
          [questionId]: {
            ...existing,
            questionId,
            unknownReasons: [...(existing.unknownReasons ?? []), reason],
          },
        },
        sessions,
      };
    });
  };

  const recordGlossaryOpen = ({
    sessionId,
    questionId,
    termId,
  }: {
    sessionId?: string;
    questionId?: string;
    termId: string;
  }) => {
    setStore((current) => {
      const sessions = current.sessions.map((session) => {
        if (session.sessionId !== sessionId) return session;
        return {
          ...session,
          openedGlossaryTermIds: [...(session.openedGlossaryTermIds ?? []), termId],
        };
      });
      const questionProgress = { ...current.questionProgress };
      if (questionId) {
        const existing = coerceQuestionProgress(questionId, current.questionProgress[questionId]);
        questionProgress[questionId] = {
          ...existing,
          questionId,
          openedGlossaryTermIds: [...(existing.openedGlossaryTermIds ?? []), termId],
          glossaryOpenCount: (existing.glossaryOpenCount ?? 0) + 1,
        };
      }
      return { ...current, questionProgress, sessions };
    });
  };

  const recordFuguReview = ({
    sessionId,
    questionId,
    result,
  }: {
    sessionId?: string;
    questionId: string;
    result: FuguReviewResult;
  }) => {
    const now = new Date().toISOString();

    setStore((current) => {
      const existing = coerceQuestionProgress(questionId, current.questionProgress[questionId]);
      const updatedProgress: UserQuestionProgress = {
        ...existing,
        questionId,
        fuguReviewCount: (existing.fuguReviewCount ?? 0) + 1,
        lastFuguReviewAt: now,
        lastFuguScore: result.score,
        lastFuguReview: result,
        lastFuguWeaknessTags: result.weaknessTags,
      };
      const nextQuestionProgress = {
        ...current.questionProgress,
        [questionId]: updatedProgress,
      };

      const sessions = current.sessions.map((session) => {
        if (session.sessionId !== sessionId) return session;
        const reviewedQuestionIds = unique([
          ...(session.fuguReviewedQuestionIds ?? []),
          questionId,
        ]);
        const reviewedScores = reviewedQuestionIds
          .map((id) =>
            id === questionId
              ? result.score
              : coerceQuestionProgress(id, nextQuestionProgress[id]).lastFuguScore,
          )
          .filter((score): score is 0 | 1 | 2 | 3 => score != null);
        const tagCounts = { ...(session.fuguWeaknessTagCounts ?? {}) };
        for (const tag of result.weaknessTags) {
          tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
        }

        return {
          ...session,
          fuguReviewedQuestionIds: reviewedQuestionIds,
          averageFuguScore: reviewedScores.length
            ? Math.round(
                (reviewedScores.reduce<number>((sum, score) => sum + score, 0) / reviewedScores.length) *
                  10,
              ) / 10
            : undefined,
          fuguWeaknessTagCounts: tagCounts,
        };
      });

      return touchStudy({
        ...current,
        questionProgress: nextQuestionProgress,
        sessions,
      });
    });
  };

  const recordQuestionResult = ({
    sessionId,
    questionId,
    score,
    memo,
    addWeak,
  }: {
    sessionId: string;
    questionId: string;
    score: 0 | 1 | 2 | 3;
    memo?: string;
    addWeak: boolean;
  }) => {
    const now = new Date();
    const interval = scoreIntervals[score];
    const nextReviewAt = dateKey(addDays(now, interval));

    setStore((current) => {
      const existing = coerceQuestionProgress(questionId, current.questionProgress[questionId]);
      const nextAnswerCount = existing.answerCount + 1;
      const bestScore =
        existing.bestScore == null ? score : (Math.max(existing.bestScore, score) as 0 | 1 | 2 | 3);
      const weakByScore = score <= 1;
      const weakCanClear = existing.isWeak && score >= 2 && bestScore >= 2 && nextAnswerCount >= 3;
      const nextIsWeak = weakCanClear ? false : addWeak || weakByScore || existing.isWeak;
      const wasWeak = existing.isWeak || existing.lastScore === 0 || existing.lastScore === 1;

      const sessions = current.sessions.map((session) => {
        if (session.sessionId !== sessionId) return session;
        const completedQuestionIds = unique([...session.completedQuestionIds, questionId]);
        const scores = { ...session.scores, [questionId]: score };
        const completedAt =
          completedQuestionIds.length >= session.questionIds.length ? now.toISOString() : session.completedAt;
        const weakAdded = nextIsWeak && !wasWeak ? 1 : 0;
        return {
          ...session,
          completedQuestionIds,
          scores,
          completedAt,
          weakAddedCount: session.weakAddedCount + weakAdded,
        };
      });

      return touchStudy({
        ...current,
        questionProgress: {
          ...current.questionProgress,
          [questionId]: {
            ...existing,
            questionId,
            lastAnsweredAt: now.toISOString(),
            answerCount: nextAnswerCount,
            lastScore: score,
            bestScore,
            isWeak: nextIsWeak,
            nextReviewAt,
            reviewIntervalDays: interval,
            lastUserAnswer: memo?.trim() || existing.lastUserAnswer,
            memo: memo?.trim() || existing.memo,
          },
        },
        sessions,
      });
    });
  };

  const resetTrainingProgress = () => {
    setStore(defaultStore);
  };

  const stats = useMemo(() => buildStats(store), [store]);
  const glossarySummary = useMemo(() => buildGlossarySummary(store), [store]);
  const fuguSummary = useMemo(() => buildFuguSummary(store), [store]);

  return {
    storageKey: STORAGE_KEY,
    storageWriteFailed,
    questionProgress: store.questionProgress,
    sessions: store.sessions,
    activeSession,
    activeQuestions,
    stats,
    glossarySummary,
    fuguSummary,
    startSession,
    markQuestionWeak,
    recordUnknownReason,
    recordGlossaryOpen,
    recordFuguReview,
    recordQuestionResult,
    resetTrainingProgress,
  };
};
