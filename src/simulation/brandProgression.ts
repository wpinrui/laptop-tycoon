/**
 * Brand reach (per-demographic, S-curve) and brand perception (per-demographic, decay + value-for-money).
 * Called at year-end after sales simulation resolves.
 */

import { ALL_STATS, DemographicId } from "../data/types";
import { DEMOGRAPHICS } from "../data/demographics";
import { SPONSORSHIPS } from "../data/sponsorships";
import { GameState, CompetitorState } from "../renderer/state/gameTypes";
import { YearSimulationResult } from "./salesTypes";
import { computeStatsForDesign } from "./statCalculation";
import { getPriceCeiling } from "./demographicData";
import {
  S_CURVE_STEEPNESS,
  S_CURVE_MIDPOINT,
  AWARENESS_DIVISOR,
  WOM_DIVISOR,
  CAMPAIGN_DIVISOR,
  CAMPAIGN_IMMEDIATE_REACH_DIVISOR,
  PERCEPTION_CONTRIBUTION_SCALE,
  REACH_INACTIVITY_DECAY,
  COMPETITOR_TIME_IN_MARKET_BONUS,
  PERCEPTION_DECAY,
  NEGATIVITY_MULTIPLIER,
} from "./tunables";

// ==================== Brand Reach ====================

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

/** Sum marketing campaign spend across all player laptops for the current year */
function getTotalCampaignSpend(state: GameState): number {
  let total = 0;
  for (const model of state.models) {
    const plan = model.manufacturingPlan;
    if (plan && plan.year === state.year && plan.marketing.cost > 0) {
      total += plan.marketing.cost;
    }
  }
  return total;
}

/** Average reach across all demographics */
export function averageReach(reach: Record<DemographicId, number>): number {
  const values = Object.values(reach);
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/**
 * Compute the immediate (same-year) reach boost from marketing campaign spend.
 * This is a flat addition (not S-curved) so it works even at 0% reach.
 * Used by simulateYear and projectDemandRange to gate demand before year-end.
 * @param extraSpend Additional campaign spend not yet committed to state (e.g. from wizard)
 */
export function getCampaignReachBoost(state: GameState, extraSpend: number = 0): number {
  return (getTotalCampaignSpend(state) + extraSpend) / CAMPAIGN_IMMEDIATE_REACH_DIVISOR;
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

  const totalCampaignSpend = getTotalCampaignSpend(state);

  for (const dem of DEMOGRAPHICS) {
    const demId = dem.id;
    const current = oldReach[demId] ?? 0;

    // Raw growth inputs
    let rawGrowth = 0;

    // 1. Awareness budget — small uniform push across all demographics
    rawGrowth += state.brandAwarenessBudget / AWARENESS_DIVISOR;

    // 2. Sponsorships — targeted boosts
    for (const sponsorshipId of state.sponsorships) {
      const sponsorship = SPONSORSHIPS.find((s) => s.id === sponsorshipId);
      if (sponsorship) {
        rawGrowth += sponsorship.reachBonus[demId] ?? 0;
      }
    }

    // 3. Word of mouth — organic from units sold in this demographic
    const unitsSold = unitsByDemographic[demId] ?? 0;
    rawGrowth += unitsSold / WOM_DIVISOR;

    // 4. Marketing campaigns — secondary reach from ad spend (uniform across demographics)
    rawGrowth += totalCampaignSpend / CAMPAIGN_DIVISOR;

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
    const rawGrowth = unitsSold / WOM_DIVISOR + COMPETITOR_TIME_IN_MARKET_BONUS;
    const growth = rawGrowth * sCurveGrowthFactor(current) * 100;

    newReach[demId] = Math.max(0, Math.min(100, current + growth));
  }

  return newReach;
}

// ==================== Brand Perception ====================

/**
 * Update per-demographic brand perception based on value-for-money of products sold.
 * Each demographic's perception is shaped only by purchases made by that demographic.
 * newPerception[dem] = oldPerception[dem] * decay + thisYearContribution[dem]
 */
export function updateBrandPerception(
  state: GameState,
  result: YearSimulationResult,
): Record<DemographicId, number> {
  const oldPerception = state.brandPerception;
  const newPerception = { ...oldPerception };

  // Accumulate weighted contributions per demographic
  const contributionByDem: Partial<Record<DemographicId, number>> = {};
  const weightByDem: Partial<Record<DemographicId, number>> = {};

  for (const pr of result.playerResults) {
    if (pr.unitsSold <= 0) continue;
    const model = state.models.find((m) => m.design.id === pr.laptopId);
    if (!model) continue;

    const stats = computeStatsForDesign(model.design, state.year);

    for (const db of pr.demographicBreakdown) {
      if (db.unitsDemanded <= 0) continue;
      const dem = DEMOGRAPHICS.find((d) => d.id === db.demographicId);
      if (!dem) continue;

      let statScore = 0;
      for (const stat of ALL_STATS) {
        statScore += (stats[stat] ?? 0) * (dem.statWeights[stat] ?? 0);
      }

      const ceiling = getPriceCeiling(dem.id, state.year);
      if (model.retailPrice == null) continue;
      const priceRatio = model.retailPrice / ceiling;

      const valueForMoney = statScore - priceRatio;
      const adjusted = valueForMoney < 0 ? valueForMoney * NEGATIVITY_MULTIPLIER : valueForMoney;

      contributionByDem[dem.id] = (contributionByDem[dem.id] ?? 0) + adjusted * db.unitsDemanded;
      weightByDem[dem.id] = (weightByDem[dem.id] ?? 0) + db.unitsDemanded;
    }
  }

  for (const dem of DEMOGRAPHICS) {
    const demId = dem.id;
    const old = oldPerception[demId] ?? 0;
    const totalContribution = contributionByDem[demId] ?? 0;
    const totalWeight = weightByDem[demId] ?? 0;

    const thisYearContribution = totalWeight > 0 ? totalContribution / totalWeight : 0;
    const scaledContribution = thisYearContribution * PERCEPTION_CONTRIBUTION_SCALE;

    newPerception[demId] = Math.max(-50, Math.min(50, old * PERCEPTION_DECAY + scaledContribution));
  }

  return newPerception;
}

/**
 * Update per-demographic brand perception for a competitor.
 * Simplified: each demographic's perception decays toward zero over time.
 */
export function updateCompetitorBrandPerception(
  comp: CompetitorState,
  _result: YearSimulationResult,
): Record<DemographicId, number> {
  const newPerception = { ...comp.brandPerception };
  for (const dem of DEMOGRAPHICS) {
    newPerception[dem.id] = (newPerception[dem.id] ?? 0) * PERCEPTION_DECAY;
  }
  return newPerception;
}

