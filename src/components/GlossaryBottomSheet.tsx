import { useEffect, useRef } from "react";
import type { GlossaryTerm } from "../types/glossary";
import { glossaryCategoryLabels } from "../data/glossary";
import { GlossaryDetailBody } from "./GlossaryPopover";

/**
 * スマホ向けボトムシート。
 * - 画面下から 40〜60% 程度で出る。
 * - 背景タップ・大きな閉じるボタン・Esc で閉じる。
 * - 開いても回答メモ状態は保持される（別コンポーネントの state のため）。
 */
export const GlossaryBottomSheet = ({
  term,
  onClose,
}: {
  term: GlossaryTerm;
  onClose: () => void;
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [onClose]);

  return (
    <div className="glossarySheetBackdrop" onClick={onClose}>
      <div
        className="glossarySheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${term.term} の説明`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="glossarySheetGrip" aria-hidden="true" />
        <div className="glossarySheetHead">
          <div>
            <span className="glossarySheetCategory">{glossaryCategoryLabels[term.category]}</span>
            <h2 className="glossarySheetTerm">{term.term}</h2>
          </div>
        </div>
        <div className="glossarySheetScroll">
          <GlossaryDetailBody term={term} />
        </div>
        <button ref={closeRef} type="button" className="glossarySheetClose" onClick={onClose}>
          閉じて問題に戻る
        </button>
      </div>
    </div>
  );
};
