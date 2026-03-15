/**
 * Brand reach (per-demographic) and brand perception (per-demographic, rolling window + value-for-money).
 * Player reach is driven by marketing campaigns (acquisitions, spillover, decay).
 * Competitor reach uses word-of-mouth from sales results.
 */

import { DemographicId } from "../data/types";
import { DEMOGRAPHICS } from "../data/demographics";
import { GameState, CompanyState, getPlayerCompany, MarketingCampaign } from "../renderer/state/gameTypes";
import {
  getMaxTier,
  getEffectiveReachCeiling,
  getAdjacencies,
} from "../data/marketingChannels";
import { LaptopSalesResult, QuarterSimulationResult, sellThroughRate, marketAverageRawVP } from "./salesTypes";
import {
  S_CURVE_STEEPNESS,
  S_CURVE_MIDPOINT,
  WOM_DIVISOR,
  PERCEPTION_CONTRIBUTION_SCALE,
  PERCEPTION_WINDOW_SIZE,
  REACH_INACTIVITY_DECAY,
  NEGATIVITY_MULTIPLIER,
  PERCEPTION_MIN,
  PERCEPTION_MAX,
  TIER_ACQUISITIONS,
  SPILLOVER_PENALTY,
  REACH_DECAY_BASE,
} from "./tunables";
import { getDemandPoolSize } from "./demographicData";
import { STARTING_DEMAND_POOL } from "../data/startingDemand";

// ==================== Brand Reach (Player — Campaign-Based) ====================

/**
 * Apply marketing campaign contributions to player brand reach.
 * Handles:
 *   1. Direct acquisitions → reach growth (capped at tier ceiling)
 *   2. Social proximity spillover to adjacent demographics
 *   3. Permeability-driven decay for demographics with no active campaign
 *
 * This must run during quarter result application so that reach is updated
 * for the next quarter's sales simulation.
 */
export function applyMarketingToReach(state: GameState): Record<DemographicId, number> {
  const player = getPlayerCompany(state);
  const oldReach = player.brandReach;
  const newReach = { ...oldReach };
  const campaigns = state.marketingCampaigns;

  // Step 1: Accumulate acquisitions per demographic (direct + spillover)
  const acquisitionsByDem: Partial<Record<DemographicId, number>> = {};
  const directCampaignByDem: Partial<Record<DemographicId, MarketingCampaign>> = {};

  for (const campaign of campaigns) {
    if (campaign.paused) continue;

    const acq = TIER_ACQUISITIONS[campaign.tier];
    const demId = campaign.demographicId;
    acquisitionsByDem[demId] = (acquisitionsByDem[demId] ?? 0) + acq;
    directCampaignByDem[demId] = campaign;

    // Spillover to adjacent demographics
    const adjacencies = getAdjacencies(demId);
    for (const { demographicId: adjDemId, weight } of adjacencies) {
      const spilloverAcq = acq * weight * SPILLOVER_PENALTY;
      acquisitionsByDem[adjDemId] = (acquisitionsByDem[adjDemId] ?? 0) + spilloverAcq;
    }
  }

  // Step 2: Apply growth/decay per demographic
  for (const dem of DEMOGRAPHICS) {
    const demId = dem.id;
    const current = oldReach[demId] ?? 0;
    const totalAcq = acquisitionsByDem[demId] ?? 0;
    const campaign = directCampaignByDem[demId];

    const basePool = STARTING_DEMAND_POOL[demId];
    const poolSize = getDemandPoolSize(demId, state.year, basePool);
    const reachDelta = poolSize > 0 ? (totalAcq / poolSize) * 100 : 0;

    if (campaign) {
      // Has direct (non-paused) campaign — grow toward ceiling
      const maxTier = getMaxTier(dem.permeability);
      const ceiling = getEffectiveReachCeiling(campaign.tier, maxTier);

      if (current < ceiling) {
        // Grow from acquisitions, cap at ceiling
        newReach[demId] = Math.min(ceiling, current + reachDelta);
      } else {
        // Above ceiling: gently decay toward ceiling
        const decay = REACH_DECAY_BASE * (1 + dem.permeability);
        const excess = current - ceiling;
        newReach[demId] = ceiling + excess * (1 - decay);
      }
    } else {
      // No direct campaign: full decay + any spillover growth
      const decay = REACH_DECAY_BASE * (1 + dem.permeability);
      newReach[demId] = Math.max(0, Math.min(100, current * (1 - decay) + reachDelta));
    }
  }

  return newReach;
}

// ==================== Brand Reach (Competitors — WoM-Based) ====================

/**
 * Logistic S-curve growth factor with permeability floor.
 * Used for competitor reach growth via word-of-mouth.
 */
function sCurveGrowthFactor(currentReach: number, permeability: number): number {
  const x = currentReach;
  const expTerm = Math.exp(-S_CURVE_STEEPNESS * (x - S_CURVE_MIDPOINT));
  const baseFactor = S_CURVE_STEEPNESS * expTerm / Math.pow(1 + expTerm, 2);
  const peakFactor = S_CURVE_STEEPNESS / 4;
  const floor = permeability * peakFactor;
  return Math.max(baseFactor, floor);
}

