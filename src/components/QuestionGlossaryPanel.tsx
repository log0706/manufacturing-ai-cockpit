import { useMemo, useState } from "react";
import type { GlossaryTerm } from "../types/glossary";
import { collectTerms } from "../utils/glossaryMatcher";
import { useGlossary } from "./glossaryContext";

/**
 * 「用語を確認」ボタンから開く、この問題に含まれる重要用語一覧。
 * - 用語を開いても問題は未回答のまま続けられる（回答フローを止めない）。
 * - 問題の巻末では usageSituation（どんな場面で使うか）も補足表示する。
 */
export const QuestionGlossaryPanel = ({
  texts,
  defaultOpen = false,
  showUsage = false,
  title = "この問題の重要用語",
  buttonLabel = "用語を確認",
}: {
  texts: Array<string | undefined | null>;
  defaultOpen?: boolean;
  /** 巻末まとめとして「どんな場面で使うか」も表示するか。 */
  showUsage?: boolean;
  title?: string;
  buttonLabel?: string;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const terms = useMemo(() => collectTerms(texts), [texts]);

  if (!terms.length) return null;

  return (
    <section className="questionGlossaryPanel" aria-label={title}>
      <button
        type="button"
        className="questionGlossaryToggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{buttonLabel}</span>
        <small>{terms.length}語</small>
        <em aria-hidden="true">{open ? "−" : "+"}</em>
      </button>

      {open ? (
        <div className="questionGlossaryBody">
          <p className="questionGlossaryHint">
            分からない用語はここで確認できます。開いても問題は未回答のまま続けられます。
          </p>
          <ul className="questionGlossaryList">
            {terms.map((term) => (
              <GlossaryListItem key={term.id} term={term} showUsage={showUsage} />
            ))}
          </ul>
          {showUsage ? (
            <p className="questionGlossaryFootnote">
              ※「使う場面」は、用語の意味そのものではなく、どんな状況でその言葉が出てくるかの補足です。
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

const GlossaryListItem = ({ term, showUsage }: { term: GlossaryTerm; showUsage: boolean }) => {
  const glossary = useGlossary();
  return (
    <li className="questionGlossaryItem">
      <button
        type="button"
        className="questionGlossaryTerm"
        aria-haspopup="dialog"
        onClick={(event) => glossary?.openTerm(term, event.currentTarget, "panel")}
      >
        <strong>{term.term}</strong>
        <span>{term.shortDefinition}</span>
      </button>
      {showUsage && term.usageSituation ? (
        <p className="questionGlossaryUsage">
          <span aria-hidden="true">🧭</span>
          <span>
            <strong>使う場面：</strong>
            {term.usageSituation}
          </span>
        </p>
      ) : null}
    </li>
  );
};
