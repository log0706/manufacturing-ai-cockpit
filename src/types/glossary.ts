export type GlossaryCategory =
  | "system"
  | "department"
  | "kpi"
  | "quality"
  | "maintenance"
  | "security"
  | "method"
  | "ai";

export interface GlossaryTerm {
  id: string;
  term: string;
  aliases: string[];
  category: GlossaryCategory;
  /** 一言定義。ホバー／タップで最初に見せる短い説明。 */
  shortDefinition: string;
  /** かみ砕いた説明。 */
  plainExplanation: string;
  /** 現場での意味。 */
  manufacturingContext: string;
  /** AI導入との関係。 */
  aiContext: string;
  relatedKpis?: string[];
  relatedDepartments?: string[];
  caution?: string;
  relatedTerms?: string[];
  example?: string;
  /**
   * どのような場面で使う言葉か。用語説明とは別に、
   * 問題の巻末（用語のまとめ）で「使いどころ」を補足するための一文。
   */
  usageSituation?: string;
}

export type UnknownReason =
  | "term"
  | "question_intent"
  | "answer_structure"
  | "example"
  | "kpi_connection";
