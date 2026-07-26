import { useMemo, useState } from "react";
import { localizedConcepts } from "../i18n/content";
import { officialNames } from "../lib/officialNames";
import type { Concept, StudyProgress } from "../types";
import { CautionBox, DomainBadge, EmptyState, ProgressRing, RedAccentButton } from "../components/ui";
import { ConceptDiagramView } from "../components/ConceptDiagramView";
import { useLocale, useT } from "../contexts/localeContext";
import type { Dictionary } from "../i18n/ja";

export const KnowledgeBoothPage = ({
  progress,
  completeConcept,
  toggleBookmark,
}: {
  progress: StudyProgress;
  completeConcept: (conceptId: string) => void;
  toggleBookmark: (conceptId: string) => void;
}) => {
  const { locale, t } = useLocale();
  const concepts = localizedConcepts[locale];
  const booths = useMemo(
    () => Array.from(new Set(concepts.map((concept) => concept.booth))),
    [concepts],
  );
  const [activeBooth, setActiveBooth] = useState(booths[0]);
  const [selectedId, setSelectedId] = useState<string | null>(
    concepts.find((concept) => concept.booth === booths[0])?.id ?? null,
  );
  const boothConcepts = concepts.filter((concept) => concept.booth === activeBooth);
  // Tracked by id rather than by object so the selection survives a locale switch,
  // which replaces every concept object with its translated counterpart.
  const selectedConcept = concepts.find((concept) => concept.id === selectedId) ?? null;

  const boothCounts = (booth: string) => {
    const targets = concepts.filter((concept) => concept.booth === booth);
    const done = targets.filter((concept) => progress.completedConceptIds.includes(concept.id));
    return { done: done.length, total: targets.length };
  };

  const boothProgress = (booth: string) => {
    const { done, total } = boothCounts(booth);
    return total ? Math.round((done / total) * 100) : 0;
  };

  const boothLabel = (booth: string) =>
    t.booths[booth as keyof Dictionary["booths"]] ?? booth.replace(" Booth", "");

  const handleBooth = (booth: string) => {
    setActiveBooth(booth);
    setSelectedId(concepts.find((concept) => concept.booth === booth)?.id ?? null);
  };

  return (
    <section className="page knowledgePage">
      <div className="pageHeader">
        <span className="eyebrow">{t.knowledge.eyebrow}</span>
        <h1>{t.knowledge.title}</h1>
        <p>{t.knowledge.lead}</p>
      </div>

      <div className="boothTabs" role="tablist" aria-label={t.a11y.boothTabs}>
        {booths.map((booth) => {
          const { done, total } = boothCounts(booth);
          return (
            <button
              className={`boothTab ${activeBooth === booth ? "isActive" : ""}`}
              key={booth}
              onClick={() => handleBooth(booth)}
              role="tab"
              aria-selected={activeBooth === booth}
              type="button"
            >
              <ProgressRing value={boothProgress(booth)} size={46} />
              <span className="boothTabText">
                <strong>{boothLabel(booth)}</strong>
                <small>{t.knowledge.boothProgress(done, total)}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="learningLayout">
        <div className="conceptGrid">
          {boothConcepts.map((concept) => {
            const done = progress.completedConceptIds.includes(concept.id);
            const bookmarked = progress.bookmarkedConceptIds.includes(concept.id);
            return (
              <button
                className={`conceptCard ${selectedConcept?.id === concept.id ? "isSelected" : ""} ${
                  done ? "isDone" : ""
                }`}
                key={concept.id}
                onClick={() => setSelectedId(concept.id)}
                type="button"
              >
                <div className="conceptCardTop">
                  <DomainBadge domain={concept.domain} />
                  <span className={`statePill ${done ? "statePill-done" : "statePill-open"}`}>
                    {done ? t.common.complete : t.common.open}
                  </span>
                </div>
                <strong>{concept.title}</strong>
                {officialNames[concept.id] ? (
                  <span className="conceptOfficialName">{officialNames[concept.id]}</span>
                ) : null}
                <p>{concept.oneLine}</p>
                {bookmarked ? <small>{t.common.bookmarked}</small> : null}
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
                  <span>{t.knowledge.whyImportant}</span>
                  <p>{selectedConcept.whyImportant}</p>
                </div>
                <div>
                  <span>{t.knowledge.departments}</span>
                  <p>{selectedConcept.departments.join(" / ")}</p>
                </div>
                <div>
                  <span>{t.knowledge.kpis}</span>
                  <p>{selectedConcept.kpis.join(" / ")}</p>
                </div>
                <div>
                  <span>{t.knowledge.aiTouchpoint}</span>
                  <p>{selectedConcept.aiTouchpoint}</p>
                </div>
              </div>
              <ConceptJuniorSection concept={selectedConcept} />
              <CautionBox>{selectedConcept.caution}</CautionBox>
              <div className="miniQuestion">
                <span>{t.knowledge.miniQuestion}</span>
                <strong>{selectedConcept.miniQuestion.prompt}</strong>
                <p>{selectedConcept.miniQuestion.answer}</p>
              </div>
              <details className="answerDetails">
                <summary>{t.knowledge.thirtySecond}</summary>
                <p>{selectedConcept.thirtySecond}</p>
              </details>
              <div className="detailActions">
                <RedAccentButton onClick={() => completeConcept(selectedConcept.id)}>
                  {t.knowledge.markComplete}
                </RedAccentButton>
                <RedAccentButton
                  variant="secondary"
                  onClick={() => toggleBookmark(selectedConcept.id)}
                >
                  {progress.bookmarkedConceptIds.includes(selectedConcept.id)
                    ? t.common.unbookmark
                    : t.common.bookmark}
                </RedAccentButton>
              </div>
            </>
          ) : (
            <EmptyState title={t.common.emptySelectCard} text={t.common.emptySelectCardText} />
          )}
        </aside>
      </div>
    </section>
  );
};

/**
 * Plain-language section: one-line summary, diagram, when it comes up, an example, and
 * how AI connects. Renders nothing for concepts without this data (departments, risks),
 * which also means an untranslated enrichment is dropped rather than appearing in
 * Japanese inside the English locale.
 */
const ConceptJuniorSection = ({ concept }: { concept: Concept }) => {
  const t = useT();
  const hasJunior =
    concept.juniorSummary ||
    concept.conceptDiagram ||
    concept.usageScene?.length ||
    concept.exampleScene?.length ||
    concept.aiConnection;

  if (!hasJunior) return null;

  return (
    <div className="juniorSection" aria-label={t.a11y.juniorSection}>
      {concept.juniorSummary ? (
        <div className="juniorSummary">
          <span className="juniorLabel">{t.knowledge.juniorSummary}</span>
          <p>{concept.juniorSummary}</p>
        </div>
      ) : null}

      {concept.conceptDiagram ? (
        <div className="juniorBlock">
          <span className="juniorLabel">{t.knowledge.juniorDiagram}</span>
          <ConceptDiagramView diagram={concept.conceptDiagram} />
        </div>
      ) : null}

      {concept.usageScene?.length ? (
        <div className="juniorBlock">
          <span className="juniorLabel">{t.knowledge.juniorUsage}</span>
          <ul className="juniorList">
            {concept.usageScene.map((scene) => (
              <li key={scene}>{scene}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {concept.exampleScene?.length ? (
        <div className="juniorBlock">
          <span className="juniorLabel">{t.knowledge.juniorExample}</span>
          <ul className="juniorList">
            {concept.exampleScene.map((scene) => (
              <li key={scene}>{scene}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {concept.aiConnection ? (
        <div className="juniorBlock juniorAiConnection">
          <span className="juniorLabel">{t.knowledge.juniorAiConnection}</span>
          <p>{concept.aiConnection}</p>
        </div>
      ) : null}
    </div>
  );
};
