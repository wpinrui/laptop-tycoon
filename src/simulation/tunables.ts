/**
 * Centralised tunables config.
 * All game-balance constants live here so designers can tweak one file.
 * See GDD § "Tunables (centralised in config)" for reference values.
 */

import { DemographicId, MarketingTier } from "../data/types";
import { CompetitorArchetype } from "../data/competitors";
import { ModelType } from "../renderer/state/gameTypes";

// ==================== Brand Reach ====================

/** S-curve steepness — higher = steeper transition in the middle */
export const S_CURVE_STEEPNESS = 0.08;
/** S-curve midpoint (reach % where growth is fastest) */
export const S_CURVE_MIDPOINT = 50;
/** Word-of-mouth divisor — every X units sold contributes 1 raw reach point (AI competitors only) */
export const WOM_DIVISOR = 5_000;
/** Reach decay rate when no products on sale (proportional, per year — AI competitors only) */
export const REACH_INACTIVITY_DECAY = 0.10;

// ==================== Marketing Campaigns (Player) ====================

/** Base cost per quarter (year-2000 dollars) for each marketing tier. Inflates yearly. */
export const TIER_COSTS: Record<MarketingTier, number> = {
  1: 2_000,
  2: 50_000,
  3: 200_000,
  4: 750_000,
  5: 3_000_000,
};

/** Raw customer acquisitions per quarter per marketing tier. */
export const TIER_ACQUISITIONS: Record<MarketingTier, number> = {
  1: 100,
  2: 500,
  3: 2_000,
  4: 7_500,
  5: 25_000,
};

/** Base reach ceiling (%) per marketing tier before permeability adjustment. */
export const TIER_BASE_CEILINGS: Record<MarketingTier, number> = {
  1: 15,
  2: 30,
  3: 50,
  4: 75,
  5: 95,
};

/** Spillover acquisition multiplier: spillover = baseAcquisitions × adjacency × SPILLOVER_PENALTY */
export const SPILLOVER_PENALTY = 0.15;

/** Base reach decay rate per quarter when no campaign targets a demographic (multiplied by 1 + permeability). */
export const REACH_DECAY_BASE = 0.05;

// ==================== Brand Perception ====================

/** Exponential smoothing factor: higher = faster response to changes (0–1) */
export const PERCEPTION_SMOOTHING_ALPHA = 0.25;
/** Maps percentage VP gap to perception scale (e.g. 30% better × 50 → target 15) */
export const PERCEPTION_EXPERIENCE_SCALE = 50;
/** Negativity bias multiplier — bad value-for-money hits harder */
export const NEGATIVITY_MULTIPLIER = 1.5;
/** Perception floor (minimum per-demographic perception score) */
export const PERCEPTION_MIN = -50;
/** Perception ceiling (maximum per-demographic perception score) */
export const PERCEPTION_MAX = 50;
/** Minimum absolute delta to count as a "meaningful" perception change */
export const PERCEPTION_MEANINGFUL_DELTA = 0.1;
/** Minimum |delta| on a perception shift before the news engine generates a headline */
export const PERCEPTION_NEWS_THRESHOLD = 3;

// ==================== Sales Engine ====================

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

// ==================== Cost Inflation ====================

/** Annual scaling for marketing/infrastructure costs */
export const COST_INFLATION = 1.03;
/** Base year for cost inflation */
export const COST_BASE_YEAR = 2000;

// ==================== Manufacturing ====================

/** Reference quantity for economies-of-scale calculation */
export const REFERENCE_QUANTITY = 5_000;
/** Fixed overhead for running 2+ distinct models */
export const MULTI_MODEL_OVERHEAD = 500_000;
/** Minimum manufacturing batch size */
export const MIN_BATCH_SIZE = 1_000;
/** Minimum price multiplier over unit cost (pricing slider floor) */
export const MIN_PRICE_MULTIPLIER = 0.5;
/** Default price multiplier for initial retail pricing */
export const DEFAULT_PRICE_MULTIPLIER = 1.5;
/** Maximum price multiplier over unit cost */
export const MAX_PRICE_MULTIPLIER = 4;
/** Per-unit assembly/QA cost */
export const ASSEMBLY_QA_COST = 10;
/** Per-unit packaging/logistics cost */
export const PACKAGING_LOGISTICS_COST = 15;

/** R&D cost charged at design finalisation (one-time, sunk) */
export const RD_COST: Record<ModelType, number> = {
  brandNew: 200_000,
  successor: 75_000,
  specBump: 15_000,
};

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
  // Generalist
  techEnthusiast: 2,
  businessProfessional: 3,
  student: 3,
  creativeProfessional: 3,
  gamer: 3,
  generalConsumer: 3,
  corporate: 4,
  budgetBuyer: 5,
  developer: 2,
  educationK12: 4,
  // Niche
  videoEditor: 3,
  threeDArtist: 3,
  musicProducer: 3,
  esportsPro: 2,
  streamer: 2,
  digitalNomad: 3,
  fieldWorker: 4,
  writer: 4,
  dayTrader: 3,
  desktopReplacement: 4,
};

// ==================== Seasonal Demand Curves ====================

/**
 * Per-demographic quarterly demand distribution.
 * Each tuple [Q1, Q2, Q3, Q4] sums to 1.0.
 * Total annual buyers per demographic is unchanged — just redistributed.
 */
