import { useEffect, useMemo, useState } from "react";
import { localizedConceptById, localizedDrills } from "../i18n/content";
import type { ExplainDrill, StudyProgress } from "../types";
import { CautionBox, RedAccentButton } from "../components/ui";
import { useLocale } from "../contexts/localeContext";

export const ExplainGymPage = ({
  progress,
  recordExplainScore,
  toggleWeakExplain,
}: {
  progress: StudyProgress;
  recordExplainScore: (drillId: string, score: number) => void;
  toggleWeakExplain: (drillId: string) => void;
}) => {
  const { locale, t } = useLocale();
  const explainDrills = localizedDrills[locale];
  const [selectedId, setSelectedId] = useState(explainDrills[0].id);
  const [duration, setDuration] = useState<30 | 180>(30);
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [running, setRunning] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const drill = useMemo(
    () => explainDrills.find((item) => item.id === selectedId) ?? explainDrills[0],
    [explainDrills, selectedId],
  );

  useEffect(() => {
    setTimeLeft(duration);
    setRunning(false);
    setShowAnswer(false);
  }, [duration, selectedId]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          setShowAnswer(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  return (
    <section className="page explainPage">
      <div className="pageHeader">
        <span className="eyebrow">{t.explain.eyebrow}</span>
        <h1>{t.explain.title}</h1>
        <p>{t.explain.lead}</p>
      </div>

      <div className="explainLayout">
        <div className="drillList">
          {explainDrills.map((item) => (
            <button
              className={`drillListItem ${selectedId === item.id ? "isActive" : ""}`}
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              type="button"
            >
              <strong>{item.title}</strong>
              <span>
                {progress.explainScores[item.id]
                  ? t.explain.score(progress.explainScores[item.id])
                  : t.common.notScored}
              </span>
            </button>
          ))}
        </div>

        <ExplainPanel
          drill={drill}
          duration={duration}
          timeLeft={timeLeft}
          running={running}
          showAnswer={showAnswer}
          score={progress.explainScores[drill.id]}
          isWeak={progress.weakExplainIds.includes(drill.id)}
          onDuration={setDuration}
          onStart={() => setRunning(true)}
          onReset={() => {
            setRunning(false);
            setTimeLeft(duration);
            setShowAnswer(false);
          }}
          onShowAnswer={() => setShowAnswer(true)}
          onScore={(score) => recordExplainScore(drill.id, score)}
          onToggleWeak={() => toggleWeakExplain(drill.id)}
        />
      </div>
    </section>
  );
};

const ExplainPanel = ({
  drill,
  duration,
  timeLeft,
  running,
  showAnswer,
  score,
  isWeak,
  onDuration,
  onStart,
  onReset,
  onShowAnswer,
  onScore,
  onToggleWeak,
}: {
  drill: ExplainDrill;
  duration: 30 | 180;
  timeLeft: number;
  running: boolean;
  showAnswer: boolean;
  score?: number;
  isWeak: boolean;
  onDuration: (duration: 30 | 180) => void;
  onStart: () => void;
  onReset: () => void;
  onShowAnswer: () => void;
  onScore: (score: number) => void;
  onToggleWeak: () => void;
}) => {
  const { locale, t } = useLocale();
  const conceptById = localizedConceptById[locale];
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <article className="explainPanel">
      <div className="timerPanel">
        <div className="timerFace">
          <span>{duration === 30 ? t.explain.thirtySecFace : t.explain.threeMinFace}</span>
          <strong>
            {minutes}:{seconds}
          </strong>
        </div>
        <div className="segmentedControl">
          <button
            className={duration === 30 ? "isActive" : ""}
            onClick={() => onDuration(30)}
            type="button"
          >
            {t.explain.thirtySec}
          </button>
          <button
            className={duration === 180 ? "isActive" : ""}
            onClick={() => onDuration(180)}
            type="button"
          >
            {t.explain.threeMin}
          </button>
        </div>
        <div className="timerActions">
          <RedAccentButton disabled={running} onClick={onStart}>
            {t.explain.startTimer}
          </RedAccentButton>
          <RedAccentButton variant="secondary" onClick={onReset}>
            {t.common.retry}
          </RedAccentButton>
          <RedAccentButton variant="ghost" onClick={onShowAnswer}>
            {t.explain.showModel}
          </RedAccentButton>
        </div>
      </div>

      <div className="explainContent">
        <span className="eyebrow">{t.explain.theme}</span>
        <h2>{drill.title}</h2>
        <div className="keywordCloud">
          {drill.keywords.map((keyword) => (
            <span key={keyword}>{keyword}</span>
          ))}
        </div>
        <CautionBox>{drill.caution}</CautionBox>

        {showAnswer ? (
          <div className="modelAnswer">
            <section>
              <h3>{t.explain.modelThirty}</h3>
              <p>{drill.thirtySecondAnswer}</p>
            </section>
            <details className="answerDetails">
              <summary>{t.explain.modelThree}</summary>
              <p>{drill.threeMinuteAnswer}</p>
            </details>
          </div>
        ) : (
          <div className="speakPrompt">
            <p>{t.explain.speakPrompt}</p>
          </div>
        )}

        <div className="scorePanel">
          <span>{t.explain.selfScore(score ? `${score}/5` : t.explain.notEntered)}</span>
          <div className="scoreButtons">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                className={score === value ? "isActive" : ""}
                key={value}
                onClick={() => onScore(value)}
                type="button"
              >
                {value}
              </button>
            ))}
          </div>
          <RedAccentButton variant="secondary" onClick={onToggleWeak}>
            {isWeak ? t.common.unmarkWeak : t.common.markWeak}
          </RedAccentButton>
        </div>

        <div className="relatedConcepts">
          {drill.relatedConcepts.map((id) =>
            conceptById[id] ? <span key={id}>{conceptById[id].title}</span> : null,
          )}
        </div>
      </div>
    </article>
  );
};
