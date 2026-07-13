import { createContext, useContext } from "react";
import type { GlossaryTerm } from "../types/glossary";

type OpenSource = "chip" | "panel";

export type GlossaryContextValue = {
  /** PC でホバー可能か（タッチ端末は false）。 */
  canHover: boolean;
  /** 用語を開く（アンカー要素があればその近くにポップオーバー）。 */
  openTerm: (term: GlossaryTerm, anchor?: HTMLElement | null, source?: OpenSource) => void;
  /** ホバーで一言定義だけを出す（PC）。 */
  previewTerm: (term: GlossaryTerm, anchor: HTMLElement | null) => void;
  /** プレビューを閉じる（詳細表示中は無視）。 */
  closePreview: () => void;
  /** 現在プレビュー中の用語ID。 */
  activeTermId?: string;
};

export const GlossaryContext = createContext<GlossaryContextValue | null>(null);

export const useGlossary = () => useContext(GlossaryContext);
