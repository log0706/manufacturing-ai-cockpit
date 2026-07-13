import { beginnerChoiceQuestionCountsByCategory } from "../data/beginnerChoiceQuestions";
import { trainingQuestionCountsByCategory, trainingQuestions } from "../data/trainingQuestions";
import { CautionBox, RedAccentButton, StatCard } from "../components/ui";
import { beginnerChoiceCategoryLabels } from "../lib/beginnerChoiceLabels";
import type {
  BeginnerChoiceMode,
  BeginnerChoiceStats,
  StudyProgress,
  TrainingMode,
  TrainingStats,
  ViewId,
} from "../types";

const intermediateModeCards: Array<{
  mode: TrainingMode;
  title: string;
  detail: string;
  button: string;
}> = [
  {
    mode: "daily10",
    title: "今日の10問",
    detail: "苦手・自己評価・未回答を混ぜて、説明力を毎日戻します。",
    button: "中級10問",
  },
  {
    mode: "quick3",
    title: "3分トレーニング",
    detail: "会議前や移動前に、3問だけ声に出して整えます。",
    button: "3問だけ",
  },
  {
    mode: "weakReview",
    title: "苦手だけ復習",
    detail: "0-1点、または苦手登録した説明問題だけを短く回します。",
    button: "苦手へ",
  },
  {
    mode: "random",
    title: "ランダム",
    detail: "全85問からランダムに10問。日替わりの偏りをなくして回します。",
    button: "ランダム",
  },
];

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
  const intermediateAverage = trainingStats.averageScore ? `${trainingStats.averageScore}/3` : "-";

  return (
    <section className="page homePage">
      <div className="homeHero">
        <div className="homeHeroCopy">
          <span className="eyebrow">v0.2 MVP</span>
          <h1>Manufacturing AI Training</h1>
          <p>
            製造業AI導入で必要になる用語、部門の責任分界、KPI、PoC判断を、
            初級の選択式と中級の説明問題で段階的に固めます。
          </p>
          <div className="homeHeroActions">
            <RedAccentButton onClick={() => onStartBeginner("daily10")}>
              初級を始める
            </RedAccentButton>
            <RedAccentButton variant="secondary" onClick={() => onStartTraining("daily10")}>
              中級10問へ
            </RedAccentButton>
          </div>
        </div>

        <div className="todayPanel" aria-label="今日の進捗">
          <span>今日の初級進捗</span>
          <strong>{beginnerStats.answeredToday}/10</strong>
          <div className="todayBar" aria-hidden="true">
            <span style={{ width: `${Math.min(beginnerStats.answeredToday * 10, 100)}%` }} />
          </div>
          <p>初級正答率 {beginnerStats.accuracy}% / 中級平均 {intermediateAverage}</p>
        </div>
      </div>

      <div className="learningModeGrid">
        <section className="learningModeCard primary">
          <div>
            <span className="eyebrow">Beginner</span>
            <h2>初級編：選択式200問</h2>
            <p>用語・部門・KPI・AI導入の基礎を4択で固める</p>
          </div>
          <div className="learningModeMetrics">
            <span>回答済み {beginnerStats.totalAnsweredCount}/200</span>
            <span>正答率 {beginnerStats.accuracy}%</span>
            <span>苦手 {beginnerStats.weakCount}</span>
            <span>今日 {beginnerStats.answeredToday}</span>
          </div>
          <RedAccentButton onClick={() => onStartBeginner("daily10")}>初級を始める</RedAccentButton>
        </section>

        <section className="learningModeCard">
          <div>
            <span className="eyebrow">Intermediate</span>
            <h2>中級編：説明問題85問</h2>
            <p>30秒・90秒で自分の言葉で説明する</p>
          </div>
          <div className="learningModeMetrics">
            <span>回答済み {trainingStats.totalAnsweredCount}/{trainingQuestions.length}</span>
            <span>自己評価 {intermediateAverage}</span>
            <span>苦手 {trainingStats.weakCount}</span>
            <span>今日 {trainingStats.answeredToday}</span>
          </div>
          <RedAccentButton variant="secondary" onClick={() => onStartTraining("daily10")}>
            中級を始める
          </RedAccentButton>
        </section>
      </div>

      <div className="homeStats">
        <StatCard
          label="初級回答済み"
          value={`${beginnerStats.totalAnsweredCount}`}
          detail="選択式200問"
        />
        <StatCard label="初級正答率" value={`${beginnerStats.accuracy}%`} detail="累計回答" />
        <StatCard label="初級苦手" value={`${beginnerStats.weakCount}`} detail="復習候補" />
        <StatCard label="中級説明問題" value={`${trainingQuestions.length}`} detail="85問維持" />
      </div>

      <div className="modeGrid">
        {intermediateModeCards.map((card) => (
          <button className="modeCard" key={card.mode} onClick={() => onStartTraining(card.mode)} type="button">
            <span>{card.title}</span>
            <strong>{card.detail}</strong>
            <em>{card.button}</em>
          </button>
        ))}
      </div>

      <div className="homeGrid">
        <section className="whitePanel compactPanel">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Beginner Set</span>
              <h2>200問の内訳</h2>
            </div>
            <p>初級は用語暗記だけでなく、部門・KPI・PoC判断につながる基礎判断を扱います。</p>
          </div>
          <div className="categoryMeterList">
            {Object.entries(beginnerChoiceQuestionCountsByCategory).map(([category, count]) => (
              <div className="categoryMeter" key={category}>
                <span>{beginnerChoiceCategoryLabels[category as keyof typeof beginnerChoiceCategoryLabels]}</span>
                <strong>{count}問</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="whitePanel compactPanel">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Intermediate Set</span>
              <h2>85問の説明問題</h2>
            </div>
            <p>中級は、AI人材・現場・品質・保全・IT/DX・経営層に説明する力を鍛えます。</p>
          </div>
          <div className="categoryMeterList">
            {Object.entries(trainingQuestionCountsByCategory).map(([category, count]) => (
              <div className="categoryMeter" key={category}>
                <span>{category}</span>
                <strong>{count}問</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="whitePanel compactPanel">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Knowledge Assets</span>
              <h2>用語と構造を確認</h2>
            </div>
            <p>詰まったときは、KnowledgeとMapで正式名称・責任分界・KPI接続を確認できます。</p>
          </div>
          <div className="supportActions">
            <button onClick={() => onChangeView("knowledge")} type="button">
              Knowledgeを確認
            </button>
            <button onClick={() => onChangeView("map")} type="button">
              Mapで関係を見る
            </button>
            <button onClick={() => onChangeView("align")} type="button">
              Alignment Canvas
            </button>
          </div>
          <p className="supportNote">
            Knowledge progress: {metrics.completedConceptCount}/{metrics.totalConceptCount} (
            {metrics.knowledge}%)
          </p>
        </section>
      </div>

      <CautionBox title="今日の判断軸">
        AIは安全・品質・出荷・停止判断の最終決定者ではありません。説明では、AIが支援すること、人が決めること、残す証跡を分けて話します。
      </CautionBox>
    </section>
  );
};
