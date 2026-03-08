/**
 * Brand reach (per-demographic, S-curve) and brand perception (per-demographic, decay + value-for-money).
 * Called at year-end after sales simulation resolves.
 */

import { DemographicId } from "../data/types";
import { DEMOGRAPHICS } from "../data/demographics";
import { SPONSORSHIPS } from "../data/sponsorships";
import { GameState, CompanyState, getPlayerCompany } from "../renderer/state/gameTypes";
import { LaptopSalesResult, YearSimulationResult } from "./salesTypes";
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
  PERCEPTION_MIN,
  PERCEPTION_MAX,
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
  const player = getPlayerCompany(state);
  let total = 0;
  for (const model of player.models) {
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
  const player = getPlayerCompany(state);
  const oldReach = player.brandReach;
  const newReach = { ...oldReach };
  const hasProductsOnSale = player.models.some(
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
  comp: CompanyState,
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
 * Core quarterly perception update for any company.
 *
 * Per quarter:
 *   experience = company_laptop_raw_vp - mean(raw_vp of all purchased laptops in this demographic)
 *   perception_contribution = experience × volume_weight × negativity_multiplier
 *   new_perception = old_perception × (DECAY ^ 0.25) + perception_contribution
 *
 * Only purchasers affect perception — demographics that didn't buy stay at 0/neutral.
 * Applied 4 times (quarterly) to produce the annual effect.
 */
function applyQuarterlyPerception(
  oldPerception: Record<DemographicId, number>,
  allLaptopResults: LaptopSalesResult[],
  companyResults: LaptopSalesResult[],
): Record<DemographicId, number> {
  const newPerception = { ...oldPerception };
  const quarterlyDecay = Math.pow(PERCEPTION_DECAY, 0.25);

  for (const dem of DEMOGRAPHICS) {
    const demId = dem.id;
    const old = oldPerception[demId] ?? 0;

    // Collect all purchased laptop rawVPs in this demographic (all companies)
    const allPurchases: { rawVP: number; units: number }[] = [];
    for (const lr of allLaptopResults) {
      const db = lr.demographicBreakdown.find((b) => b.demographicId === demId);
      if (db && db.unitsDemanded > 0) {
        allPurchases.push({ rawVP: db.rawVP, units: db.unitsDemanded });
      }
    }

    const totalUnitsAll = allPurchases.reduce((s, p) => s + p.units, 0);
    const meanRawVP = totalUnitsAll > 0
      ? allPurchases.reduce((s, p) => s + p.rawVP * p.units, 0) / totalUnitsAll
      : 0;

    // Collect this company's purchases in this demographic
    let weightedExperience = 0;
    let companyUnits = 0;
    for (const cr of companyResults) {
      const db = cr.demographicBreakdown.find((b) => b.demographicId === demId);
      if (db && db.unitsDemanded > 0) {
        const experience = db.rawVP - meanRawVP;
        weightedExperience += experience * db.unitsDemanded;
        companyUnits += db.unitsDemanded;
      }
    }

    // Only purchasers affect perception — no purchases means decay only
    if (companyUnits <= 0) {
      newPerception[demId] = Math.max(PERCEPTION_MIN, Math.min(PERCEPTION_MAX, old * PERCEPTION_DECAY));
      continue;
    }

    // Volume-weighted average experience, apply negativity multiplier
    const avgExperience = weightedExperience / companyUnits;
    const adjusted = avgExperience < 0 ? avgExperience * NEGATIVITY_MULTIPLIER : avgExperience;
    const perceptionContribution = adjusted * PERCEPTION_CONTRIBUTION_SCALE;

    // Apply quarterly: fold 4 quarters of decay + contribution
    let perception = old;
    const quarterlyContribution = perceptionContribution / 4;
    for (let q = 0; q < 4; q++) {
      perception = perception * quarterlyDecay + quarterlyContribution;
    }

    newPerception[demId] = Math.max(PERCEPTION_MIN, Math.min(PERCEPTION_MAX, perception));
  }

  return newPerception;
}

/** Update per-demographic brand perception for any company (player or competitor). */
export function updateBrandPerception(
  company: CompanyState,
  allLaptopResults: LaptopSalesResult[],
): Record<DemographicId, number> {
  const companyResults = allLaptopResults.filter((r) => r.owner === company.id);
  return applyQuarterlyPerception(company.brandPerception, allLaptopResults, companyResults);
}
