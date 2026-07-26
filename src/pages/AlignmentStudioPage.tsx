import { useEffect, useMemo, useState } from "react";
import {
  localizedAuthority,
  localizedDialogues,
  localizedFrictions,
  localizedScenarios,
} from "../i18n/content";
import type { ExpertDialogueCard, FrictionWord, Scenario } from "../types";
import { CautionBox, RedAccentButton } from "../components/ui";
import { useLocale } from "../contexts/localeContext";
import type { Dictionary } from "../i18n/ja";

type CanvasState = {
  target: string;
  problem: string;
  supportedDecision: string;
  kpi: string;
  data: string;
  dataAssumption: string;
  aiOutput: string;
  aiDoesNotDecide: string;
  finalDecisionOwner: string;
  riskNotes: string;
  pocSuccess: string;
  productionCondition: string;
  outOfScope: string;
  nextActions: string;
};

type CopyStatus = "idle" | "copied" | "downloaded" | "failed";

const initialCanvas: CanvasState = {
  target: "",
  problem: "",
  supportedDecision: "",
  kpi: "",
  data: "",
  dataAssumption: "",
  aiOutput: "",
  aiDoesNotDecide: "",
  finalDecisionOwner: "",
  riskNotes: "",
  pocSuccess: "",
  productionCondition: "",
  outOfScope: "",
  nextActions: "",
};

const CANVAS_STORAGE_KEY = "manufacturing-ai-alignment-canvas-draft-v1";

const canvasFields = Object.keys(initialCanvas) as Array<keyof CanvasState>;

/** Exported Markdown follows the active locale so the file matches the meeting. */
const buildMarkdown = (canvas: CanvasState, t: Dictionary) =>
  [
    "# Manufacturing AI Alignment Canvas",
    "",
    ...canvasFields.flatMap((field, index) => [
      `## ${index + 1}. ${t.align.canvasLabels[field]}`,
      canvas[field] || t.align.canvasEmptyValue,
      "",
    ]),
  ].join("\n");

const loadCanvasDraft = (): CanvasState => {
  try {
    const raw = localStorage.getItem(CANVAS_STORAGE_KEY);
    if (!raw) return initialCanvas;
    const parsed = JSON.parse(raw) as Partial<CanvasState>;
    return canvasFields.reduce<CanvasState>(
      (draft, field) => ({
        ...draft,
        [field]: typeof parsed[field] === "string" ? parsed[field] : initialCanvas[field],
      }),
      initialCanvas,
    );
  } catch {
    return initialCanvas;
  }
};

