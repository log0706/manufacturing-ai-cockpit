import { localizedConcepts, localizedDrillById } from "../i18n/content";
import { questionsById } from "../data/questions";
import { trainingQuestionsById } from "../data/trainingQuestions";
import type {
  Concept,
  ExplainDrill,
  Question,
  StudyProgress,
  TrainingMode,
  TrainingQuestion,
  TrainingStats,
  UserQuestionProgress,
  ViewId,
} from "../types";
import { EmptyState, RedAccentButton } from "../components/ui";
import { useLocale } from "../contexts/localeContext";
import type { Dictionary } from "../i18n/ja";
import type { TrainingCategory } from "../types";

const exists = <T,>(value: T | undefined): value is T => value !== undefined;

export const ReviewVaultPage = ({
  progress,
  onChangeView,
  toggleWeakQuestion,
  toggleWeakExplain,
  toggleBookmark,
  trainingProgress,
  trainingStats,
  onStartTraining,
  onResetTrainingProgress,
}: {
  progress: StudyProgress;
  onChangeView: (view: ViewId) => void;
  toggleWeakQuestion: (questionId: string) => void;
  toggleWeakExplain: (drillId: string) => void;
  toggleBookmark: (conceptId: string) => void;
  trainingProgress: Record<string, UserQuestionProgress>;
  trainingStats: TrainingStats;
  onStartTraining: (mode: TrainingMode) => void;
  onResetTrainingProgress: () => void;
}) => {
  const { locale, t } = useLocale();
  const concepts = localizedConcepts[locale];
  const explainDrillsById = localizedDrillById[locale];
  const weakTrainingItems = Object.values(trainingProgress)
    .filter((item) => item.isWeak || item.lastScore === 0 || item.lastScore === 1)
    .map((item) => ({ progress: item, question: trainingQuestionsById[item.questionId] }))
    .filter((item): item is { progress: UserQuestionProgress; question: TrainingQuestion } =>
      exists(item.question),
    )
    .slice(0, 8);
  const wrongQuestions = progress.wrongQuestionIds
    .map((id) => questionsById[id])
    .filter((question): question is Question => exists(question))
    .slice(0, 6);
  const weakQuestions = progress.weakQuestionIds
    .map((id) => questionsById[id])
    .filter((question): question is Question => exists(question))
    .slice(0, 6);
  const weakExplains = progress.weakExplainIds
    .map((id) => explainDrillsById[id])
    .filter((drill): drill is ExplainDrill => exists(drill))
    .slice(0, 6);
  const bookmarked = progress.bookmarkedConceptIds
    .map((id) => concepts.find((concept) => concept.id === id))
    .filter((concept): concept is Concept => exists(concept))
    .slice(0, 6);
  const unlearned = concepts
    .filter((concept) => !progress.completedConceptIds.includes(concept.id))
    .slice(0, 8);

  return (
    <section className="page reviewPage">
      <div className="pageHeader">
        <span className="eyebrow">{t.review.eyebrow}</span>
        <h1>{t.review.title}</h1>
        <p>{t.review.lead}</p>
      </div>

      <div className="reviewGrid">
        <ReviewSection
          title={t.review.weakTrainingTitle}
          action={t.review.weakTrainingAction}
          onAction={() => onStartTraining("weakReview")}
        >
          {weakTrainingItems.length ? (
            weakTrainingItems.map(({ question, progress: item }) => (
              <div className="reviewItem" key={question.id}>
                <strong>{question.title}</strong>
                <p>
                  {t.review.weakTrainingMeta(
                    t.trainingCategories[question.category as TrainingCategory] ??
                      question.category,
                    String(item.lastScore ?? "-"),
                    item.nextReviewAt ?? "-",
                  )}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              title={t.review.weakTrainingEmpty}
              text={t.review.weakTrainingEmptyText}
            />
          )}
        </ReviewSection>

        <ReviewSection
          title={t.review.dataTitle}
          action={t.review.dataAction}
          onAction={onResetTrainingProgress}
        >
          <div className="reviewItem">
            <strong>{t.review.dataAnswered(trainingStats.totalAnsweredCount)}</strong>
            <p>
              {t.review.dataMeta(
                trainingStats.streak,
                trainingStats.weekAnswerCount,
                trainingStats.weakCount,
              )}
            </p>
          </div>
        </ReviewSection>

        <ReviewSection
          title={t.review.wrongTitle}
          action={t.review.toDrill}
          onAction={() => onChangeView("drill")}
        >
          {wrongQuestions.length ? (
            wrongQuestions.map((question) => (
              <div className="reviewItem" key={question.id}>
                <strong>{question.prompt}</strong>
                <p>{question.explanation}</p>
              </div>
            ))
          ) : (
            <EmptyState title={t.review.wrongEmpty} text={t.review.wrongEmptyText} />
          )}
        </ReviewSection>

        <ReviewSection
          title={t.review.weakQuestionsTitle}
          action={t.review.toDrill}
          onAction={() => onChangeView("drill")}
        >
          {weakQuestions.length ? (
            weakQuestions.map((question) => (
              <div className="reviewItem withAction" key={question.id}>
                <div>
                  <strong>{question.prompt}</strong>
                  <p>{question.category}</p>
                </div>
                <button onClick={() => toggleWeakQuestion(question.id)} type="button">
                  {t.common.release}
                </button>
              </div>
            ))
          ) : (
            <EmptyState
              title={t.review.weakQuestionsEmpty}
              text={t.review.weakQuestionsEmptyText}
            />
          )}
        </ReviewSection>

        <ReviewSection
          title={t.review.explainTitle}
          action={t.review.toExplain}
          onAction={() => onChangeView("explain")}
        >
          {weakExplains.length ? (
            weakExplains.map((drill) => (
              <div className="reviewItem withAction" key={drill.id}>
                <div>
                  <strong>{drill.title}</strong>
                  <p>{drill.caution}</p>
                </div>
                <button onClick={() => toggleWeakExplain(drill.id)} type="button">
                  {t.common.release}
                </button>
              </div>
            ))
          ) : (
            <EmptyState title={t.review.explainEmpty} text={t.review.explainEmptyText} />
          )}
        </ReviewSection>

        <ReviewSection
          title={t.review.bookmarkTitle}
          action={t.review.toKnowledge}
          onAction={() => onChangeView("knowledge")}
        >
          {bookmarked.length ? (
            bookmarked.map((concept) => (
              <div className="reviewItem withAction" key={concept.id}>
                <div>
                  <strong>{concept.title}</strong>
                  <p>{concept.oneLine}</p>
                </div>
                <button onClick={() => toggleBookmark(concept.id)} type="button">
                  {t.common.release}
                </button>
              </div>
            ))
          ) : (
            <EmptyState title={t.review.bookmarkEmpty} text={t.review.bookmarkEmptyText} />
          )}
        </ReviewSection>

        <ReviewSection
          title={t.review.unlearnedTitle}
          action={t.review.toKnowledge}
          onAction={() => onChangeView("knowledge")}
        >
          {unlearned.map((concept) => (
            <div className="reviewItem" key={concept.id}>
              <strong>{concept.title}</strong>
              <p>{t.booths[concept.booth as keyof Dictionary["booths"]] ?? concept.booth}</p>
            </div>
          ))}
        </ReviewSection>
      </div>
    </section>
  );
};

const ReviewSection = ({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}) => (
  <section className="reviewSection">
    <div className="reviewSectionHeader">
      <h2>{title}</h2>
      <RedAccentButton variant="ghost" onClick={onAction}>
        {action}
      </RedAccentButton>
    </div>
    <div className="reviewSectionBody">{children}</div>
  </section>
);
