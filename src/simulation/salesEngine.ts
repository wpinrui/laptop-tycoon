import {
  LaptopStat,
  Demographic,
  StatVector,
  ALL_STATS,
} from "../data/types";
import { DEMOGRAPHICS } from "../data/demographics";
import { STARTING_DEMAND_POOL } from "../data/startingDemand";
import { GameState, LaptopModel } from "../renderer/state/gameTypes";
import { computeStatsForDesign } from "./statCalculation";
import {
  getDemandPoolSize,
  getScreenSizeFit,
} from "./demographicData";
import {
  DemographicSalesBreakdown,
  LaptopSalesResult,
  YearSimulationResult,
  DemandProjection,
  PerceptionChange,
} from "./salesTypes";
import {
  CHANNEL_MARGIN_RATE,
  DEMAND_NOISE_MIN,
  DEMAND_NOISE_MAX,
  BASE_DEMAND_VARIANCE,
  REACH_VARIANCE_SCALE,
  REPLACEMENT_CYCLE,
  PERCEPTION_DECAY,
  NEGATIVITY_MULTIPLIER,
  PERCEPTION_CONTRIBUTION_SCALE,
} from "./tunables";
import { AD_CAMPAIGNS } from "../renderer/manufacturing/data/campaigns";
import { sampleCampaignOutcome } from "../renderer/manufacturing/utils/skewNormal";
import { generateCompetitorModels } from "./competitorAI";
import { COMPETITORS } from "../data/competitors";
import { averageReach, getCampaignReachBoost } from "./brandProgression";

// Cache synthetic competitor models per year for stable demand projections
let cachedProjectionYear: number | null = null;
let cachedProjectionModels: LaptopModel[] = [];

/** Clear the projection cache (call on new game to avoid stale data). */
export function clearProjectionCache(): void {
  cachedProjectionYear = null;
  cachedProjectionModels = [];
}

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
 * normalized_stat = this_laptop_stat / max(that stat across all laptops this year)
 * Returns a 0-1 score per stat where 1.0 = best in market.
 */
