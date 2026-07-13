import type { ExplainDrill } from "../types";

export const explainDrills: ExplainDrill[] = [
  {
    id: "ex-erp-mes",
    title: "ERPとMESの違い",
    thirtySecondAnswer:
      "ERPは会社全体の受発注、会計、在庫、原価を管理する基幹側の仕組みで、MESは工場内の作業指示、製造実績、工程、ロットを管理する現場実行側の仕組みです。",
    threeMinuteAnswer:
      "ERPは経営・事業・調達・在庫・会計に近いシステムです。一方、MESは工場で何を、どの工程で、どのロットとして、どの設備で作ったかを扱います。AI導入では、ERPだけを見ると現場の秒単位・工程単位の変化が見えず、MESだけを見ると受注や在庫、原価との関係が見えにくいです。納期遅延や品質問題を説明するには、ERPの計画・在庫情報とMESの実績・ロット情報をつなぐことが重要です。ただし、品目IDや時刻、ロットがつながっていない場合が多く、そこがAI導入前の確認ポイントになります。",
    keywords: ["経営・計画", "工場実行", "粒度差", "ロット", "在庫"],
    caution: "ERPだけで現場原因まで見えると言い切らない。",
    relatedConcepts: ["erp", "mes"],
  },
  {
    id: "ex-mes-mom",
    title: "MESとMOMの違い",
    thirtySecondAnswer:
      "MESは製造実行を管理する仕組みで、MOMは生産、品質、保全、在庫など工場運営全体を含む広い考え方です。",
    threeMinuteAnswer:
      "MESは作業指示、実績収集、工程進捗、ロット管理など、製造実行の中心にあります。MOMはそれより広く、生産だけでなく品質、保全、在庫、パフォーマンス管理まで含めて工場運営を捉える考え方です。AI導入では、MESデータだけでなく、QMSの品質情報、CMMSの保全履歴、SCADAの設備状態までつなげて、工場全体の判断支援を行う方向がMOM的です。ただし、MOMの範囲は企業やシステム構成で違うため、会話では何をMOMと呼んでいるかを確認します。",
    keywords: ["製造実行", "工場運営", "品質", "保全", "範囲差"],
    caution: "MOMを固定定義として押し切らない。",
    relatedConcepts: ["mes", "mom", "qms", "cmms", "scada"],
  },
  {
    id: "ex-plm-qms",
    title: "PLMとQMSの関係",
    thirtySecondAnswer:
      "PLMは設計・BOM・変更管理、QMSは品質・監査・是正処置を扱います。AI導入では、設計変更が品質問題へどう影響したかを追うために両方が重要です。",
    threeMinuteAnswer:
      "PLMは製品の設計情報、BOM、仕様変更、設計変更を管理します。QMSは不良、監査、是正処置、品質記録を管理します。製造業では、品質問題が現場作業だけでなく、設計変更、材料変更、工程変更に起因することがあります。品質解析を行うなら、QMSの不良情報だけでなく、PLMの設計変更履歴やBOM変更と接続して見る必要があります。ただし、AIが品質判断を確定するのではなく、設計・製造・品質が確認するための材料を整理する位置づけにすることが重要です。",
    keywords: ["設計変更", "BOM", "不良", "是正処置", "証跡"],
    caution: "AIが品質判断を確定すると言わない。",
    relatedConcepts: ["plm", "qms", "quality-analysis"],
  },
  {
    id: "ex-it-ot",
    title: "ITとOTの違い",
    thirtySecondAnswer:
      "ITは業務情報を扱う領域で、OTは設備や制御を扱う領域です。OTでは安全と稼働継続が特に重要です。",
    threeMinuteAnswer:
      "ITはERP、帳票、データベース、アカウント、業務システムなどを扱います。OTはPLC、SCADA、DCS、設備、ラインなど、実際に工場を動かす技術領域です。AI導入では、ITデータの分析は比較的進めやすい一方、OTに接続する場合は設備停止、安全、品質への影響を慎重に見る必要があります。特にPLCやDCSへの書き込み、自動操作はリスクが高いため、最初は読み取り、監視、異常検知、判断材料の提示から始めるのが現実的です。権限、ログ、接続方式、人間確認を明確にします。",
    keywords: ["業務情報", "設備制御", "可用性", "読み取り", "権限"],
    caution: "OTを普通の業務システム接続の延長で軽く扱わない。",
    relatedConcepts: ["it", "ot", "plc", "scada", "ot-security"],
  },
  {
    id: "ex-pe-pc",
    title: "生産技術と生産管理の違い",
    thirtySecondAnswer:
      "生産技術はどう作るか、生産管理はいつ何をどれだけ作るかを担います。",
    threeMinuteAnswer:
      "生産技術は工程設計、設備導入、加工条件、量産立上げ、工程改善などを担当します。製品を安定して作れる工程を作る役割です。生産管理は需要、在庫、納期、設備負荷、人員を見ながら生産計画を立て、変更を調整します。AI導入では、生産技術には工程条件や設備制約を踏まえた異常解析・改善支援として説明し、生産管理には材料遅延や設備停止時の計画変更影響の整理として説明すると伝わりやすいです。どちらも関係しますが、見ているKPIと責任が違います。",
    keywords: ["どう作るか", "いつ何を作るか", "工程条件", "納期", "在庫"],
    caution: "両部門を同じ関心として扱わない。",
    relatedConcepts: ["production-engineering", "production-control", "plan-change-support"],
  },
  {
    id: "ex-qa-qc",
    title: "品質保証と品質管理の違い",
    thirtySecondAnswer:
      "品質保証は顧客保証・監査・出荷品質の責任、品質管理は工程内の検査・測定・解析を担います。",
    threeMinuteAnswer:
      "品質管理は工程内で不良率、ppm、直行率、管理図などを見ながら品質を測定・解析します。品質保証は顧客に対する品質保証、監査、出荷可否、再発防止、品質システムの責任を持ちます。AI導入では、品質管理には不良原因分析や異常検知、品質保証には証跡整理や再発防止支援として説明します。ただし、出荷判定や品質保証上の最終判断をAI単独にする表現は避け、人間の確認と承認を前提にします。",
    keywords: ["顧客保証", "監査", "工程内品質", "ppm", "承認"],
    caution: "品質保証の責任をAIに移す表現を避ける。",
    relatedConcepts: ["quality-assurance", "quality-control", "qms"],
  },
  {
    id: "ex-poc-prod",
    title: "PoCが本番化しない理由",
    thirtySecondAnswer:
      "精度が高くても、KPI、運用、責任、セキュリティ、既存システム連携が整っていないと本番化しにくいです。",
    threeMinuteAnswer:
      "PoCでは限定データで良い結果が出ることがあります。しかし本番では、誰が使うのか、いつ使うのか、既存手順と衝突しないか、データ更新はどうするか、誤答時に誰が確認するか、ログをどう残すか、IT / DXや品質保証が承認できるかが問われます。また、PoCでは手作業でデータ投入していても、本番ではERP、MES、QMS、SCADAなどとの連携が必要になる場合があります。PoCは精度検証だけでなく、業務適合、KPI、運用、責任分界の検証として設計します。",
    keywords: ["KPI", "利用場面", "運用責任", "ログ", "本番条件"],
    caution: "PoC成功をそのまま本番成功と言わない。",
    relatedConcepts: ["poc", "production-rollout", "approval"],
  },
  {
    id: "ex-ot-security",
    title: "OTセキュリティが重要な理由",
    thirtySecondAnswer:
      "OTは設備やラインの制御に関わるため、問題が起きると情報漏えいだけでなく、設備停止、安全・品質影響につながるからです。",
    threeMinuteAnswer:
      "ITセキュリティは情報保護が中心ですが、OTセキュリティは設備を安全に動かし続けることが中心です。PLC、SCADA、DCSなどにAIを接続する場合、誤った接続や操作が設備停止、ライン停止、品質不良、安全リスクにつながる可能性があります。そのためAIは、まず設備データの読み取り、状態監視、異常傾向の提示から始めるのが現実的です。書き込みや自動操作を行う場合は、接続方式、権限、ログ、人間承認、緊急時対応の設計が必要です。",
    keywords: ["設備停止", "安全", "品質", "読み取り", "ログ"],
    caution: "制御系を軽く扱う説明を避ける。",
    relatedConcepts: ["ot-security", "ot", "plc", "scada"],
  },
  {
    id: "ex-scale",
    title: "複数工場への横展開が難しい理由",
    thirtySecondAnswer:
      "工場ごとに設備、帳票、作業標準、データ項目、現場用語が違うため、単純にコピーできないからです。",
    threeMinuteAnswer:
      "1つの工場でAIがうまくいっても、他工場では工程名、設備構成、標準作業書、帳票、データ粒度、ロット管理が違うことがあります。海外拠点では言語や現地運用も変わります。そのため横展開では、共通化できるナレッジ検索や教育支援と、個別検証が必要な設備制御・工程最適化を分ける必要があります。最初から全社一律にせず、共通部分、差分、KPI、運用体制を整理して段階的に進めることが重要です。",
    keywords: ["工場差", "帳票差", "現地運用", "共通部分", "個別検証"],
    caution: "そのまま横展開できると言わない。",
    relatedConcepts: ["scale-out", "digital-thread", "knowledge-search"],
  },
  {
    id: "ex-first-area",
    title: "最初に狙うべきAI領域",
    thirtySecondAnswer:
      "最初は、現場ナレッジ検索、過去トラブル検索、作業標準書の対話化、保全履歴検索など、人間の判断を支援する領域が現実的です。",
    threeMinuteAnswer:
      "初期導入では、安全・品質・設備制御に直接関わる自動化よりも、現場の探す時間を減らす、異常時の初動を早める、若手教育を支援する、過去トラブルを見つけやすくする用途が入りやすいです。これらは既存手順と衝突しにくく、KPIも検索時間、自己解決率、問い合わせ削減、初動時間、MTTRなどで見やすいです。成功後に、品質解析、予知保全、生産計画変更支援へ広げるのが現実的です。大切なのは、AIを現場判断の材料整理役として置くことです。",
    keywords: ["ナレッジ検索", "過去トラブル", "教育支援", "MTTR", "材料整理"],
    caution: "最初から安全判断や出荷判断へ寄せない。",
    relatedConcepts: ["knowledge-search", "predictive-maintenance", "plan-change-support"],
  },
];

export const explainDrillsById = Object.fromEntries(
  explainDrills.map((drill) => [drill.id, drill]),
) as Record<string, ExplainDrill>;
