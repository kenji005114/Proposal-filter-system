export interface ParsedBrief {
  title: string;
  description: string;
  budget: number | null;
  deadline: string | null;
}

const DATE_RE = /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?/;
// ラベルの直後に区切り(コロンや空白)を必須にすることで、「納期の延長は…」のような
// 地の文中のたまたまの出現を誤って抽出しないようにしている。
const DEADLINE_LABEL_RE = /(?:納期|締切|希望納期|期限)[：:\s]+([^\n]+)/g;
const BUDGET_LABEL_RE = /予算[：:]?\s*([0-9,]+)\s*(万)?\s*円?/;
const BUDGET_FALLBACK_RE = /([0-9][0-9,]{2,})\s*(万)?\s*円/;

function normalizeDate(match: RegExpMatchArray): string {
  const [, y, m, d] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function extractDeadline(text: string): string | null {
  const labelMatches = [...text.matchAll(DEADLINE_LABEL_RE)];
  for (const match of labelMatches) {
    const dateInLabel = match[1].match(DATE_RE);
    if (dateInLabel) return normalizeDate(dateInLabel);
  }
  if (labelMatches.length > 0) return labelMatches[0][1].trim();

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
 * 構造化された項目をルールベースで抽出する(AIによる抽出ではないため精度は限定的)。
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

export type BriefItemCategory =
  | "TITLE"
  | "DEADLINE"
  | "BUDGET"
  | "DETAIL"
  | "DESIRED"
  | "AVOID"
  | "ONLINE_MEETING";

export interface AnalyzedBriefItem {
  category: BriefItemCategory;
  content: string;
}

const DESIRED_KEYWORDS = ["希望", "必須", "求める", "得意な方", "経験者", "歓迎"];
const AVOID_KEYWORDS = ["NG", "不可", "避け", "お断り", "ご遠慮", "禁止"];
const ONLINE_MEETING_KEYWORD_RE = /オンライン(ミーティング|会議|打ち合わせ)?|ビデオ通話|Zoom|Google\s?Meet|Teams/i;

function extractOnlineMeeting(text: string): string | null {
  if (!ONLINE_MEETING_KEYWORD_RE.test(text)) return null;

  if (/(オンライン[^\n]{0,20}(不可|NG|できません|対応できません))|((不可|NG)[^\n]{0,20}オンライン)/.test(text)) {
    return "対応不可";
  }
  if (/オンライン[^\n]{0,20}(可|対応可能|OK|歓迎)/i.test(text)) {
    return "対応可";
  }
  return "言及あり（詳細は要確認）";
}

/**
 * 募集要項分析ページ用の、カテゴリ別の詳細抽出。キーワードマッチによる
 * ルールベース抽出のため、書き方によっては拾えない/誤検出することがある
 * 前提で、抽出後にクライアントが追加・除外できる設計にしている。
 */
export function analyzeBriefItems(text: string): AnalyzedBriefItem[] {
  const brief = parseBriefText(text);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const items: AnalyzedBriefItem[] = [];

  if (brief.title) items.push({ category: "TITLE", content: brief.title });
  if (brief.deadline) items.push({ category: "DEADLINE", content: brief.deadline });
  if (brief.budget) items.push({ category: "BUDGET", content: `${brief.budget.toLocaleString()}円` });
  if (brief.description) items.push({ category: "DETAIL", content: brief.description });

  for (const line of lines) {
    if (DESIRED_KEYWORDS.some((keyword) => line.includes(keyword))) {
      items.push({ category: "DESIRED", content: line });
    }
    if (AVOID_KEYWORDS.some((keyword) => line.includes(keyword))) {
      items.push({ category: "AVOID", content: line });
    }
  }

  const onlineMeeting = extractOnlineMeeting(text);
  if (onlineMeeting) items.push({ category: "ONLINE_MEETING", content: onlineMeeting });

  return items;
}
