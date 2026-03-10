import {
  LaptopStat,
  Demographic,
  DemographicId,
  StatVector,
  ALL_STATS,
} from "../data/types";
import { DEMOGRAPHICS } from "../data/demographics";
import { STARTING_DEMAND_POOL } from "../data/startingDemand";
import { GameState, LaptopModel, CompanyState, getPlayerCompany } from "../renderer/state/gameTypes";
import { computeStatsForDesign } from "./statCalculation";
import {
  getDemandPoolSize,
  getScreenSizeFit,
} from "./demographicData";
import { applyViabilityTransform } from "../data/designConstants";
import {
  DemographicSalesBreakdown,
  LaptopSalesResult,
  QuarterSimulationResult,
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
  QUARTER_SHARES,
  QUARTER_SHARES_SUM,
} from "./tunables";
import { AD_CAMPAIGNS } from "../renderer/manufacturing/data/campaigns";
import { sampleCampaignOutcome } from "../renderer/manufacturing/utils/skewNormal";
import { generateCompetitorModels } from "./competitorAI";
import { COMPETITORS } from "../data/competitors";
import { averageReach, getCampaignReachBoost, applySingleQuarterPerception } from "./brandProgression";
import { getTheoreticalMaxima, getPriceScaleFactor, clearTheoreticalMaxCache } from "./theoreticalMax";

// Cache synthetic competitor models per year for stable demand projections
let cachedProjectionYear: number | null = null;
let cachedProjectionModels: LaptopModel[] = [];

/** Clear the projection cache (call on new game to avoid stale data). */
export function clearProjectionCache(): void {
  cachedProjectionYear = null;
  cachedProjectionModels = [];
  clearTheoreticalMaxCache();
}

// --- Market Entry: all laptops competing this year ---

interface MarketLaptop {
  id: string;
  owner: string; // company id
  model: LaptopModel;
  stats: StatVector;
  retailPrice: number;
  manufacturingQuantity: number;
  totalManufacturingCost: number;
}

