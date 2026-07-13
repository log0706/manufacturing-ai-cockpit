import { useEffect, useMemo, useState } from "react";
import { concepts } from "../data/concepts";
import { explainDrills } from "../data/explainDrills";
import { questions } from "../data/questions";
import type { AnswerResult, Domain, DomainScores, StudyProgress } from "../types";

const STORAGE_KEY = "manufacturing-ai-cockpit-progress-v1";

const domains: Domain[] = [
  "system",
  "department",
  "process",
  "risk",
  "global",
  "ai-usecase",
  "explanation",
];

const emptyDomainScores = (): DomainScores => ({
  system: 0,
  department: 0,
  process: 0,
  risk: 0,
  global: 0,
  "ai-usecase": 0,
  explanation: 0,
});

const defaultProgress: StudyProgress = {
  completedConceptIds: [],
  answeredQuestionIds: [],
  correctQuestionIds: [],
  wrongQuestionIds: [],
  weakQuestionIds: [],
  bookmarkedConceptIds: [],
  explainScores: {},
  weakExplainIds: [],
  lastStudiedAt: null,
  streak: 0,
  domainScores: emptyDomainScores(),
};

const unique = (items: string[]) => Array.from(new Set(items));
const without = (items: string[], item: string) => items.filter((value) => value !== item);

const todayKey = () => new Date().toISOString().slice(0, 10);

const yesterdayKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

const touchStudy = (progress: StudyProgress): StudyProgress => {
  const today = todayKey();
  if (progress.lastStudiedAt === today) {
    return progress;
  }

  return {
    ...progress,
    lastStudiedAt: today,
    streak: progress.lastStudiedAt === yesterdayKey() ? progress.streak + 1 : 1,
  };
};

const coerceProgress = (value: unknown): StudyProgress => {
  if (!value || typeof value !== "object") {
    return defaultProgress;
  }

  const source = value as Partial<StudyProgress>;
  return {
    completedConceptIds: Array.isArray(source.completedConceptIds)
      ? source.completedConceptIds
      : [],
    answeredQuestionIds: Array.isArray(source.answeredQuestionIds)
      ? source.answeredQuestionIds
      : [],
    correctQuestionIds: Array.isArray(source.correctQuestionIds)
      ? source.correctQuestionIds
      : [],
    wrongQuestionIds: Array.isArray(source.wrongQuestionIds) ? source.wrongQuestionIds : [],
    weakQuestionIds: Array.isArray(source.weakQuestionIds) ? source.weakQuestionIds : [],
    bookmarkedConceptIds: Array.isArray(source.bookmarkedConceptIds)
      ? source.bookmarkedConceptIds
      : [],
    explainScores:
      source.explainScores && typeof source.explainScores === "object"
        ? source.explainScores
        : {},
    weakExplainIds: Array.isArray(source.weakExplainIds) ? source.weakExplainIds : [],
    lastStudiedAt: typeof source.lastStudiedAt === "string" ? source.lastStudiedAt : null,
    streak: typeof source.streak === "number" ? source.streak : 0,
    domainScores: { ...emptyDomainScores(), ...source.domainScores },
  };
};

const recalcDomainScores = (progress: StudyProgress): DomainScores => {
  const scores = emptyDomainScores();

  for (const domain of domains) {
    if (domain === "explanation") {
      const values = Object.values(progress.explainScores);
      scores.explanation = values.length
        ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 20)
        : 0;
      continue;
    }

    const domainQuestions = questions.filter((question) => question.domain === domain);
    const answered = domainQuestions.filter((question) =>
      progress.answeredQuestionIds.includes(question.id),
    );
    const correct = answered.filter((question) => progress.correctQuestionIds.includes(question.id));
    scores[domain] = answered.length ? Math.round((correct.length / answered.length) * 100) : 0;
  }

  return scores;
};

const withScores = (progress: StudyProgress) => ({
  ...progress,
  domainScores: recalcDomainScores(progress),
});

