import type { ExpertDialogueCard } from "../types";

export const expertDialogues: ExpertDialogueCard[] = [
  {
    id: "purpose",
    phase: "課題設定",
    weakQuestion: "このAIで何ができますか？",
    strongQuestion: "このAIは、誰の・どの業務判断を・どのKPIで改善する想定ですか？",
    whyItWorks: "技術の可能性を、診断士が扱える経営課題・業務・KPIに戻せる。",
  },
  {
    id: "data",
    phase: "データ確認",
    weakQuestion: "このデータでAIできますか？",
    strongQuestion:
      "このデータは時刻・ロット・工程・設備・品質結果まで紐づいていますか。欠損や記録粒度のばらつきはどこにありますか？",
    whyItWorks: "モデル以前のデータ接続条件を確認でき、PoCの過信を防げる。",
  },
  {
    id: "metric",
    phase: "評価設計",
    weakQuestion: "精度は何％ですか？",
    strongQuestion:
      "見逃しと誤検知のどちらが業務上重いですか。品質流出や点検負荷は評価指標にどう反映しますか？",
    whyItWorks: "AI指標を現場の損失・品質リスク・運用負荷に変換できる。",
  },
  {
    id: "operation",
    phase: "運用設計",
    weakQuestion: "本番でも使えますか？",
    strongQuestion:
      "誰が、いつ、どの画面でAI出力を見て、どの既存手順の中で確認・修正・記録しますか？",
    whyItWorks: "精度検証から現場定着、責任、改善サイクルの話へ進められる。",
  },
  {
    id: "authority",
    phase: "責任境界",
    weakQuestion: "AIで自動化できますか？",
    strongQuestion:
      "AIが出すもの、AIが決めないもの、最終判断者、監査時に残す記録をそれぞれ分けられますか？",
    whyItWorks: "高度な技術提案でも、安全・品質・出荷判断を人とプロセスに戻せる。",
  },
];
