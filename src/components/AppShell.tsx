import type { ReactNode } from "react";
import type { ViewId } from "../types";
import { useT } from "../contexts/localeContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
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
}) => {
  const t = useT();

  return (
    <div className="appShell">
      <aside className="sidebar" aria-label={t.a11y.mainNav}>
        <div className="brandBlock">
          <div className="brandMark" aria-hidden="true">
            AI
          </div>
          <div className="brandText">
            <p className="brandName">{t.shell.brandName}</p>
            <span>{t.shell.brandTagline}</span>
          </div>
        </div>
        <nav className="navList">
          {views.map((view) => (
            <button
              key={view}
              className={`navItem ${currentView === view ? "isActive" : ""}`}
              onClick={() => onChangeView(view)}
              aria-current={currentView === view ? "page" : undefined}
              type="button"
            >
              <span>{t.nav.labels[view]}</span>
              <small>{t.nav.descriptions[view]}</small>
            </button>
          ))}
        </nav>
        <LanguageSwitcher className="sidebarSwitcher" />
        <div className="sidebarNote">
          <p>{t.shell.sidebarNote}</p>
        </div>
      </aside>

      <main className="mainStage">{children}</main>

      <aside className="rightRail" aria-label={t.a11y.progressRail}>
        {progressPanel}
      </aside>

      <nav className="mobileTabBar" aria-label={t.a11y.mobileNav}>
        {views.map((view) => (
          <button
            key={view}
            className={`mobileTab ${currentView === view ? "isActive" : ""}`}
            onClick={() => onChangeView(view)}
            aria-current={currentView === view ? "page" : undefined}
            type="button"
          >
            <span className="mobileTabDot" aria-hidden="true" />
            {t.nav.labels[view]}
          </button>
        ))}
      </nav>
    </div>
  );
};

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
  const t = useT();

  const items = [
    [t.metrics.knowledge, metrics.knowledge],
    [t.metrics.structure, metrics.structure],
    [t.metrics.process, metrics.process],
    [t.metrics.risk, metrics.risk],
    [t.metrics.explain, metrics.explain],
  ] as const;

  return (
    <div className="progressPanel">
      <div className="panelHeader">
        <p>{t.shell.progressTitle}</p>
        <span>{t.shell.streak(streak)}</span>
      </div>
      <div className="metricStack">
        {items.map(([label, value]) => (
          <div className="metricRow" key={label}>
            {/* No `label`: the metric name is visible text beside the ring, so an
                sr-only copy would read the name twice. */}
            <ProgressRing value={value} size={58} />
            <div className="metricText">
              <strong>{label}</strong>
              <span>{value}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="railSummary">
        <div>
          <span>{t.shell.concepts}</span>
          <strong>
            {metrics.completedConceptCount}/{metrics.totalConceptCount}
          </strong>
        </div>
        <div>
          <span>{t.shell.questions}</span>
          <strong>
            {metrics.answeredCount}/{metrics.totalQuestionCount}
          </strong>
        </div>
      </div>
    </div>
  );
};
