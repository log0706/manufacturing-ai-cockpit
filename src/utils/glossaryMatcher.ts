import { glossaryTerms } from "../data/glossary";
import type { GlossaryTerm } from "../types/glossary";

/**
 * テキストの一部（プレーンテキスト or 用語ヒット）を表すセグメント。
 * RichTextWithGlossary はこの配列を React 要素として安全に描画するため、
 * dangerouslySetInnerHTML を一切使わず XSS を避けられる。
 */
export type TextSegment =
  | { kind: "text"; value: string }
  | { kind: "term"; value: string; term: GlossaryTerm };

type MatchEntry = {
  term: GlossaryTerm;
  /** 検出に使う表記（term または alias）。 */
  surface: string;
  /** 小文字化した表記（英字の大小吸収用）。 */
  needle: string;
  /** 英字のみで構成されているか（単語境界チェックに使う）。 */
  isAscii: boolean;
};

const isAsciiWord = (value: string) => /^[\x20-\x7e]+$/.test(value);

const isAsciiAlnum = (char: string | undefined) =>
  char != null && /[a-z0-9]/i.test(char);

/**
 * 全用語 + alias を「長い順」に整列した検出テーブル。
 * モジュール読み込み時に一度だけ構築し、以降は再計算しない（パフォーマンス要件）。
 */
const matchTable: MatchEntry[] = glossaryTerms
  .flatMap((term) => {
    const surfaces = [term.term, ...term.aliases];
    return surfaces
      .map((surface) => surface.trim())
      .filter((surface) => surface.length > 0)
      .map((surface) => ({
        term,
        surface,
        needle: surface.toLowerCase(),
        isAscii: isAsciiWord(surface),
      }));
  })
  // 長い表記を優先してマッチさせる（「品質保証」を「品質」より先に）。
  .sort((left, right) => right.surface.length - left.surface.length);

export type MatchOptions = {
  /** 1カード内で同じ用語をチップ化する最大回数（既定2回）。 */
  maxPerTerm?: number;
  /** 1テキストブロックでチップ化する最大数（既定8個）。 */
  maxChipsPerBlock?: number;
  /** 既に他ブロックでチップ化済みの用語IDと回数（カード全体でのカウント共有用）。 */
  usedCounts?: Map<string, number>;
};

/**
 * 指定位置から始まる最長の用語マッチを探す。
 */
const findMatchAt = (lower: string, original: string, index: number): MatchEntry | null => {
  for (const entry of matchTable) {
    const end = index + entry.needle.length;
    if (end > lower.length) continue;
    if (lower.startsWith(entry.needle, index)) {
      // 英字用語は前後が英数字だと部分一致とみなさない（例: "MES" が "MESH" にヒットしない）。
      if (entry.isAscii) {
        const before = index > 0 ? original[index - 1] : undefined;
        const after = end < original.length ? original[end] : undefined;
        if (isAsciiAlnum(before) || isAsciiAlnum(after)) continue;
      }
      return entry;
    }
  }
  return null;
};

/**
 * テキストを用語セグメントへ分解する。HTML は一切生成しない。
 */
export const segmentText = (text: string, options: MatchOptions = {}): TextSegment[] => {
  if (!text) return [];
  const maxPerTerm = options.maxPerTerm ?? 2;
  const maxChipsPerBlock = options.maxChipsPerBlock ?? 8;
  const usedCounts = options.usedCounts ?? new Map<string, number>();

  const lower = text.toLowerCase();
  const segments: TextSegment[] = [];
  let buffer = "";
  let chipCount = 0;
  let index = 0;

  const flushBuffer = () => {
    if (buffer) {
      segments.push({ kind: "text", value: buffer });
      buffer = "";
    }
  };

  while (index < text.length) {
    const match = chipCount < maxChipsPerBlock ? findMatchAt(lower, text, index) : null;
    if (match) {
      const used = usedCounts.get(match.term.id) ?? 0;
      if (used < maxPerTerm) {
        flushBuffer();
        const value = text.slice(index, index + match.needle.length);
        segments.push({ kind: "term", value, term: match.term });
        usedCounts.set(match.term.id, used + 1);
        chipCount += 1;
        index += match.needle.length;
        continue;
      }
      // 上限に達した用語はプレーンテキストとして流すが、位置は進める。
      buffer += text.slice(index, index + match.needle.length);
      index += match.needle.length;
      continue;
    }
    buffer += text[index];
    index += 1;
  }

  flushBuffer();
  return segments;
};

/**
 * テキスト群に含まれる用語を（重複なし・出現順で）抽出する。
 * QuestionGlossaryPanel の「この問題の重要用語」一覧に使う。
 */
export const collectTerms = (texts: Array<string | undefined | null>): GlossaryTerm[] => {
  const found = new Map<string, GlossaryTerm>();
  for (const text of texts) {
    if (!text) continue;
    const lower = text.toLowerCase();
    let index = 0;
    while (index < text.length) {
      const match = findMatchAt(lower, text, index);
      if (match) {
        if (!found.has(match.term.id)) {
          found.set(match.term.id, match.term);
        }
        index += match.needle.length;
        continue;
      }
      index += 1;
    }
  }
  return Array.from(found.values());
};
