import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  TrainingMode,
  TrainingQuestion,
  TrainingSession,
  TrainingStats,
  UnknownReason,
  UserQuestionProgress,
} from "../types";
import { CautionBox, EmptyState, LocaleContentNotice, RedAccentButton, StatCard } from "../components/ui";
import { useLocale } from "../contexts/localeContext";
import { fuguErrorMessage } from "../lib/fuguReviewError";
import { GlossaryProvider } from "../components/GlossaryProvider";
import { RichTextWithGlossary } from "../components/RichTextWithGlossary";
import { QuestionGlossaryPanel } from "../components/QuestionGlossaryPanel";
import { glossaryTermById } from "../data/glossary";
import {
  FUGU_REVIEW_CONSENT_KEY,
  requestFuguReview,
} from "../lib/fuguReviewClient";
import {
  FUGU_USER_ANSWER_MAX_LENGTH,
  judgementLabels,
  weaknessTagLabels,
} from "../lib/fuguReviewSchema";
import type { FuguSummary, GlossarySummary } from "../hooks/useTrainingProgress";
import type { FuguReviewResult, FuguReviewStatus } from "../types/fuguReview";

type CardPhase = "front" | "back";
type TrainingScore = 0 | 1 | 2 | 3;

const modeLabel: Record<TrainingMode, string> = {
  daily10: "今日の10問",
  quick3: "3分トレーニング",
  weakReview: "苦手復習",
  random: "ランダム",
};

const audienceLabel: Record<NonNullable<TrainingQuestion["audience"]>, string> = {
  general: "一般",
  factory_manager: "工場長",
  it_dx: "IT/DX",
  quality: "品質",
  maintenance: "保全",
  production_control: "生産管理",
  shop_floor: "現場",
};

const scoreLabels: Record<TrainingScore, string> = {
  0: "説明できなかった",
  1: "用語は出た",
  2: "だいたい説明できた",
  3: "相手に合わせて説明できた",
};

const scoreValues: TrainingScore[] = [0, 1, 2, 3];

const unknownReasonOptions: Array<{ value: UnknownReason; label: string; hint: string }> = [
  { value: "term", label: "用語が分からない", hint: "ERP・MESなどの言葉で止まった" },
  { value: "question_intent", label: "何を聞かれているか分からない", hint: "問いの意図がつかめない" },
  { value: "answer_structure", label: "答え方の型が分からない", hint: "どう組み立てるか迷う" },
  { value: "example", label: "具体例が思いつかない", hint: "現場の例が出てこない" },
  { value: "kpi_connection", label: "KPIに接続できない", hint: "どの指標につなぐか分からない" },
];

const unknownReasonLabel: Record<UnknownReason, string> = {
  term: "用語が分からない",
  question_intent: "何を聞かれているか",
  answer_structure: "答え方の型",
  example: "具体例",
  kpi_connection: "KPI接続",
};

/** カード内の全テキストを集めて、用語検出・用語一覧の対象にする。 */
const collectQuestionTexts = (question?: TrainingQuestion): string[] => {
  if (!question) return [];
  return [
    question.prompt,
    question.situation,
    question.hint,
    ...(question.answerTemplate ?? []),
    question.expectedAnswer,
    question.modelAnswer30Sec,
    question.modelAnswer90Sec,
    ...question.keyPoints,
    ...question.ngPatterns,
    ...question.scoringRubric,
    ...question.mustIncludeKeywords,
    ...(question.riskNotes ?? []),
    ...(question.relatedKpis ?? []),
    question.responsibilityBoundary,
    question.existingSystemContext,
  ].filter((value): value is string => Boolean(value));
};