export const SEASONAL_DEMAND_CURVES: Record<DemographicId, [number, number, number, number]> = {
  // Student-type: Q3 peak (back-to-school)
  student:       [0.15, 0.15, 0.55, 0.15],
  educationK12:  [0.15, 0.15, 0.55, 0.15],
  // Consumer-type: Q4 peak (holidays)
  generalConsumer: [0.15, 0.15, 0.25, 0.45],
  budgetBuyer:     [0.15, 0.15, 0.25, 0.45],
  techEnthusiast:  [0.15, 0.15, 0.25, 0.45],
  // Business-type: Q1-Q2 heavy, Q4 light
  businessProfessional: [0.30, 0.30, 0.25, 0.15],
  corporate:            [0.30, 0.30, 0.25, 0.15],
  developer:            [0.30, 0.30, 0.25, 0.15],
  // Creative-type: relatively flat, slight Q1-Q2 bias
  creativeProfessional: [0.28, 0.27, 0.27, 0.18],
  videoEditor:          [0.28, 0.27, 0.27, 0.18],
  threeDArtist:         [0.28, 0.27, 0.27, 0.18],
  musicProducer:        [0.28, 0.27, 0.27, 0.18],
  writer:               [0.28, 0.27, 0.27, 0.18],
  // Gamer-type: Q4 peak (holidays)
  gamer:              [0.12, 0.22, 0.22, 0.44],
  esportsPro:         [0.12, 0.22, 0.22, 0.44],
  streamer:           [0.12, 0.22, 0.22, 0.44],
  desktopReplacement: [0.12, 0.22, 0.22, 0.44],
  // Other niche → business-type curve
  digitalNomad: [0.30, 0.30, 0.25, 0.15],
  fieldWorker:  [0.30, 0.30, 0.25, 0.15],
  dayTrader:    [0.30, 0.30, 0.25, 0.15],
};

// ==================== Product Freshness / Novelty ====================

/** VP multiplier at launch quarter (novelty/hype bonus) */
export const NOVELTY_LAUNCH_BONUS = 1.3;
/** Per-quarter exponential decay base for novelty factor */
export const NOVELTY_DECAY_BASE = 0.85;

/**
 * Per-demographic freshness decay rate multiplier.
 * Higher = product ages faster for this demographic.
 */
export const FRESHNESS_DECAY_RATE: Record<DemographicId, number> = {
  // Student-type: fast (trend-conscious)
  student: 1.2,
  educationK12: 1.2,
  // Consumer-type: baseline
  generalConsumer: 1.0,
  budgetBuyer: 1.0,
  techEnthusiast: 1.0,
  // Business-type: slow (procurement cycles)
  businessProfessional: 0.7,
  corporate: 0.7,
  developer: 0.7,
  // Creative-type: slow (tool loyalty)
  creativeProfessional: 0.8,
  videoEditor: 0.8,
  threeDArtist: 0.8,
  musicProducer: 0.8,
  writer: 0.8,
  // Gamer-type: fast (chasing latest specs)
  gamer: 1.3,
  esportsPro: 1.3,
  streamer: 1.3,
  desktopReplacement: 1.3,
  // Other niche → business-type decay
  digitalNomad: 0.7,
  fieldWorker: 0.7,
  dayTrader: 0.7,
};

// ==================== AI Production ====================

/** Fraction of estimated annual demand each archetype orders */
export const AI_ORDER_MULTIPLIER: Record<CompetitorArchetype, number> = {
  budget: 0.80,
  generalist: 0.90,
  premium: 1.00,
};

// ==================== AI Old Inventory & Model Continuity ====================

/** Per-year price discount applied to AI models at year transition */
export const AI_OLD_INVENTORY_DISCOUNT = 0.25;
/** Maximum age (years) before an AI model is auto-discontinued */
export const AI_MAX_MODEL_AGE = 3;
/** Sell-through above this → successor (successful product, iterate) */
export const AI_SUCCESSOR_THRESHOLD = 0.80;
/** Sell-through above this (but below successor) → spec bump */
export const AI_SPEC_BUMP_THRESHOLD = 0.50;

// ==================== AI Death Spiral Prevention ====================

/** Minimum annual unit sales before an AI competitor is considered "struggling" */
export const DEATH_SPIRAL_SALES_THRESHOLD = 10_000;
/** Consecutive low-sales years required before nudging engineeringBonus */
export const DEATH_SPIRAL_CONSECUTIVE_YEARS = 2;
/** How much to increase engineeringBonus per trigger (shifts component percentile) */
export const DEATH_SPIRAL_BONUS_NUDGE = 0.05;
/** Maximum engineeringBonus cap (prevent runaway escalation) */
export const DEATH_SPIRAL_MAX_BONUS = 0.4;

// ==================== News Engine ====================

/** Probability (0–1) of using a press-quote headline template when a quote is available */
export const QUOTE_HEADLINE_PROBABILITY = 0.8;

// ==================== Awards ====================

/** Perception boost for primary demographics (matching outlet affinity) */
export const AWARD_PRIMARY_PERCEPTION_BONUS = 5;
/** Reach % boost for primary demographics */
export const AWARD_PRIMARY_REACH_BONUS = 3;
/** Perception boost for secondary demographics (adjacent interest) */
export const AWARD_SECONDARY_PERCEPTION_BONUS = 1;
/** Reach % boost for secondary demographics */
export const AWARD_SECONDARY_REACH_BONUS = 0.5;
