import {
  LaptopStat,
  Demographic,
  PriceSensitivity,
  StatVector,
  ALL_STATS,
} from "../data/types";
import { DEMOGRAPHICS } from "../data/demographics";
import { STARTING_DEMAND_POOL } from "../data/startingDemand";
import { GameState, LaptopModel } from "../renderer/state/gameTypes";
import { computeStatsForDesign } from "./statCalculation";
import {
  getPriceCeiling,
  getDemandPoolSize,
  getScreenSizeFit,
} from "./demographicData";
import {
  DemographicSalesBreakdown,
  LaptopSalesResult,
  YearSimulationResult,
  DemandProjection,
} from "./salesTypes";
import {
  CHANNEL_MARGIN_RATE,
  DEMAND_NOISE_MIN,
  DEMAND_NOISE_MAX,
} from "../renderer/manufacturing/utils/constants";
import { AD_CAMPAIGNS } from "../renderer/manufacturing/data/campaigns";
import { generateCompetitorModels } from "./competitorAI";
import { COMPETITORS } from "../data/competitors";

// Cache synthetic competitor models per year for stable demand projections
let cachedProjectionYear: number | null = null;
let cachedProjectionModels: LaptopModel[] = [];

/** Clear the projection cache (call on new game to avoid stale data). */
export function clearProjectionCache(): void {
  cachedProjectionYear = null;
  cachedProjectionModels = [];
}

// --- Tuning Constants ---

/** Brand awareness floor (0-1) when brand recognition is 0 */
const BRAND_AWARENESS_MIN = 0.3;
/** Brand awareness ceiling added as recognition approaches 100 */
const BRAND_AWARENESS_RANGE = 0.7;
/** Max extra appeal from niche reputation alignment */
const NICHE_BONUS_CAP = 0.3;
/** Loyalty multiplier for successor models */
const SUCCESSOR_LOYALTY = 1.2;
/** Loyalty multiplier for spec-bump models */
const SPEC_BUMP_LOYALTY = 1.15;
/** Exponential decay rate for price overshoot above ceiling */
const PRICE_OVERSHOOT_DECAY = 3;
/** Base demand variance (±%) before brand recognition adjustment */
const BASE_DEMAND_VARIANCE = 0.15;
/** Additional variance scaled by brand recognition factor */
const RECOGNITION_VARIANCE_SCALE = 0.20;
/** Divisor for brand recognition when computing projection confidence */
const RECOGNITION_CONFIDENCE_DIVISOR = 150;

// --- Market Entry: all laptops competing this year ---

interface MarketLaptop {
  id: string;
  owner: "player" | string;
  model: LaptopModel;
  stats: StatVector;
  retailPrice: number;
  manufacturingQuantity: number;
  totalManufacturingCost: number;
}

function buildMarketLaptops(state: GameState): MarketLaptop[] {
  const laptops: MarketLaptop[] = [];

  // Player models
  for (const model of state.models) {
    if (model.status !== "manufacturing" && model.status !== "onSale") continue;
    if (!model.retailPrice) continue;

    const stats = computeStatsForDesign(model.design, state.year);

    // Calculate total manufacturing cost from plan
    const plan = model.manufacturingPlan;
    const isCurrentYearPlan = plan && plan.year === state.year;

    // Manufacturing quantity = new batch (if any) + existing inventory
    const newBatch = isCurrentYearPlan ? (model.manufacturingQuantity ?? 0) : 0;
    const totalAvailable = newBatch + model.unitsInStock;

    if (totalAvailable <= 0) continue;

    const totalMfgCost = isCurrentYearPlan
      ? plan.manufacturing.totalCost + plan.marketing.cost
      : 0; // Inventory-only: no new manufacturing cost

    laptops.push({
      id: model.design.id,
      owner: "player",
      model,
      stats,
      retailPrice: model.retailPrice,
      manufacturingQuantity: totalAvailable,
      totalManufacturingCost: totalMfgCost,
    });
  }

  // Competitor models (current year only)
  for (const comp of state.competitors) {
    for (const model of comp.models) {
      if (model.yearDesigned !== state.year) continue;
      if (!model.retailPrice || !model.manufacturingQuantity) continue;

      const stats = computeStatsForDesign(model.design, state.year);

      laptops.push({
        id: model.design.id,
        owner: comp.id,
        model,
        stats,
        retailPrice: model.retailPrice,
        manufacturingQuantity: model.manufacturingQuantity,
        totalManufacturingCost: model.manufacturingQuantity * model.design.unitCost,
      });
    }
  }

  return laptops;
}

