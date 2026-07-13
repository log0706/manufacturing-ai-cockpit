import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { GlossaryTerm } from "../types/glossary";
import { glossaryCategoryLabels } from "../data/glossary";

type Position = { top: number; left: number; placement: "top" | "bottom" };

const GAP = 10;
const MARGIN = 12;

/**
 * PC 向けポップオーバー。
 * - 既定は一言定義だけを短く表示する。
 * - expanded=true で詳細（現場での意味・AI導入との関係・KPI・注意点・関連語）まで表示。
 * - 「使う場面」は問題巻末の QuestionGlossaryPanel に寄せ、ホバーを重くしない。
 * - Esc で閉じる。画面外にはみ出さないよう位置を補正。
 */
export const GlossaryPopover = ({
  term,
  anchor,
  expanded = false,
  onRequestClose,
  onOpenDetail,
  onKeepOpen,
}: {
  term: GlossaryTerm;
  anchor: HTMLElement | null;
  expanded?: boolean;
  onRequestClose: () => void;
  onOpenDetail?: () => void;
  onKeepOpen?: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    if (!anchor) {
      setPosition({
        top: Math.max(MARGIN, viewportH / 2 - rect.height / 2),
        left: Math.max(MARGIN, viewportW / 2 - rect.width / 2),
        placement: "bottom",
      });
      return;
    }

    const anchorRect = anchor.getBoundingClientRect();
    let left = anchorRect.left + anchorRect.width / 2 - rect.width / 2;
    left = Math.min(Math.max(MARGIN, left), viewportW - rect.width - MARGIN);

    const spaceBelow = viewportH - anchorRect.bottom;
    const placeBelow = spaceBelow >= rect.height + GAP + MARGIN || spaceBelow >= anchorRect.top;
    const top = placeBelow
      ? Math.min(anchorRect.bottom + GAP, viewportH - rect.height - MARGIN)
      : Math.max(MARGIN, anchorRect.top - rect.height - GAP);

    setPosition({ top, left, placement: placeBelow ? "bottom" : "top" });
  }, [anchor, term, expanded]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onRequestClose();
      }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [onRequestClose]);

  return (
    <div
      ref={ref}
      className={`glossaryPopover ${expanded ? "isExpanded" : ""}`}
      role="dialog"
      aria-label={`${term.term} の説明`}
      style={{
        position: "fixed",
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        visibility: position ? "visible" : "hidden",
      }}
      onMouseEnter={onKeepOpen}
      onMouseLeave={onRequestClose}
    >
      <div className="glossaryPopoverHead">
        <span className="glossaryPopoverTerm">{term.term}</span>
        <span className="glossaryPopoverCategory">{glossaryCategoryLabels[term.category]}</span>
      </div>
      <p className="glossaryPopoverShort">{term.shortDefinition}</p>

      {expanded ? (
        <div className="glossaryPopoverDetail">
          <GlossaryDetailBody term={term} />
          <button type="button" className="glossaryPopoverClose" onClick={onRequestClose}>
            閉じる（Esc）
          </button>
        </div>
      ) : (
        <>
          <dl className="glossaryPopoverMini">
            <div>
              <dt>AI導入との関係</dt>
              <dd>{term.aiContext}</dd>
            </div>
          </dl>
          {onOpenDetail ? (
            <button type="button" className="glossaryPopoverMore" onClick={onOpenDetail}>
              詳しく見る
            </button>
          ) : null}
        </>
      )}
    </div>
  );
};

export const GlossaryDetailBody = ({ term }: { term: GlossaryTerm }) => (
  <div className="glossaryDetailBody">
    <dl>
      <div>
        <dt>一言でいうと</dt>
        <dd>{term.shortDefinition}</dd>
      </div>
      <div>
        <dt>かみ砕くと</dt>
        <dd>{term.plainExplanation}</dd>
      </div>
      <div>
        <dt>現場での意味</dt>
        <dd>{term.manufacturingContext}</dd>
      </div>
      <div>
        <dt>AI導入との関係</dt>
        <dd>{term.aiContext}</dd>
      </div>
      {term.relatedKpis?.length ? (
        <div>
          <dt>関連KPI</dt>
          <dd>{term.relatedKpis.join(" / ")}</dd>
        </div>
      ) : null}
      {term.relatedDepartments?.length ? (
        <div>
          <dt>関わる部門</dt>
          <dd>{term.relatedDepartments.join(" / ")}</dd>
        </div>
      ) : null}
      {term.caution ? (
        <div className="glossaryCaution">
          <dt>言いすぎ注意</dt>
          <dd>{term.caution}</dd>
        </div>
      ) : null}
      {term.example ? (
        <div>
          <dt>具体例</dt>
          <dd>{term.example}</dd>
        </div>
      ) : null}
    </dl>
    {term.relatedTerms?.length ? (
      <p className="glossaryRelated">
        <span>関連用語</span>
        {term.relatedTerms.join("、")}
      </p>
    ) : null}
  </div>
);
