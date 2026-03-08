/**
 * Brand recognition growth/decay and niche reputation evolution.
 * Called at year-end after sales simulation resolves.
 */

import { ALL_STATS, LaptopStat } from "../data/types";
import { GameState } from "../renderer/state/gameTypes";
import { YearSimulationResult } from "./salesTypes";
import { computeStatsForDesign } from "./statCalculation";

// --- Brand Recognition Tuning ---

/** Units sold per +1 brand recognition */
const SALES_VOLUME_DIVISOR = 10_000;
/** Marketing spend per +1 brand recognition */
const MARKETING_SPEND_DIVISOR = 2_000_000;
/** Time-in-market bonus per year with products on sale */
const TIME_IN_MARKET_BONUS = 1;
/** Decay when player has no products on sale */
const INACTIVITY_DECAY = -5;
/** Decay when player has products but sold very few */
const POOR_SALES_DECAY = -2;
/** Threshold below which sales are considered "poor" */
const POOR_SALES_THRESHOLD = 1_000;

/**
 * Update brand recognition based on year-end results.
 * Grows with: sales volume, marketing spend, time in market.
 * Decays with: inactivity (no products on sale), poor sales.
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

  // Growth components
  const salesGrowth = totalUnitsSold / SALES_VOLUME_DIVISOR;
  const marketingGrowth = totalMarketingSpend / MARKETING_SPEND_DIVISOR;
  const timeBonus = hasProductsOnSale ? TIME_IN_MARKET_BONUS : 0;

  // Decay component
  let decay = 0;
  if (!hasProductsOnSale) {
    decay = INACTIVITY_DECAY;
  } else if (totalUnitsSold < POOR_SALES_THRESHOLD) {
    decay = POOR_SALES_DECAY;
  }

  const delta = salesGrowth + marketingGrowth + timeBonus + decay;
  return Math.max(0, Math.min(100, old + delta));
}

// --- Niche Reputation Tuning ---

/** How quickly niche reputation moves toward current product focus (0-1) */
const NICHE_LERP_RATE = 0.3;
/** Tech Enthusiast demographic ID */
const TECH_ENTHUSIAST_ID = "techEnthusiast";
/** Extra weight given to Tech Enthusiast sales for niche movement */
const TECH_ENTHUSIAST_MULTIPLIER = 2.0;

/**
 * Update niche reputation based on shipped laptop stats, weighted by units sold.
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

  // Build a weighted stat profile from player laptops sold this year.
  // Weight = units sold, with Tech Enthusiast sales counting extra.
  const statAccum: Record<LaptopStat, number> = {} as Record<LaptopStat, number>;
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

  // Normalise to get average stat profile (raw scores)
  const avgStats: Record<string, number> = {};
  for (const stat of ALL_STATS) {
    avgStats[stat] = statAccum[stat] / totalWeight;
  }

  // Find the max raw stat to normalise into 0-100 range
  const maxStat = Math.max(...ALL_STATS.map((s) => avgStats[s]), 1);

  // Lerp niche reputation toward normalised stat profile
  const updated: Record<string, number> = {};
  for (const stat of ALL_STATS) {
    const target = (avgStats[stat] / maxStat) * 100;
    const current = old[stat] ?? 0;
    updated[stat] = current + NICHE_LERP_RATE * (target - current);
  }

  return updated;
}
