import { DemographicId } from "../data/types";
import { LaptopSalesResult, DemographicSalesBreakdown } from "./salesTypes";

export type LossReasonType = "statGap" | "price" | "perception" | "screenSize";

export interface LossReason {
  type: LossReasonType;
  /** Negative = disadvantage, positive = advantage. Magnitude indicates impact. */
  impact: number;
  label: string;
}

/**
 * Compute top loss reasons for a player laptop in a specific demographic.
 *
 * Compares the player laptop's VP components against the sales-weighted
 * average of all other laptops in that demographic. Returns up to 3 reasons
 * sorted by negative impact (worst first).
 */
export function computeLossReasons(
  playerBreakdown: DemographicSalesBreakdown,
  allResults: LaptopSalesResult[],
  demographicId: DemographicId,
  playerLaptopId: string,
): LossReason[] {
  // Gather all competitors' breakdowns for this demographic
  const competitors: { breakdown: DemographicSalesBreakdown; unitsDemanded: number }[] = [];
  for (const lr of allResults) {
    if (lr.laptopId === playerLaptopId) continue;
    const db = lr.demographicBreakdown.find((b) => b.demographicId === demographicId);
    if (db && db.unitsDemanded > 0) {
      competitors.push({ breakdown: db, unitsDemanded: db.unitsDemanded });
    }
  }

  if (competitors.length === 0) return [];

  // Sales-weighted average of competitor components
  const totalCompUnits = competitors.reduce((s, c) => s + c.unitsDemanded, 0);
  if (totalCompUnits === 0) return [];

  let avgStatScore = 0;
  let avgScreenPenalty = 0;
  let avgPerceptionMod = 0;
  // For price, compare via rawVP vs stat*screen (since rawVP = stat*screen/price)
  // We'll compare each factor ratio: player / avg
  let avgRawVP = 0;

  for (const { breakdown: db, unitsDemanded } of competitors) {
    const w = unitsDemanded / totalCompUnits;
    avgStatScore += db.weightedStatScore * w;
    avgScreenPenalty += db.screenPenalty * w;
    avgPerceptionMod += db.perceptionMod * w;
    avgRawVP += db.rawVP * w;
  }

  const p = playerBreakdown;

  // Factor ratios: >1 means player is better, <1 means player is worse
  // Stat gap: player's weighted stat score vs avg
  const statRatio = avgStatScore > 0 ? p.weightedStatScore / avgStatScore : 1;
  // Screen fit: player's penalty vs avg
  const screenRatio = avgScreenPenalty > 0 ? p.screenPenalty / avgScreenPenalty : 1;
  // Perception: player's mod vs avg
  const percRatio = (1 + p.perceptionMod / 100) / (1 + avgPerceptionMod / 100);
  // Price: isolate price effect. rawVP = stat*screen/price, so priceRatio = (stat*screen/rawVP_player) vs avg
  // price_effect = rawVP / (stat * screen) = 1/price. Higher rawVP per stat*screen = better price.
  const playerPriceEffect = p.weightedStatScore * p.screenPenalty > 0
    ? p.rawVP / (p.weightedStatScore * p.screenPenalty)
    : 0;
  const avgPriceEffect = avgStatScore * avgScreenPenalty > 0
    ? avgRawVP / (avgStatScore * avgScreenPenalty)
    : 0;
  const priceRatio = avgPriceEffect > 0 ? playerPriceEffect / avgPriceEffect : 1;

  // Convert ratios to impact scores (negative = disadvantage)
  // Use log scale so symmetric advantages/disadvantages have equal magnitude
  const reasons: LossReason[] = [
    {
      type: "statGap",
      impact: Math.log(statRatio),
      label: statRatio < 0.95 ? "Weaker specs for this segment" : "Strong specs for this segment",
    },
    {
      type: "price",
      impact: Math.log(priceRatio),
      label: priceRatio < 0.95 ? "Priced too high vs competitors" : "Competitive pricing",
    },
    {
      type: "perception",
      impact: Math.log(percRatio),
      label: percRatio < 0.95 ? "Lower brand perception" : "Strong brand perception",
    },
    {
      type: "screenSize",
      impact: Math.log(screenRatio),
      label: screenRatio < 0.95 ? "Screen size doesn't fit this segment" : "Good screen size fit",
    },
  ];

  // Sort by impact ascending (most negative = biggest loss reason first)
  reasons.sort((a, b) => a.impact - b.impact);

  // Return only negative-impact reasons (actual loss factors), up to 3
  return reasons.filter((r) => r.impact < -0.02).slice(0, 3);
}

/** Human-readable label for loss reason types */
export const LOSS_REASON_LABELS: Record<LossReasonType, string> = {
  statGap: "Spec Gap",
  price: "Price",
  perception: "Perception",
  screenSize: "Screen Size",
};
