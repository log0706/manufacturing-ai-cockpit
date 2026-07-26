import { useCallback, useEffect, useState } from "react";
import { glossaryTermById } from "../data/glossary";
import type { BeginnerChoiceQuestion } from "../data/beginnerChoiceQuestions";
import { QuestionGlossaryPanel } from "../components/QuestionGlossaryPanel";
import { RichTextWithGlossary } from "../components/RichTextWithGlossary";
import { GlossaryProvider } from "../components/GlossaryProvider";
import { LocaleContentNotice, RedAccentButton, StatCard } from "../components/ui";
import { useLocale } from "../contexts/localeContext";
import {
  beginnerCategories,
  // The question/answer/result screens render the Japanese-only question bank, so they
  // keep the Japanese label maps. They are unreachable in the English locale, where the
  // top screen shows LocaleContentNotice instead of starting a session.
  beginnerChoiceCategoryLabels as categoryLabels,
  beginnerChoiceModeLabels as modeLabels,
} from "../lib/beginnerChoiceLabels";
import type {
  BeginnerChoiceCategory,
  BeginnerChoiceId,
  BeginnerChoiceMode,
  BeginnerChoiceProgress,
  BeginnerChoiceSession,
  BeginnerChoiceStats,
} from "../types";

const choiceIds: BeginnerChoiceId[] = ["A", "B", "C", "D"];

const isInteractiveElement = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(
    target.closest("button, input, textarea, select, a, [role='dialog']") ||
      target.closest("[role='button']:not(.choiceCard)"),
  );

const termTexts = (question: BeginnerChoiceQuestion) =>
  question.relatedGlossaryTerms
    .map((id) => glossaryTermById[id])
    .filter((term): term is NonNullable<typeof term> => term != null)
    .map((term) => `${term.term} ${term.shortDefinition} ${term.usageSituation ?? ""}`);

const fieldTexts = (question: BeginnerChoiceQuestion) => [
  question.prompt,
  ...question.choices.map((choice) => choice.text),
  question.explanation,
  question.whyCorrect,
  question.keyTakeaway,
  question.caution,
  question.bridgeToAdvancedQuestion,
  ...(question.relatedKpis ?? []),
  ...(question.relatedDepartments ?? []),
  ...Object.values(question.whyWrong),
  ...termTexts(question),
];

