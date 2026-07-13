import type { BeginnerChoiceCategory, BeginnerChoiceMode } from "../types";

export const beginnerChoiceCategoryLabels: Record<BeginnerChoiceCategory, string> = {
  systems: "システム基礎",
  departments: "部門・責任分界",
  management_kpi: "管理技術・KPI",
  quality_maintenance_safety: "品質・保全・安全",
  ai_use_cases: "AI活用領域",
  poc_deployment: "PoC・導入プロセス",
};

export const beginnerChoiceModeLabels: Record<BeginnerChoiceMode, string> = {
  daily10: "今日の10問",
  quick3: "3分クイズ",
  category: "カテゴリ別練習",
  weakReview: "苦手復習",
  random: "ランダム出題",
};
