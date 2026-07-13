import { useEffect, useMemo, useState } from "react";
import {
  beginnerChoiceQuestionCountsByCategory,
  beginnerChoiceQuestions,
} from "../data/beginnerChoiceQuestions";
import type { BeginnerChoiceQuestion } from "../data/beginnerChoiceQuestions";
import type {
  BeginnerChoiceCategory,
  BeginnerChoiceId,
  BeginnerChoiceMode,
  BeginnerChoiceProgress,
  BeginnerChoiceSession,
  BeginnerChoiceStats,
} from "../types";

const STORAGE_KEY = "manufacturing-ai-beginner-choice-v1";

type BeginnerChoiceStore = {
  questionProgress: Record<string, BeginnerChoiceProgress>;
  sessions: BeginnerChoiceSession[];
  activeSessionId?: string;
};

const defaultStore: BeginnerChoiceStore = {
  questionProgress: {},
  sessions: [],
  activeSessionId: undefined,
};

const categories: BeginnerChoiceCategory[] = [
  "systems",
  "departments",
  "management_kpi",
  "quality_maintenance_safety",
  "ai_use_cases",
  "poc_deployment",
];

const questionById = Object.fromEntries(
  beginnerChoiceQuestions.map((question) => [question.id, question]),
) as Record<string, BeginnerChoiceQuestion>;

const modeLimit: Record<BeginnerChoiceMode, number> = {
  daily10: 10,
  quick3: 5,
  category: 10,
  weakReview: 10,
  random: 1,
};

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

