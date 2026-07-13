import { Fragment, useMemo, type ElementType } from "react";
import { segmentText, type MatchOptions } from "../utils/glossaryMatcher";
import { GlossaryTerm } from "./GlossaryTerm";

/**
 * テキストを受け取り、辞書と照合して用語部分だけ GlossaryTerm へ置換する。
 * - HTML 文字列は挿入せず、React 要素として描画するため XSS を避けられる。
 * - usedCounts を渡すと、カード全体で同一用語のチップ化数を共有できる。
 */
export const RichTextWithGlossary = ({
  text,
  as: Tag = "span",
  className,
  usedCounts,
  maxPerTerm,
  maxChipsPerBlock,
}: {
  text?: string | null;
  as?: ElementType;
  className?: string;
  usedCounts?: Map<string, number>;
  maxPerTerm?: number;
  maxChipsPerBlock?: number;
}) => {
  const segments = useMemo(() => {
    if (!text) return [];
    const options: MatchOptions = { usedCounts, maxPerTerm, maxChipsPerBlock };
    return segmentText(text, options);
    // usedCounts は Map（毎回新規参照になりうる）ため依存に含めない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, maxPerTerm, maxChipsPerBlock]);

  if (!text) return null;

  return (
    <Tag className={className}>
      {segments.map((segment, index) =>
        segment.kind === "term" ? (
          <GlossaryTerm key={index} term={segment.term} surface={segment.value} />
        ) : (
          <Fragment key={index}>{segment.value}</Fragment>
        ),
      )}
    </Tag>
  );
};
