/**
 * Brand reach (per-demographic, S-curve), brand perception (global, decay + value-for-money),
 * and niche reputation evolution.
 * Called at year-end after sales simulation resolves.
 */

import { ALL_STATS, DemographicId, LaptopStat } from "../data/types";
import { DEMOGRAPHICS } from "../data/demographics";
import { SPONSORSHIPS } from "../data/sponsorships";
import { GameState, CompetitorState } from "../renderer/state/gameTypes";
import { YearSimulationResult } from "./salesTypes";
import { computeStatsForDesign } from "./statCalculation";
import { getPriceCeiling } from "./demographicData";

// ==================== Brand Reach ====================

/** S-curve steepness — higher = steeper transition in the middle */
const S_CURVE_STEEPNESS = 0.08;
/** S-curve midpoint (reach % where growth is fastest) */
const S_CURVE_MIDPOINT = 50;
/** Awareness budget divisor — every $X of awareness budget contributes 1 raw reach point */
const AWARENESS_BUDGET_DIVISOR = 500_000;
/** Word-of-mouth divisor — every X units sold in a demographic contributes 1 raw reach point */
const WORD_OF_MOUTH_DIVISOR = 5_000;
/** Marketing campaign divisor — every $X of campaign spend contributes 1 raw reach point (S-curve, year-over-year) */
const CAMPAIGN_REACH_DIVISOR = 2_000_000;
/** Immediate reach divisor — every $X of campaign spend gives 1% immediate reach (flat, same-year) */
const CAMPAIGN_IMMEDIATE_REACH_DIVISOR = 500_000;
/** Reach decay rate when no products on sale (proportional, per year) */
const REACH_INACTIVITY_DECAY = 0.10;
/** Competitor time-in-market reach growth (raw reach points per year just for existing) */
const COMPETITOR_TIME_IN_MARKET_BONUS = 0.5;

/**
 * Logistic S-curve growth factor.
 * Low reach → slow growth (cold start), mid reach → fast growth, high reach → plateaus.
 */
function sCurveGrowthFactor(currentReach: number): number {
  const x = currentReach;
  const expTerm = Math.exp(-S_CURVE_STEEPNESS * (x - S_CURVE_MIDPOINT));
  // Derivative of logistic: peaks at midpoint, low at extremes
  return S_CURVE_STEEPNESS * expTerm / Math.pow(1 + expTerm, 2);
}

/**
 * Compute the immediate (same-year) reach boost from marketing campaign spend.
 * This is a flat addition (not S-curved) so it works even at 0% reach.
 * Used by simulateYear and projectDemandRange to gate demand before year-end.
 * @param extraSpend Additional campaign spend not yet committed to state (e.g. from wizard)
 */
export function getCampaignReachBoost(state: GameState, extraSpend: number = 0): number {
  let totalCampaignSpend = extraSpend;
  for (const model of state.models) {
    const plan = model.manufacturingPlan;
    if (plan && plan.year === state.year && plan.marketing.cost > 0) {
      totalCampaignSpend += plan.marketing.cost;
    }
  }
  return totalCampaignSpend / CAMPAIGN_IMMEDIATE_REACH_DIVISOR;
}

/**
 * Update per-demographic brand reach for the player.
 * Growth sources: awareness budget (all demographics), sponsorships (targeted), word of mouth (from sales), marketing campaigns (secondary).
 */
export function updateBrandReach(
  state: GameState,
  result: YearSimulationResult,
): Record<DemographicId, number> {
  const oldReach = state.brandReach;
  const newReach = { ...oldReach };
  const hasProductsOnSale = state.models.some(
    (m) => m.status === "manufacturing" || m.status === "onSale",
  );

  // Build per-demographic units sold from player results
  const unitsByDemographic: Partial<Record<DemographicId, number>> = {};
  for (const pr of result.playerResults) {
    for (const db of pr.demographicBreakdown) {
      const demId = db.demographicId;
      unitsByDemographic[demId] = (unitsByDemographic[demId] ?? 0) + db.unitsDemanded;
    }
  }

  // Total marketing campaign spend this year (across all player laptops)
  let totalCampaignSpend = 0;
  for (const model of state.models) {
    const plan = model.manufacturingPlan;
    if (plan && plan.year === state.year && plan.marketing.cost > 0) {
      totalCampaignSpend += plan.marketing.cost;
    }
  }

  for (const dem of DEMOGRAPHICS) {
    const demId = dem.id;
    const current = oldReach[demId] ?? 0;

    // Raw growth inputs
    let rawGrowth = 0;

    // 1. Awareness budget — small uniform push across all demographics
    rawGrowth += state.brandAwarenessBudget / AWARENESS_BUDGET_DIVISOR;

    // 2. Sponsorships — targeted boosts
    for (const sponsorshipId of state.sponsorships) {
      const sponsorship = SPONSORSHIPS.find((s) => s.id === sponsorshipId);
      if (sponsorship) {
        rawGrowth += sponsorship.reachBonus[demId] ?? 0;
      }
    }

    // 3. Word of mouth — organic from units sold in this demographic
    const unitsSold = unitsByDemographic[demId] ?? 0;
    rawGrowth += unitsSold / WORD_OF_MOUTH_DIVISOR;

    // 4. Marketing campaigns — secondary reach from ad spend (uniform across demographics)
    rawGrowth += totalCampaignSpend / CAMPAIGN_REACH_DIVISOR;

    // Apply S-curve: growth is modulated by current reach position
    const growth = rawGrowth * sCurveGrowthFactor(current) * 100;

    // Decay if no products on sale
    const decay = !hasProductsOnSale ? current * REACH_INACTIVITY_DECAY : 0;

    newReach[demId] = Math.max(0, Math.min(100, current + growth - decay));
  }

  return newReach;
}

