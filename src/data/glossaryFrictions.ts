import type { FrictionWord } from "../types";

export const glossaryFrictions: FrictionWord[] = [
  {
    id: "accuracy",
    term: "精度",
    plain: "AIの予測や分類がどの程度当たるかを示す言葉。",
    aiSideMeaning: "正解率、F1、AUC、再現率など、モデル評価指標として捉えがち。",
    manufacturingRisk:
      "現場では見逃しが品質流出につながるのか、誤検知が点検負荷を増やすのかで重みが変わる。",
    alignmentDefinition:
      "単一の精度ではなく、見逃し・誤検知・確認工数・品質影響を分けた評価として合意する。",
    expertQuestion:
      "この用途では、見逃しと誤検知のどちらを重く見ますか。品質流出につながる誤りは評価指標上どう扱いますか？",
  },
  {
    id: "data-exists",
    term: "データがある",
    plain: "記録やテーブル、帳票、センサー値が存在する状態。",
    aiSideMeaning: "学習・検索・分析に使える入力データが存在すると受け取りがち。",
    manufacturingRisk:
      "時刻、ロット、工程、設備、検査結果が紐づいていないと、原因分析や判断支援には弱い。",
    alignmentDefinition:
      "存在するデータと、AI用途に使えるデータを分け、接続キー・粒度・欠損・更新頻度を確認する。",
    expertQuestion:
      "このデータはロット、工程、時刻、品質結果まで紐づいていますか。紐づいていない場合、先に整備すべきキーは何ですか？",
  },
  {
    id: "automation",
    term: "自動化",
    plain: "人の作業や判断の一部を機械やシステムで置き換えること。",
    aiSideMeaning: "候補提示から自動判定、自動実行まで一続きで語られやすい。",
    manufacturingRisk:
      "品質判定、出荷可否、ライン停止・再開、設備制御を混同すると責任境界が崩れる。",
    alignmentDefinition:
      "候補提示、判断支援、自動判定、自動実行を段階分けし、どこに人間承認を残すかを合意する。",
    expertQuestion:
      "ここでいう自動化は、候補提示・自動判定・自動実行のどこまでですか。安全・品質に関わる承認点はどこに残しますか？",
  },
  {
    id: "poc-success",
    term: "PoC成功",
    plain: "限定範囲の検証で効果や実現性が確認できた状態。",
    aiSideMeaning: "モデル精度やデモ動作が良好なら成功と捉えがち。",
    manufacturingRisk:
      "本番では権限、ログ、運用責任、データ更新、現場定着、監査対応が必要になる。",
    alignmentDefinition:
      "PoC成功は精度だけでなく、KPI改善、利用場面、責任分界、本番化条件の検証まで含める。",
    expertQuestion:
      "このPoCは精度検証だけですか。それとも本番運用、権限、ログ、責任者、KPIまで検証範囲に入れていますか？",
  },
  {
    id: "real-time",
    term: "リアルタイム",
    plain: "状況変化に近いタイミングで情報を取得・処理すること。",
    aiSideMeaning: "秒単位やミリ秒単位の処理速度として語られがち。",
    manufacturingRisk:
      "工程サイクル、安全余裕、確認者の動きによって、必要な時間粒度は大きく違う。",
    alignmentDefinition:
      "何秒以内なら業務判断に意味があるか、どの判断に使うのかを先に決める。",
    expertQuestion:
      "この用途で必要なリアルタイム性は何秒以内ですか。その時間は工程サイクルや安全確認に対して意味がありますか？",
  },
  {
    id: "root-cause",
    term: "真因",
    plain: "問題を生んだ根本的な原因。",
    aiSideMeaning: "相関の強い特徴量や推定原因を真因に近いものとして語りがち。",
    manufacturingRisk:
      "設備条件、材料、作業、設計変更、検査ばらつきなどを現場確認しないと誤った対策につながる。",
    alignmentDefinition:
      "AIは真因確定ではなく、原因候補と確認順序を整理する役割に置く。",
    expertQuestion:
      "モデルが出すのは真因の確定ですか、それとも原因候補ですか。現場で確認すべき順序はどう設計しますか？",
  },
];

export const glossaryFrictionById = Object.fromEntries(
  glossaryFrictions.map((item) => [item.id, item]),
) as Record<string, FrictionWord>;
