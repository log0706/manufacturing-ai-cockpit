import { beginnerChoiceQuestionCountsByCategory } from "../data/beginnerChoiceQuestions";
import { trainingQuestionCountsByCategory, trainingQuestions } from "../data/trainingQuestions";
import { CautionBox, RedAccentButton } from "../components/ui";
import { useT } from "../contexts/localeContext";
import type {
  BeginnerChoiceCategory,
  BeginnerChoiceMode,
  BeginnerChoiceStats,
  StudyProgress,
  TrainingCategory,
  TrainingMode,
  TrainingStats,
  ViewId,
} from "../types";

const intermediateModes: TrainingMode[] = ["daily10", "quick3", "weakReview", "random"];

export const CockpitPage = ({
  metrics,
  beginnerStats,
  trainingStats,
  onChangeView,
  onStartBeginner,
  onStartTraining,
}: {
  progress: StudyProgress;
  metrics: {
    knowledge: number;
    completedConceptCount: number;
    totalConceptCount: number;
  };
  beginnerStats: BeginnerChoiceStats;
  trainingStats: TrainingStats;
  onChangeView: (view: ViewId) => void;
  onStartBeginner: (mode: BeginnerChoiceMode) => void;
  onStartTraining: (mode: TrainingMode) => void;
}) => {
  const t = useT();
  const intermediateAverage = trainingStats.averageScore ? `${trainingStats.averageScore}/3` : "-";
  const beginnerTotal = beginnerStats.totalQuestionCount;

  return (
    <section className="page homePage">
      <div className="homeHero">
        <div className="homeHeroCopy">
          <span className="eyebrow">{t.cockpit.eyebrow}</span>
          <h1>{t.cockpit.title}</h1>
          <p>{t.cockpit.lead}</p>
          <p className="homeHeroSubLead">{t.cockpit.subLead}</p>
          <div className="homeHeroActions">
            <RedAccentButton onClick={() => onStartBeginner("daily10")}>
              {t.cockpit.startBeginner}
            </RedAccentButton>
            <RedAccentButton variant="secondary" onClick={() => onStartTraining("daily10")}>
              {t.cockpit.startIntermediate}
            </RedAccentButton>
          </div>
        </div>

        <div className="todayPanel" aria-label={t.a11y.todayProgress}>
          <span>{t.cockpit.todayLabel}</span>
          <strong>{beginnerStats.answeredToday}/10</strong>
          <div className="todayBar" aria-hidden="true">
            <span style={{ width: `${Math.min(beginnerStats.answeredToday * 10, 100)}%` }} />
          </div>
          <p>{t.cockpit.todaySummary(beginnerStats.accuracy, intermediateAverage)}</p>
        </div>
      </div>

      {/*
        The responsibility boundary is the product thesis, so it belongs in the first
        screen rather than in a caution box below six other sections.
      */}
      <section className="boundaryPanel">
        <div className="boundaryPanelHead">
          <div>
            <span className="eyebrow">Human approval gates</span>
            <h2>{t.cockpit.boundaryPanelTitle}</h2>
          </div>
          <p>{t.cockpit.boundaryPanelLead}</p>
        </div>
        <div className="boundarySplit">
          <div className="boundaryColumn boundaryColumn-ai">
            <span>{t.cockpit.boundaryAiSupports}</span>
            <ul>
              {t.cockpit.boundaryAiSupportsItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="boundaryColumn boundaryColumn-human">
            <span>{t.cockpit.boundaryHumanDecides}</span>
            <ul>
              {t.cockpit.boundaryHumanDecidesItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <button type="button" className="textButton" onClick={() => onChangeView("align")}>
          {t.cockpit.boundaryViewDetail}
        </button>
      </section>

      <div className="learningModeGrid">
        <section className="learningModeCard primary">
          <div>
            <span className="eyebrow">{t.cockpit.beginnerEyebrow}</span>
            <h2>{t.cockpit.beginnerTitle}</h2>
            <p>{t.cockpit.beginnerLead}</p>
          </div>
          <div className="learningModeMetrics">
            <span>{t.cockpit.answered(beginnerStats.totalAnsweredCount, beginnerTotal)}</span>
            <span>{t.cockpit.accuracy(beginnerStats.accuracy)}</span>
            <span>{t.cockpit.weak(beginnerStats.weakCount)}</span>
            <span>{t.cockpit.today(beginnerStats.answeredToday)}</span>
          </div>
          <RedAccentButton onClick={() => onStartBeginner("daily10")}>
            {t.cockpit.startBeginnerCard}
          </RedAccentButton>
        </section>

        <section className="learningModeCard">
          <div>
            <span className="eyebrow">{t.cockpit.intermediateEyebrow}</span>
            <h2>{t.cockpit.intermediateTitle}</h2>
            <p>{t.cockpit.intermediateLead}</p>
          </div>
          <div className="learningModeMetrics">
            <span>
              {t.cockpit.answered(trainingStats.totalAnsweredCount, trainingQuestions.length)}
            </span>
            <span>{t.cockpit.selfScore(intermediateAverage)}</span>
            <span>{t.cockpit.weak(trainingStats.weakCount)}</span>
            <span>{t.cockpit.today(trainingStats.answeredToday)}</span>
          </div>
          <RedAccentButton variant="secondary" onClick={() => onStartTraining("daily10")}>
            {t.cockpit.startIntermediateCard}
          </RedAccentButton>
        </section>
      </div>

      <div className="modeGrid">
        {intermediateModes.map((mode) => (
          <button
            className="modeCard"
            key={mode}
            onClick={() => onStartTraining(mode)}
            type="button"
          >
            <span>{t.cockpit.modes[mode].title}</span>
            <strong>{t.cockpit.modes[mode].detail}</strong>
            <em>{t.cockpit.modes[mode].button}</em>
          </button>
        ))}
      </div>

      <div className="homeGrid">
        <section className="whitePanel compactPanel">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">{t.cockpit.beginnerSetEyebrow}</span>
              <h2>{t.cockpit.beginnerSetTitle}</h2>
            </div>
            <p>{t.cockpit.beginnerSetLead}</p>
          </div>
          <div className="categoryMeterList">
            {Object.entries(beginnerChoiceQuestionCountsByCategory).map(([category, count]) => (
              <div className="categoryMeter" key={category}>
                <span>{t.beginnerCategories[category as BeginnerChoiceCategory]}</span>
                <strong>{t.common.questionUnit(count)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="whitePanel compactPanel">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">{t.cockpit.intermediateSetEyebrow}</span>
              <h2>{t.cockpit.intermediateSetTitle}</h2>
            </div>
            <p>{t.cockpit.intermediateSetLead}</p>
          </div>
          <div className="categoryMeterList">
            {Object.entries(trainingQuestionCountsByCategory).map(([category, count]) => (
              <div className="categoryMeter" key={category}>
                <span>{t.trainingCategories[category as TrainingCategory] ?? category}</span>
                <strong>{t.common.questionUnit(count)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="whitePanel compactPanel">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">{t.cockpit.knowledgeEyebrow}</span>
              <h2>{t.cockpit.knowledgeTitle}</h2>
            </div>
            <p>{t.cockpit.knowledgeLead}</p>
          </div>
          <div className="supportActions">
            <button onClick={() => onChangeView("knowledge")} type="button">
              {t.cockpit.openKnowledge}
            </button>
            <button onClick={() => onChangeView("map")} type="button">
              {t.cockpit.openMap}
            </button>
            <button onClick={() => onChangeView("align")} type="button">
              {t.cockpit.openAlign}
            </button>
          </div>
          <p className="supportNote">
            {t.cockpit.knowledgeProgress(
              metrics.completedConceptCount,
              metrics.totalConceptCount,
              metrics.knowledge,
            )}
          </p>
        </section>
      </div>

      <CautionBox title={t.cockpit.cautionTitle}>{t.cockpit.caution}</CautionBox>
    </section>
  );
};
