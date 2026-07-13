import { useMemo, useState } from "react";
import { concepts } from "../data/concepts";
import { officialNames } from "../lib/officialNames";
import type { Concept, StudyProgress } from "../types";
import { CautionBox, DomainBadge, EmptyState, ProgressRing, RedAccentButton } from "../components/ui";
import { ConceptDiagramView } from "../components/ConceptDiagramView";

export const KnowledgeBoothPage = ({
  progress,
  completeConcept,
  toggleBookmark,
}: {
  progress: StudyProgress;
  completeConcept: (conceptId: string) => void;
  toggleBookmark: (conceptId: string) => void;
}) => {
  const booths = useMemo(() => Array.from(new Set(concepts.map((concept) => concept.booth))), []);
  const [activeBooth, setActiveBooth] = useState(booths[0]);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(
    concepts.find((concept) => concept.booth === booths[0]) ?? null,
  );
  const boothConcepts = concepts.filter((concept) => concept.booth === activeBooth);

  const boothProgress = (booth: string) => {
    const targets = concepts.filter((concept) => concept.booth === booth);
    const done = targets.filter((concept) => progress.completedConceptIds.includes(concept.id));
    return targets.length ? Math.round((done.length / targets.length) * 100) : 0;
  };

  const handleBooth = (booth: string) => {
    setActiveBooth(booth);
    setSelectedConcept(concepts.find((concept) => concept.booth === booth) ?? null);
  };

  return (
    <section className="page knowledgePage">
      <div className="pageHeader">
        <span className="eyebrow">Knowledge Booth</span>
        <h1>用語を、会話で使える判断軸へ。</h1>
        <p>一言定義、関係部署、KPI、AIとの接点、注意点をセットで覚えます。</p>
      </div>

      <div className="boothTabs" role="tablist" aria-label="Knowledge booth categories">
        {booths.map((booth) => (
          <button
            className={`boothTab ${activeBooth === booth ? "isActive" : ""}`}
            key={booth}
            onClick={() => handleBooth(booth)}
            role="tab"
            aria-selected={activeBooth === booth}
            type="button"
          >
            <ProgressRing value={boothProgress(booth)} size={46} label={booth} />
            <span>{booth.replace(" Booth", "")}</span>
          </button>
        ))}
      </div>

      <div className="learningLayout">
        <div className="conceptGrid">
          {boothConcepts.map((concept) => {
            const done = progress.completedConceptIds.includes(concept.id);
            const bookmarked = progress.bookmarkedConceptIds.includes(concept.id);
            return (
              <button
                className={`conceptCard ${selectedConcept?.id === concept.id ? "isSelected" : ""}`}
                key={concept.id}
                onClick={() => setSelectedConcept(concept)}
                type="button"
              >
                <div className="conceptCardTop">
                  <DomainBadge domain={concept.domain} />
                  <span>{done ? "Complete" : "Open"}</span>
                </div>
                <strong>{concept.title}</strong>
                {officialNames[concept.id] ? (
                  <span className="conceptOfficialName">{officialNames[concept.id]}</span>
                ) : null}
                <p>{concept.oneLine}</p>
                {bookmarked ? <small>Bookmarked</small> : null}
              </button>
            );
          })}
        </div>

        <aside className="detailPanel">
          {selectedConcept ? (
            <>
              <div className="detailHeader">
                <div>
                  <DomainBadge domain={selectedConcept.domain} />
                  <h2>{selectedConcept.title}</h2>
                  {officialNames[selectedConcept.id] ? (
                    <p className="detailOfficialName">{officialNames[selectedConcept.id]}</p>
                  ) : null}
                </div>
                <ProgressRing
                  value={progress.completedConceptIds.includes(selectedConcept.id) ? 100 : 0}
                  size={58}
                  label={selectedConcept.title}
                />
              </div>
              <p className="leadText">{selectedConcept.oneLine}</p>
              <div className="detailList">
                <div>
                  <span>なぜ重要か</span>
                  <p>{selectedConcept.whyImportant}</p>
                </div>
                <div>
                  <span>関係部署</span>
                  <p>{selectedConcept.departments.join(" / ")}</p>
                </div>
                <div>
                  <span>関連KPI</span>
                  <p>{selectedConcept.kpis.join(" / ")}</p>
                </div>
                <div>
                  <span>AIとの接点</span>
                  <p>{selectedConcept.aiTouchpoint}</p>
                </div>
              </div>
              <ConceptJuniorSection concept={selectedConcept} />
              <CautionBox>{selectedConcept.caution}</CautionBox>
              <div className="miniQuestion">
                <span>ミニ確認</span>
                <strong>{selectedConcept.miniQuestion.prompt}</strong>
                <p>{selectedConcept.miniQuestion.answer}</p>
              </div>
              <details className="answerDetails">
                <summary>30秒で説明するなら</summary>
                <p>{selectedConcept.thirtySecond}</p>
              </details>
              <div className="detailActions">
                <RedAccentButton onClick={() => completeConcept(selectedConcept.id)}>
                  理解済みにする
                </RedAccentButton>
                <RedAccentButton
                  variant="secondary"
                  onClick={() => toggleBookmark(selectedConcept.id)}
                >
                  {progress.bookmarkedConceptIds.includes(selectedConcept.id)
                    ? "ブックマーク解除"
                    : "ブックマーク"}
                </RedAccentButton>
              </div>
            </>
          ) : (
            <EmptyState title="カードを選択" text="左のブースから知識カードを開いてください。" />
          )}
        </aside>
      </div>
    </section>
  );
};

/**
 * 「中学生でもわかる」強化セクション。
 * 一言でいうと → 概念図 → 利用シーン → たとえばこう使う → AIとどうつながるか の順で表示する。
 * データが無い用語（部門・リスク等）では何も描画しない（既存カードを壊さない）。
 */
const ConceptJuniorSection = ({ concept }: { concept: Concept }) => {
  const hasJunior =
    concept.juniorSummary ||
    concept.conceptDiagram ||
    concept.usageScene?.length ||
    concept.exampleScene?.length ||
    concept.aiConnection;

  if (!hasJunior) return null;

  return (
    <div className="juniorSection" aria-label="中学生でもわかる説明">
      {concept.juniorSummary ? (
        <div className="juniorSummary">
          <span className="juniorLabel">一言でいうと</span>
          <p>{concept.juniorSummary}</p>
        </div>
      ) : null}

      {concept.conceptDiagram ? (
        <div className="juniorBlock">
          <span className="juniorLabel">概念図</span>
          <ConceptDiagramView diagram={concept.conceptDiagram} />
        </div>
      ) : null}

      {concept.usageScene?.length ? (
        <div className="juniorBlock">
          <span className="juniorLabel">利用シーン</span>
          <ul className="juniorList">
            {concept.usageScene.map((scene) => (
              <li key={scene}>{scene}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {concept.exampleScene?.length ? (
        <div className="juniorBlock">
          <span className="juniorLabel">たとえばこう使う</span>
          <ul className="juniorList">
            {concept.exampleScene.map((scene) => (
              <li key={scene}>{scene}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {concept.aiConnection ? (
        <div className="juniorBlock juniorAiConnection">
          <span className="juniorLabel">AIとどうつながるか</span>
          <p>{concept.aiConnection}</p>
        </div>
      ) : null}
    </div>
  );
};
