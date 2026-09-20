import type { Badge } from "@prisma/client";

/**
 * 暫定のスコアリング重み。ユーザーとの実例確認を経て確定するまでの仮値。
 */
export const SCORING_WEIGHTS = {
  wilsonScoreWeight: 70,
  badge: {
    CERTIFIED: 20,
    SILVER: 10,
    BRONZE: 5,
    REGULAR: 0,
    NONE: 0,
  } as Record<Badge, number>,
  beginnerFriendlyBonus: 3,
  completionRateWeight: 0.2,
  missingVerificationPenalty: 5,
};

const CONFIDENCE_Z = 1.96;

/** Wilson score interval の下限。母数が少ないほど同じ満足率でも保守的に評価される。 */
export function wilsonScoreLowerBound(satisfied: number, total: number): number {
  if (total <= 0) return 0;
  const phat = satisfied / total;
  const z2 = CONFIDENCE_Z * CONFIDENCE_Z;
  const denominator = 1 + z2 / total;
  const centre = phat + z2 / (2 * total);
  const margin = CONFIDENCE_Z * Math.sqrt((phat * (1 - phat) + z2 / (4 * total)) / total);
  return Math.max(centre - margin, 0) / denominator;
}

export interface ScoreInput {
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

export interface ScoreBreakdown {
  wilsonComponent: number;
  badgeComponent: number;
  completionComponent: number;
  verificationPenalty: number;
}

export interface ScoreResult {
  score: number | null;
  excluded: boolean;
  exclusionReason: string | null;
  breakdown: ScoreBreakdown | null;
}

export function scoreProposal(input: ScoreInput): ScoreResult {
  if (!input.identityVerified) {
    return {
      score: null,
      excluded: true,
      exclusionReason: "本人確認が未完了のため候補から除外されました。",
      breakdown: null,
    };
  }

  const satisfied = Math.max(input.achievementsCount - input.unsatisfiedCount, 0);
  const wilson = wilsonScoreLowerBound(satisfied, input.achievementsCount);
  const wilsonComponent = wilson * SCORING_WEIGHTS.wilsonScoreWeight;

  const badgeComponent =
    SCORING_WEIGHTS.badge[input.badge] +
    (input.beginnerFriendly ? SCORING_WEIGHTS.beginnerFriendlyBonus : 0);

  const completionComponent = input.completionRate * SCORING_WEIGHTS.completionRateWeight;

  const missingCount = [input.ndaVerified, input.phoneVerified, input.lancersCheck].filter(
    (verified) => !verified
  ).length;
  const verificationPenalty = -missingCount * SCORING_WEIGHTS.missingVerificationPenalty;

  const score = wilsonComponent + badgeComponent + completionComponent + verificationPenalty;

  return {
    score,
    excluded: false,
    exclusionReason: null,
    breakdown: { wilsonComponent, badgeComponent, completionComponent, verificationPenalty },
  };
}
