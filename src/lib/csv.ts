import Papa from "papaparse";
import type { Badge } from "@prisma/client";

export interface ProposalRow {
  lancerName: string;
  proposalAmount: number | null;
  proposalMessage: string | null;
  achievementsCount: number;
  unsatisfiedCount: number;
  completionRate: number;
  badge: Badge;
  beginnerFriendly: boolean;
  identityVerified: boolean;
  ndaVerified: boolean;
  phoneVerified: boolean;
  lancersCheck: boolean;
}

function toBoolean(value: unknown): boolean {
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["true", "1", "yes", "y", "はい", "済", "済み", "○"].includes(normalized);
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : fallback;
}

function toBadge(value: unknown): Badge {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized.includes("認定") || normalized === "certified") return "CERTIFIED";
  if (normalized.includes("シルバー") || normalized === "silver") return "SILVER";
  if (normalized.includes("ブロンズ") || normalized === "bronze") return "BRONZE";
  if (normalized.includes("レギュラー") || normalized === "regular") return "REGULAR";
  return "NONE";
}

export function parseProposalsCsv(csvText: string): ProposalRow[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return data.map((row) => ({
    lancerName: row.lancer_name ?? row["応募者名"] ?? "",
    proposalAmount:
      row.proposal_amount || row["提案金額"]
        ? toNumber(row.proposal_amount ?? row["提案金額"])
        : null,
    proposalMessage: row.proposal_message ?? row["提案メッセージ"] ?? null,
    achievementsCount: toNumber(row.achievements_count ?? row["実績数"]),
    unsatisfiedCount: toNumber(row.unsatisfied_count ?? row["評価_残念"]),
    completionRate: toNumber(row.completion_rate ?? row["完了率"]),
    badge: toBadge(row.badge ?? row["バッジ"]),
    beginnerFriendly: toBoolean(row.beginner_friendly ?? row["初心者に優しい"]),
    identityVerified: toBoolean(row.identity_verified ?? row["本人確認"]),
    ndaVerified: toBoolean(row.nda_verified ?? row["秘密保持確認"]),
    phoneVerified: toBoolean(row.phone_verified ?? row["電話確認"]),
    lancersCheck: toBoolean(row.lancers_check ?? row["ランサーズチェック"]),
  }));
}
