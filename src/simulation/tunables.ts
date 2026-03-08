/**
 * Centralised tunables config.
 * All game-balance constants live here so designers can tweak one file.
 * See GDD § "Tunables (centralised in config)" for reference values.
 */

import { DemographicId } from "../data/types";
import { ModelType } from "../renderer/state/gameTypes";

// ==================== Brand Reach ====================

/** S-curve steepness — higher = steeper transition in the middle */
export const S_CURVE_STEEPNESS = 0.08;
/** S-curve midpoint (reach % where growth is fastest) */
export const S_CURVE_MIDPOINT = 50;
/** Awareness budget divisor — every $X of awareness budget contributes 1 raw reach point */
export const AWARENESS_DIVISOR = 500_000;
/** Word-of-mouth divisor — every X units sold contributes 1 raw reach point */
export const WOM_DIVISOR = 5_000;
/** Marketing campaign divisor — every $X of campaign spend contributes 1 raw reach point (S-curve, year-over-year) */
export const CAMPAIGN_DIVISOR = 2_000_000;
/** Immediate reach divisor — every $X of campaign spend gives 1% immediate reach (flat, same-year) */
export const CAMPAIGN_IMMEDIATE_REACH_DIVISOR = 500_000;
/** Reach decay rate when no products on sale (proportional, per year) */
export const REACH_INACTIVITY_DECAY = 0.10;
/** Competitor time-in-market reach growth (raw reach points per year just for existing) */
export const COMPETITOR_TIME_IN_MARKET_BONUS = 0.5;

// ==================== Brand Perception ====================

/** Scales raw value-for-money contribution into perception points (roughly +-5 per year) */
export const PERCEPTION_CONTRIBUTION_SCALE = 5;
/** Perception decay factor (50% fade per year — recency bias) */
export const PERCEPTION_DECAY = 0.5;
/** Negativity bias multiplier — bad value-for-money hits harder */
export const NEGATIVITY_MULTIPLIER = 1.5;

// ==================== Sales Engine ====================

/** Exponential decay rate for price overshoot above ceiling */
export const PRICE_OVERSHOOT_DECAY = 3;
/** Base demand variance for projections */
export const BASE_DEMAND_VARIANCE = 0.15;
/** Additional variance scaled by average reach */
export const REACH_VARIANCE_SCALE = 0.20;
/** Demand noise floor (percentage) */
export const DEMAND_NOISE_MIN = 10;
/** Demand noise ceiling (percentage) */
export const DEMAND_NOISE_MAX = 15;
/** Channel margin — retailer takes this fraction of retail price */
export const CHANNEL_MARGIN_RATE = 0.20;

// ==================== Pricing ====================

/** Annual price-ceiling inflation rate */
export const PRICE_INFLATION_RATE = 1.03;
/** Baseline year for inflation calculations */
export const PRICE_BASE_YEAR = 2000;

// ==================== Campaign Costs ====================

/** Annual scaling for campaign and sponsorship costs */
export const CAMPAIGN_COST_INFLATION = 1.03;
/** Base year for campaign cost inflation */
export const CAMPAIGN_BASE_YEAR = 2000;

// ==================== Manufacturing ====================

/** Reference quantity for economies-of-scale calculation */
export const REFERENCE_QUANTITY = 5_000;
/** Fixed overhead for running 2+ distinct models */
export const MULTI_MODEL_OVERHEAD = 500_000;
/** Minimum manufacturing batch size */
export const MIN_BATCH_SIZE = 1_000;
/** Maximum price multiplier over unit cost */
export const MAX_PRICE_MULTIPLIER = 4;
/** Per-unit assembly/QA cost */
export const ASSEMBLY_QA_COST = 10;
/** Per-unit packaging/logistics cost */
export const PACKAGING_LOGISTICS_COST = 15;
/** Support budget slider minimum */
export const SUPPORT_BUDGET_MIN = 0;
/** Support budget slider maximum */
export const SUPPORT_BUDGET_MAX = 50;

/** Fixed tooling cost by model type */
export const TOOLING_COST: Record<ModelType, number> = {
  brandNew: 800_000,
  successor: 300_000,
  specBump: 0,
};

/** Fixed certification cost by model type */
export const CERTIFICATION_COST: Record<ModelType, number> = {
  brandNew: 50_000,
  successor: 50_000,
  specBump: 0,
};

// ==================== Demographic Replacement Cycles ====================

/** Years between upgrades, per demographic */
export const REPLACEMENT_CYCLE: Record<DemographicId, number> = {
  techEnthusiast: 2,
  businessProfessional: 3,
  student: 3,
  creativeProfessional: 3,
  gamer: 3,
  generalConsumer: 3,
  corporate: 4,
  budgetBuyer: 5,
};

// ==================== Quarterly Distribution ====================

/** Buyer distribution across Q1-Q4 (out of sum = 15) */
export const QUARTER_SHARES = [8, 4, 2, 1] as const;

// ==================== Awards ====================

/** Global perception boost from winning an award */
export const AWARD_PERCEPTION_BONUS = 2;
/** Global reach % boost from winning an award */
export const AWARD_REACH_BONUS = 1;
