import type { Domain, ViewId } from "../types";

export const viewLabels: Record<ViewId, string> = {
  cockpit: "Home",
  beginner: "Beginner",
  align: "Align",
  knowledge: "Knowledge",
  map: "Map",
  drill: "Train",
  explain: "Explain",
  review: "Review",
};

export const viewDescriptions: Record<ViewId, string> = {
  beginner: "4択200問で基礎を固める",
  cockpit: "今日やることを選ぶ",
  align: "AI人材と前提を揃える",
  knowledge: "用語を判断軸に変える",
  map: "関係性を一枚でつかむ",
  drill: "説明カードを回す",
  explain: "30秒と3分で話す",
  review: "苦手だけを戻す",
};

export const domainLabels: Record<Domain, string> = {
  system: "System",
  department: "Department",
  process: "Process",
  risk: "Risk",
  global: "Global",
  "ai-usecase": "AI Use Case",
  explanation: "Explain",
};

export const domainJapanese: Record<Domain, string> = {
  system: "構造",
  department: "部門",
  process: "導入",
  risk: "リスク",
  global: "横展開",
  "ai-usecase": "用途",
  explanation: "説明",
};
