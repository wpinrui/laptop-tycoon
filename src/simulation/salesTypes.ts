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
  /** Raw value proposition (weighted_score × screen_penalty / price) before perception mods */
  rawVP: number;
  /** Total demographic pool size this quarter (before reach gating) */
  totalPool: number;
  /** Reach-gated addressable pool for this laptop */
  addressablePool: number;
  /** Weighted stat score (dot product of normalised stats × demographic weights) */
  weightedStatScore: number;
  /** Screen size fit penalty (0.05–1.0) */
  screenPenalty: number;
  /** Combined perception modifier % (brand + campaign) */
  perceptionMod: number;
  /** Market-relative normalised stats (0–1 per stat, 1 = best in market) */
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
  /** Sampled campaign perception modifier (%) applied to this laptop's biased VP */
  campaignPerceptionMod: number;
  demographicBreakdown: DemographicSalesBreakdown[];
}

/** Per-demographic perception change for a single company */
export interface PerceptionChange {
  demographicId: DemographicId;
  oldPerception: number;
  newPerception: number;
  delta: number;
}

export interface QuarterSimulationResult {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  laptopResults: LaptopSalesResult[];
  playerResults: LaptopSalesResult[];
  totalRevenue: number;
  totalProfit: number;
  cashAfterResolution: number;
  /** Per-demographic perception changes for the player this quarter */
  perceptionChanges: PerceptionChange[];
}

export interface YearSimulationResult {
  year: number;
  laptopResults: LaptopSalesResult[];
  playerResults: LaptopSalesResult[];
  totalRevenue: number;
  totalProfit: number;
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
