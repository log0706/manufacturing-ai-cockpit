import { useState } from "react";
import { AppShell, ProgressPanel } from "./components/AppShell";
import { useBeginnerChoiceProgress } from "./hooks/useBeginnerChoiceProgress";
import { useProgress } from "./hooks/useProgress";
import { useTrainingProgress } from "./hooks/useTrainingProgress";
import { AlignmentStudioPage } from "./pages/AlignmentStudioPage";
import { BeginnerChoicePage } from "./pages/BeginnerChoicePage";
import { CockpitPage } from "./pages/CockpitPage";
import { DrillDeckPage } from "./pages/DrillDeckPage";
import { ExplainGymPage } from "./pages/ExplainGymPage";
import { KnowledgeBoothPage } from "./pages/KnowledgeBoothPage";
import { MapRoomPage } from "./pages/MapRoomPage";
import { ReviewVaultPage } from "./pages/ReviewVaultPage";
import type { BeginnerChoiceCategory, BeginnerChoiceMode, TrainingMode, ViewId } from "./types";

const App = () => {
  const [currentView, setCurrentView] = useState<ViewId>("cockpit");
  const {
    progress,
    metrics,
    completeConcept,
    toggleBookmark,
    toggleWeakQuestion,
    recordExplainScore,
    toggleWeakExplain,
    storageWriteFailed,
  } = useProgress();
  const beginner = useBeginnerChoiceProgress();
  const training = useTrainingProgress();
  const fuguEnabled = import.meta.env.DEV && import.meta.env.VITE_FUGU_ENABLED === "true";
  const fuguReviewEndpoint = import.meta.env.VITE_FUGU_REVIEW_ENDPOINT ?? "/api/fugu-review";

  const startTraining = (mode: TrainingMode) => {
    training.startSession(mode);
    setCurrentView("drill");
  };

  const startBeginner = (mode: BeginnerChoiceMode, category?: BeginnerChoiceCategory) => {
    beginner.startSession(mode, category);
    setCurrentView("beginner");
  };

  const page = (() => {
    switch (currentView) {
      case "cockpit":
        return (
          <CockpitPage
            progress={progress}
            metrics={metrics}
            beginnerStats={beginner.stats}
            trainingStats={training.stats}
            onChangeView={setCurrentView}
            onStartBeginner={startBeginner}
            onStartTraining={startTraining}
          />
        );
      case "beginner":
        return (
          <BeginnerChoicePage
            activeSession={beginner.activeSession}
            activeQuestions={beginner.activeQuestions}
            questionProgress={beginner.questionProgress}
            stats={beginner.stats}
            storageWriteFailed={beginner.storageWriteFailed}
            onStart={startBeginner}
            onAnswer={beginner.recordAnswer}
            onMarkWeak={beginner.markQuestionWeak}
            onRecordUnknown={beginner.recordUnknown}
            onClearSession={beginner.clearActiveSession}
            onHome={() => setCurrentView("cockpit")}
          />
        );
      case "align":
        return <AlignmentStudioPage />;
      case "knowledge":
        return (
          <KnowledgeBoothPage
            progress={progress}
            completeConcept={completeConcept}
            toggleBookmark={toggleBookmark}
          />
        );
      case "map":
        return <MapRoomPage />;
      case "drill":
        return (
          <DrillDeckPage
            activeSession={training.activeSession}
            activeQuestions={training.activeQuestions}
            questionProgress={training.questionProgress}
            stats={training.stats}
            onStartTraining={startTraining}
            onRecordResult={training.recordQuestionResult}
            onMarkWeak={training.markQuestionWeak}
            onRecordUnknownReason={training.recordUnknownReason}
            onRecordGlossaryOpen={training.recordGlossaryOpen}
            onRecordFuguReview={training.recordFuguReview}
            glossarySummary={training.glossarySummary}
            fuguSummary={training.fuguSummary}
            fuguEnabled={fuguEnabled}
            fuguReviewEndpoint={fuguReviewEndpoint}
            onHome={() => setCurrentView("cockpit")}
          />
        );
      case "explain":
        return (
          <ExplainGymPage
            progress={progress}
            recordExplainScore={recordExplainScore}
            toggleWeakExplain={toggleWeakExplain}
          />
        );
      case "review":
        return (
          <ReviewVaultPage
            progress={progress}
            onChangeView={setCurrentView}
            toggleWeakQuestion={toggleWeakQuestion}
            toggleWeakExplain={toggleWeakExplain}
            toggleBookmark={toggleBookmark}
            trainingProgress={training.questionProgress}
            trainingStats={training.stats}
            onStartTraining={startTraining}
            onResetTrainingProgress={() => {
              if (window.confirm("この端末のv0.2学習データを削除します。よろしいですか？")) {
                training.resetTrainingProgress();
              }
            }}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <AppShell
      currentView={currentView}
      onChangeView={setCurrentView}
      progressPanel={
        <ProgressPanel
          metrics={{
            ...metrics,
            answeredCount: training.stats.totalAnsweredCount + beginner.stats.totalAnsweredCount,
            totalQuestionCount:
              (training.activeQuestions.length || metrics.totalQuestionCount) +
              beginner.stats.totalQuestionCount,
          }}
          streak={training.stats.streak}
        />
      }
    >
      {storageWriteFailed || training.storageWriteFailed || beginner.storageWriteFailed ? (
        <div className="storageNotice" role="status">
          進捗をこの端末に保存できません。画面上の学習は続けられますが、ブラウザ設定や空き容量を確認してください。
        </div>
      ) : null}
      {page}
    </AppShell>
  );
};

export default App;