/**
 * Update per-demographic brand reach for a competitor.
 * Competitors grow reach from sales volume + time-in-market (simplified).
 */
export function updateCompetitorBrandReach(
  comp: CompetitorState,
  result: YearSimulationResult,
): Record<DemographicId, number> {
  const oldReach = comp.brandReach;
  const newReach = { ...oldReach };

  // Build per-demographic units sold
  const compResults = result.laptopResults.filter((r) => r.owner === comp.id);
  const unitsByDemographic: Partial<Record<DemographicId, number>> = {};
  for (const cr of compResults) {
    for (const db of cr.demographicBreakdown) {
      const demId = db.demographicId;
      unitsByDemographic[demId] = (unitsByDemographic[demId] ?? 0) + db.unitsDemanded;
    }
  }

  for (const dem of DEMOGRAPHICS) {
    const demId = dem.id;
    const current = oldReach[demId] ?? 0;

    // Competitor reach growth from sales + time-in-market
    const unitsSold = unitsByDemographic[demId] ?? 0;
    const rawGrowth = unitsSold / WORD_OF_MOUTH_DIVISOR + COMPETITOR_TIME_IN_MARKET_BONUS;
    const growth = rawGrowth * sCurveGrowthFactor(current) * 100;

    newReach[demId] = Math.max(0, Math.min(100, current + growth));
  }

  return newReach;
}

// ==================== Brand Perception ====================

/** Perception decay factor (50% fade per year — recency bias) */
const PERCEPTION_DECAY = 0.5;
/** Negativity bias multiplier — bad value-for-money hits harder */
const NEGATIVITY_BIAS = 1.5;

/**
 * Update global brand perception based on value-for-money of products sold.
 * newPerception = oldPerception * decay + thisYearContribution
 */
export function updateBrandPerception(
  state: GameState,
  result: YearSimulationResult,
): number {
  const old = state.brandPerception;

  // Calculate this year's contribution from value-for-money
  let weightedContribution = 0;
  let totalWeight = 0;

  for (const pr of result.playerResults) {
    if (pr.unitsSold <= 0) continue;
    const model = state.models.find((m) => m.design.id === pr.laptopId);
    if (!model) continue;

    const stats = computeStatsForDesign(model.design, state.year);

    // For each demographic that bought this laptop, compute value-for-money
    for (const db of pr.demographicBreakdown) {
      if (db.unitsDemanded <= 0) continue;
      const dem = DEMOGRAPHICS.find((d) => d.id === db.demographicId);
      if (!dem) continue;

      // Weighted stat score for this demographic
      let statScore = 0;
      for (const stat of ALL_STATS) {
        statScore += (stats[stat] ?? 0) * (dem.statWeights[stat] ?? 0);
      }

      // Price relative to demographic ceiling
      const ceiling = getPriceCeiling(dem.id, state.year);
      if (model.retailPrice == null) continue;
      const priceRatio = model.retailPrice / ceiling;

      // Value-for-money: high stat score relative to price = positive, overpaying = negative
      const valueForMoney = statScore - priceRatio;

      // Apply negativity bias
      const adjusted = valueForMoney < 0 ? valueForMoney * NEGATIVITY_BIAS : valueForMoney;

      weightedContribution += adjusted * db.unitsDemanded;
      totalWeight += db.unitsDemanded;
    }
  }

  const thisYearContribution = totalWeight > 0 ? weightedContribution / totalWeight : 0;

  // Scale contribution to reasonable perception range (roughly -5 to +5 per year)
  const scaledContribution = thisYearContribution * 5;

  const newPerception = old * PERCEPTION_DECAY + scaledContribution;
  return Math.max(-50, Math.min(50, newPerception));
}