export const useProgress = () => {
  const [storageWriteFailed, setStorageWriteFailed] = useState(false);
  const [progress, setProgress] = useState<StudyProgress>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? withScores(coerceProgress(JSON.parse(raw))) : defaultProgress;
    } catch {
      return defaultProgress;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setStorageWriteFailed((current) => (current ? false : current));
    } catch {
      setStorageWriteFailed(true);
    }
  }, [progress]);

  const completeConcept = (conceptId: string) => {
    setProgress((current) =>
      withScores(
        touchStudy({
          ...current,
          completedConceptIds: unique([...current.completedConceptIds, conceptId]),
        }),
      ),
    );
  };

  const toggleBookmark = (conceptId: string) => {
    setProgress((current) => {
      const exists = current.bookmarkedConceptIds.includes(conceptId);
      return touchStudy({
        ...current,
        bookmarkedConceptIds: exists
          ? without(current.bookmarkedConceptIds, conceptId)
          : unique([...current.bookmarkedConceptIds, conceptId]),
      });
    });
  };

  const recordAnswer = ({ questionId, isCorrect }: AnswerResult) => {
    setProgress((current) =>
      withScores(
        touchStudy({
          ...current,
          answeredQuestionIds: unique([...current.answeredQuestionIds, questionId]),
          correctQuestionIds: isCorrect
            ? unique([...current.correctQuestionIds, questionId])
            : without(current.correctQuestionIds, questionId),
          wrongQuestionIds: isCorrect
            ? without(current.wrongQuestionIds, questionId)
            : unique([...current.wrongQuestionIds, questionId]),
          weakQuestionIds: isCorrect
            ? current.weakQuestionIds
            : unique([...current.weakQuestionIds, questionId]),
        }),
      ),
    );
  };

  const toggleWeakQuestion = (questionId: string) => {
    setProgress((current) => {
      const exists = current.weakQuestionIds.includes(questionId);
      return touchStudy({
        ...current,
        weakQuestionIds: exists
          ? without(current.weakQuestionIds, questionId)
          : unique([...current.weakQuestionIds, questionId]),
      });
    });
  };

  const recordExplainScore = (drillId: string, score: number) => {
    setProgress((current) =>
      withScores(
        touchStudy({
          ...current,
          explainScores: { ...current.explainScores, [drillId]: score },
          weakExplainIds:
            score <= 2
              ? unique([...current.weakExplainIds, drillId])
              : without(current.weakExplainIds, drillId),
        }),
      ),
    );
  };

  const toggleWeakExplain = (drillId: string) => {
    setProgress((current) => {
      const exists = current.weakExplainIds.includes(drillId);
      return touchStudy({
        ...current,
        weakExplainIds: exists
          ? without(current.weakExplainIds, drillId)
          : unique([...current.weakExplainIds, drillId]),
      });
    });
  };

  const resetProgress = () => setProgress(defaultProgress);

  const metrics = useMemo(() => {
    const answered = questions.filter((question) => progress.answeredQuestionIds.includes(question.id));
    const correct = questions.filter((question) => progress.correctQuestionIds.includes(question.id));
    const explainValues = Object.values(progress.explainScores);
    const explanationAverage = explainValues.length
      ? explainValues.reduce((sum, value) => sum + value, 0) / explainValues.length
      : 0;

    return {
      knowledge: Math.round((progress.completedConceptIds.length / concepts.length) * 100),
      structure: progress.domainScores.system,
      process: progress.domainScores.process,
      risk: progress.domainScores.risk,
      explain: Math.round(explanationAverage * 20),
      answeredCount: answered.length,
      correctCount: correct.length,
      questionAccuracy: answered.length ? Math.round((correct.length / answered.length) * 100) : 0,
      completedConceptCount: progress.completedConceptIds.length,
      totalConceptCount: concepts.length,
      totalQuestionCount: questions.length,
      explainCompletedCount: explainValues.length,
      totalExplainCount: explainDrills.length,
    };
  }, [progress]);

  return {
    progress,
    metrics,
    storageWriteFailed,
    completeConcept,
    toggleBookmark,
    recordAnswer,
    toggleWeakQuestion,
    recordExplainScore,
    toggleWeakExplain,
    resetProgress,
  };
};