export const DrillDeckPage = ({
  activeSession,
  activeQuestions,
  questionProgress,
  stats,
  onStartTraining,
  onRecordResult,
  onMarkWeak,
  onRecordUnknownReason,
  onRecordGlossaryOpen,
  onRecordFuguReview,
  glossarySummary,
  fuguSummary,
  fuguEnabled,
  fuguReviewEndpoint,
  onHome,
}: {
  activeSession?: TrainingSession;
  activeQuestions: TrainingQuestion[];
  questionProgress: Record<string, UserQuestionProgress>;
  stats: TrainingStats;
  onStartTraining: (mode: TrainingMode) => void;
  onRecordResult: (args: {
    sessionId: string;
    questionId: string;
    score: TrainingScore;
    memo?: string;
    addWeak: boolean;
  }) => void;
  onMarkWeak: (questionId: string) => void;
  onRecordUnknownReason: (args: {
    sessionId?: string;
    questionId: string;
    reason: UnknownReason;
  }) => void;
  onRecordGlossaryOpen: (args: {
    sessionId?: string;
    questionId?: string;
    termId: string;
  }) => void;
  onRecordFuguReview: (args: {
    sessionId?: string;
    questionId: string;
    result: FuguReviewResult;
  }) => void;
  glossarySummary: GlossarySummary;
  fuguSummary: FuguSummary;
  fuguEnabled: boolean;
  fuguReviewEndpoint: string;
  onHome: () => void;
}) => {
  const { t } = useLocale();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<CardPhase>("front");
  const [memo, setMemo] = useState("");
  const [pendingWeak, setPendingWeak] = useState(false);
  const [savedScore, setSavedScore] = useState<TrainingScore | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [nowTime, setNowTime] = useState(() => Date.now());
  const [showUnknownReasons, setShowUnknownReasons] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<UnknownReason[]>([]);
  const [fuguAnswer, setFuguAnswer] = useState("");
  const [fuguStatus, setFuguStatus] = useState<FuguReviewStatus>("idle");
  const [fuguReview, setFuguReview] = useState<FuguReviewResult | null>(null);
  const [fuguFromCache, setFuguFromCache] = useState(false);
  const [fuguError, setFuguError] = useState("");
  const [fuguConsentAccepted, setFuguConsentAccepted] = useState(() => {
    try {
      return window.localStorage.getItem(FUGU_REVIEW_CONSENT_KEY) === "true";
    } catch {
      return false;
    }
  });
  const initializedQuestionId = useRef<string | undefined>(undefined);

  const currentQuestion = activeQuestions[currentIndex];
  const currentProgress = currentQuestion ? questionProgress[currentQuestion.id] : undefined;
  const completedCount = activeSession?.completedQuestionIds.length ?? 0;
  const totalCount = activeQuestions.length;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const sessionComplete = Boolean(
    activeSession && totalCount > 0 && activeSession.completedQuestionIds.length >= totalCount,
  );
  const quickRemainingSec =
    activeSession?.mode === "quick3"
      ? Math.max(0, 180 - Math.floor((nowTime - new Date(activeSession.startedAt).getTime()) / 1000))
      : null;

  useEffect(() => {
    if (activeSession?.mode !== "quick3") return undefined;
    const timerId = window.setInterval(() => setNowTime(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, [activeSession?.mode, activeSession?.startedAt]);

  useEffect(() => {
    setCurrentIndex(0);
    setPhase("front");
    setMemo("");
    setPendingWeak(false);
    setSavedScore(null);
    setShowResult(false);
    setShowUnknownReasons(false);
    setSelectedReasons([]);
    setFuguAnswer("");
    setFuguStatus("idle");
    setFuguReview(null);
    setFuguFromCache(false);
    setFuguError("");
    initializedQuestionId.current = undefined;
  }, [activeSession?.sessionId]);

  useEffect(() => {
    if (!currentQuestion) return;
    if (initializedQuestionId.current === currentQuestion.id) return;
    initializedQuestionId.current = currentQuestion.id;
    setMemo(questionProgress[currentQuestion.id]?.memo ?? "");
    setPhase("front");
    setPendingWeak(Boolean(questionProgress[currentQuestion.id]?.isWeak));
    setSavedScore(null);
    setShowUnknownReasons(false);
    setSelectedReasons([]);
    setFuguAnswer("");
    setFuguStatus("idle");
    setFuguReview(questionProgress[currentQuestion.id]?.lastFuguReview ?? null);
    setFuguFromCache(false);
    setFuguError("");
  }, [currentQuestion, questionProgress]);

  const revealAnswer = useCallback(() => setPhase("back"), []);

  const markWeak = useCallback(() => {
    if (!currentQuestion) return;
    setPendingWeak(true);
    onMarkWeak(currentQuestion.id);
  }, [currentQuestion, onMarkWeak]);

  // 「わからない」= すぐ答えを見せる導線ではなく、まず詰まった理由を選ばせる。
  const markUnknown = useCallback(() => {
    setShowUnknownReasons(true);
  }, []);

  const toggleReason = useCallback(
    (reason: UnknownReason) => {
      if (!currentQuestion) return;
      setSelectedReasons((current) => {
        if (current.includes(reason)) {
          return current.filter((value) => value !== reason);
        }
        onRecordUnknownReason({
          sessionId: activeSession?.sessionId,
          questionId: currentQuestion.id,
          reason,
        });
        return [...current, reason];
      });
    },
    [activeSession?.sessionId, currentQuestion, onRecordUnknownReason],
  );

  const closeUnknownReasons = useCallback(() => {
    setShowUnknownReasons(false);
    setSelectedReasons([]);
  }, []);

  const revealFromUnknown = useCallback(() => {
    markWeak();
    setShowUnknownReasons(false);
    setPhase("back");
  }, [markWeak]);

  const handleGlossaryOpen = useCallback(
    (termId: string) => {
      onRecordGlossaryOpen({
        sessionId: activeSession?.sessionId,
        questionId: currentQuestion?.id,
        termId,
      });
    },
    [activeSession?.sessionId, currentQuestion?.id, onRecordGlossaryOpen],
  );

  const submitFuguReview = useCallback(
    async (skipConsent = false) => {
      if (!activeSession || !currentQuestion || !fuguEnabled) return;
      if (!fuguConsentAccepted && !skipConsent) {
        setFuguStatus("consent");
        return;
      }

      setFuguStatus("loading");
      setFuguError("");
      try {
        const response = await requestFuguReview({
          endpoint: fuguReviewEndpoint,
          mode: activeSession.mode,
          question: currentQuestion,
          userAnswer: fuguAnswer,
          unknownReasons:
            currentProgress?.unknownReasons?.length
              ? currentProgress.unknownReasons
              : selectedReasons,
          openedGlossaryTermIds: currentProgress?.openedGlossaryTermIds ?? [],
        });
        setFuguReview(response.result);
        setFuguFromCache(response.fromCache);
        setFuguStatus("success");
        onRecordFuguReview({
          sessionId: activeSession.sessionId,
          questionId: currentQuestion.id,
          result: response.result,
        });
      } catch (error) {
        setFuguStatus("error");
        // The client throws locale-independent codes; resolve them here, where the
        // active dictionary is available.
        setFuguError(fuguErrorMessage(error, t));
      }
    },
    [
      activeSession,
      currentProgress?.openedGlossaryTermIds,
      currentProgress?.unknownReasons,
      currentQuestion,
      fuguAnswer,
      fuguConsentAccepted,
      fuguEnabled,
      fuguReviewEndpoint,
      onRecordFuguReview,
      selectedReasons,
      t,
    ],
  );

  const acceptFuguConsent = useCallback(() => {
    try {
      window.localStorage.setItem(FUGU_REVIEW_CONSENT_KEY, "true");
    } catch {
      // 同意状態の永続化に失敗しても、このセッション内の送信は続行する。
    }
    setFuguConsentAccepted(true);
    void submitFuguReview(true);
  }, [submitFuguReview]);

  const retry = useCallback(() => {
    setPhase("front");
    setSavedScore(null);
  }, []);

  const recordScore = useCallback((score: TrainingScore) => {
    if (!activeSession || !currentQuestion || savedScore != null) return;
    onRecordResult({
      sessionId: activeSession.sessionId,
      questionId: currentQuestion.id,
      score,
      memo,
      addWeak: pendingWeak,
    });
    setSavedScore(score);
  }, [activeSession, currentQuestion, memo, onRecordResult, pendingWeak, savedScore]);

  const goNext = useCallback(() => {
    if (savedScore == null) return;
    if (currentIndex >= activeQuestions.length - 1) {
      setShowResult(true);
      return;
    }
    setCurrentIndex((value) => value + 1);
    setPhase("front");
    setPendingWeak(false);
    setSavedScore(null);
    setMemo("");
    setShowUnknownReasons(false);
    setSelectedReasons([]);
    setFuguAnswer("");
    setFuguStatus("idle");
    setFuguReview(null);
    setFuguFromCache(false);
    setFuguError("");
  }, [activeQuestions.length, currentIndex, savedScore]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "TEXTAREA" || target?.tagName === "INPUT" || target?.tagName === "SELECT";
      const isInteractive =
        isTyping ||
        target?.tagName === "BUTTON" ||
        target?.tagName === "A" ||
        Boolean(target?.closest('[role="button"], [role="dialog"], [contenteditable="true"]'));
      if (event.defaultPrevented || isInteractive) return;

      const key = event.key.toLowerCase();
      if (key === "escape") {
        onHome();
        return;
      }
      if (!currentQuestion) return;
      if (showUnknownReasons && (event.key === " " || key === "enter")) {
        return;
      }
      if ((event.key === " " || key === "enter") && phase === "front") {
        event.preventDefault();
        revealAnswer();
        return;
      }
      if (key === "w") {
        markUnknown();
        return;
      }
      if (key === "b") {
        markWeak();
        return;
      }
      if (key === "r") {
        retry();
        return;
      }
      if (phase === "back" && (key === "0" || key === "1" || key === "2" || key === "3")) {
        recordScore(Number(key) as TrainingScore);
        return;
      }
      if ((key === "n" || key === "enter") && savedScore != null) {
        goNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentQuestion,
    goNext,
    markUnknown,
    markWeak,
    onHome,
    phase,
    recordScore,
    retry,
    revealAnswer,
    savedScore,
    showUnknownReasons,
  ]);

  if (!activeSession) {
    return <TrainingLauncher onStartTraining={onStartTraining} stats={stats} />;
  }

  if (!activeQuestions.length) {
    return (
      <section className="page trainingPage">
        <EmptyState title={t.drill.emptyTitle} text={t.drill.emptyText} />
        <div className="trainingEmptyActions">
          <RedAccentButton onClick={() => onStartTraining("daily10")}>
            {t.drill.emptyAction}
          </RedAccentButton>
          <RedAccentButton variant="secondary" onClick={onHome}>
            {t.common.home}
          </RedAccentButton>
        </div>
      </section>
    );
  }

  if (showResult || sessionComplete) {
    return (
      <GlossaryProvider onOpenTerm={handleGlossaryOpen}>
        <TrainingResult
          session={activeSession}
          questions={activeQuestions}
          stats={stats}
          glossarySummary={glossarySummary}
          fuguSummary={fuguSummary}
          onHome={onHome}
          onRestart={() => onStartTraining(activeSession.mode)}
        />
      </GlossaryProvider>
    );
  }

  return (
    <GlossaryProvider onOpenTerm={handleGlossaryOpen}>
    <section className="page trainingPage">
      <div className="trainingTopBar">
        <div>
          <span className="eyebrow">{modeLabel[activeSession.mode]}</span>
          <h1>{t.drill.sessionTitle}</h1>
        </div>
        <button className="plainTextButton" onClick={onHome} type="button">
          {t.drill.escHome}
        </button>
      </div>

      <div className="trainingLayout">
        <ProgressSidePanel
          completedCount={completedCount}
          totalCount={totalCount}
          progressPercent={progressPercent}
          question={currentQuestion}
          progress={currentProgress}
          quickRemainingSec={quickRemainingSec}
        />

        <article className={`trainingCard trainingCard-${phase}`} aria-live="polite">
          <div className="cardProgressLine">
            <span style={{ width: `${Math.min(progressPercent, 100)}%` }} />
          </div>

          {phase === "front" ? (
            <QuestionFront
              question={currentQuestion}
              currentIndex={currentIndex}
              totalCount={totalCount}
              memo={memo}
              pendingWeak={pendingWeak}
              onMemo={setMemo}
              onReveal={revealAnswer}
              onUnknown={markUnknown}
              onMarkWeak={markWeak}
              showUnknownReasons={showUnknownReasons}
              selectedReasons={selectedReasons}
              onToggleReason={toggleReason}
              onCloseUnknownReasons={closeUnknownReasons}
              onRevealFromUnknown={revealFromUnknown}
            />
          ) : (
            <QuestionBack
              question={currentQuestion}
              pendingWeak={pendingWeak}
              savedScore={savedScore}
              onScore={recordScore}
              onMarkWeak={markWeak}
              onRetry={retry}
              onNext={goNext}
              fuguEnabled={fuguEnabled}
              fuguAnswer={fuguAnswer}
              fuguStatus={fuguStatus}
              fuguReview={fuguReview}
              fuguFromCache={fuguFromCache}
              fuguError={fuguError}
              fuguConsentAccepted={fuguConsentAccepted}
              onFuguAnswerChange={setFuguAnswer}
              onSubmitFuguReview={() => {
                void submitFuguReview();
              }}
              onAcceptFuguConsent={acceptFuguConsent}
            />
          )}
        </article>

        <MemoSidePanel question={currentQuestion} progress={currentProgress} memo={memo} />
      </div>
    </section>
    </GlossaryProvider>
  );
};

const TrainingLauncher = ({
  onStartTraining,
  stats,
}: {
  onStartTraining: (mode: TrainingMode) => void;
  stats: TrainingStats;
}) => {
  const { locale, setLocale, t } = useLocale();
  const modes: TrainingMode[] = ["daily10", "quick3", "weakReview", "random"];
  // The 85-item explanation bank is Japanese-only, so the English locale states that
  // plainly rather than opening a session whose cards the reader cannot follow.
  const bankAvailable = locale === "ja";

  return (
    <section className="page trainingPage">
      <div className="pageHeader">
        <span className="eyebrow">Training</span>
        <h1>{t.drill.topTitle}</h1>
        <p>{t.drill.topLead}</p>
      </div>
      <div className="homeStats">
        <StatCard
          label={t.drill.statToday}
          value={`${stats.answeredToday}`}
          detail={t.drill.statTodayDetail}
        />
        <StatCard
          label={t.drill.statWeek}
          value={`${stats.weekAnswerCount}`}
          detail={t.drill.statWeekDetail}
        />
        <StatCard
          label={t.drill.statWeak}
          value={`${stats.weakCount}`}
          detail={t.drill.statWeakDetail}
        />
      </div>
      {bankAvailable ? (
        <div className="modeGrid">
          {modes.map((mode) => (
            <button
              className="modeCard"
              key={mode}
              onClick={() => onStartTraining(mode)}
              type="button"
            >
              <span>{t.drill.modes[mode].title}</span>
              <strong>{t.drill.modes[mode].detail}</strong>
              <em>{t.common.start}</em>
            </button>
          ))}
        </div>
      ) : (
        <LocaleContentNotice
          title={t.drill.englishNoticeTitle}
          body={t.drill.englishNoticeBody}
          action={t.drill.englishNoticeAction}
          onAction={() => setLocale("ja")}
        />
      )}
    </section>
  );
};

const ProgressSidePanel = ({
  completedCount,
  totalCount,
  progressPercent,
  question,
  progress,
  quickRemainingSec,
}: {
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  question: TrainingQuestion;
  progress?: UserQuestionProgress;
  quickRemainingSec: number | null;
}) => (
  <aside className="trainingSidePanel" aria-label="セッション進捗">
    <span>Session</span>
    <strong>
      {completedCount}/{totalCount}
    </strong>
    <div className="miniProgressTrack" aria-hidden="true">
      <span style={{ width: `${Math.min(progressPercent, 100)}%` }} />
    </div>
    <dl>
      <div>
        <dt>カテゴリ</dt>
        <dd>{question.category}</dd>
      </div>
      <div>
        <dt>回答時間</dt>
        <dd>{question.answerTimeSec}秒</dd>
      </div>
      {quickRemainingSec != null ? (
        <div>
          <dt>3分目安</dt>
          <dd>
            {Math.floor(quickRemainingSec / 60)}:{`${quickRemainingSec % 60}`.padStart(2, "0")}
          </dd>
        </div>
      ) : null}
      <div>
        <dt>前回評価</dt>
        <dd>{progress?.lastScore != null ? `${progress.lastScore}/3` : "初回"}</dd>
      </div>
      <div>
        <dt>次回復習</dt>
        <dd>{progress?.nextReviewAt ?? "-"}</dd>
      </div>
    </dl>
    <ShortcutHelp />
  </aside>
);

const ShortcutHelp = () => (
  <div className="shortcutHelp" aria-label="PCショートカット">
    <span>Keys</span>
    <p>Space/Enter: 答えを見る</p>
    <p>N: 次へ / W: わからない</p>
    <p>B: 苦手 / R: もう一度</p>
    <p>0-3: 自己評価 / Esc: 戻る</p>
  </div>
);

const QuestionFront = ({
  question,
  currentIndex,
  totalCount,
  memo,
  pendingWeak,
  onMemo,
  onReveal,
  onUnknown,
  onMarkWeak,
  showUnknownReasons,
  selectedReasons,
  onToggleReason,
  onCloseUnknownReasons,
  onRevealFromUnknown,
}: {
  question: TrainingQuestion;
  currentIndex: number;
  totalCount: number;
  memo: string;
  pendingWeak: boolean;
  onMemo: (memo: string) => void;
  onReveal: () => void;
  onUnknown: () => void;
  onMarkWeak: () => void;
  showUnknownReasons: boolean;
  selectedReasons: UnknownReason[];
  onToggleReason: (reason: UnknownReason) => void;
  onCloseUnknownReasons: () => void;
  onRevealFromUnknown: () => void;
}) => {
  // カード全体で同一用語のチップ化回数を共有し、チップだらけを防ぐ。
  const usedCounts = new Map<string, number>();
  const questionTexts = useMemo(() => collectQuestionTexts(question), [question]);
  return (
  <>
    <div className="trainingCardMeta">
      <span>
        {currentIndex + 1}/{totalCount}
      </span>
      <span className="phaseBadge">Front</span>
      <span>{question.category}</span>
      <span>{question.answerTimeSec}秒</span>
      <span>{question.difficulty}</span>
      {question.audience ? <span>{audienceLabel[question.audience]}</span> : null}
    </div>

    <div className="questionFrontBody">
      <span className="topicPill">{question.topic}</span>
      <RichTextWithGlossary as="h2" text={question.prompt} usedCounts={usedCounts} />
      {question.situation ? (
        <RichTextWithGlossary
          as="p"
          className="situationText"
          text={question.situation}
          usedCounts={usedCounts}
        />
      ) : null}
    </div>

    <QuestionGlossaryPanel texts={questionTexts} />

    <div className="hintBox">
      <span>Hint</span>
      <RichTextWithGlossary as="p" text={question.hint} usedCounts={usedCounts} />
    </div>

    <div className="answerTemplate">
      <span>回答の型</span>
      <ol>
        {question.answerTemplate?.map((item) => (
          <li key={item}>
            <RichTextWithGlossary text={item} usedCounts={usedCounts} />
          </li>
        ))}
      </ol>
    </div>

    <label className="memoField">
      <span>任意メモ</span>
      <textarea
        value={memo}
        onChange={(event) => onMemo(event.target.value)}
        placeholder="声に出す前のキーワードだけでOK"
        rows={3}
      />
    </label>

    {pendingWeak ? <p className="weakInlineNotice">後で復習に入れました。</p> : null}

    {showUnknownReasons ? (
      <UnknownReasonPicker
        selectedReasons={selectedReasons}
        onToggleReason={onToggleReason}
        onClose={onCloseUnknownReasons}
        onReveal={onRevealFromUnknown}
      />
    ) : null}

    <div className="cardBottomActions">
      <RedAccentButton onClick={onReveal}>答えを見る</RedAccentButton>
      <RedAccentButton variant="secondary" onClick={onUnknown}>
        わからない
      </RedAccentButton>
      <RedAccentButton variant="ghost" onClick={onMarkWeak}>
        後で復習
      </RedAccentButton>
    </div>
  </>
  );
};

const UnknownReasonPicker = ({
  selectedReasons,
  onToggleReason,
  onClose,
  onReveal,
}: {
  selectedReasons: UnknownReason[];
  onToggleReason: (reason: UnknownReason) => void;
  onClose: () => void;
  onReveal: () => void;
}) => {
  const firstReasonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstReasonRef.current?.focus();
  }, []);

  return (
    <div className="unknownReasonPanel" role="group" aria-label="どこで詰まったか">
      <div className="unknownReasonHead">
        <span>どこで詰まりましたか？</span>
        <small>後から「単語で詰まったか、構造で詰まったか」を見返せます。</small>
      </div>
      <div className="unknownReasonGrid">
        {unknownReasonOptions.map((option, index) => {
          const active = selectedReasons.includes(option.value);
          return (
            <button
              ref={index === 0 ? firstReasonRef : undefined}
              key={option.value}
              type="button"
              className={`unknownReasonButton ${active ? "isSelected" : ""}`}
              aria-pressed={active}
              onClick={() => onToggleReason(option.value)}
            >
              <strong>{option.label}</strong>
              <span>{option.hint}</span>
            </button>
          );
        })}
      </div>
      <div className="unknownReasonActions">
        <RedAccentButton variant="ghost" onClick={onClose}>
          まだ自分で考える
        </RedAccentButton>
        <RedAccentButton onClick={onReveal}>答えを見る</RedAccentButton>
      </div>
    </div>
  );
};

const QuestionBack = ({
  question,
  pendingWeak,
  savedScore,
  onScore,
  onMarkWeak,
  onRetry,
  onNext,
  fuguEnabled,
  fuguAnswer,
  fuguStatus,
  fuguReview,
  fuguFromCache,
  fuguError,
  fuguConsentAccepted,
  onFuguAnswerChange,
  onSubmitFuguReview,
  onAcceptFuguConsent,
}: {
  question: TrainingQuestion;
  pendingWeak: boolean;
  savedScore: TrainingScore | null;
  onScore: (score: TrainingScore) => void;
  onMarkWeak: () => void;
  onRetry: () => void;
  onNext: () => void;
  fuguEnabled: boolean;
  fuguAnswer: string;
  fuguStatus: FuguReviewStatus;
  fuguReview: FuguReviewResult | null;
  fuguFromCache: boolean;
  fuguError: string;
  fuguConsentAccepted: boolean;
  onFuguAnswerChange: (answer: string) => void;
  onSubmitFuguReview: () => void;
  onAcceptFuguConsent: () => void;
}) => {
  const usedCounts = new Map<string, number>();
  const questionTexts = useMemo(() => collectQuestionTexts(question), [question]);
  return (
  <>
    <div className="trainingCardMeta">
      <span className="phaseBadge answerPhase">Answer</span>
      <span>{question.category}</span>
      <span>{question.answerTimeSec}秒回答</span>
      <span>{question.topic}</span>
    </div>

    <div className="answerRevealHeader">
      <span>Answer Layer</span>
      <h2>答え合わせの基準</h2>
      <p>FUGUなしでも、この面だけで模範回答・言い方・採点基準を確認できます。</p>
    </div>

    <div className="answerPanel modelAnswerPanel">
      <span>1. 模範回答</span>
      <RichTextWithGlossary as="p" text={question.expectedAnswer} usedCounts={usedCounts} />
    </div>

    <div className="answerVariantGrid" aria-label="30秒回答と90秒回答">
      <div className="answerVariantCard">
        <span>2. 30秒回答</span>
        <RichTextWithGlossary as="p" text={question.modelAnswer30Sec} usedCounts={usedCounts} />
      </div>
      <div className="answerVariantCard isLong">
        <span>3. 90秒回答</span>
        <RichTextWithGlossary as="p" text={question.modelAnswer90Sec} usedCounts={usedCounts} />
      </div>
    </div>

    <div className="answerDetailGrid answerSignalGrid">
      <DetailList title="4. 答えるべき要点" items={question.keyPoints} usedCounts={usedCounts} />
      <ChipList
        title="5. 入れるべきキーワード"
        items={question.mustIncludeKeywords}
        usedCounts={usedCounts}
      />
      <DetailList title="6. NG回答・言いすぎ注意" items={question.ngPatterns} usedCounts={usedCounts} />
      <DetailList title="自己採点基準" items={question.scoringRubric} usedCounts={usedCounts} />
    </div>

    <div className="answerOpsGrid">
      <ChipList title="7. 関連KPI" items={question.relatedKpis ?? []} usedCounts={usedCounts} />
      <div className="responsibilityPanel">
        <h3>8. 責任分界メモ</h3>
        <RichTextWithGlossary
          as="p"
          text={question.responsibilityBoundary}
          usedCounts={usedCounts}
        />
      </div>
      <DetailList title="注意点" items={question.riskNotes ?? []} usedCounts={usedCounts} />
    </div>

    {/* 問題の巻末: 用語説明に加えて「どんな場面で使うか」を補足する。 */}
    <QuestionGlossaryPanel
      texts={questionTexts}
      defaultOpen
      showUsage
      title="この問題の用語まとめ（使う場面つき）"
      buttonLabel="用語まとめ（使う場面つき）"
    />

    {fuguEnabled ? (
      <FuguReviewPanel
        answer={fuguAnswer}
        status={fuguStatus}
        review={fuguReview}
        fromCache={fuguFromCache}
        error={fuguError}
        consentAccepted={fuguConsentAccepted}
        onAnswerChange={onFuguAnswerChange}
        onSubmit={onSubmitFuguReview}
        onAcceptConsent={onAcceptFuguConsent}
      />
    ) : null}

    <section className="selfScorePanel" aria-label="自己評価">
      <div className="sectionHeader tight">
        <div>
          <span className="eyebrow">Self Check</span>
          <h2>0〜3で自己評価</h2>
        </div>
        {pendingWeak ? <p>苦手に追加済み</p> : null}
      </div>
      <div className="scoreButtonGrid">
        {scoreValues.map((score) => (
          <button
            className={`scoreButton ${savedScore === score ? "isSelected" : ""}`}
            disabled={savedScore != null}
            key={score}
            onClick={() => onScore(score)}
            type="button"
          >
            <strong>{score}</strong>
            <span>{scoreLabels[score]}</span>
          </button>
        ))}
      </div>
      {savedScore != null ? (
        <p className="scoreSavedNotice">自己評価 {savedScore}/3 を保存しました。</p>
      ) : null}
    </section>

    <div className="cardBottomActions">
      <RedAccentButton variant="ghost" onClick={onMarkWeak}>
        苦手に追加
      </RedAccentButton>
      <RedAccentButton variant="secondary" onClick={onRetry}>
        もう一度
      </RedAccentButton>
      <RedAccentButton disabled={savedScore == null} onClick={onNext}>
        次の問題へ
      </RedAccentButton>
    </div>
  </>
  );
};

const FuguReviewPanel = ({
  answer,
  status,
  review,
  fromCache,
  error,
  consentAccepted,
  onAnswerChange,
  onSubmit,
  onAcceptConsent,
}: {
  answer: string;
  status: FuguReviewStatus;
  review: FuguReviewResult | null;
  fromCache: boolean;
  error: string;
  consentAccepted: boolean;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  onAcceptConsent: () => void;
}) => {
  const tooLong = answer.length > FUGU_USER_ANSWER_MAX_LENGTH;
  const isLoading = status === "loading";
  const submitDisabled = isLoading || !answer.trim() || tooLong;

  return (
    <section className="fuguReviewPanel" aria-label="FUGU参考講評">
      <div className="sectionHeader tight">
        <div>
          <span className="eyebrow">FUGU Review</span>
          <h2>回答を参考講評する</h2>
        </div>
        {fromCache ? <p>同じ回答のキャッシュ</p> : null}
      </div>

      <label className="fuguAnswerField">
        <span>講評用の自分の回答</span>
        <textarea
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          maxLength={FUGU_USER_ANSWER_MAX_LENGTH + 100}
          placeholder="ここに、実際に説明するつもりの回答だけを書きます。メモ欄の内容は送信しません。"
          rows={5}
        />
      </label>
      <div className={`fuguCharCount ${tooLong ? "isOver" : ""}`}>
        {answer.length}/{FUGU_USER_ANSWER_MAX_LENGTH}
      </div>

      {status === "consent" && !consentAccepted ? (
        <div className="fuguConsentBox" role="status">
          <strong>送信前の確認</strong>
          <p>
            FUGU講評では、問題文・模範回答・あなたの回答文をFUGU APIへ送信します。
            個人名、社名、顧客名、機密情報は入力しないでください。
            送信するのは、この問題の講評に必要な最小限の情報のみです。
          </p>
          <RedAccentButton onClick={onAcceptConsent}>同意して送信</RedAccentButton>
        </div>
      ) : null}

      <div className="fuguActions">
        <RedAccentButton disabled={submitDisabled} onClick={onSubmit}>
          {isLoading ? "講評中..." : "FUGUに参考講評してもらう"}
        </RedAccentButton>
        <p>安全・品質・責任分界の説明力を見る開発時レビューです。</p>
      </div>

      {status === "error" ? <p className="fuguError">{error}</p> : null}
      {review ? <FuguReviewResultCard review={review} /> : null}
    </section>
  );
};

const FuguReviewResultCard = ({ review }: { review: FuguReviewResult }) => (
  <div className="fuguResultCard">
    <p>{review.summary}</p>
    <div className="fuguScoreLine">
      <span>参考評価</span>
      <strong>{review.score}/3</strong>
      <small>{judgementLabels[review.judgement]}</small>
    </div>

    <div className="fuguResultGrid">
      <FuguList title="良い点" items={review.goodPoints} empty="良い点は講評に含まれていません。" />
      <FuguList title="足りない点" items={review.missingPoints} empty="大きな不足はありません。" />
    </div>

    {review.weaknessTags.length ? (
      <div className="fuguTagRow">
        {review.weaknessTags.map((tag) => (
          <span key={tag}>{weaknessTagLabels[tag]}</span>
        ))}
      </div>
    ) : null}

    <div className="fuguFeedbackGrid">
      <div>
        <strong>KPI</strong>
        <p>{review.kpiConnectionFeedback}</p>
      </div>
      <div>
        <strong>責任分界</strong>
        <p>{review.responsibilityBoundaryFeedback}</p>
      </div>
      <div>
        <strong>安全・品質</strong>
        <p>{review.safetyQualityFeedback}</p>
      </div>
    </div>

    <FuguList
      title="危険な表現"
      items={review.riskyExpressions}
      empty="危険な言いすぎ表現は特に見当たりません。"
    />

    {review.riskyExpressionRewrites.length ? (
      <div className="fuguRewriteList">
        <h3>危険な表現の言い換え</h3>
        {review.riskyExpressionRewrites.map((item) => (
          <div key={`${item.from}-${item.to}`}>
            <span>{item.from || "表現未指定"}</span>
            <strong>{item.to || "言い換え未指定"}</strong>
            <p>{item.reason}</p>
          </div>
        ))}
      </div>
    ) : null}

    <FuguList
      title="追加するとよいキーワード"
      items={review.recommendedKeywords}
      empty="追加必須のキーワードはありません。"
    />

    <details className="foldPanel fuguImprovedAnswer">
      <summary>改善回答を見る</summary>
      <div>
        <h3>改善版30秒回答</h3>
        <p>{review.improved30SecAnswer}</p>
        <h3>改善版90秒回答</h3>
        <p>{review.improved90SecAnswer}</p>
      </div>
    </details>

    <FuguList title="追加で考える問い" items={review.followUpQuestions} empty="追加質問はありません。" />
    <FuguList title="次に練習すること" items={review.nextPracticeTopics} empty="次の練習テーマはありません。" />
  </div>
);

const FuguList = ({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) => (
  <div className="fuguList">
    <h3>{title}</h3>
    {items.length ? (
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    ) : (
      <p>{empty}</p>
    )}
  </div>
);

const DetailList = ({
  title,
  items,
  usedCounts,
}: {
  title: string;
  items: string[];
  usedCounts?: Map<string, number>;
}) => (
  <div className="detailList">
    <h3>{title}</h3>
    {items.length ? (
      <ul>
        {items.map((item) => (
          <li key={item}>
            <RichTextWithGlossary text={item} usedCounts={usedCounts} />
          </li>
        ))}
      </ul>
    ) : (
      <p>-</p>
    )}
  </div>
);

const ChipList = ({
  title,
  items,
  usedCounts,
}: {
  title: string;
  items: string[];
  usedCounts?: Map<string, number>;
}) => (
  <div className="chipList">
    <h3>{title}</h3>
    {items.length ? (
      <div className="answerChipRow">
        {items.map((item) => (
          <span key={item}>
            <RichTextWithGlossary text={item} usedCounts={usedCounts} maxChipsPerBlock={1} />
          </span>
        ))}
      </div>
    ) : (
      <p>-</p>
    )}
  </div>
);

const MemoSidePanel = ({
  question,
  progress,
  memo,
}: {
  question: TrainingQuestion;
  progress?: UserQuestionProgress;
  memo: string;
}) => (
  <aside className="trainingNotePanel" aria-label="メモと前回履歴">
    <span>Memo / History</span>
    <div className="notePreview">
      <strong>今回のメモ</strong>
      <p>{memo.trim() || "メモなしでも進められます。"}</p>
    </div>
    <div className="notePreview">
      <strong>前回メモ</strong>
      <p>{progress?.lastUserAnswer || progress?.memo || "まだ履歴はありません。"}</p>
    </div>
    <CautionBox title="言いすぎ注意">
      {question.responsibilityBoundary ?? "AIが支援すること、人が決めること、残す証跡を分けます。"}
    </CautionBox>
  </aside>
);

const TrainingResult = ({
  session,
  questions,
  stats,
  glossarySummary,
  fuguSummary,
  onHome,
  onRestart,
}: {
  session: TrainingSession;
  questions: TrainingQuestion[];
  stats: TrainingStats;
  glossarySummary: GlossarySummary;
  fuguSummary: FuguSummary;
  onHome: () => void;
  onRestart: () => void;
}) => {
  const scores = Object.values(session.scores);
  const average = scores.length
    ? Math.round((scores.reduce((sum: number, score) => sum + score, 0) / scores.length) * 10) / 10
    : 0;
  const categoryStats = questions.reduce(
    (result, question) => {
      const score = session.scores[question.id];
      if (score == null) return result;
      const current = result[question.category] ?? { count: 0, score: 0 };
      return {
        ...result,
        [question.category]: { count: current.count + 1, score: current.score + score },
      };
    },
    {} as Record<string, { count: number; score: number }>,
  );

  return (
    <section className="page trainingResultPage">
      <div className="resultHero">
        <span className="eyebrow">{modeLabel[session.mode]}</span>
        <h1>今日の結果</h1>
        <p>答えを読んだ量ではなく、声に出して説明した回数を積み上げます。</p>
      </div>

      <div className="homeStats resultStats">
        <StatCard label="今日の回答数" value={`${stats.answeredToday}`} detail="この端末の合計" />
        <StatCard label="平均自己評価" value={`${average}/3`} detail={`${scores.length}問の平均`} />
        <StatCard label="苦手に追加" value={`${session.weakAddedCount}`} detail="次回優先" />
        <StatCard label="明日復習" value={`${stats.dueTomorrowCount}`} detail="復習予定" />
      </div>

      <section className="whitePanel compactPanel">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Category</span>
            <h2>カテゴリ別の結果</h2>
          </div>
        </div>
        <div className="categoryMeterList">
          {Object.entries(categoryStats).map(([category, value]) => (
            <div className="categoryMeter" key={category}>
              <span>{category}</span>
              <strong>
                {value.count}問 / 平均 {Math.round((value.score / value.count) * 10) / 10}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <FuguSummarySection summary={fuguSummary} />

      <GlossarySummarySection summary={glossarySummary} />

      <div className="resultActions">
        <RedAccentButton onClick={onHome}>ホームへ戻る</RedAccentButton>
        <RedAccentButton variant="secondary" onClick={onRestart}>
          もう一度{modeLabel[session.mode]}
        </RedAccentButton>
      </div>
    </section>
  );
};

const FuguSummarySection = ({ summary }: { summary: FuguSummary }) => {
  if (!summary.reviewedQuestionCount) return null;

  return (
    <section className="whitePanel compactPanel fuguSummary" aria-label="FUGU講評サマリー">
      <div className="sectionHeader">
        <div>
          <span className="eyebrow">FUGU Review</span>
          <h2>参考講評サマリー</h2>
        </div>
      </div>
      <div className="glossarySummaryGrid">
        <div className="glossarySummaryBlock">
          <h3>講評済み</h3>
          <p>
            <strong>{summary.reviewedQuestionCount}</strong>問 / 平均{" "}
            <strong>{summary.averageFuguScore}/3</strong>
          </p>
          {summary.scoreGap != null ? (
            <p className="fuguGap">自己評価との差: {summary.scoreGap > 0 ? "+" : ""}{summary.scoreGap}</p>
          ) : null}
        </div>
        <div className="glossarySummaryBlock">
          <h3>弱点タグ</h3>
          {summary.topWeaknessTags.length ? (
            <ul className="glossaryReasonList">
              {summary.topWeaknessTags.map((entry) => (
                <li key={entry.tag}>
                  <span>{weaknessTagLabels[entry.tag]}</span>
                  <small>{entry.count}回</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="glossarySummaryEmpty">弱点タグはまだありません。</p>
          )}
        </div>
      </div>
      {summary.nextPracticeTopics.length ? (
        <div className="glossaryNextTip">
          <p>
            次の練習: <strong>{summary.nextPracticeTopics.join(" / ")}</strong>
          </p>
        </div>
      ) : null}
    </section>
  );
};

const termName = (termId: string) => glossaryTermById[termId]?.term ?? termId;

const GlossarySummarySection = ({ summary }: { summary: GlossarySummary }) => {
  const hasActivity =
    summary.topTermIdsToday.length > 0 ||
    summary.topTermIdsAllTime.length > 0 ||
    summary.termStuckQuestionCount > 0 ||
    Object.keys(summary.unknownReasonCounts).length > 0;

  if (!hasActivity) return null;

  const topToday = summary.topTermIdsToday.length
    ? summary.topTermIdsToday
    : summary.topTermIdsAllTime;
  const reasonEntries = (Object.entries(summary.unknownReasonCounts) as Array<[UnknownReason, number]>)
    .filter(([, count]) => count > 0)
    .sort((left, right) => right[1] - left[1]);

  return (
    <section className="whitePanel compactPanel glossarySummary" aria-label="用語理解サマリー">
      <div className="sectionHeader">
        <div>
          <span className="eyebrow">Glossary</span>
          <h2>用語理解サマリー</h2>
        </div>
      </div>

      <div className="glossarySummaryGrid">
        <div className="glossarySummaryBlock">
          <h3>今日よく確認した用語</h3>
          {topToday.length ? (
            <ol className="glossaryRankList">
              {topToday.map((entry) => (
                <li key={entry.termId}>
                  <span>{termName(entry.termId)}</span>
                  <small>{entry.count}回</small>
                </li>
              ))}
            </ol>
          ) : (
            <p className="glossarySummaryEmpty">まだ用語を開いていません。</p>
          )}
        </div>

        <div className="glossarySummaryBlock">
          <h3>つまずいた理由</h3>
          {reasonEntries.length ? (
            <ul className="glossaryReasonList">
              {reasonEntries.map(([reason, count]) => (
                <li key={reason}>
                  <span>{unknownReasonLabel[reason]}</span>
                  <small>{count}回</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="glossarySummaryEmpty">「わからない」の記録はありません。</p>
          )}
          <p className="glossaryStuckNote">
            用語で詰まった問題数：<strong>{summary.termStuckQuestionCount}</strong>問
          </p>
        </div>
      </div>

      {summary.nextTermIds.length ? (
        <div className="glossaryNextTip">
          <span aria-hidden="true">📌</span>
          <p>
            明日のおすすめ：
            <strong>「{summary.nextTermIds.map(termName).join(" / ")} を復習しましょう」</strong>
          </p>
        </div>
      ) : null}
    </section>
  );
};
