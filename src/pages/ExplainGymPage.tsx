import { useEffect, useMemo, useState } from "react";
import { conceptById } from "../data/concepts";
import { explainDrills } from "../data/explainDrills";
import type { ExplainDrill, StudyProgress } from "../types";
import { CautionBox, RedAccentButton } from "../components/ui";

export const ExplainGymPage = ({
  progress,
  recordExplainScore,
  toggleWeakExplain,
}: {
  progress: StudyProgress;
  recordExplainScore: (drillId: string, score: number) => void;
  toggleWeakExplain: (drillId: string) => void;
}) => {
  const [selectedId, setSelectedId] = useState(explainDrills[0].id);
  const [duration, setDuration] = useState<30 | 180>(30);
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [running, setRunning] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const drill = useMemo(
    () => explainDrills.find((item) => item.id === selectedId) ?? explainDrills[0],
    [selectedId],
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
        <span className="eyebrow">Explain Gym</span>
        <h1>30秒で骨子、3分で納得。</h1>
        <p>相手に伝わる言葉で、AI導入の価値とリスクを説明する練習です。</p>
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
                  ? `Score ${progress.explainScores[item.id]}/5`
                  : "Not scored"}
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
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <article className="explainPanel">
      <div className="timerPanel">
        <div className="timerFace">
          <span>{duration === 30 ? "30 sec" : "3 min"}</span>
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
            30秒
          </button>
          <button
            className={duration === 180 ? "isActive" : ""}
            onClick={() => onDuration(180)}
            type="button"
          >
            3分
          </button>
        </div>
        <div className="timerActions">
          <RedAccentButton disabled={running} onClick={onStart}>
            スタート
          </RedAccentButton>
          <RedAccentButton variant="secondary" onClick={onReset}>
            もう一度
          </RedAccentButton>
          <RedAccentButton variant="ghost" onClick={onShowAnswer}>
            模範を見る
          </RedAccentButton>
        </div>
      </div>

      <div className="explainContent">
        <span className="eyebrow">Theme</span>
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
              <h3>30秒回答</h3>
              <p>{drill.thirtySecondAnswer}</p>
            </section>
            <details className="answerDetails">
              <summary>3分回答を開く</summary>
              <p>{drill.threeMinuteAnswer}</p>
            </details>
          </div>
        ) : (
          <div className="speakPrompt">
            <p>キーワードを見ながら、まずは声に出して説明してください。</p>
          </div>
        )}

        <div className="scorePanel">
          <span>自己採点 {score ? `${score}/5` : "未入力"}</span>
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
            {isWeak ? "苦手解除" : "苦手登録"}
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
