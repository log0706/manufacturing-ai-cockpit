import type { Scenario } from "../types";

export const scenarios: Scenario[] = [
  {
    id: "sc-plant-manager",
    stakeholder: "工場長",
    concern: "現場が混乱しないか、安全・品質に影響しないか。",
    reason: "工場全体の安全、品質、納期、原価に責任を持つため。",
    goodResponse:
      "まずは制御や出荷判断ではなく、過去トラブル検索や異常時の情報整理から始めます。安全・品質の最終判断は既存の責任者が行う設計です。",
    poorResponse: "AIで全部効率化できます。",
    aiTalentTrap: "全体最適・自動化を先に語り、工場長が背負う安全・品質・納期責任を後回しにする。",
    agreedGoal:
      "制御や出荷判断ではなく、異常時の情報整理・初動短縮から始め、責任者の判断を支援する範囲で合意する。",
    nextQuestions: [
      "最初に短縮したい判断時間は、停止時の初動・品質確認・納期影響のどれですか？",
      "AI出力を見て最終判断する責任者は誰ですか？",
      "安全・品質への影響がある場合、どの既存プロセスに戻しますか？",
    ],
    relatedConcepts: ["plant-manager", "safety", "quality", "knowledge-search"],
  },
  {
    id: "sc-qa",
    stakeholder: "品質保証",
    concern: "AIの根拠が不明だと監査対応できない。",
    reason: "品質保証は説明責任と証跡を担うため。",
    goodResponse:
      "AIは出荷可否を決めるのではなく、検査結果、過去不良、是正処置を整理します。最終判断と記録は従来の品質保証プロセスに残します。",
    poorResponse: "AIの判断を信じれば大丈夫です。",
    aiTalentTrap: "精度や生成品質を強調し、監査証跡・承認・版管理を軽く扱う。",
    agreedGoal:
      "AIは品質保証判断を代替せず、検査結果・過去不良・是正処置を探しやすくする証跡整理役に置く。",
    nextQuestions: [
      "監査時に残すべき参照元・版・承認者は何ですか？",
      "出荷可否に関わる情報は、AI出力後に誰が確認しますか？",
      "誤った候補提示が出た場合、修正記録をどこに残しますか？",
    ],
    relatedConcepts: ["quality-assurance", "qms", "audit"],
  },
  {
    id: "sc-production-engineering",
    stakeholder: "生産技術",
    concern: "工程条件や設備制約を理解しているか。",
    reason: "工程設計と量産安定化に責任があるため。",
    goodResponse:
      "工程条件、設備能力、標準作業を確認したうえで、AIは改善候補や異常要因の整理に使います。工程変更の判断は既存プロセスに沿います。",
    poorResponse: "データから最適条件を自動で決めます。",
    aiTalentTrap: "データ最適化を先に語り、工程条件・設備制約・変更承認を十分に聞かない。",
    agreedGoal:
      "AIは工程条件の自動決定ではなく、異常要因・改善候補・検証観点を整理する役割に置く。",
    nextQuestions: [
      "工程条件変更に必要な承認プロセスは何ですか？",
      "モデルが見ていない設備制約や標準作業はありますか？",
      "候補を検証する時のKPIは歩留まり・OEE・工程能力のどれですか？",
    ],
    relatedConcepts: ["production-engineering", "mes", "quality-analysis"],
  },
  {
    id: "sc-maintenance",
    stakeholder: "保全",
    concern: "誤警報で点検負荷が増えないか。",
    reason: "保全リソースは限られ、停止判断も重いため。",
    goodResponse:
      "予知保全は警報を増やすことが目的ではなく、停止リスクの高い設備を優先づける支援です。誤警報の記録と閾値見直しも運用に入れます。",
    poorResponse: "故障はAIで防げます。",
    aiTalentTrap: "故障予測の性能だけを語り、誤警報による点検負荷と停止判断の重さを見落とす。",
    agreedGoal:
      "AIは故障を防ぐ保証ではなく、点検優先度・兆候・過去復旧例を整理する保全支援に置く。",
    nextQuestions: [
      "見逃しと誤警報では、どちらが現場負荷・停止損失として重いですか？",
      "警報後の一次確認者と点検判断者は誰ですか？",
      "閾値の見直しや誤警報記録はどの運用で回しますか？",
    ],
    relatedConcepts: ["maintenance", "predictive-maintenance", "cmms"],
  },
  {
    id: "sc-it-dx",
    stakeholder: "情報システム",
    concern: "セキュリティ、権限、既存システム影響が不安。",
    reason: "本番運用と保守責任があるため。",
    goodResponse:
      "接続方式、データ範囲、権限、ログ、保守体制を初期に整理します。OT接続はまず読み取り中心で検討します。",
    poorResponse: "PoCなのでセキュリティは後で考えます。",
    aiTalentTrap: "PoCの速さを優先し、権限・ログ・既存システム影響・OT接続条件を後工程に送る。",
    agreedGoal:
      "PoC段階から接続方式・データ範囲・権限・ログ・保守責任を最小限定義する。",
    nextQuestions: [
      "PoCでアクセスしてよいデータ範囲と禁止範囲は何ですか？",
      "本番化時に必要な権限・ログ・保守体制は何ですか？",
      "OT接続は読み取りのみか、書き込み可能性があるかを分けられますか？",
    ],
    relatedConcepts: ["it-dx", "ot-security", "production-rollout"],
  },
  {
    id: "sc-line-leader",
    stakeholder: "現場班長",
    concern: "作業が増える、現場に合わない。",
    reason: "班長は日々の作業運営と異常時の初動を担うため。",
    goodResponse:
      "入力を増やすのではなく、探す時間や異常時の確認時間を減らす設計にします。既存の引継ぎや手順に合わせて試します。",
    poorResponse: "現場には慣れてもらいます。",
    aiTalentTrap: "利用率向上を現場努力に寄せ、日々の作業導線や入力負担を確認しない。",
    agreedGoal:
      "新しい入力負荷を増やすのではなく、探す時間・確認時間・引継ぎ負荷を減らす導線で試す。",
    nextQuestions: [
      "現場が今いちばん時間を使って探している情報は何ですか？",
      "既存の引継ぎ・日報・異常時手順のどこに差し込むのが自然ですか？",
      "使われなくなる原因を、入力負荷・信用・画面導線のどれで見ますか？",
    ],
    relatedConcepts: ["manufacturing", "knowledge-search"],
  },
  {
    id: "sc-operator",
    stakeholder: "作業者",
    concern: "監視されるのではないか。",
    reason: "AIが評価ツールに見えると使われにくくなるため。",
    goodResponse:
      "目的は個人評価ではなく、手順確認や困った時の参照をしやすくすることです。作業者が迷う時間を減らす支援として使います。",
    poorResponse: "AIで作業者の良し悪しを見ます。",
    aiTalentTrap: "行動データの分析可能性を語り、監視される不安や公平性を軽視する。",
    agreedGoal:
      "個人評価ではなく、手順確認・教育・困った時の参照支援として位置づける。",
    nextQuestions: [
      "作業者に表示する目的説明は、評価ではなく支援として伝わりますか？",
      "個人別データを扱う場合、閲覧権限と利用目的は明確ですか？",
      "作業者が安心して使うために、何を記録しないと明示しますか？",
    ],
    relatedConcepts: ["manufacturing", "safety", "knowledge-search"],
  },
  {
    id: "sc-executive",
    stakeholder: "経営層",
    concern: "投資対効果と横展開性があるか。",
    reason: "全社視点で資本配分とリスクを見ているため。",
    goodResponse:
      "まず限定領域でKPI改善を確認し、共通化できるデータ・手順・運用を整理します。そのうえで横展開可否を判断します。",
    poorResponse: "将来性があるので大きく投資すべきです。",
    aiTalentTrap: "技術的将来性や先進性を語り、投資判断に必要なKPI・横展開条件・リスクを曖昧にする。",
    agreedGoal:
      "限定領域でKPI改善と運用可能性を確認し、共通化できる部分と個別検証が必要な部分を分ける。",
    nextQuestions: [
      "投資判断で見るKPIは時間削減・不良率・停止時間・教育期間のどれですか？",
      "横展開時に共通化できるデータ・手順・教育素材は何ですか？",
      "次の投資判断までに、どのリスクを潰せばよいですか？",
    ],
    relatedConcepts: ["approval", "scale-out", "poc"],
  },
];

export const scenariosById = Object.fromEntries(
  scenarios.map((item) => [item.id, item]),
) as Record<string, Scenario>;