/** Aggregate units sold per demographic from laptop results */
function buildUnitsByDemographic(
  results: LaptopSalesResult[],
): Partial<Record<DemographicId, number>> {
  const units: Partial<Record<DemographicId, number>> = {};
  for (const r of results) {
    for (const db of r.demographicBreakdown) {
      const demId = db.demographicId;
      units[demId] = (units[demId] ?? 0) + db.unitsDemanded;
    }
  }
  return units;
}

/** Apply S-curve growth, inactivity decay, and clamp reach to [0, 100] */
function applyReachGrowth(
  current: number,
  rawGrowth: number,
  permeability: number,
  hasProductsOnSale: boolean,
): number {
  const growth = rawGrowth * sCurveGrowthFactor(current, permeability) * 100;
  const decay = !hasProductsOnSale ? current * (REACH_INACTIVITY_DECAY / 4) : 0;
  return Math.max(0, Math.min(100, current + growth - decay));
}

/** Average reach across all demographics */
export function averageReach(reach: Record<DemographicId, number>): number {
  const values = Object.values(reach);
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/**
 * Update per-demographic brand reach for a competitor (quarterly).
 * Uses WoM from sales (perception-amplified) + S-curve growth + inactivity decay.
 */
export function updateCompetitorBrandReach(
  comp: CompanyState,
  result: QuarterSimulationResult,
): Record<DemographicId, number> {
  const oldReach = comp.brandReach;
  const newReach = { ...oldReach };
  const hasProductsOnSale = comp.models.some(
    (m) => m.status === "manufacturing" || m.status === "onSale",
  );

  const compResults = result.laptopResults.filter((r) => r.owner === comp.id);
  const unitsByDemographic = buildUnitsByDemographic(compResults);

  for (const dem of DEMOGRAPHICS) {
    const demId = dem.id;
    const current = oldReach[demId] ?? 0;

    const unitsSold = unitsByDemographic[demId] ?? 0;
    const perception = comp.brandPerception[demId] ?? 0;
    const rawGrowth = (unitsSold / WOM_DIVISOR) * (1 + perception / 100);

    newReach[demId] = applyReachGrowth(current, rawGrowth, dem.permeability, hasProductsOnSale);
  }

  return newReach;
}

// ==================== Brand Perception (Rolling Window) ====================

export interface PerceptionUpdateResult {
  perception: Record<DemographicId, number>;
  history: Record<DemographicId, number[]>;
}

/**
 * Apply a single quarter of perception update for a company using a rolling window.
 * Perception is purely driven by product quality (rawVP vs market average).
 * No marketing modifiers — marketing affects reach, not perception.
 */
function applyOneQuarterPerception(
  oldHistory: Record<DemographicId, number[]>,
  allLaptopResults: LaptopSalesResult[],
  companyResults: LaptopSalesResult[],
): PerceptionUpdateResult {
  const newPerception: Partial<Record<DemographicId, number>> = {};
  const newHistory: Partial<Record<DemographicId, number[]>> = {};

  for (const dem of DEMOGRAPHICS) {
    const demId = dem.id;
    const history = [...(oldHistory[demId] ?? [])];

    const meanRawVP = marketAverageRawVP(demId, allLaptopResults);

    let weightedExperience = 0;
    let companyUnits = 0;
    for (const cr of companyResults) {
      const db = cr.demographicBreakdown.find((b) => b.demographicId === demId);
      if (db && db.unitsDemanded > 0) {
        const units = db.unitsDemanded * sellThroughRate(cr);
        const experience = db.rawVP - meanRawVP;
        weightedExperience += experience * units;
        companyUnits += units;
      }
    }

    let experienceValue = 0;
    if (companyUnits > 0) {
      const avgExperience = weightedExperience / companyUnits;
      experienceValue = avgExperience < 0 ? avgExperience * NEGATIVITY_MULTIPLIER : avgExperience;
    }

    history.push(experienceValue);
    if (history.length > PERCEPTION_WINDOW_SIZE) {
      history.splice(0, history.length - PERCEPTION_WINDOW_SIZE);
    }

    const sum = history.reduce((s, v) => s + v, 0);
    const mean = sum / history.length;
    const perception = mean * PERCEPTION_CONTRIBUTION_SCALE;
    newPerception[demId] = Math.max(PERCEPTION_MIN, Math.min(PERCEPTION_MAX, perception));
    newHistory[demId] = history;
  }

  return {
    perception: newPerception as Record<DemographicId, number>,
    history: newHistory as Record<DemographicId, number[]>,
  };
}

/**
 * Apply a single quarter of perception update for any company.
 * Returns both the new perception values and the updated history window.
 */
export function applySingleQuarterPerception(
  company: CompanyState,
  allLaptopResults: LaptopSalesResult[],
): PerceptionUpdateResult {
  const companyResults = allLaptopResults.filter((r) => r.owner === company.id);
  const history = company.perceptionHistory ?? {};
  return applyOneQuarterPerception(history, allLaptopResults, companyResults);
}
