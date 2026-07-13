import { concepts } from "../data/concepts";
import { explainDrillsById } from "../data/explainDrills";
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
        <span className="eyebrow">Review Vault</span>
        <h1>戻るべきカードだけ、短く戻る。</h1>
        <p>説明カードの0〜1点、苦手登録、旧ドリルの誤答、ブックマークをまとめて見ます。</p>
      </div>

      <div className="reviewGrid">
        <ReviewSection
          title="説明カードの苦手"
          action="苦手復習を始める"
          onAction={() => onStartTraining("weakReview")}
        >
          {weakTrainingItems.length ? (
            weakTrainingItems.map(({ question, progress: item }) => (
              <div className="reviewItem" key={question.id}>
                <strong>{question.title}</strong>
                <p>
                  {question.category} / 前回 {item.lastScore ?? "-"}点 / 次回 {item.nextReviewAt ?? "-"}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              title="説明カードの苦手はありません"
              text="0〜1点、または後で復習を押したカードがここに集まります。"
            />
          )}
        </ReviewSection>

        <ReviewSection
          title="v0.2 学習データ"
          action="この端末の学習データを削除"
          onAction={onResetTrainingProgress}
        >
          <div className="reviewItem">
            <strong>{trainingStats.totalAnsweredCount}問に回答済み</strong>
            <p>
              連続{trainingStats.streak}日 / 今週{trainingStats.weekAnswerCount}問 / 苦手
              {trainingStats.weakCount}問
            </p>
          </div>
        </ReviewSection>

        <ReviewSection title="間違えた問題" action="Drill Deckへ" onAction={() => onChangeView("drill")}>
          {wrongQuestions.length ? (
            wrongQuestions.map((question) => (
              <div className="reviewItem" key={question.id}>
                <strong>{question.prompt}</strong>
                <p>{question.explanation}</p>
              </div>
            ))
          ) : (
            <EmptyState title="まだ誤答はありません" text="Drill Deckを進めるとここに表示されます。" />
          )}
        </ReviewSection>

        <ReviewSection title="苦手登録した問題" action="Drill Deckへ" onAction={() => onChangeView("drill")}>
          {weakQuestions.length ? (
            weakQuestions.map((question) => (
              <div className="reviewItem withAction" key={question.id}>
                <div>
                  <strong>{question.prompt}</strong>
                  <p>{question.category}</p>
                </div>
                <button onClick={() => toggleWeakQuestion(question.id)} type="button">
                  解除
                </button>
              </div>
            ))
          ) : (
            <EmptyState title="苦手問題は未登録" text="迷った問題を苦手に追加すると復習しやすくなります。" />
          )}
        </ReviewSection>

        <ReviewSection title="説明テーマ" action="Explain Gymへ" onAction={() => onChangeView("explain")}>
          {weakExplains.length ? (
            weakExplains.map((drill) => (
              <div className="reviewItem withAction" key={drill.id}>
                <div>
                  <strong>{drill.title}</strong>
                  <p>{drill.caution}</p>
                </div>
                <button onClick={() => toggleWeakExplain(drill.id)} type="button">
                  解除
                </button>
              </div>
            ))
          ) : (
            <EmptyState title="低スコアテーマはありません" text="自己採点1から2のテーマがここに集まります。" />
          )}
        </ReviewSection>

        <ReviewSection title="ブックマーク" action="Knowledgeへ" onAction={() => onChangeView("knowledge")}>
          {bookmarked.length ? (
            bookmarked.map((concept) => (
              <div className="reviewItem withAction" key={concept.id}>
                <div>
                  <strong>{concept.title}</strong>
                  <p>{concept.oneLine}</p>
                </div>
                <button onClick={() => toggleBookmark(concept.id)} type="button">
                  解除
                </button>
              </div>
            ))
          ) : (
            <EmptyState title="ブックマークは空" text="重要な知識カードを保存できます。" />
          )}
        </ReviewSection>

        <ReviewSection title="未学習ブース" action="Knowledgeへ" onAction={() => onChangeView("knowledge")}>
          {unlearned.map((concept) => (
            <div className="reviewItem" key={concept.id}>
              <strong>{concept.title}</strong>
              <p>{concept.booth}</p>
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
