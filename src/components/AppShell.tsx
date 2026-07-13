import type { ReactNode } from "react";
import type { ViewId } from "../types";
import { viewDescriptions, viewLabels } from "../lib/labels";
import { ProgressRing } from "./ui";

const views: ViewId[] = [
  "cockpit",
  "beginner",
  "align",
  "knowledge",
  "map",
  "drill",
  "explain",
  "review",
];

export const AppShell = ({
  currentView,
  onChangeView,
  children,
  progressPanel,
}: {
  currentView: ViewId;
  onChangeView: (view: ViewId) => void;
  children: ReactNode;
  progressPanel: ReactNode;
}) => (
  <div className="appShell">
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brandBlock">
        <div className="brandMark">AI</div>
        <div>
          <p className="brandName">Manufacturing AI Training</p>
          <span>毎日3〜10分の説明練習</span>
        </div>
      </div>
      <nav className="navList">
        {views.map((view) => (
          <button
            key={view}
            className={`navItem ${currentView === view ? "isActive" : ""}`}
            onClick={() => onChangeView(view)}
            type="button"
          >
            <span>{viewLabels[view]}</span>
            <small>{viewDescriptions[view]}</small>
          </button>
        ))}
      </nav>
      <div className="sidebarNote">
        <p>診断士として、AI人材・現場・経営の前提、KPI、責任境界をそろえる練習に集中します。</p>
      </div>
    </aside>

    <main className="mainStage">{children}</main>

    <aside className="rightRail" aria-label="Progress">
      {progressPanel}
    </aside>

    <nav className="mobileTabBar" aria-label="Mobile navigation">
      {views.map((view) => (
        <button
          key={view}
          className={`mobileTab ${currentView === view ? "isActive" : ""}`}
          onClick={() => onChangeView(view)}
          type="button"
        >
          <span className="mobileTabDot" aria-hidden="true" />
          {viewLabels[view]}
        </button>
      ))}
    </nav>
  </div>
);

export const ProgressPanel = ({
  metrics,
  streak,
}: {
  metrics: {
    knowledge: number;
    structure: number;
    process: number;
    risk: number;
    explain: number;
    answeredCount: number;
    totalQuestionCount: number;
    completedConceptCount: number;
    totalConceptCount: number;
  };
  streak: number;
}) => {
  const items = [
    ["Knowledge", metrics.knowledge],
    ["Structure", metrics.structure],
    ["Process", metrics.process],
    ["Risk", metrics.risk],
    ["Explain", metrics.explain],
  ] as const;

  return (
    <div className="progressPanel">
      <div className="panelHeader">
        <p>Progress</p>
        <span>{streak} day streak</span>
      </div>
      <div className="metricStack">
        {items.map(([label, value]) => (
          <div className="metricRow" key={label}>
            <ProgressRing value={value} size={58} label={label} />
            <div>
              <strong>{label}</strong>
              <span>{value}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="railSummary">
        <div>
          <span>Concepts</span>
          <strong>
            {metrics.completedConceptCount}/{metrics.totalConceptCount}
          </strong>
        </div>
        <div>
          <span>Questions</span>
          <strong>
            {metrics.answeredCount}/{metrics.totalQuestionCount}
          </strong>
        </div>
      </div>
    </div>
  );
};
