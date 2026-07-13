import type { DecisionAuthority } from "../types";

export const decisionAuthority: DecisionAuthority[] = [
  {
    id: "safety",
    area: "安全判断",
    aiRole: "過去事例、危険源、確認観点、類似ヒヤリハットを提示する。",
    humanRole: "作業可否、退避、再開可否は責任者と既存安全プロセスが判断する。",
    evidenceToLeave: "参照した手順、確認者、判断時刻、是正・停止指示の記録。",
  },
  {
    id: "quality",
    area: "品質・出荷判断",
    aiRole: "検査結果、過去不良、是正処置、類似ロットを整理する。",
    humanRole: "品質保証判断、出荷可否、顧客説明は品質保証プロセスに残す。",
    evidenceToLeave: "検査値、判定基準、承認者、版、出荷判断の根拠。",
  },
  {
    id: "line-stop",
    area: "ライン停止・再開",
    aiRole: "設備状態、異常傾向、影響範囲、過去復旧例を提示する。",
    humanRole: "停止・再開の実行判断、現場指揮、安全確認は責任者が行う。",
    evidenceToLeave: "アラーム、復旧手順、確認項目、責任者判断、再開条件。",
  },
  {
    id: "equipment-control",
    area: "設備制御",
    aiRole: "読み取り、監視、異常検知、条件候補の提示から始める。",
    humanRole: "PLC/DCS等への書き込み、制御変更、緊急時対応は承認設計を必須にする。",
    evidenceToLeave: "権限、ログ、変更承認、ロールバック手順、緊急停止時対応。",
  },
  {
    id: "production-plan",
    area: "生産計画変更",
    aiRole: "材料遅延、能力、在庫、納期影響、代替案を整理する。",
    humanRole: "計画変更、顧客調整、現場負荷調整は生産管理・経営判断に残す。",
    evidenceToLeave: "代替案、制約条件、影響KPI、承認者、連絡先・調整履歴。",
  },
];