/**
 * Update global brand perception for a competitor.
 * Simplified: competitors decay toward zero over time.
 */
export function updateCompetitorBrandPerception(
  comp: CompetitorState,
  _result: YearSimulationResult,
): number {
  return comp.brandPerception * PERCEPTION_DECAY;
}

// ==================== Niche Reputation (unchanged) ====================

/** How quickly niche reputation moves toward current product focus (0-1) */
const NICHE_LERP_RATE = 0.3;
/** Tech Enthusiast demographic ID */
const TECH_ENTHUSIAST_ID = "techEnthusiast";
/** Extra weight given to Tech Enthusiast sales for niche movement */
const TECH_ENTHUSIAST_MULTIPLIER = 2.0;

/**
 * Build a weighted-average stat vector across all laptops in the market for
 * the given year. Used to normalise niche reputation against market context.
 */
function buildMarketStatProfile(
  state: GameState,
  result: YearSimulationResult,
): Record<LaptopStat, number> {
  const accum = {} as Record<LaptopStat, number>;
  for (const stat of ALL_STATS) accum[stat] = 0;
  let totalWeight = 0;

  for (const lr of result.laptopResults) {
    if (lr.unitsSold <= 0) continue;

    // Find the design — player or competitor
    let design;
    if (lr.owner === "player") {
      design = state.models.find((m) => m.design.id === lr.laptopId)?.design;
    } else {
      const comp = state.competitors.find((c) => c.id === lr.owner);
      design = comp?.models.find((m) => m.design.id === lr.laptopId)?.design;
    }
    if (!design) continue;

    const stats = computeStatsForDesign(design, state.year);
    for (const stat of ALL_STATS) {
      accum[stat] += (stats[stat] ?? 0) * lr.unitsSold;
    }
    totalWeight += lr.unitsSold;
  }

  if (totalWeight === 0) return accum;
  for (const stat of ALL_STATS) accum[stat] /= totalWeight;
  return accum;
}

/**
 * Update niche reputation based on shipped laptop stats, weighted by units sold.
 * Normalised against market-wide stats so "scoring well" is relative to competitors.
 * Tech Enthusiast sales accelerate reputation movement.
 */
export function updateNicheReputation(
  state: GameState,
  result: YearSimulationResult,
): Record<string, number> {
  const old = state.nicheReputation;
  const playerResults = result.playerResults;

  if (playerResults.length === 0) {
    // No sales — decay toward zero
    const decayed: Record<string, number> = {};
    for (const stat of ALL_STATS) {
      const current = old[stat] ?? 0;
      decayed[stat] = current * (1 - NICHE_LERP_RATE);
    }
    return decayed;
  }

  // Market-wide average stat profile for normalisation
  const marketProfile = buildMarketStatProfile(state, result);

  // Build a weighted stat profile from player laptops sold this year.
  // Weight = units sold, with Tech Enthusiast sales counting extra.
  const statAccum = {} as Record<LaptopStat, number>;
  for (const stat of ALL_STATS) statAccum[stat] = 0;
  let totalWeight = 0;

  for (const pr of playerResults) {
    const model = state.models.find((m) => m.design.id === pr.laptopId);
    if (!model) continue;

    const stats = computeStatsForDesign(model.design, state.year);

    // Calculate effective weight: base units + extra for Tech Enthusiast sales
    const techSales = pr.demographicBreakdown
      .filter((d) => d.demographicId === TECH_ENTHUSIAST_ID)
      .reduce((sum, d) => sum + d.unitsDemanded, 0);
    const otherSales = pr.unitsSold - Math.min(techSales, pr.unitsSold);
    const weight = otherSales + techSales * TECH_ENTHUSIAST_MULTIPLIER;

    for (const stat of ALL_STATS) {
      statAccum[stat] += (stats[stat] ?? 0) * weight;
    }
    totalWeight += weight;
  }

  if (totalWeight === 0) return old;

  // Average player stat profile
  const avgStats = {} as Record<LaptopStat, number>;
  for (const stat of ALL_STATS) {
    avgStats[stat] = statAccum[stat] / totalWeight;
  }

  // Normalise against market: how much better/worse than market average (0-100).
  // A stat at market average = 50, double market average = 100, zero = 0.
  const updated: Record<string, number> = {};
  for (const stat of ALL_STATS) {
    const marketAvg = marketProfile[stat] || 1;
    const ratio = avgStats[stat] / marketAvg;
    // ratio=1 means market average → target 50; ratio=2 → 100; ratio=0 → 0
    const target = Math.min(100, ratio * 50);
    const current = old[stat] ?? 0;
    updated[stat] = current + NICHE_LERP_RATE * (target - current);
  }

  return updated;
}