export const BeginnerChoicePage = ({
  activeSession,
  activeQuestions,
  questionProgress,
  stats,
  storageWriteFailed,
  onStart,
  onAnswer,
  onMarkWeak,
  onRecordUnknown,
  onClearSession,
  onHome,
}: {
  activeSession?: BeginnerChoiceSession;
  activeQuestions: BeginnerChoiceQuestion[];
  questionProgress: Record<string, BeginnerChoiceProgress>;
  stats: BeginnerChoiceStats;
  storageWriteFailed: boolean;
  onStart: (mode: BeginnerChoiceMode, category?: BeginnerChoiceCategory) => void;
  onAnswer: (args: {
    sessionId: string;
    question: BeginnerChoiceQuestion;
    selectedChoiceId: BeginnerChoiceId;
  }) => void;
  onMarkWeak: (questionId: string) => void;
  onRecordUnknown: (questionId: string) => void;
  onClearSession: () => void;
  onHome: () => void;
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BeginnerChoiceCategory>("systems");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<BeginnerChoiceId | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const question = activeQuestions[currentIndex];
  const currentProgress = question ? questionProgress[question.id] : undefined;
  const progressPercent = activeQuestions.length
    ? Math.round(((currentIndex + (answered ? 1 : 0)) / activeQuestions.length) * 100)
    : 0;

  const answerQuestion = useCallback((choiceId: BeginnerChoiceId) => {
    if (!question || !activeSession || answered) return;
    setSelectedChoiceId(choiceId);
    setAnswered(true);
    onAnswer({ sessionId: activeSession.sessionId, question, selectedChoiceId: choiceId });
  }, [activeSession, answered, onAnswer, question]);

  const goNext = useCallback(() => {
    if (!activeSession) return;
    if (currentIndex + 1 >= activeQuestions.length) {
      setShowResult(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
    setSelectedChoiceId(null);
    setAnswered(false);
  }, [activeQuestions.length, activeSession, currentIndex]);

  const restartAnswer = () => {
    setSelectedChoiceId(null);
    setAnswered(false);
  };

  const startMode = (mode: BeginnerChoiceMode, category?: BeginnerChoiceCategory) => {
    setCurrentIndex(0);
    setSelectedChoiceId(null);
    setAnswered(false);
    setShowResult(false);
    onStart(mode, category);
  };

  const backToTop = () => {
    onClearSession();
    setCurrentIndex(0);
    setSelectedChoiceId(null);
    setAnswered(false);
    setShowResult(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveElement(event.target)) return;
      if (!question || showResult) return;

      const numberIndex = ["1", "2", "3", "4"].indexOf(event.key);
      if (numberIndex >= 0 && !answered) {
        event.preventDefault();
        answerQuestion(choiceIds[numberIndex]);
        return;
      }
      if (event.key === "Enter" && answered) {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key.toLowerCase() === "w") {
        event.preventDefault();
        onRecordUnknown(question.id);
        return;
      }
      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        onMarkWeak(question.id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [answerQuestion, answered, goNext, onMarkWeak, onRecordUnknown, question, showResult]);

  if (!activeSession || !question) {
    return (
      <GlossaryProvider>
        <BeginnerTop
          stats={stats}
          selectedCategory={selectedCategory}
          storageWriteFailed={storageWriteFailed}
          onSelectCategory={setSelectedCategory}
          onStart={startMode}
          onHome={onHome}
        />
      </GlossaryProvider>
    );
  }

  if (showResult) {
    return (
      <GlossaryProvider>
        <BeginnerResult
          session={activeSession}
          questions={activeQuestions}
          onBackToTop={backToTop}
          onStart={startMode}
          onHome={() => {
            backToTop();
            onHome();
          }}
        />
      </GlossaryProvider>
    );
  }

  return (
    <GlossaryProvider>
    <section className="page beginnerPage">
      <div className="beginnerQuizHeader">
        <button type="button" className="textButton" onClick={backToTop}>
          初級トップ
        </button>
        <div>
          <span className="eyebrow">{modeLabels[activeSession.mode]}</span>
          <h1>初級編：選択式200問</h1>
        </div>
        <span className="beginnerQuestionNumber">
          {currentIndex + 1}/{activeQuestions.length}
        </span>
      </div>

      <div className="beginnerProgressBar" aria-label="進捗">
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="beginnerQuizLayout">
        <article className="beginnerQuestionCard">
          <div className="beginnerMetaRow">
            <span>{categoryLabels[question.category]}</span>
            <span>{question.subCategory}</span>
            <span>{question.topic}</span>
          </div>

          <RichTextWithGlossary
            as="h2"
            className="beginnerPrompt"
            text={question.prompt}
            maxChipsPerBlock={2}
          />

          <div className="beginnerTools">
            <QuestionGlossaryPanel
              texts={fieldTexts(question)}
              buttonLabel="用語を確認"
              title="この問題の関連用語"
            />
            <div className="beginnerToolButtons">
              <button
                type="button"
                onClick={() => {
                  onRecordUnknown(question.id);
                  onMarkWeak(question.id);
                }}
              >
                わからない
              </button>
              <button type="button" onClick={() => onMarkWeak(question.id)}>
                後で復習
              </button>
            </div>
          </div>

          <div className="choiceCardList" role="list" aria-label="選択肢">
            {question.choices.map((choice) => {
              const isSelected = selectedChoiceId === choice.id;
              const isCorrect = choice.id === question.correctChoiceId;
              const statusClass =
                answered && isCorrect
                  ? "isCorrect"
                  : answered && isSelected && !isCorrect
                    ? "isWrong"
                    : "";
              return (
                <div
                  key={choice.id}
                  role="button"
                  tabIndex={answered ? -1 : 0}
                  aria-disabled={answered}
                  aria-pressed={isSelected}
                  className={`choiceCard ${isSelected ? "isSelected" : ""} ${statusClass} ${
                    answered ? "isDisabled" : ""
                  }`}
                  onClick={() => {
                    if (answered) return;
                    answerQuestion(choice.id);
                  }}
                  onKeyDown={(event) => {
                    if (answered) return;
                    // 用語チップ（内側の button）にフォーカスがある時は選択させない。
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      answerQuestion(choice.id);
                    }
                  }}
                >
                  <span className="choiceLetter">{choice.id}</span>
                  <RichTextWithGlossary
                    as="span"
                    className="choiceText"
                    text={choice.text}
                    maxChipsPerBlock={2}
                  />
                </div>
              );
            })}
          </div>
        </article>

        <aside className="beginnerSidePanel">
          <div>
            <span className="eyebrow">この問題の履歴</span>
            <strong>{currentProgress?.answeredCount ?? 0}回回答</strong>
            <p>
              正解 {currentProgress?.correctCount ?? 0}回 / 苦手{" "}
              {currentProgress?.isWeak ? "登録中" : "未登録"}
            </p>
          </div>
          <div>
            <span className="eyebrow">PC操作</span>
            <p>1-4で回答、Enterで次へ、Wで「わからない」、Bで苦手登録。</p>
          </div>
        </aside>
      </div>

      {answered && selectedChoiceId ? (
        <FeedbackPanel
          question={question}
          selectedChoiceId={selectedChoiceId}
          onRetry={restartAnswer}
          onNext={goNext}
          isLast={currentIndex + 1 >= activeQuestions.length}
        />
      ) : null}
    </section>
    </GlossaryProvider>
  );
};

const BeginnerTop = ({
  stats,
  selectedCategory,
  storageWriteFailed,
  onSelectCategory,
  onStart,
  onHome,
}: {
  stats: BeginnerChoiceStats;
  selectedCategory: BeginnerChoiceCategory;
  storageWriteFailed: boolean;
  onSelectCategory: (category: BeginnerChoiceCategory) => void;
  onStart: (mode: BeginnerChoiceMode, category?: BeginnerChoiceCategory) => void;
  onHome: () => void;
}) => {
  const { locale, setLocale, t } = useLocale();
  // "category" is started from the category panel below, not from this grid.
  const modes = ["daily10", "quick3", "weakReview", "random"] as const;
  // The 200-item bank is Japanese-only, so the English locale surfaces the gap
  // explicitly instead of starting a session the reader cannot follow.
  const bankAvailable = locale === "ja";

  return (
    <section className="page beginnerPage beginnerTopPage">
      <div className="beginnerTopHero">
        <div>
          <span className="eyebrow">Beginner Choice</span>
          <h1>{t.beginner.topTitle}</h1>
          <p>{t.beginner.topLead}</p>
        </div>
        <button type="button" className="textButton" onClick={onHome}>
          {t.beginner.toHome}
        </button>
      </div>

      {storageWriteFailed ? (
        <div className="storageNotice" role="alert">
          <span className="storageNoticeMark" aria-hidden="true">
            !
          </span>
          <span>{t.errors.beginnerStorageWriteFailed}</span>
        </div>
      ) : null}

      <div className="homeStats">
        <StatCard
          label={t.beginner.statAnswered}
          value={`${stats.totalAnsweredCount}/${stats.totalQuestionCount}`}
          detail={t.beginner.statAnsweredDetail(stats.totalQuestionCount)}
        />
        <StatCard
          label={t.beginner.statAccuracy}
          value={`${stats.accuracy}%`}
          detail={t.beginner.statAccuracyDetail}
        />
        <StatCard
          label={t.beginner.statWeak}
          value={`${stats.weakCount}`}
          detail={t.beginner.statWeakDetail}
        />
        <StatCard
          label={t.beginner.statToday}
          value={`${stats.answeredToday}`}
          detail={t.beginner.statTodayDetail}
        />
      </div>

      {bankAvailable ? (
        <>
          <div className="beginnerModeGrid">
            {modes.map((mode, index) => (
              <button
                key={mode}
                type="button"
                className={`beginnerModeCard ${index === 0 ? "primary" : ""}`}
                onClick={() => onStart(mode)}
              >
                <span>{t.beginner.modes[mode].title}</span>
                <strong>{t.beginner.modes[mode].detail}</strong>
              </button>
            ))}
          </div>

          <section className="whitePanel beginnerCategoryPanel">
            <div className="sectionHeader">
              <div>
                <span className="eyebrow">Category Practice</span>
                <h2>{t.beginner.categoryTitle}</h2>
              </div>
              <RedAccentButton onClick={() => onStart("category", selectedCategory)}>
                {t.beginner.categoryStart}
              </RedAccentButton>
            </div>
            <div className="beginnerCategoryGrid">
              {beginnerCategories.map((category) => {
                const progress = stats.categoryProgress[category];
                const percent = progress.total
                  ? Math.round((progress.answered / progress.total) * 100)
                  : 0;
                return (
                  <button
                    key={category}
                    type="button"
                    className={`beginnerCategoryButton ${
                      selectedCategory === category ? "isSelected" : ""
                    }`}
                    onClick={() => onSelectCategory(category)}
                  >
                    <span>{t.beginnerCategories[category]}</span>
                    <strong>
                      {progress.answered}/{progress.total}
                    </strong>
                    <em style={{ width: `${percent}%` }} />
                  </button>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <LocaleContentNotice
          title={t.beginner.englishNoticeTitle}
          body={t.beginner.englishNoticeBody}
          action={t.beginner.englishNoticeAction}
          onAction={() => setLocale("ja")}
        />
      )}
    </section>
  );
};

const FeedbackPanel = ({
  question,
  selectedChoiceId,
  onRetry,
  onNext,
  isLast,
}: {
  question: BeginnerChoiceQuestion;
  selectedChoiceId: BeginnerChoiceId;
  onRetry: () => void;
  onNext: () => void;
  isLast: boolean;
}) => {
  const isCorrect = selectedChoiceId === question.correctChoiceId;
  const selectedChoice = question.choices.find((choice) => choice.id === selectedChoiceId);
  const correctChoice = question.choices.find((choice) => choice.id === question.correctChoiceId);
  const relatedTerms = question.relatedGlossaryTerms
    .map((id) => glossaryTermById[id])
    .filter((term): term is NonNullable<typeof term> => term != null);
  const usedCounts = new Map<string, number>();

  return (
    <section className={`feedbackPanel ${isCorrect ? "isCorrect" : "isWrong"}`} aria-live="polite">
      <div className="feedbackHeader">
        <div>
          <span className="eyebrow">{isCorrect ? "正解" : "惜しい"}</span>
          <h2>{isCorrect ? "基礎判断は合っています" : "ここで確認しておきましょう"}</h2>
        </div>
        <strong>{isCorrect ? "Correct" : "Review"}</strong>
      </div>

      {!isCorrect ? (
        <div className="feedbackAnswerLine">
          <span>正解</span>
          <strong>
            {question.correctChoiceId}.{" "}
            <RichTextWithGlossary
              as="span"
              text={correctChoice?.text}
              usedCounts={usedCounts}
              maxChipsPerBlock={2}
            />
          </strong>
        </div>
      ) : null}

      <div className="feedbackGrid">
        <div>
          <span>なぜ正しいか</span>
          <RichTextWithGlossary text={question.whyCorrect} usedCounts={usedCounts} />
        </div>
        {!isCorrect && selectedChoice ? (
          <div>
            <span>選んだ選択肢の確認</span>
            <p>
              {selectedChoice.id}.{" "}
              <RichTextWithGlossary
                as="span"
                text={selectedChoice.text}
                usedCounts={usedCounts}
                maxChipsPerBlock={2}
              />
            </p>
            <RichTextWithGlossary
              text={question.whyWrong[selectedChoice.id]}
              usedCounts={usedCounts}
            />
          </div>
        ) : null}
        <div>
          <span>解説</span>
          <RichTextWithGlossary text={question.explanation} usedCounts={usedCounts} />
        </div>
        <div>
          <span>持ち帰る一文</span>
          <RichTextWithGlossary text={question.keyTakeaway} usedCounts={usedCounts} />
        </div>
      </div>

      {question.relatedKpis?.length || question.relatedDepartments?.length ? (
        <div className="beginnerChipRow">
          {question.relatedKpis?.map((kpi, index) => (
            <span key={`kpi-${index}-${kpi}`}>
              KPI:{" "}
              <RichTextWithGlossary as="span" text={kpi} usedCounts={usedCounts} maxChipsPerBlock={1} />
            </span>
          ))}
          {question.relatedDepartments?.map((department, index) => (
            <span key={`department-${index}-${department}`}>
              部門:{" "}
              <RichTextWithGlossary
                as="span"
                text={department}
                usedCounts={usedCounts}
                maxChipsPerBlock={1}
              />
            </span>
          ))}
        </div>
      ) : null}

      {relatedTerms.length ? (
        <div className="beginnerRelatedTerms">
          <span>関連用語</span>
          <div>
            {relatedTerms.map((term) => (
              <strong key={term.id}>{term.term}</strong>
            ))}
          </div>
        </div>
      ) : null}

      {!isCorrect && question.caution ? (
        <div className="beginnerCaution">
          <span>注意</span>
          <RichTextWithGlossary text={question.caution} usedCounts={usedCounts} />
        </div>
      ) : null}

      {question.bridgeToAdvancedQuestion ? (
        <div className="beginnerBridge">
          <span>次に練習する説明問題</span>
          <RichTextWithGlossary
            as="p"
            text={question.bridgeToAdvancedQuestion}
            usedCounts={usedCounts}
          />
        </div>
      ) : null}

      <div className="beginnerBottomActions">
        {!isCorrect ? (
          <button type="button" onClick={onRetry}>
            もう一度
          </button>
        ) : null}
        <RedAccentButton onClick={onNext}>{isLast ? "結果を見る" : "次へ"}</RedAccentButton>
      </div>
    </section>
  );
};

const BeginnerResult = ({
  session,
  questions,
  onBackToTop,
  onStart,
  onHome,
}: {
  session: BeginnerChoiceSession;
  questions: BeginnerChoiceQuestion[];
  onBackToTop: () => void;
  onStart: (mode: BeginnerChoiceMode, category?: BeginnerChoiceCategory) => void;
  onHome: () => void;
}) => {
  const correctCount = session.correctQuestionIds.length;
  const wrongQuestions = questions.filter((question) =>
    session.wrongQuestionIds.includes(question.id),
  );
  const accuracy = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <section className="page beginnerPage beginnerResultPage">
      <div className="resultHero">
        <span className="eyebrow">{modeLabels[session.mode]} result</span>
        <h1>初級クイズ結果</h1>
        <p>
          {questions.length}問中 {correctCount}問正解。正答率 {accuracy}%。
        </p>
      </div>

      <div className="resultStats">
        <StatCard label="正解" value={`${correctCount}`} detail={`${questions.length}問中`} />
        <StatCard label="不正解" value={`${session.wrongQuestionIds.length}`} detail="復習候補" />
        <StatCard label="正答率" value={`${accuracy}%`} detail="このセッション" />
      </div>

      {wrongQuestions.length ? (
        <section className="whitePanel beginnerWrongList">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Review</span>
              <h2>確認しておく問題</h2>
            </div>
          </div>
          <div className="beginnerWrongItems">
            {wrongQuestions.map((question) => (
              <article key={question.id}>
                <span>{categoryLabels[question.category]}</span>
                <RichTextWithGlossary as="strong" text={question.prompt} maxChipsPerBlock={2} />
                <RichTextWithGlossary as="p" text={question.keyTakeaway} maxChipsPerBlock={2} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="beginnerResultActions">
        <RedAccentButton onClick={() => onStart("daily10")}>今日の10問をもう一度</RedAccentButton>
        <button type="button" onClick={() => onStart("weakReview")}>
          苦手復習へ
        </button>
        <button type="button" onClick={onBackToTop}>
          初級トップへ
        </button>
        <button type="button" onClick={onHome}>
          Homeへ
        </button>
      </div>
    </section>
  );
};
