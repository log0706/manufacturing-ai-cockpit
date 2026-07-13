import { useRef } from "react";
import type { GlossaryTerm as GlossaryTermType } from "../types/glossary";
import { useGlossary } from "./glossaryContext";

export const GlossaryTerm = ({
  term,
  surface,
}: {
  term: GlossaryTermType;
  surface: string;
}) => {
  const glossary = useGlossary();
  const ref = useRef<HTMLButtonElement>(null);

  if (!glossary) {
    return <>{surface}</>;
  }

  const isActive = glossary.activeTermId === term.id;
  const open = () => glossary.openTerm(term, ref.current, "chip");

  return (
    <button
      ref={ref}
      type="button"
      className={`glossaryChip ${isActive ? "isActive" : ""}`}
      aria-label={`${term.term} の説明を開く`}
      aria-haspopup="dialog"
      onMouseEnter={() => glossary.previewTerm(term, ref.current)}
      onMouseLeave={() => glossary.closePreview()}
      onFocus={() => glossary.previewTerm(term, ref.current)}
      onBlur={() => glossary.closePreview()}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
          event.preventDefault();
          open();
          return;
        }
        if (event.key === "Escape") {
          glossary.closePreview();
        }
      }}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        open();
      }}
    >
      {surface}
    </button>
  );
};
