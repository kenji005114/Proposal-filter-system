export interface ParsedBrief {
  title: string;
  description: string;
  budget: number | null;
  deadline: string | null;
}

const DATE_RE = /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?/;
const DEADLINE_LABEL_RE = /(?:納期|締切|希望納期|期限)[：:]?\s*([^\n]+)/;
const BUDGET_LABEL_RE = /予算[：:]?\s*([0-9,]+)\s*(万)?\s*円?/;
const BUDGET_FALLBACK_RE = /([0-9][0-9,]{2,})\s*(万)?\s*円/;

function normalizeDate(match: RegExpMatchArray): string {
  const [, y, m, d] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function extractDeadline(text: string): string | null {
  const labelMatch = text.match(DEADLINE_LABEL_RE);
  if (labelMatch) {
    const dateInLabel = labelMatch[1].match(DATE_RE);
    if (dateInLabel) return normalizeDate(dateInLabel);
    return labelMatch[1].trim();
  }

  const dateMatch = text.match(DATE_RE);
  return dateMatch ? normalizeDate(dateMatch) : null;
}

function extractBudget(text: string): number | null {
  const match = text.match(BUDGET_LABEL_RE) ?? text.match(BUDGET_FALLBACK_RE);
  if (!match) return null;

  const raw = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(raw)) return null;

  return match[2] === "万" ? raw * 10000 : raw;
}

/**
 * クライアントがタイトル・内容・締切などをまとめて入力した自由文から、
 * 構造化された項目をルールベースで抽出する（AIによる抽出ではないため精度は限定的）。
 * 1行目をタイトルとみなし、本文全体はdescriptionとしてそのまま保持する。
 */
export function parseBriefText(text: string): ParsedBrief {
  const trimmed = text.trim();
  const firstLine = trimmed.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? "";

  return {
    title: firstLine,
    description: trimmed,
    budget: extractBudget(trimmed),
    deadline: extractDeadline(trimmed),
  };
}
