import { DemographicId, LaptopStat } from "../data/types";

/** Price ceiling for a demographic (year-2000 dollars, inflates over time) */
export interface PriceCeiling {
  demographicId: DemographicId;
  baseCeiling: number;
}

// --- Demand Pool Growth ---

/** Multiplier per demographic per era anchor year */
export interface DemandGrowthAnchor {
  year: number;
  multipliers: Record<DemographicId, number>;
}

// --- Sales Simulation Results ---

export interface DemographicSalesBreakdown {
  demographicId: DemographicId;
  appeal: number;
  marketShare: number;
  unitsDemanded: number;
  /** Raw value proposition (total_score × screen_penalty) before perception mods */
  rawVP: number;
  /** Total demographic pool size this quarter */
  totalPool: number;
  /** Weighted stat score (dot product of normalised stats × demographic stat weights, excludes price) */
  weightedStatScore: number;
  /** Price score (1 = cheapest possible, 0 = most expensive possible) */
  priceScore: number;
  /** Screen size fit penalty (0.05–1.0) */
  screenPenalty: number;
  /** Brand perception modifier (%) */
  perceptionMod: number;
  /** Normalised stats (0–1 per stat, 1 = theoretical max for this year) */
  normalizedStats: Record<LaptopStat, number>;
}

export interface LaptopSalesResult {
  laptopId: string;
  owner: string; // company id
  retailPrice: number;
  unitsDemanded: number;
  unitsSold: number;
  unsoldUnits: number;
  revenue: number;
  manufacturingCost: number;
  profit: number;
  demographicBreakdown: DemographicSalesBreakdown[];
}

/** Fraction of demanded units that were actually sold (0–1). Accounts for stock-outs. */
export function sellThroughRate(lr: LaptopSalesResult): number {
  return lr.unitsDemanded > 0 ? lr.unitsSold / lr.unitsDemanded : 1;
}

/** Weighted-average rawVP across all laptops for a single demographic (by sold units). */
export function marketAverageRawVP(
  demId: DemographicId,
  allResults: LaptopSalesResult[],
): number {
  let totalUnits = 0;
  let weightedVP = 0;
  for (const lr of allResults) {
    const db = lr.demographicBreakdown.find((b) => b.demographicId === demId);
    if (db && db.unitsDemanded > 0) {
      const units = db.unitsDemanded * sellThroughRate(lr);
      weightedVP += db.rawVP * units;
      totalUnits += units;
    }
  }
  return totalUnits > 0 ? weightedVP / totalUnits : 0;
}

/** A stat's contribution to the VP gap between the player and market average */
export interface StatContributor {
  stat: LaptopStat;
  /** Player's normalized score (0–100) for this stat */
  playerScore: number;
  /** Market leader's normalized score (0–100) for this stat */
  marketLeaderScore: number;
  /** Demographic weight for this stat */
  weight: number;
  /** Whether this stat is helping or hurting the player */
  impact: "helping" | "hurting" | "neutral";
}

/** Structured insight into why perception changed for a demographic */
export interface PerceptionInsight {
  /** Player's average rawVP in this demographic */
  playerAvgVP: number;
  /** Market-wide average rawVP in this demographic */
  marketAvgVP: number;
  /** Gap: playerAvgVP - marketAvgVP */
  vpGap: number;
  /** Top stat contributors to the VP gap, sorted by |weighted impact| descending */
  topStats: StatContributor[];
  /** Player's average price score vs market average price score */
  priceScore: { player: number; marketAvg: number };
  /** The top competitor in this demographic */
  topCompetitor: { name: string; rawVP: number } | null;
}

/** Per-demographic perception change for a single company */
export interface PerceptionChange {
  demographicId: DemographicId;
  oldPerception: number;
  newPerception: number;
  delta: number;
  /** Human-readable explanation of why perception changed */
  reason: string;
  /** Structured insight for actionable feedback (null if no sales) */
  insight: PerceptionInsight | null;
}

export interface QuarterSimulationResult {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  laptopResults: LaptopSalesResult[];
  playerResults: LaptopSalesResult[];
  totalRevenue: number;
  totalProfit: number;
  /** Total quarterly marketing channel spend */
  marketingCost: number;
  cashAfterResolution: number;
  /** Per-demographic perception changes for the player this quarter */
  perceptionChanges: PerceptionChange[];
  /** Updated rolling-window perception history for the player this quarter */
  playerPerceptionHistory: Record<DemographicId, number[]>;
}

export interface YearSimulationResult {
  year: number;
  laptopResults: LaptopSalesResult[];
  playerResults: LaptopSalesResult[];
  totalRevenue: number;
  totalProfit: number;
  /** Total marketing channel spend for the year */
  marketingCost: number;
  cashAfterResolution: number;
  gameOver: boolean;
  /** Per-demographic perception changes for the player this year */
  perceptionChanges: PerceptionChange[];
}

export interface DemandProjection {
  low: number;
  high: number;
  expected: number;
}