export const AlignmentStudioPage = () => {
  const { locale, t } = useLocale();
  const scenarios = localizedScenarios[locale];
  const glossaryFrictions = localizedFrictions[locale];
  const expertDialogues = localizedDialogues[locale];
  const decisionAuthority = localizedAuthority[locale];
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? "");
  const [frictionId, setFrictionId] = useState(glossaryFrictions[0]?.id ?? "");
  const [dialogueId, setDialogueId] = useState(expertDialogues[0]?.id ?? "");
  const [canvas, setCanvas] = useState<CanvasState>(loadCanvasDraft);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
    [scenarios, scenarioId],
  );
  const friction = useMemo(
    () => glossaryFrictions.find((item) => item.id === frictionId) ?? glossaryFrictions[0],
    [glossaryFrictions, frictionId],
  );
  const dialogue = useMemo(
    () => expertDialogues.find((item) => item.id === dialogueId) ?? expertDialogues[0],
    [expertDialogues, dialogueId],
  );
  const markdown = useMemo(() => buildMarkdown(canvas, t), [canvas, t]);
  const requiredReady =
    canvas.supportedDecision.trim() && canvas.aiDoesNotDecide.trim() && canvas.finalDecisionOwner.trim();

  useEffect(() => {
    try {
      localStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(canvas));
    } catch {
      // Canvas output still works through copy/download even when local draft save is unavailable.
    }
  }, [canvas]);

  const updateCanvas = (field: keyof CanvasState, value: string) => {
    setCopyStatus("idle");
    setCanvas((current) => ({ ...current, [field]: value }));
  };

  const applyScenarioToCanvas = (item: Scenario) => {
    setCanvas((current) => ({
      ...current,
      supportedDecision: t.align.concernOf(item.stakeholder, item.concern),
      aiOutput: item.goodResponse,
      aiDoesNotDecide: item.poorResponse,
      finalDecisionOwner: t.align.ownerOf(item.stakeholder),
      riskNotes: item.reason,
      nextActions: item.nextQuestions.map((question) => `- ${question}`).join("\n"),
    }));
    setCopyStatus("idle");
  };

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "manufacturing-ai-alignment-canvas.md";
    anchor.click();
    URL.revokeObjectURL(url);
    setCopyStatus("downloaded");
  };

  return (
    <section className="page alignmentPage">
      <div className="pageHeader alignmentHero">
        <span className="eyebrow">{t.align.eyebrow}</span>
        <h1>{t.align.title}</h1>
        <p>{t.align.lead}</p>
      </div>

      <div className="alignmentOverview">
        <div>
          <span>{t.align.roleLabel}</span>
          <strong>{t.align.roleValue}</strong>
        </div>
        <div>
          <span>{t.align.requiredLabel}</span>
          <strong>{t.align.requiredValue}</strong>
        </div>
        <div>
          <span>{t.align.outputLabel}</span>
          <strong>{t.align.outputValue}</strong>
        </div>
      </div>

      <div className="alignmentGrid">
        <section className="alignmentPanel stakeholderPanel">
          <PanelHeader
            eyebrow={t.align.stakeholderEyebrow}
            title={t.align.stakeholderTitle}
            text={t.align.stakeholderText}
          />
          <ScenarioPicker scenarios={scenarios} scenario={scenario} onSelect={setScenarioId} />
          <div className="alignmentCard">
            <span>{scenario.stakeholder}</span>
            <h3>{scenario.concern}</h3>
            <p>{scenario.reason}</p>
          </div>
          <div className="alignmentSplit">
            <ResponseBox title={t.align.trapTitle} tone="warn" text={scenario.aiTalentTrap} />
            <ResponseBox title={t.align.goalTitle} tone="good" text={scenario.agreedGoal} />
          </div>
          <AnswerBlock
            title={t.align.nextQuestionsTitle}
            items={scenario.nextQuestions}
            actionLabel={t.align.applyToCanvas}
            onAction={() => applyScenarioToCanvas(scenario)}
          />
        </section>

        <section className="alignmentPanel">
          <PanelHeader
            eyebrow={t.align.frictionEyebrow}
            title={t.align.frictionTitle}
            text={t.align.frictionText}
          />
          <FrictionPicker frictions={glossaryFrictions} friction={friction} onSelect={setFrictionId} />
          <FrictionCard friction={friction} />
        </section>
      </div>

      <div className="alignmentGrid">
        <section className="alignmentPanel">
          <PanelHeader
            eyebrow={t.align.dialogueEyebrow}
            title={t.align.dialogueTitle}
            text={t.align.dialogueText}
          />
          <DialoguePicker dialogues={expertDialogues} dialogue={dialogue} onSelect={setDialogueId} />
          <DialogueCard dialogue={dialogue} />
        </section>

        <section className="alignmentPanel">
          <PanelHeader
            eyebrow={t.align.boundaryEyebrow}
            title={t.align.boundaryTitle}
            text={t.align.boundaryText}
          />
          <div className="authorityStack">
            {decisionAuthority.map((item) => (
              <details className="authorityItem" key={item.id}>
                <summary>{item.area}</summary>
                <div>
                  <p>
                    <strong>{t.align.boundaryAi}</strong> {item.aiRole}
                  </p>
                  <p>
                    <strong>{t.align.boundaryHuman}</strong> {item.humanRole}
                  </p>
                  <p>
                    <strong>{t.align.boundaryEvidence}</strong> {item.evidenceToLeave}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>

      <section className="alignmentPanel canvasPanel">
        <PanelHeader
          eyebrow={t.align.canvasEyebrow}
          title={t.align.canvasTitle}
          text={t.align.canvasText}
        />
        <CautionBox title={requiredReady ? t.align.canvasReadyTitle : t.align.canvasRequiredTitle}>
          {t.align.canvasRequiredText}
        </CautionBox>
        <div className="canvasGrid">
          {canvasFields.map((field) => (
            <label className="canvasField" key={field}>
              <span>{t.align.canvasLabels[field]}</span>
              <textarea
                value={canvas[field]}
                onChange={(event) => updateCanvas(field, event.target.value)}
                rows={field === "nextActions" ? 5 : 3}
                placeholder={t.align.canvasPlaceholder}
              />
            </label>
          ))}
        </div>
        <div className="canvasActions">
          <RedAccentButton onClick={copyMarkdown}>{t.align.copyMarkdown}</RedAccentButton>
          <RedAccentButton variant="secondary" onClick={downloadMarkdown}>
            {t.align.downloadMarkdown}
          </RedAccentButton>
          <RedAccentButton variant="ghost" onClick={() => setCanvas(initialCanvas)}>
            {t.align.resetCanvas}
          </RedAccentButton>
          <span className={`copyStatus copyStatus-${copyStatus}`}>
            {copyStatus === "copied"
              ? t.align.copied
              : copyStatus === "downloaded"
                ? t.align.downloaded
                : copyStatus === "failed"
                  ? t.errors.clipboardFailed
                  : t.align.copyIdle}
          </span>
        </div>
        <details className="markdownPreview">
          <summary>{t.align.markdownPreview}</summary>
          <pre>{markdown}</pre>
        </details>
      </section>
    </section>
  );
};

const PanelHeader = ({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) => (
  <div className="sectionHeader alignmentSectionHeader">
    <div>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
    </div>
    <p>{text}</p>
  </div>
);

const ScenarioPicker = ({
  scenarios,
  scenario,
  onSelect,
}: {
  scenarios: Scenario[];
  scenario: Scenario;
  onSelect: (scenarioId: string) => void;
}) => {
  const { t } = useLocale();
  return (
  <div className="alignmentChipRail" role="tablist" aria-label={t.a11y.stakeholderScenarios}>
    {scenarios.map((item) => (
      <button
        className={`alignmentChip ${scenario.id === item.id ? "isActive" : ""}`}
        key={item.id}
        onClick={() => onSelect(item.id)}
        role="tab"
        aria-selected={scenario.id === item.id}
        type="button"
      >
        {item.stakeholder}
      </button>
    ))}
  </div>
  );
};

const FrictionPicker = ({
  frictions,
  friction,
  onSelect,
}: {
  frictions: FrictionWord[];
  friction: FrictionWord;
  onSelect: (frictionId: string) => void;
}) => {
  const { t } = useLocale();
  return (
  <div className="alignmentChipRail" role="tablist" aria-label={t.a11y.frictionWords}>
    {frictions.map((item) => (
      <button
        className={`alignmentChip ${friction.id === item.id ? "isActive" : ""}`}
        key={item.id}
        onClick={() => onSelect(item.id)}
        role="tab"
        aria-selected={friction.id === item.id}
        type="button"
      >
        {item.term}
      </button>
    ))}
  </div>
  );
};

const DialoguePicker = ({
  dialogues,
  dialogue,
  onSelect,
}: {
  dialogues: ExpertDialogueCard[];
  dialogue: ExpertDialogueCard;
  onSelect: (dialogueId: string) => void;
}) => {
  const { t } = useLocale();
  return (
  <div className="alignmentChipRail" role="tablist" aria-label={t.a11y.dialoguePhases}>
    {dialogues.map((item) => (
      <button
        className={`alignmentChip ${dialogue.id === item.id ? "isActive" : ""}`}
        key={item.id}
        onClick={() => onSelect(item.id)}
        role="tab"
        aria-selected={dialogue.id === item.id}
        type="button"
      >
        {item.phase}
      </button>
    ))}
  </div>
  );
};

const ResponseBox = ({
  title,
  text,
  tone,
}: {
  title: string;
  text: string;
  tone: "good" | "warn";
}) => (
  <div className={`responseBox responseBox-${tone}`}>
    <span>{title}</span>
    <p>{text}</p>
  </div>
);

const AnswerBlock = ({
  title,
  items,
  actionLabel,
  onAction,
}: {
  title: string;
  items: string[];
  actionLabel: string;
  onAction: () => void;
}) => (
  <div className="answerBlock">
    <h3>{title}</h3>
    <ol>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
    <RedAccentButton variant="secondary" onClick={onAction}>
      {actionLabel}
    </RedAccentButton>
  </div>
);

const FrictionCard = ({ friction }: { friction: FrictionWord }) => {
  const { t } = useLocale();
  return (
    <div className="frictionCard">
      <span>{friction.term}</span>
      <div className="modeStack">
        <ModeBlock label={t.align.frictionPlain} text={friction.plain} />
        <ModeBlock label={t.align.frictionAiSide} text={friction.aiSideMeaning} />
        <ModeBlock label={t.align.frictionRisk} text={friction.manufacturingRisk} />
        <ModeBlock label={t.align.frictionDefinition} text={friction.alignmentDefinition} />
        <ModeBlock label={t.align.frictionExpertQuestion} text={friction.expertQuestion} strong />
      </div>
    </div>
  );
};

const ModeBlock = ({ label, text, strong = false }: { label: string; text: string; strong?: boolean }) => (
  <div className={`modeBlock ${strong ? "isStrong" : ""}`}>
    <span>{label}</span>
    <p>{text}</p>
  </div>
);

const DialogueCard = ({ dialogue }: { dialogue: ExpertDialogueCard }) => {
  const { t } = useLocale();
  return (
    <div className="dialogueCard">
      <span>{dialogue.phase}</span>
      <div className="alignmentSplit">
        <ResponseBox title={t.align.weakQuestion} tone="warn" text={dialogue.weakQuestion} />
        <ResponseBox title={t.align.strongQuestion} tone="good" text={dialogue.strongQuestion} />
      </div>
      <div className="answerBlock compact">
        <h3>{t.align.whyItWorks}</h3>
        <p>{dialogue.whyItWorks}</p>
      </div>
    </div>
  );
};