function buildMarketLaptops(state: GameState): MarketLaptop[] {
  const laptops: MarketLaptop[] = [];
  const player = getPlayerCompany(state);

  // Player models
  for (const model of player.models) {
    if (model.status !== "manufacturing" && model.status !== "onSale") continue;
    if (!model.retailPrice) continue;

    const stats = computeStatsForDesign(model.design, state.year);

    // Calculate total manufacturing cost from plan
    const plan = model.manufacturingPlan;
    const isCurrentQuarterPlan = plan && plan.year === state.year && plan.quarter === state.quarter;

    // Manufacturing quantity = new batch (if any) + existing inventory
    const newBatch = isCurrentQuarterPlan ? (model.manufacturingQuantity ?? 0) : 0;
    const totalAvailable = newBatch + model.unitsInStock;

    if (totalAvailable <= 0) continue;

    const totalMfgCost = isCurrentQuarterPlan
      ? plan.manufacturing.totalCost + plan.marketing.cost
      : 0; // Inventory-only or previous quarter: no new manufacturing cost

    laptops.push({
      id: model.design.id,
      owner: player.id,
      model,
      stats,
      retailPrice: model.retailPrice,
      manufacturingQuantity: totalAvailable,
      totalManufacturingCost: totalMfgCost,
    });
  }

  // Competitor models (current year only)
  for (const comp of state.companies) {
    if (comp.isPlayer) continue;
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
 * Normalise stats against the theoretical maximum for the current year.
 * normalized_stat = raw_stat / theoretical_max(stat, year)
 * Returns a 0-1 score per stat where 1.0 = theoretical best possible.
 */
function normaliseStats(laptop: MarketLaptop, year: number): Record<LaptopStat, number> {
  const maxima = getTheoreticalMaxima(year);
  const result = {} as Record<LaptopStat, number>;

  for (const stat of ALL_STATS) {
    const raw = laptop.stats[stat] ?? 0;
    result[stat] = maxima[stat] > 0 ? raw / maxima[stat] : 0;
  }

  return result;
}

/** Dot product of normalised stats (with viability transform) against demographic weights. */
function calculateWeightedStatScore(
  normalisedStats: Record<LaptopStat, number>,
  demographic: Demographic,
): number {
  let score = 0;
  for (const stat of ALL_STATS) {
    const transformed = applyViabilityTransform(normalisedStats[stat] ?? 0, stat);
    score += transformed * (demographic.statWeights[stat] ?? 0);
  }
  return score;
}

/**
 * Compute price score using exponential decay: cheaper laptops score higher.
 * price_score = e^(-price / scaleFactor)
 *
 * scaleFactor is the median build cost for the year, concentrating sensitivity
 * in the price range where most laptops actually live. Saving $30 on a $700
 * build matters more than saving $30 on a $2500 build.
 */
function calculatePriceScore(retailPrice: number, year: number): number {
  const scaleFactor = getPriceScaleFactor(year);
  return Math.exp(-retailPrice / scaleFactor);
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
function getLaptopCampaignPerception(laptop: MarketLaptop, playerId: string): number {
  if (laptop.owner !== playerId) return 0;
  const plan = laptop.model.manufacturingPlan;
  if (!plan) return 0;
  return sampleCampaignPerception(plan.marketing.campaignId);
}

/**
 * Calculate biased value proposition for a laptop against a demographic.
 *
 * Step 1 – Raw VP:
 *   raw_vp = (dot_product(normalised_stats, stat_weights) + price_score × price_weight) × screen_penalty
 *
 * Step 2 – Biased VP:
 *   biased_vp = raw_vp × (1 + brand_perception_mod / 100) × (1 + laptop_perception_mod / 100)
 *
 * Note: reach is NOT applied here — it multiplies effective VP in simulateQuarter.
 */
interface VPComponents {
  biasedVP: number;
  rawVP: number;
  weightedStatScore: number;
  priceScore: number;
  screenPenalty: number;
  /** Combined brand + campaign perception modifier (%) */
  perceptionMod: number;
}

function calculateBiasedVP(
  laptop: MarketLaptop,
  normalisedStats: Record<LaptopStat, number>,
  demographic: Demographic,
  state: GameState,
  campaignPerception: number,
): VPComponents {
  const weightedStatScore = calculateWeightedStatScore(normalisedStats, demographic);
  const priceScore = calculatePriceScore(laptop.retailPrice, state.year);
  const pref = demographic.screenSizePreference;
  const screenPenalty = getScreenSizeFit(laptop.model.design.screenSize, pref.preferredMin, pref.preferredMax, pref.penaltyPerInch);

  // Step 1: raw_vp = (stat_score + price_score × price_weight) × screen_penalty
  const totalScore = weightedStatScore + priceScore * demographic.priceWeight;
  const rawVP = totalScore * screenPenalty;

  // Step 2: biased_vp = raw_vp × (1 + brand_perception_mod / 100) × (1 + laptop_perception_mod / 100)
  const company = state.companies.find((c) => c.id === laptop.owner);
  const brandPerceptionMod = company ? (company.brandPerception[demographic.id] ?? 0) : 0;

  const laptopPerceptionMod = campaignPerception;
  const perceptionMod = ((1 + brandPerceptionMod / 100) * (1 + laptopPerceptionMod / 100) - 1) * 100;

  const biasedVP = rawVP * (1 + perceptionMod / 100);
  return { biasedVP: Math.max(0, biasedVP), rawVP, weightedStatScore, priceScore, screenPenalty, perceptionMod };
}

// --- Market Share & Demand Resolution ---

function applySalesNoise(baseDemand: number): number {
  const noisePercent = DEMAND_NOISE_MIN + Math.random() * (DEMAND_NOISE_MAX - DEMAND_NOISE_MIN);
  const direction = Math.random() < 0.5 ? -1 : 1;
  return Math.round(baseDemand * (1 + direction * noisePercent / 100));
}

/**
 * Run the sales simulation for a single quarter.
 * Demand is scaled by the quarter's share of annual buyers.
 */
export function simulateQuarter(state: GameState): QuarterSimulationResult {
  const { year, quarter } = state;
  const quarterShare = QUARTER_SHARES[quarter - 1] / QUARTER_SHARES_SUM;
  const allLaptops = buildMarketLaptops(state);
  const player = getPlayerCompany(state);

  if (allLaptops.length === 0) {
    return {
      year,
      quarter,
      laptopResults: [],
      playerResults: [],
      totalRevenue: 0,
      totalProfit: 0,
      cashAfterResolution: state.cash,
      perceptionChanges: [],
    };
  }

  // Immediate reach boost from marketing campaign spend (flat, not S-curved)
  const campaignReachBoost = getCampaignReachBoost(state);

  // Pre-compute normalised stats for all laptops
  const normalisedStatsMap = new Map<string, Record<LaptopStat, number>>();
  for (const laptop of allLaptops) {
    normalisedStatsMap.set(laptop.id, normaliseStats(laptop, year));
  }

  // Pre-sample campaign perception modifiers (once per laptop, consistent across demographics)
  const campaignPerceptions = new Map<string, number>();
  for (const laptop of allLaptops) {
    campaignPerceptions.set(laptop.id, getLaptopCampaignPerception(laptop, player.id));
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

    // Quarterly active buyers = annual × quarter share
    const quarterlyActiveBuyers = annualActiveBuyers * quarterShare;

    // Calculate effective VP for each laptop: biased_vp × (reach / 100)
    // Reach multiplies competitive strength within one shared pool (no per-company pools)
    const vpEntries: { laptopId: string; vp: VPComponents; effectiveVP: number }[] = [];
    let totalEffectiveVP = 0;

    for (const laptop of allLaptops) {
      const normStats = normalisedStatsMap.get(laptop.id)!;
      const campPerc = campaignPerceptions.get(laptop.id)!;
      const vp = calculateBiasedVP(laptop, normStats, demographic, state, campPerc);

      const company = state.companies.find((c) => c.id === laptop.owner);
      let reach = company ? (company.brandReach[demId] ?? 0) : 0;
      if (company?.isPlayer) {
        reach += campaignReachBoost;
      }
      reach = Math.min(reach, 100);
      const effectiveVP = vp.biasedVP * (reach / 100);

      vpEntries.push({ laptopId: laptop.id, vp, effectiveVP });
      totalEffectiveVP += effectiveVP;
    }

    // Everyone in the shared pool buys: purchase_probability = effective_vp / sum(all effective_vps)
    for (const { laptopId, vp, effectiveVP } of vpEntries) {
      const purchaseProbability = totalEffectiveVP > 0 ? effectiveVP / totalEffectiveVP : 0;
      const unitsDemanded = Math.round(quarterlyActiveBuyers * purchaseProbability);

      const entry = demandByLaptop.get(laptopId)!;
      entry.total += unitsDemanded;
      entry.breakdown.push({
        demographicId: demId,
        appeal: vp.biasedVP,
        marketShare: purchaseProbability,
        unitsDemanded,
        rawVP: vp.rawVP,
        totalPool: Math.round(quarterlyActiveBuyers),
        weightedStatScore: vp.weightedStatScore,
        priceScore: vp.priceScore,
        screenPenalty: vp.screenPenalty,
        perceptionMod: vp.perceptionMod,
        normalizedStats: normalisedStatsMap.get(laptopId)!,
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

    if (laptop.owner === player.id) {
      playerRevenue += revenue;
      playerProfit += profit;
    }
  }

  const playerResults = laptopResults.filter((r) => r.owner === player.id);

  // Cash flow: revenue collected quarterly
  const cashAfterResolution = state.cash + playerRevenue;

  // Compute player perception changes for this quarter
  const perceptionChanges = computeQuarterlyPerceptionChanges(state, laptopResults);

  return {
    year,
    quarter,
    laptopResults,
    playerResults,
    totalRevenue: playerRevenue,
    totalProfit: playerProfit,
    cashAfterResolution,
    perceptionChanges,
  };
}

// --- Perception Change Computation ---

/**
 * Compute per-demographic perception changes for one quarter.
 * Uses single-quarter perception update (not 4x loop).
 * Generates a human-readable reason for each change.
 */
function computeQuarterlyPerceptionChanges(
  state: GameState,
  laptopResults: LaptopSalesResult[],
): PerceptionChange[] {
  const player = getPlayerCompany(state);
  const newPerception = applySingleQuarterPerception(player, laptopResults);
  const playerResults = laptopResults.filter((r) => r.owner === player.id);

  return DEMOGRAPHICS.map((dem) => {
    const oldP = player.brandPerception[dem.id] ?? 0;
    const newP = newPerception[dem.id] ?? 0;
    const delta = newP - oldP;
    const reason = buildPerceptionReason(dem.id, delta, playerResults, laptopResults, player.models);
    return { demographicId: dem.id, oldPerception: oldP, newPerception: newP, delta, reason };
  });
}

/** Build a human-readable reason for a perception change in one demographic. */
function buildPerceptionReason(
  demId: DemographicId,
  delta: number,
  playerResults: LaptopSalesResult[],
  allResults: LaptopSalesResult[],
  playerModels: CompanyState["models"],
): string {
  // Check if player had any sales in this demographic
  // Use sell-through ratio to estimate actual units sold per demographic
  const playerSales: { name: string; rawVP: number; units: number }[] = [];
  for (const pr of playerResults) {
    const db = pr.demographicBreakdown.find((b) => b.demographicId === demId);
    if (db && db.unitsDemanded > 0) {
      const sellThrough = pr.unitsDemanded > 0 ? pr.unitsSold / pr.unitsDemanded : 1;
      const units = db.unitsDemanded * sellThrough;
      if (units > 0) {
        const model = playerModels.find((m) => m.design.id === pr.laptopId);
        const name = model?.design.name ?? pr.laptopId.slice(0, 6);
        playerSales.push({ name, rawVP: db.rawVP, units });
      }
    }
  }

  if (playerSales.length === 0) {
    if (Math.abs(delta) < 0.1) return "No sales — perception unchanged";
    return "No sales this quarter — natural decay";
  }

  // Compute market average rawVP for this demographic (using sold units)
  let totalUnits = 0;
  let weightedVP = 0;
  for (const lr of allResults) {
    const db = lr.demographicBreakdown.find((b) => b.demographicId === demId);
    if (db && db.unitsDemanded > 0) {
      const sellThrough = lr.unitsDemanded > 0 ? lr.unitsSold / lr.unitsDemanded : 1;
      const units = db.unitsDemanded * sellThrough;
      weightedVP += db.rawVP * units;
      totalUnits += units;
    }
  }
  const marketAvgVP = totalUnits > 0 ? weightedVP / totalUnits : 0;

  // Find best-selling player laptop in this demographic
  playerSales.sort((a, b) => b.units - a.units);
  const top = playerSales[0];
  const vpDiff = top.rawVP - marketAvgVP;

  if (Math.abs(delta) < 0.1) {
    return `${top.name} sold at near-average value`;
  }

  if (delta > 0) {
    if (vpDiff > 0) {
      return `${top.name} offered above-average value`;
    }
    return `Sales volume gave a slight perception boost`;
  }

  // delta < 0
  if (vpDiff < 0) {
    return `${top.name} offered below-average value`;
  }
  return "Natural decay outweighed modest sales";
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
  const player = getPlayerCompany(state);

  // Build a temporary market with this model + current competitor models
  const model = player.models.find((m) => m.design.id === modelId);
  if (!model) return { low: 0, high: 0, expected: 0 };

  const stats = computeStatsForDesign(model.design, year);

  const tempLaptop: MarketLaptop = {
    id: modelId,
    owner: player.id,
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
  for (const pm of player.models) {
    if (pm.design.id === modelId) continue;
    if (pm.status !== "manufacturing" && pm.status !== "onSale") continue;
    if (!pm.retailPrice) continue;
    otherPlayerModels.push({
      id: pm.design.id,
      owner: player.id,
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
    normalisedStatsMap.set(laptop.id, normaliseStats(laptop, year));
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
    // Scale by current quarter's share
    const quarterShare = QUARTER_SHARES[state.quarter - 1] / QUARTER_SHARES_SUM;
    const quarterlyActiveBuyers = annualActiveBuyers * quarterShare;

    let totalEffectiveVP = 0;
    let ourEffectiveVP = 0;

    for (const laptop of allLaptops) {
      const normStats = normalisedStatsMap.get(laptop.id)!;
      const { biasedVP: vp } = calculateBiasedVP(laptop, normStats, demographic, state, 0);

      // effective_vp = biased_vp × (reach / 100)
      const company = state.companies.find((c) => c.id === laptop.owner);
      let reach = company ? (company.brandReach[demId] ?? 0) : 0;
      if (company?.isPlayer) {
        reach += campaignReachBoost;
      }
      reach = Math.min(reach, 100);
      const effectiveVP = vp * (reach / 100);

      totalEffectiveVP += effectiveVP;
      if (laptop.id === modelId) ourEffectiveVP = effectiveVP;
    }

    const share = totalEffectiveVP > 0 ? ourEffectiveVP / totalEffectiveVP : 0;
    totalExpected += quarterlyActiveBuyers * share;
  }

  const expected = Math.round(totalExpected);

  // Confidence interval based on average reach (higher = tighter)
  const reachFactor = Math.max(0.1, 1 - averageReach(player.brandReach) / 100);
  const variance = BASE_DEMAND_VARIANCE + reachFactor * REACH_VARIANCE_SCALE;

  const low = Math.max(0, Math.round(expected * (1 - variance)));
  const high = Math.round(expected * (1 + variance));

  return { low, high, expected };
}
