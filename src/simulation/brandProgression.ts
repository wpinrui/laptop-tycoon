/**
 * Brand recognition growth/decay and niche reputation evolution.
 * Called at year-end after sales simulation resolves.
 */

import { ALL_STATS, LaptopStat } from "../data/types";
import { GameState, CompetitorState } from "../renderer/state/gameTypes";
import { YearSimulationResult } from "./salesTypes";
import { computeStatsForDesign } from "./statCalculation";

// --- Brand Recognition Tuning ---

/** Units sold per +1 raw brand recognition growth */
const SALES_VOLUME_DIVISOR = 10_000;
/** Marketing spend per +1 raw brand recognition growth */
const MARKETING_SPEND_DIVISOR = 2_000_000;
/** Time-in-market bonus per year with products on sale */
const TIME_IN_MARKET_BONUS = 1;
/** Proportional decay rate when player has no products on sale */
const INACTIVITY_DECAY_RATE = 0.15;
/** Proportional decay rate when player has products but poor sales */
const POOR_SALES_DECAY_RATE = 0.05;
/** Threshold below which sales are considered "poor" */
const POOR_SALES_THRESHOLD = 1_000;

/**
 * Update brand recognition with diminishing returns.
 * Growth is scaled by (1 - recognition/100) so it's harder to gain at higher levels.
 * Decay is proportional to current recognition.
 */
export function updateBrandRecognition(
  state: GameState,
  result: YearSimulationResult,
): number {
  const old = state.brandRecognition;

  const playerResults = result.playerResults;
  const totalUnitsSold = playerResults.reduce((sum, r) => sum + r.unitsSold, 0);

  // Marketing spend from current-year manufacturing plans
  const totalMarketingSpend = state.models.reduce((sum, m) => {
    const plan = m.manufacturingPlan;
    if (plan && plan.year === state.year) return sum + plan.marketing.cost;
    return sum;
  }, 0);

  const hasProductsOnSale = state.models.some(
    (m) => m.status === "manufacturing" || m.status === "onSale",
  );

  // Raw growth (before diminishing returns)
  const rawGrowth =
    totalUnitsSold / SALES_VOLUME_DIVISOR +
    totalMarketingSpend / MARKETING_SPEND_DIVISOR +
    (hasProductsOnSale ? TIME_IN_MARKET_BONUS : 0);

  // Diminishing returns: harder to grow at higher recognition
  const headroom = 1 - old / 100;
  const growth = rawGrowth * headroom;

  // Proportional decay
  let decay = 0;
  if (!hasProductsOnSale) {
    decay = old * INACTIVITY_DECAY_RATE;
  } else if (totalUnitsSold < POOR_SALES_THRESHOLD) {
    decay = old * POOR_SALES_DECAY_RATE;
  }

  return Math.max(0, Math.min(100, old + growth - decay));
}

/**
 * Update a competitor's brand recognition based on their sales volume.
 */
export function updateCompetitorBrandRecognition(
  comp: CompetitorState,
  result: YearSimulationResult,
): number {
  const old = comp.brandRecognition;

  const compResults = result.laptopResults.filter((r) => r.owner === comp.id);
  const totalUnitsSold = compResults.reduce((sum, r) => sum + r.unitsSold, 0);

  const rawGrowth = totalUnitsSold / SALES_VOLUME_DIVISOR + TIME_IN_MARKET_BONUS;
  const headroom = 1 - old / 100;
  const growth = rawGrowth * headroom;

  return Math.max(0, Math.min(100, old + growth));
}

// --- Niche Reputation Tuning ---

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