// --- Appeal Calculation ---

/**
 * Compute market-relative stat scores by normalising each stat against all laptops in the market.
 * Returns a 0-1 score per stat where 1.0 = best in market.
 */
function normaliseStats(laptop: MarketLaptop, allLaptops: MarketLaptop[]): Record<LaptopStat, number> {
  const result = {} as Record<LaptopStat, number>;

  for (const stat of ALL_STATS) {
    const values = allLaptops.map((l) => l.stats[stat] ?? 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min;
    const raw = laptop.stats[stat] ?? 0;
    result[stat] = range > 0 ? (raw - min) / range : 0.5;
  }

  return result;
}

/** Dot product of normalised stats against demographic weights */
function calculateWeightedStatScore(
  normalisedStats: Record<LaptopStat, number>,
  demographic: Demographic,
): number {
  let score = 0;
  for (const stat of ALL_STATS) {
    score += (normalisedStats[stat] ?? 0) * (demographic.statWeights[stat] ?? 0);
  }
  return score;
}

/** Price competitiveness: below ceiling = good (diminishing returns), above = sharp dropoff */
function calculatePriceCompetitiveness(
  retailPrice: number,
  demographic: Demographic,
  year: number,
): number {
  const ceiling = getPriceCeiling(demographic.id, year);

  if (retailPrice <= ceiling) {
    // Below ceiling: cheaper is better with diminishing returns
    // Score ranges from 0.5 (at ceiling) to 1.0 (at $0)
    const ratio = retailPrice / ceiling;
    return 0.5 + 0.5 * (1 - Math.sqrt(ratio));
  } else {
    // Above ceiling: sharp exponential dropoff
    const overshoot = (retailPrice - ceiling) / ceiling;
    return 0.5 * Math.exp(-PRICE_OVERSHOOT_DECAY * overshoot);
  }
}

/** Scale price sensitivity effect based on demographic */
function applyPriceSensitivity(
  priceScore: number,
  sensitivity: Demographic["priceSensitivity"],
): number {
  // Higher sensitivity = price matters more (score deviations amplified)
  const exponents: Record<PriceSensitivity, number> = {
    low: 0.5,
    moderate: 1.0,
    high: 1.5,
    veryHigh: 2.0,
    extreme: 3.0,
  };
  const exp = exponents[sensitivity];
  // Amplify deviation from neutral (0.5)
  if (priceScore >= 0.5) {
    return 0.5 + 0.5 * Math.pow((priceScore - 0.5) / 0.5, 1 / exp);
  } else {
    return 0.5 - 0.5 * Math.pow((0.5 - priceScore) / 0.5, exp);
  }
}

/** Map brand recognition (0-100) to an awareness factor */
function brandAwareness(brandRecognition: number): number {
  return BRAND_AWARENESS_MIN + BRAND_AWARENESS_RANGE * (brandRecognition / 100);
}

/** Brand fit: how well the player's niche reputation aligns with what this demographic cares about */
function calculateBrandFit(
  brandRecognition: number,
  nicheReputation: Record<string, number>,
  demographic: Demographic,
): number {
  const awarenessBase = brandAwareness(brandRecognition);

  // Niche alignment bonus: dot product of niche scores with demographic weights
  let nicheScore = 0;
  for (const stat of ALL_STATS) {
    const nicheValue = nicheReputation[stat] ?? 0;
    const weight = demographic.statWeights[stat] ?? 0;
    nicheScore += (nicheValue / 100) * weight;
  }

  return awarenessBase * (1 + nicheScore * NICHE_BONUS_CAP);
}

/** Loyalty modifier for returning products */
function calculateLoyaltyModifier(laptop: MarketLaptop): number {
  if (laptop.owner !== "player") return 1.0;

  const model = laptop.model;
  if (model.design.modelType === "successor") return SUCCESSOR_LOYALTY;
  if (model.design.modelType === "specBump") return SPEC_BUMP_LOYALTY;

  // Brand new — check if there's a gap from previous models
  return 1.0;
}

/** Sample campaign bonus from skew-normal distribution */
function sampleCampaignBonus(campaignId: string | null): number {
  if (!campaignId || campaignId === "no_campaign") return 1.0;
  const campaign = AD_CAMPAIGNS.find((c) => c.id === campaignId);
  if (!campaign) return 1.0;

  const { mean, stdDev, min, max } = campaign.distribution;
  // Box-Muller for normal sample
  const u1 = Math.random() || 1e-10; // guard against log(0)
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  let sample = mean + stdDev * z;
  sample = Math.max(min, Math.min(max, sample));

  return 1 + sample / 100;
}

/** Get marketing modifier for a laptop */
function getMarketingModifier(laptop: MarketLaptop): number {
  if (laptop.owner !== "player") {
    // Competitors get a baseline marketing boost based on brand recognition
    return 1.0;
  }

  const plan = laptop.model.manufacturingPlan;
  if (!plan) return 1.0;

  return sampleCampaignBonus(plan.marketing.campaignId);
}

/**
 * Calculate full appeal score for a laptop against a demographic.
 * appeal = weighted_stat_score * price_competitiveness * brand_fit * loyalty * screen_fit * marketing
 */
function calculateAppeal(
  laptop: MarketLaptop,
  normalisedStats: Record<LaptopStat, number>,
  demographic: Demographic,
  year: number,
  state: GameState,
  marketingModifier: number,
): number {
  const statScore = calculateWeightedStatScore(normalisedStats, demographic);
  const rawPriceScore = calculatePriceCompetitiveness(laptop.retailPrice, demographic, year);
  const priceScore = applyPriceSensitivity(rawPriceScore, demographic.priceSensitivity);
  const pref = demographic.screenSizePreference;
  const screenFit = getScreenSizeFit(laptop.model.design.screenSize, pref.preferredMin, pref.preferredMax, pref.penaltyPerInch);

  let brandFit: number;
  if (laptop.owner === "player") {
    brandFit = calculateBrandFit(state.brandRecognition, state.nicheReputation, demographic);
  } else {
    const comp = state.competitors.find((c) => c.id === laptop.owner);
    brandFit = comp ? brandAwareness(comp.brandRecognition) : 0.5;
  }

  const loyalty = calculateLoyaltyModifier(laptop);

  const appeal = statScore * priceScore * brandFit * loyalty * screenFit * marketingModifier;
  return Math.max(0, appeal);
}

// --- Market Share & Demand Resolution ---

function applySalesNoise(baseDemand: number): number {
  const noisePercent = DEMAND_NOISE_MIN + Math.random() * (DEMAND_NOISE_MAX - DEMAND_NOISE_MIN);
  const direction = Math.random() < 0.5 ? -1 : 1;
  return Math.round(baseDemand * (1 + direction * noisePercent / 100));
}

/**
 * Run the full sales simulation for the current year.
 */
export function simulateYear(state: GameState): YearSimulationResult {
  const year = state.year;
  const allLaptops = buildMarketLaptops(state);

  if (allLaptops.length === 0) {
    return {
      year,
      laptopResults: [],
      playerResults: [],
      totalRevenue: 0,
      totalProfit: 0,
      cashAfterResolution: state.cash,
      gameOver: state.cash < 0,
    };
  }

  // Pre-compute normalised stats for all laptops
  const normalisedStatsMap = new Map<string, Record<LaptopStat, number>>();
  for (const laptop of allLaptops) {
    normalisedStatsMap.set(laptop.id, normaliseStats(laptop, allLaptops));
  }

  // Pre-sample marketing modifiers (once per laptop, consistent across demographics)
  const marketingModifiers = new Map<string, number>();
  for (const laptop of allLaptops) {
    marketingModifiers.set(laptop.id, getMarketingModifier(laptop));
  }

  // For each laptop, accumulate demand across all demographics
  const demandByLaptop = new Map<string, { total: number; breakdown: DemographicSalesBreakdown[] }>();
  for (const laptop of allLaptops) {
    demandByLaptop.set(laptop.id, { total: 0, breakdown: [] });
  }

  for (const demographic of DEMOGRAPHICS) {
    const demId = demographic.id;
    const basePool = STARTING_DEMAND_POOL[demId];
    const pool = getDemandPoolSize(demId, year, basePool);

    // Calculate appeal for each laptop in this demographic
    const appeals: { laptopId: string; appeal: number }[] = [];
    let totalAppeal = 0;

    for (const laptop of allLaptops) {
      const normStats = normalisedStatsMap.get(laptop.id)!;
      const mktMod = marketingModifiers.get(laptop.id)!;
      const appeal = calculateAppeal(laptop, normStats, demographic, year, state, mktMod);
      appeals.push({ laptopId: laptop.id, appeal });
      totalAppeal += appeal;
    }

    // Distribute demand pool by market share
    for (const { laptopId, appeal } of appeals) {
      const share = totalAppeal > 0 ? appeal / totalAppeal : 0;
      const unitsDemanded = Math.round(pool * share);

      const entry = demandByLaptop.get(laptopId)!;
      entry.total += unitsDemanded;
      entry.breakdown.push({
        demographicId: demId,
        appeal,
        marketShare: share,
        unitsDemanded,
      });
    }
  }

  // Build results
  const laptopResults: LaptopSalesResult[] = [];
  let playerRevenue = 0;
  let playerProfit = 0;

  for (const laptop of allLaptops) {
    const demand = demandByLaptop.get(laptop.id)!;
    const noisyDemand = applySalesNoise(demand.total);
    const unitsSold = Math.min(noisyDemand, laptop.manufacturingQuantity);
    const unsoldUnits = laptop.manufacturingQuantity - unitsSold;
    const revenue = unitsSold * laptop.retailPrice * (1 - CHANNEL_MARGIN_RATE);
    const profit = revenue - laptop.totalManufacturingCost;

    const result: LaptopSalesResult = {
      laptopId: laptop.id,
      owner: laptop.owner,
      retailPrice: laptop.retailPrice,
      unitsDemanded: noisyDemand,
      unitsSold,
      unsoldUnits,
      revenue,
      manufacturingCost: laptop.totalManufacturingCost,
      profit,
      demographicBreakdown: demand.breakdown,
    };
    laptopResults.push(result);

    if (laptop.owner === "player") {
      playerRevenue += revenue;
      playerProfit += profit;
    }
  }

  const playerResults = laptopResults.filter((r) => r.owner === "player");

  // Cash flow resolution
  // Manufacturing cost was already deducted when manufacturing plan was set
  // Revenue is collected at year-end
  const cashAfterResolution = state.cash + playerRevenue;
  const gameOver = cashAfterResolution < 0;

  return {
    year,
    laptopResults,
    playerResults,
    totalRevenue: playerRevenue,
    totalProfit: playerProfit,
    cashAfterResolution,
    gameOver,
  };
}

// --- Demand Projection (for manufacturing wizard) ---

/**
 * Project demand range for a laptop model. Used in manufacturing wizard
 * to help the player decide how many units to order.
 */
export function projectDemandRange(
  state: GameState,
  modelId: string,
  retailPrice: number,
): DemandProjection {
  const year = state.year;

  // Build a temporary market with this model + current competitor models
  const model = state.models.find((m) => m.design.id === modelId);
  if (!model) return { low: 0, high: 0, expected: 0 };

  const stats = computeStatsForDesign(model.design, year);

  const tempLaptop: MarketLaptop = {
    id: modelId,
    owner: "player",
    model: { ...model, retailPrice, manufacturingQuantity: 0 },
    stats,
    retailPrice,
    manufacturingQuantity: 0,
    totalManufacturingCost: 0,
  };

  // Build competitor laptops for comparison.
  // Generate synthetic models once per year for stable projections.
  if (cachedProjectionYear !== year) {
    cachedProjectionYear = year;
    cachedProjectionModels = generateCompetitorModels(year, COMPETITORS);
  }
  const syntheticModels = cachedProjectionModels;
  const competitorLaptops: MarketLaptop[] = [];
  for (let i = 0; i < COMPETITORS.length; i++) {
    const comp = COMPETITORS[i];
    const cm = syntheticModels[i];
    if (!cm.retailPrice) continue;
    competitorLaptops.push({
      id: cm.design.id,
      owner: comp.id,
      model: cm,
      stats: computeStatsForDesign(cm.design, year),
      retailPrice: cm.retailPrice,
      manufacturingQuantity: cm.manufacturingQuantity ?? 0,
      totalManufacturingCost: 0,
    });
  }

  // Also include other player models
  const otherPlayerModels: MarketLaptop[] = [];
  for (const pm of state.models) {
    if (pm.design.id === modelId) continue;
    if (pm.status !== "manufacturing" && pm.status !== "onSale") continue;
    if (!pm.retailPrice) continue;
    otherPlayerModels.push({
      id: pm.design.id,
      owner: "player",
      model: pm,
      stats: computeStatsForDesign(pm.design, year),
      retailPrice: pm.retailPrice,
      manufacturingQuantity: pm.manufacturingQuantity ?? 0,
      totalManufacturingCost: 0,
    });
  }

  const allLaptops = [tempLaptop, ...competitorLaptops, ...otherPlayerModels];

  // Compute normalised stats
  const normalisedStatsMap = new Map<string, Record<LaptopStat, number>>();
  for (const laptop of allLaptops) {
    normalisedStatsMap.set(laptop.id, normaliseStats(laptop, allLaptops));
  }

  // Sum demand across demographics for our model
  let totalExpected = 0;
  for (const demographic of DEMOGRAPHICS) {
    const demId = demographic.id;
    const basePool = STARTING_DEMAND_POOL[demId];
    const pool = getDemandPoolSize(demId, year, basePool);

    let totalAppeal = 0;
    let ourAppeal = 0;

    for (const laptop of allLaptops) {
      const normStats = normalisedStatsMap.get(laptop.id)!;
      const appeal = calculateAppeal(laptop, normStats, demographic, year, state, 1.0);
      totalAppeal += appeal;
      if (laptop.id === modelId) ourAppeal = appeal;
    }

    const share = totalAppeal > 0 ? ourAppeal / totalAppeal : 0;
    totalExpected += pool * share;
  }

  const expected = Math.round(totalExpected);

  // Confidence interval based on brand recognition (higher = tighter)
  const recognitionFactor = Math.max(0.1, 1 - state.brandRecognition / RECOGNITION_CONFIDENCE_DIVISOR);
  const variance = BASE_DEMAND_VARIANCE + recognitionFactor * RECOGNITION_VARIANCE_SCALE;

  const low = Math.max(0, Math.round(expected * (1 - variance)));
  const high = Math.round(expected * (1 + variance));

  return { low, high, expected };
}
