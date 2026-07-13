import type { ConceptDiagram } from "../types";

/**
 * 概念図を外部画像・ライブラリなしで描く軽量ビュー。
 * - データは「入力 → 仕組み → 出力（多段可・省略可）」に正規化済み。
 * - PC は横方向（入力群 → hub → 出力）、スマホは CSS で縦積みに切り替える。
 * - 矢印は装飾要素（aria-hidden）で、読み上げは各ノードのテキストのみ。
 */
export const ConceptDiagramView = ({ diagram }: { diagram: ConceptDiagram }) => {
  const hasOutputs = diagram.outputs.length > 0;

  return (
    <figure className="conceptDiagram" aria-label="概念図">
      <div className="conceptDiagramFlow">
        <div className="conceptDiagramInputs">
          {diagram.inputs.map((node) => (
            <span className="conceptNode inputNode" key={node}>
              {node}
            </span>
          ))}
        </div>

        <span className="conceptArrow" aria-hidden="true">
          →
        </span>

        <span className="conceptNode hubNode">{diagram.hub}</span>

        {hasOutputs
          ? diagram.outputs.map((node) => (
              <span className="conceptOutputStep" key={node}>
                <span className="conceptArrow" aria-hidden="true">
                  →
                </span>
                <span className="conceptNode outputNode">{node}</span>
              </span>
            ))
          : null}
      </div>

      {diagram.note ? <figcaption className="conceptDiagramNote">{diagram.note}</figcaption> : null}
    </figure>
  );
};
