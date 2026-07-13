import { useEffect, useMemo, useState } from "react";
import { decisionAuthority } from "../data/decisionAuthority";
import { expertDialogues } from "../data/expertDialogues";
import { glossaryFrictions } from "../data/glossaryFrictions";
import { scenarios } from "../data/scenarios";
import type { ExpertDialogueCard, FrictionWord, Scenario } from "../types";
import { CautionBox, RedAccentButton } from "../components/ui";

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

const canvasLabels: Record<keyof CanvasState, string> = {
  target: "対象業務 / 工程",
  problem: "解きたい課題",
  supportedDecision: "誰の・何の判断を支援するか",
  kpi: "成功KPI",
  data: "利用データ",
  dataAssumption: "データ前提（時刻 / ロット / 工程 / 品質結果）",
  aiOutput: "AIが出すもの",
  aiDoesNotDecide: "AIが決めないもの",
  finalDecisionOwner: "最終判断者",
  riskNotes: "品質・安全・監査上の注意",
  pocSuccess: "PoC成功条件",
  productionCondition: "本番化条件",
  outOfScope: "やらないこと",
  nextActions: "次回までの確認事項",
};

const canvasFields = Object.keys(initialCanvas) as Array<keyof CanvasState>;

const buildMarkdown = (canvas: CanvasState) =>
  [
    "# Manufacturing AI Alignment Canvas",
    "",
    ...canvasFields.flatMap((field, index) => [
      `## ${index + 1}. ${canvasLabels[field]}`,
      canvas[field] || "[未入力]",
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
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? "");
  const [frictionId, setFrictionId] = useState(glossaryFrictions[0]?.id ?? "");
  const [dialogueId, setDialogueId] = useState(expertDialogues[0]?.id ?? "");
  const [canvas, setCanvas] = useState<CanvasState>(loadCanvasDraft);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  );
  const friction = useMemo(
    () => glossaryFrictions.find((item) => item.id === frictionId) ?? glossaryFrictions[0],
    [frictionId],
  );
  const dialogue = useMemo(
    () => expertDialogues.find((item) => item.id === dialogueId) ?? expertDialogues[0],
    [dialogueId],
  );
  const markdown = useMemo(() => buildMarkdown(canvas), [canvas]);
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
      supportedDecision: `${item.stakeholder}の懸念: ${item.concern}`,
      aiOutput: item.goodResponse,
      aiDoesNotDecide: item.poorResponse,
      finalDecisionOwner: `${item.stakeholder} / 既存プロセスの責任者`,
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
        <span className="eyebrow">Alignment Studio</span>
        <h1>AI専門家と、短期間で前提をそろえる。</h1>
        <p>
          中小企業診断士として、AIの技術論を製造業の業務・KPI・責任境界・現場定着へ接続するための回答ワークスペースです。
        </p>
      </div>

      <div className="alignmentOverview">
        <div>
          <span>役割</span>
          <strong>技術で張り合わず、実装可能な合意へ翻訳する</strong>
        </div>
        <div>
          <span>必須合意</span>
          <strong>AIが出すもの / 決めないもの / 最終判断者</strong>
        </div>
        <div>
          <span>出力</span>
          <strong>会議後に残せる Markdown Canvas</strong>
        </div>
      </div>

      <div className="alignmentGrid">
        <section className="alignmentPanel stakeholderPanel">
          <PanelHeader
            eyebrow="Stakeholder Alignment"
            title="相手の懸念から入る"
            text="工場長、品質保証、保全、IT/DX、現場、経営層など、相手ごとの不安を先に受け止めます。"
          />
          <ScenarioPicker scenario={scenario} onSelect={setScenarioId} />
          <div className="alignmentCard">
            <span>{scenario.stakeholder}</span>
            <h3>{scenario.concern}</h3>
            <p>{scenario.reason}</p>
          </div>
          <div className="alignmentSplit">
            <ResponseBox title="AI人材が陥りやすいズレ" tone="warn" text={scenario.aiTalentTrap} />
            <ResponseBox title="合意したい着地点" tone="good" text={scenario.agreedGoal} />
          </div>
          <AnswerBlock
            title="会議で投げる次の問い"
            items={scenario.nextQuestions}
            actionLabel="このケースをCanvasへ反映"
            onAction={() => applyScenarioToCanvas(scenario)}
          />
        </section>

        <section className="alignmentPanel">
          <PanelHeader
            eyebrow="Friction Words"
            title="ずれやすい言葉を翻訳する"
            text="簡単すぎず、難しすぎず。Plain → Alignment → Expert Question の3段で確認します。"
          />
          <FrictionPicker friction={friction} onSelect={setFrictionId} />
          <FrictionCard friction={friction} />
        </section>
      </div>

      <div className="alignmentGrid">
        <section className="alignmentPanel">
          <PanelHeader
            eyebrow="Expert Dialogue"
            title="浅すぎない質問に変換する"
            text="AI専門家の高度な技術論を、製造業の実装論点へ戻す質問練習です。"
          />
          <DialoguePicker dialogue={dialogue} onSelect={setDialogueId} />
          <DialogueCard dialogue={dialogue} />
        </section>

        <section className="alignmentPanel">
          <PanelHeader
            eyebrow="Decision Boundary"
            title="AIが支援すること、人が決めること"
            text="安全・品質・出荷・停止・設備制御の最終判断をAIに渡さないための境界表です。"
          />
          <div className="authorityStack">
            {decisionAuthority.map((item) => (
              <details className="authorityItem" key={item.id}>
                <summary>{item.area}</summary>
                <div>
                  <p>
                    <strong>AI:</strong> {item.aiRole}
                  </p>
                  <p>
                    <strong>人・既存プロセス:</strong> {item.humanRole}
                  </p>
                  <p>
                    <strong>残す証跡:</strong> {item.evidenceToLeave}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>

      <section className="alignmentPanel canvasPanel">
        <PanelHeader
          eyebrow="Alignment Canvas"
          title="PCでもスマホでも、会議の回答を残す"
          text="入力内容は端末内の画面状態だけで扱います。外部送信・DB保存・ログインはありません。"
        />
        <CautionBox title={requiredReady ? "最低限の境界は入力済み" : "必須入力"}>
          共有前に「AIが決めないもの」「最終判断者」「誰の何の判断を支援するか」を必ず埋めてください。
        </CautionBox>
        <div className="canvasGrid">
          {canvasFields.map((field) => (
            <label className="canvasField" key={field}>
              <span>{canvasLabels[field]}</span>
              <textarea
                value={canvas[field]}
                onChange={(event) => updateCanvas(field, event.target.value)}
                rows={field === "nextActions" ? 5 : 3}
                placeholder="ここに会議で合意した内容を入力"
              />
            </label>
          ))}
        </div>
        <div className="canvasActions">
          <RedAccentButton onClick={copyMarkdown}>Markdownをコピー</RedAccentButton>
          <RedAccentButton variant="secondary" onClick={downloadMarkdown}>
            .mdで保存
          </RedAccentButton>
          <RedAccentButton variant="ghost" onClick={() => setCanvas(initialCanvas)}>
            入力をリセット
          </RedAccentButton>
          <span className={`copyStatus copyStatus-${copyStatus}`}>
            {copyStatus === "copied"
              ? "コピーしました"
              : copyStatus === "downloaded"
                ? "保存ファイルを作成しました"
                : copyStatus === "failed"
                  ? "コピーできません。保存ボタンを使ってください。"
                  : "未出力"}
          </span>
        </div>
        <details className="markdownPreview">
          <summary>Markdownプレビュー</summary>
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
  scenario,
  onSelect,
}: {
  scenario: Scenario;
  onSelect: (scenarioId: string) => void;
}) => (
  <div className="alignmentChipRail" role="tablist" aria-label="Stakeholder scenarios">
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

const FrictionPicker = ({
  friction,
  onSelect,
}: {
  friction: FrictionWord;
  onSelect: (frictionId: string) => void;
}) => (
  <div className="alignmentChipRail" role="tablist" aria-label="Friction words">
    {glossaryFrictions.map((item) => (
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

const DialoguePicker = ({
  dialogue,
  onSelect,
}: {
  dialogue: ExpertDialogueCard;
  onSelect: (dialogueId: string) => void;
}) => (
  <div className="alignmentChipRail" role="tablist" aria-label="Expert dialogue phases">
    {expertDialogues.map((item) => (
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

const FrictionCard = ({ friction }: { friction: FrictionWord }) => (
  <div className="frictionCard">
    <span>{friction.term}</span>
    <div className="modeStack">
      <ModeBlock label="Plain" text={friction.plain} />
      <ModeBlock label="AI側の含意" text={friction.aiSideMeaning} />
      <ModeBlock label="製造側のリスク" text={friction.manufacturingRisk} />
      <ModeBlock label="合意すべき定義" text={friction.alignmentDefinition} />
      <ModeBlock label="Expert Question" text={friction.expertQuestion} strong />
    </div>
  </div>
);

const ModeBlock = ({ label, text, strong = false }: { label: string; text: string; strong?: boolean }) => (
  <div className={`modeBlock ${strong ? "isStrong" : ""}`}>
    <span>{label}</span>
    <p>{text}</p>
  </div>
);

const DialogueCard = ({ dialogue }: { dialogue: ExpertDialogueCard }) => (
  <div className="dialogueCard">
    <span>{dialogue.phase}</span>
    <div className="alignmentSplit">
      <ResponseBox title="弱い質問" tone="warn" text={dialogue.weakQuestion} />
      <ResponseBox title="強い質問" tone="good" text={dialogue.strongQuestion} />
    </div>
    <div className="answerBlock compact">
      <h3>なぜ効くか</h3>
      <p>{dialogue.whyItWorks}</p>
    </div>
  </div>
);
