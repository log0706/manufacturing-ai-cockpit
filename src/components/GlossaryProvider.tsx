import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { GlossaryTerm } from "../types/glossary";
import { GlossaryPopover } from "./GlossaryPopover";
import { GlossaryBottomSheet } from "./GlossaryBottomSheet";
import { GlossaryContext, type GlossaryContextValue } from "./glossaryContext";

const detectHover = () => {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
};

export const GlossaryProvider = ({
  children,
  onOpenTerm,
}: {
  children: ReactNode;
  /** 用語説明が開かれたときに呼ばれる（学習履歴の記録に使う）。 */
  onOpenTerm?: (termId: string) => void;
}) => {
  const [canHover, setCanHover] = useState(detectHover);
  const [preview, setPreview] = useState<{ term: GlossaryTerm; anchor: HTMLElement | null } | null>(
    null,
  );
  const [detail, setDetail] = useState<{ term: GlossaryTerm; anchor: HTMLElement | null } | null>(
    null,
  );
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const handleChange = () => setCanHover(query.matches);
    query.addEventListener?.("change", handleChange);
    return () => query.removeEventListener?.("change", handleChange);
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const previewTerm = useCallback(
    (term: GlossaryTerm, anchor: HTMLElement | null) => {
      if (!canHover) return;
      clearCloseTimer();
      setPreview({ term, anchor });
    },
    [canHover, clearCloseTimer],
  );

  const closePreview = useCallback(() => {
    clearCloseTimer();
    // ホバーが用語→ポップオーバーへ移る猶予を持たせて、消えにくくする。
    closeTimer.current = window.setTimeout(() => setPreview(null), 140);
  }, [clearCloseTimer]);

  const openTerm = useCallback(
    (term: GlossaryTerm, anchor?: HTMLElement | null) => {
      clearCloseTimer();
      setPreview(null);
      setDetail({ term, anchor: anchor ?? null });
      onOpenTerm?.(term.id);
    },
    [clearCloseTimer, onOpenTerm],
  );

  const closeDetail = useCallback(() => setDetail(null), []);

  const value = useMemo<GlossaryContextValue>(
    () => ({
      canHover,
      openTerm,
      previewTerm,
      closePreview,
      activeTermId: preview?.term.id ?? detail?.term.id,
    }),
    [canHover, openTerm, previewTerm, closePreview, preview?.term.id, detail?.term.id],
  );

  return (
    <GlossaryContext.Provider value={value}>
      {children}
      {canHover && preview && !detail ? (
        <GlossaryPopover
          term={preview.term}
          anchor={preview.anchor}
          onKeepOpen={clearCloseTimer}
          onRequestClose={() => setPreview(null)}
          onOpenDetail={() => openTerm(preview.term, preview.anchor)}
        />
      ) : null}
      {detail && canHover ? (
        <GlossaryPopover
          term={detail.term}
          anchor={detail.anchor}
          expanded
          onKeepOpen={clearCloseTimer}
          onRequestClose={closeDetail}
        />
      ) : null}
      {detail && !canHover ? (
        <GlossaryBottomSheet term={detail.term} onClose={closeDetail} />
      ) : null}
    </GlossaryContext.Provider>
  );
};