function normaliseStats(laptop: MarketLaptop, allLaptops: MarketLaptop[]): Record<LaptopStat, number> {
  const result = {} as Record<LaptopStat, number>;

  for (const stat of ALL_STATS) {
    const values = allLaptops.map((l) => l.stats[stat] ?? 0);
    const max = Math.max(...values);
    const raw = laptop.stats[stat] ?? 0;
    result[stat] = max > 0 ? raw / max : 0;
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

/**
 * Sample campaign perception modifier from distribution.
 * Returns a percentage modifier to laptop perceived value (laptop_perception_mod).
 */
function sampleCampaignPerception(campaignId: string | null): number {
  if (!campaignId || campaignId === "no_campaign") return 0;
  const campaign = AD_CAMPAIGNS.find((c) => c.id === campaignId);
  if (!campaign) return 0;

  const { mean, stdDev, skew, min, max } = campaign.distribution;
  return sampleCampaignOutcome(mean, stdDev, skew, min, max);
}

/** Get laptop-specific campaign perception modifier */
function getLaptopCampaignPerception(laptop: MarketLaptop): number {
  if (laptop.owner !== "player") return 0;
  const plan = laptop.model.manufacturingPlan;
  if (!plan) return 0;
  return sampleCampaignPerception(plan.marketing.campaignId);
}

/**
 * Calculate biased value proposition for a laptop against a demographic.
 *
 * Step 1 – Raw VP:
 *   raw_vp = (weighted_score × screen_penalty) / price
 *
 * Step 2 – Biased VP:
 *   biased_vp = raw_vp × (1 + brand_perception_mod / 100) × (1 + laptop_perception_mod / 100)
 *
 * Note: reach is NOT applied here — it gates the demand pool size instead (in simulateYear).
 */
function calculateBiasedVP(
  laptop: MarketLaptop,
  normalisedStats: Record<LaptopStat, number>,
  demographic: Demographic,
  state: GameState,
  campaignPerception: number,
): { biasedVP: number; rawVP: number } {
  const weightedScore = calculateWeightedStatScore(normalisedStats, demographic);
  const pref = demographic.screenSizePreference;
  const screenPenalty = getScreenSizeFit(laptop.model.design.screenSize, pref.preferredMin, pref.preferredMax, pref.penaltyPerInch);

  // Step 1: raw_vp = (weighted_score × screen_penalty) / price
  const rawVP = (weightedScore * screenPenalty) / laptop.retailPrice;

  // Step 2: biased_vp = raw_vp × (1 + brand_perception_mod / 100) × (1 + laptop_perception_mod / 100)
  let brandPerceptionMod: number;
  if (laptop.owner === "player") {
    brandPerceptionMod = state.brandPerception[demographic.id] ?? 0;
  } else {
    const comp = state.competitors.find((c) => c.id === laptop.owner);
    brandPerceptionMod = comp ? (comp.brandPerception[demographic.id] ?? 0) : 0;
  }

  const laptopPerceptionMod = campaignPerception;

  const biasedVP = rawVP * (1 + brandPerceptionMod / 100) * (1 + laptopPerceptionMod / 100);
  return { biasedVP: Math.max(0, biasedVP), rawVP };
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
      perceptionChanges: [],
    };
  }

  // Immediate reach boost from marketing campaign spend (flat, not S-curved)
  const campaignReachBoost = getCampaignReachBoost(state);

  // Pre-compute normalised stats for all laptops
  const normalisedStatsMap = new Map<string, Record<LaptopStat, number>>();
  for (const laptop of allLaptops) {
    normalisedStatsMap.set(laptop.id, normaliseStats(laptop, allLaptops));
  }

  // Pre-sample campaign perception modifiers (once per laptop, consistent across demographics)
  const campaignPerceptions = new Map<string, number>();
  for (const laptop of allLaptops) {
    campaignPerceptions.set(laptop.id, getLaptopCampaignPerception(laptop));
  }

  // For each laptop, accumulate demand across all demographics
  const demandByLaptop = new Map<string, { total: number; breakdown: DemographicSalesBreakdown[] }>();
  for (const laptop of allLaptops) {
    demandByLaptop.set(laptop.id, { total: 0, breakdown: [] });
  }

  for (const demographic of DEMOGRAPHICS) {
    const demId = demographic.id;
    const basePool = STARTING_DEMAND_POOL[demId];
    const demographicPopulation = getDemandPoolSize(demId, year, basePool);

    // annual_active_buyers = demographic_population / replacement_cycle_years
    const replacementCycle = REPLACEMENT_CYCLE[demId];
    const annualActiveBuyers = demographicPopulation / replacementCycle;

    // Calculate biased VP for each laptop in this demographic
    const vpEntries: { laptopId: string; biasedVP: number; rawVP: number; reachGatedPool: number }[] = [];
    let totalBiasedVP = 0;

    for (const laptop of allLaptops) {
      const normStats = normalisedStatsMap.get(laptop.id)!;
      const campPerc = campaignPerceptions.get(laptop.id)!;
      const { biasedVP, rawVP } = calculateBiasedVP(laptop, normStats, demographic, state, campPerc);

      // Each laptop's addressable pool is gated by its owner's reach in this demographic
      let reach: number;
      if (laptop.owner === "player") {
        reach = (state.brandReach[demId] ?? 0) + campaignReachBoost;
      } else {
        const comp = state.competitors.find((c) => c.id === laptop.owner);
        reach = comp ? (comp.brandReach[demId] ?? 0) : 0;
      }
      reach = Math.min(reach, 100);
      const reachGatedPool = annualActiveBuyers * (reach / 100);

      vpEntries.push({ laptopId: laptop.id, biasedVP, rawVP, reachGatedPool });
      totalBiasedVP += biasedVP;
    }

    // Everyone in the active pool buys: purchase_probability = biased_vp / sum(all biased_vps)
    for (const { laptopId, biasedVP, rawVP, reachGatedPool } of vpEntries) {
      const purchaseProbability = totalBiasedVP > 0 ? biasedVP / totalBiasedVP : 0;
      const unitsDemanded = Math.round(reachGatedPool * purchaseProbability);

      const entry = demandByLaptop.get(laptopId)!;
      entry.total += unitsDemanded;
      entry.breakdown.push({
        demographicId: demId,
        appeal: biasedVP,
        marketShare: purchaseProbability,
        unitsDemanded,
        rawVP,
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
      campaignPerceptionMod: campaignPerceptions.get(laptop.id) ?? 0,
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

  // Compute player perception changes for tracking in results
  const perceptionChanges = computePerceptionChanges(state, laptopResults);

  return {
    year,
    laptopResults,
    playerResults,
    totalRevenue: playerRevenue,
    totalProfit: playerProfit,
    cashAfterResolution,
    gameOver,
    perceptionChanges,
  };
}

// --- Perception Change Computation ---

/**
 * Compute per-demographic perception changes for the player.
 * Used for tracking in simulation results (display only — actual state update
 * happens in brandProgression.ts updateBrandPerception).
 */
function computePerceptionChanges(
  state: GameState,
  laptopResults: LaptopSalesResult[],
): PerceptionChange[] {
  const changes: PerceptionChange[] = [];
  const playerResults = laptopResults.filter((r) => r.owner === "player");

  for (const dem of DEMOGRAPHICS) {
    const demId = dem.id;
    const oldPerception = state.brandPerception[demId] ?? 0;

    // Collect all purchased laptop rawVPs in this demographic (all companies)
    const allPurchases: { rawVP: number; units: number }[] = [];
    for (const lr of laptopResults) {
      const db = lr.demographicBreakdown.find((b) => b.demographicId === demId);
      if (db && db.unitsDemanded > 0) {
        allPurchases.push({ rawVP: db.rawVP, units: db.unitsDemanded });
      }
    }

    // Mean raw_vp of all purchased laptops in this demographic
    const totalUnitsAll = allPurchases.reduce((s, p) => s + p.units, 0);
    const meanRawVP = totalUnitsAll > 0
      ? allPurchases.reduce((s, p) => s + p.rawVP * p.units, 0) / totalUnitsAll
      : 0;

    // Collect player's laptop purchases in this demographic
    let weightedExperience = 0;
    let playerUnits = 0;
    for (const pr of playerResults) {
      const db = pr.demographicBreakdown.find((b) => b.demographicId === demId);
      if (db && db.unitsDemanded > 0) {
        const experience = db.rawVP - meanRawVP;
        weightedExperience += experience * db.unitsDemanded;
        playerUnits += db.unitsDemanded;
      }
    }

    // Only purchasers affect perception — demographics that didn't buy stay at 0/neutral
    if (playerUnits <= 0) {
      // Decay only (DECAY^0.25 applied 4 times = DECAY)
      const newPerception = Math.max(-50, Math.min(50, oldPerception * PERCEPTION_DECAY));
      changes.push({ demographicId: demId, oldPerception, newPerception, delta: newPerception - oldPerception });
      continue;
    }

    // Volume-weighted average experience
    const avgExperience = weightedExperience / playerUnits;

    // Apply negativity multiplier
    const adjusted = avgExperience < 0 ? avgExperience * NEGATIVITY_MULTIPLIER : avgExperience;

    // Scale contribution
    const perceptionContribution = adjusted * PERCEPTION_CONTRIBUTION_SCALE;

    // Apply quarterly decay + contribution over 4 quarters
    // new_perception = old_perception × (DECAY ^ 0.25) + perception_contribution per quarter
    // Over 4 quarters: fold iteratively
    let perception = oldPerception;
    const quarterlyDecay = Math.pow(PERCEPTION_DECAY, 0.25);
    const quarterlyContribution = perceptionContribution / 4;
    for (let q = 0; q < 4; q++) {
      perception = perception * quarterlyDecay + quarterlyContribution;
    }
    const newPerception = Math.max(-50, Math.min(50, perception));

    changes.push({ demographicId: demId, oldPerception, newPerception, delta: newPerception - oldPerception });
  }

  return changes;
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
  uncommittedCampaignSpend: number = 0,
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

  // Immediate reach boost from marketing campaign spend (committed + uncommitted from wizard)
  const campaignReachBoost = getCampaignReachBoost(state, uncommittedCampaignSpend);

  // Sum demand across demographics for our model
  let totalExpected = 0;
  for (const demographic of DEMOGRAPHICS) {
    const demId = demographic.id;
    const basePool = STARTING_DEMAND_POOL[demId];
    const demographicPopulation = getDemandPoolSize(demId, year, basePool);
    const annualActiveBuyers = demographicPopulation / REPLACEMENT_CYCLE[demId];

    let totalBiasedVP = 0;
    let ourBiasedVP = 0;

    for (const laptop of allLaptops) {
      const normStats = normalisedStatsMap.get(laptop.id)!;
      const { biasedVP: vp } = calculateBiasedVP(laptop, normStats, demographic, state, 0);
      totalBiasedVP += vp;
      if (laptop.id === modelId) ourBiasedVP = vp;
    }

    const share = totalBiasedVP > 0 ? ourBiasedVP / totalBiasedVP : 0;
    // Gate by player's reach in this demographic (including immediate campaign boost)
    const reach = Math.min((state.brandReach[demId] ?? 0) + campaignReachBoost, 100);
    totalExpected += annualActiveBuyers * (reach / 100) * share;
  }

  const expected = Math.round(totalExpected);

  // Confidence interval based on average reach (higher = tighter)
  const reachFactor = Math.max(0.1, 1 - averageReach(state.brandReach) / 100);
  const variance = BASE_DEMAND_VARIANCE + reachFactor * REACH_VARIANCE_SCALE;

  const low = Math.max(0, Math.round(expected * (1 - variance)));
  const high = Math.round(expected * (1 + variance));

  return { low, high, expected };
}