const hashString = (input: string) => {
  let hash = 2166136261;
  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const unique = (items: string[]) => Array.from(new Set(items));

const isChoiceId = (value: unknown): value is BeginnerChoiceId =>
  value === "A" || value === "B" || value === "C" || value === "D";

const isMode = (value: unknown): value is BeginnerChoiceMode =>
  value === "daily10" ||
  value === "quick3" ||
  value === "category" ||
  value === "weakReview" ||
  value === "random";

const isCategory = (value: unknown): value is BeginnerChoiceCategory =>
  typeof value === "string" && (categories as string[]).includes(value);

const coerceStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const coerceProgress = (questionId: string, value: unknown): BeginnerChoiceProgress => {
  const source =
    value && typeof value === "object" ? (value as Partial<BeginnerChoiceProgress>) : {};
  return {
    questionId,
    answeredCount: typeof source.answeredCount === "number" ? source.answeredCount : 0,
    correctCount: typeof source.correctCount === "number" ? source.correctCount : 0,
    lastAnsweredAt: typeof source.lastAnsweredAt === "string" ? source.lastAnsweredAt : undefined,
    lastSelectedChoiceId: isChoiceId(source.lastSelectedChoiceId)
      ? source.lastSelectedChoiceId
      : undefined,
    isWeak: Boolean(source.isWeak),
    nextReviewAt: typeof source.nextReviewAt === "string" ? source.nextReviewAt : undefined,
    correctStreak: typeof source.correctStreak === "number" ? source.correctStreak : 0,
    unknownCount: typeof source.unknownCount === "number" ? source.unknownCount : 0,
  };
};

const coerceSession = (value: unknown): BeginnerChoiceSession | null => {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<BeginnerChoiceSession>;
  if (
    typeof source.sessionId !== "string" ||
    !isMode(source.mode) ||
    typeof source.startedAt !== "string" ||
    !Array.isArray(source.questionIds)
  ) {
    return null;
  }
  return {
    sessionId: source.sessionId,
    mode: source.mode,
    startedAt: source.startedAt,
    completedAt: typeof source.completedAt === "string" ? source.completedAt : undefined,
    category: isCategory(source.category) ? source.category : undefined,
    questionIds: coerceStringArray(source.questionIds).filter((id) => questionById[id]),
    answeredQuestionIds: coerceStringArray(source.answeredQuestionIds),
    correctQuestionIds: coerceStringArray(source.correctQuestionIds),
    wrongQuestionIds: coerceStringArray(source.wrongQuestionIds),
  };
};

const coerceStore = (value: unknown): BeginnerChoiceStore => {
  if (!value || typeof value !== "object") return defaultStore;
  const source = value as Partial<BeginnerChoiceStore>;
  const questionProgress =
    source.questionProgress && typeof source.questionProgress === "object"
      ? Object.fromEntries(
          Object.entries(source.questionProgress).map(([id, progress]) => [
            id,
            coerceProgress(id, progress),
          ]),
        )
      : {};
  const sessions = Array.isArray(source.sessions)
    ? source.sessions
        .map(coerceSession)
        .filter((session): session is BeginnerChoiceSession => session != null)
    : [];

  return {
    questionProgress,
    sessions,
    activeSessionId:
      typeof source.activeSessionId === "string" ? source.activeSessionId : undefined,
  };
};

const rankQuestion = (
  question: BeginnerChoiceQuestion,
  progress: BeginnerChoiceProgress | undefined,
  mode: BeginnerChoiceMode,
  seed: string,
) => {
  const wrong =
    progress?.lastSelectedChoiceId != null && progress.lastSelectedChoiceId !== question.correctChoiceId;
  const weak = Boolean(progress?.isWeak || wrong);
  const unanswered = !progress || progress.answeredCount === 0;
  const due = Boolean(progress?.nextReviewAt && progress.nextReviewAt <= dateKey());

  if (mode === "random") return hashString(`${seed}:random:${question.id}`);
  if (weak && due) return 0;
  if (weak) return 1;
  if (unanswered) return 2;
  return 3 + (hashString(`${seed}:tie:${question.id}`) % 1000) / 1000;
};

const sortedCandidates = ({
  mode,
  category,
  progress,
  now,
}: {
  mode: BeginnerChoiceMode;
  category?: BeginnerChoiceCategory;
  progress: Record<string, BeginnerChoiceProgress>;
  now: Date;
}) => {
  const seed = `${dateKey(now)}:${mode}:${category ?? "all"}`;
  const base = beginnerChoiceQuestions.filter((question) => {
    if (mode === "category") return question.category === category;
    if (mode === "weakReview") {
      const item = progress[question.id];
      const wrong =
        item?.lastSelectedChoiceId != null && item.lastSelectedChoiceId !== question.correctChoiceId;
      return Boolean(item?.isWeak || wrong);
    }
    return true;
  });

  return base
    .map((question) => ({
      question,
      rank: rankQuestion(question, progress[question.id], mode, seed),
      tie: hashString(`${seed}:tie2:${question.id}`),
    }))
    .sort((left, right) => left.rank - right.rank || left.tie - right.tie)
    .map(({ question }) => question);
};

const balancedDailyQuestions = (
  progress: Record<string, BeginnerChoiceProgress>,
  now: Date,
): string[] => {
  const byCategory = categories.map((category) =>
    sortedCandidates({ mode: "daily10", category, progress, now }).filter(
      (question) => question.category === category,
    ),
  );
  const picked: string[] = [];
  let cursor = 0;
  while (picked.length < modeLimit.daily10 && byCategory.some((items) => items.length)) {
    const bucket = byCategory[cursor % byCategory.length];
    const next = bucket.shift();
    if (next) picked.push(next.id);
    cursor += 1;
  }
  return picked;
};

const selectQuestions = ({
  mode,
  category,
  progress,
  now,
}: {
  mode: BeginnerChoiceMode;
  category?: BeginnerChoiceCategory;
  progress: Record<string, BeginnerChoiceProgress>;
  now: Date;
}) => {
  if (mode === "daily10") return balancedDailyQuestions(progress, now);
  const candidates = sortedCandidates({ mode, category, progress, now });
  return candidates.slice(0, modeLimit[mode]).map((question) => question.id);
};

const buildStats = (store: BeginnerChoiceStore): BeginnerChoiceStats => {
  const today = dateKey();
  const progressValues = Object.values(store.questionProgress);
  const totalAttempts = progressValues.reduce((sum, progress) => sum + progress.answeredCount, 0);
  const totalCorrect = progressValues.reduce((sum, progress) => sum + progress.correctCount, 0);
  const categoryProgress = categories.reduce<BeginnerChoiceStats["categoryProgress"]>(
    (current, category) => {
      current[category] = {
        total: beginnerChoiceQuestionCountsByCategory[category] ?? 0,
        answered: beginnerChoiceQuestions.filter(
          (question) =>
            question.category === category && store.questionProgress[question.id]?.answeredCount > 0,
        ).length,
      };
      return current;
    },
    {} as BeginnerChoiceStats["categoryProgress"],
  );

  return {
    answeredToday: progressValues.filter((progress) => progress.lastAnsweredAt?.startsWith(today))
      .length,
    totalAnsweredCount: progressValues.filter((progress) => progress.answeredCount > 0).length,
    accuracy: totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
    weakCount: progressValues.filter((progress) => progress.isWeak).length,
    totalQuestionCount: beginnerChoiceQuestions.length,
    categoryProgress,
  };
};

export const useBeginnerChoiceProgress = () => {
  const [storageWriteFailed, setStorageWriteFailed] = useState(false);
  const [store, setStore] = useState<BeginnerChoiceStore>(() => {
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
            .map((id) => questionById[id])
            .filter((question): question is BeginnerChoiceQuestion => question != null)
        : [],
    [activeSession],
  );

  const startSession = (mode: BeginnerChoiceMode, category?: BeginnerChoiceCategory) => {
    const now = new Date();
    const questionIds = selectQuestions({
      mode,
      category,
      progress: store.questionProgress,
      now,
    });
    const session: BeginnerChoiceSession = {
      sessionId: `beginner-${mode}-${now.getTime()}`,
      mode,
      startedAt: now.toISOString(),
      category,
      questionIds,
      answeredQuestionIds: [],
      correctQuestionIds: [],
      wrongQuestionIds: [],
    };

    setStore((current) => ({
      ...current,
      activeSessionId: session.sessionId,
      sessions: [session, ...current.sessions].slice(0, 80),
    }));
    return session;
  };

  const recordAnswer = ({
    sessionId,
    question,
    selectedChoiceId,
  }: {
    sessionId: string;
    question: BeginnerChoiceQuestion;
    selectedChoiceId: BeginnerChoiceId;
  }) => {
    const now = new Date();
    const isCorrect = selectedChoiceId === question.correctChoiceId;

    setStore((current) => {
      const existing = coerceProgress(question.id, current.questionProgress[question.id]);
      const correctStreak = isCorrect ? existing.correctStreak + 1 : 0;
      const shouldClearWeak = isCorrect && correctStreak >= 2;
      const nextProgress: BeginnerChoiceProgress = {
        ...existing,
        questionId: question.id,
        answeredCount: existing.answeredCount + 1,
        correctCount: existing.correctCount + (isCorrect ? 1 : 0),
        lastAnsweredAt: now.toISOString(),
        lastSelectedChoiceId: selectedChoiceId,
        isWeak: shouldClearWeak ? false : !isCorrect || existing.isWeak,
        nextReviewAt: isCorrect ? dateKey(addDays(now, 7)) : dateKey(addDays(now, 1)),
        correctStreak,
      };

      const sessions = current.sessions.map((session) => {
        if (session.sessionId !== sessionId) return session;
        const correctQuestionIds = isCorrect
          ? unique([...session.correctQuestionIds, question.id])
          : session.correctQuestionIds.filter((id) => id !== question.id);
        const wrongQuestionIds = isCorrect
          ? session.wrongQuestionIds.filter((id) => id !== question.id)
          : unique([...session.wrongQuestionIds, question.id]);
        const answeredQuestionIds = unique([...session.answeredQuestionIds, question.id]);
        return {
          ...session,
          answeredQuestionIds,
          correctQuestionIds,
          wrongQuestionIds,
          completedAt:
            answeredQuestionIds.length >= session.questionIds.length
              ? now.toISOString()
              : session.completedAt,
        };
      });

      return {
        ...current,
        questionProgress: {
          ...current.questionProgress,
          [question.id]: nextProgress,
        },
        sessions,
      };
    });
  };

  const markQuestionWeak = (questionId: string) => {
    setStore((current) => ({
      ...current,
      questionProgress: {
        ...current.questionProgress,
        [questionId]: {
          ...coerceProgress(questionId, current.questionProgress[questionId]),
          questionId,
          isWeak: true,
          nextReviewAt: dateKey(addDays(new Date(), 1)),
        },
      },
    }));
  };

  const recordUnknown = (questionId: string) => {
    setStore((current) => {
      const existing = coerceProgress(questionId, current.questionProgress[questionId]);
      return {
        ...current,
        questionProgress: {
          ...current.questionProgress,
          [questionId]: {
            ...existing,
            questionId,
            isWeak: true,
            unknownCount: existing.unknownCount + 1,
            nextReviewAt: dateKey(addDays(new Date(), 1)),
          },
        },
      };
    });
  };

  const clearActiveSession = () => {
    setStore((current) => ({ ...current, activeSessionId: undefined }));
  };

  const resetBeginnerProgress = () => {
    setStore(defaultStore);
  };

  const stats = useMemo(() => buildStats(store), [store]);

  return {
    storageKey: STORAGE_KEY,
    storageWriteFailed,
    questionProgress: store.questionProgress,
    sessions: store.sessions,
    activeSession,
    activeQuestions,
    stats,
    startSession,
    recordAnswer,
    markQuestionWeak,
    recordUnknown,
    clearActiveSession,
    resetBeginnerProgress,
  };
};
