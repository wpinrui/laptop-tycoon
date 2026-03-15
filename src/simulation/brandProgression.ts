/**
 * Brand reach (per-demographic, S-curve) and brand perception (per-demographic, rolling window + value-for-money).
 * Called quarterly after sales simulation resolves.
 */

import { DemographicId } from "../data/types";
import { DEMOGRAPHICS } from "../data/demographics";
import { GameState, CompanyState, getPlayerCompany } from "../renderer/state/gameTypes";
import {
  MARKETING_CHANNELS,
  CHANNEL_REACH_PER_TIER,
  PREMIUM_REACH_MULTIPLIER,
  AGGRESSIVE_PERCEPTION_PENALTY,
  PREMIUM_PERCEPTION_BONUS,
  PREMIUM_WOM_BONUS,
  isChannelAvailable,
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
} from "./tunables";

// ==================== Brand Reach ====================

/**
 * Logistic S-curve growth factor with permeability floor.
 * Low reach → slow growth (cold start), mid reach → fast growth, high reach → plateaus.
 * Permeability sets a minimum growth factor so permeable demographics (e.g. tech enthusiasts)
 * still grow meaningfully even at 0% reach, while mass market demographics stay punishing.
 */
function sCurveGrowthFactor(currentReach: number, permeability: number): number {
  const x = currentReach;
  const expTerm = Math.exp(-S_CURVE_STEEPNESS * (x - S_CURVE_MIDPOINT));
  // Derivative of logistic: peaks at midpoint, low at extremes
  const baseFactor = S_CURVE_STEEPNESS * expTerm / Math.pow(1 + expTerm, 2);
  // Peak of the logistic derivative (at midpoint) = steepness / 4
  const peakFactor = S_CURVE_STEEPNESS / 4;
  // Permeability floor: fraction of peak growth always available
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
 * Apply marketing channel contributions to player brand reach (pre-simulation).
 * This must run BEFORE sales simulation so that marketing spend immediately
 * affects the quarter's sales via the reach multiplier.
 */
export function applyMarketingToReach(state: GameState): Record<DemographicId, number> {
  const player = getPlayerCompany(state);
  const oldReach = player.brandReach;
  const newReach = { ...oldReach };

  for (const dem of DEMOGRAPHICS) {
    const demId = dem.id;
    const current = oldReach[demId] ?? 0;

    let rawGrowth = 0;
    for (const ac of state.activeMarketingChannels) {
      const channel = MARKETING_CHANNELS.find((c) => c.id === ac.channelId);
      if (!channel || !isChannelAvailable(channel, state.year)) continue;
      if (!channel.targetDemographics.includes(demId)) continue;

      let reachContribution = CHANNEL_REACH_PER_TIER[channel.tier];
      if (ac.mode === "premium") {
        reachContribution *= PREMIUM_REACH_MULTIPLIER;
      }
      rawGrowth += reachContribution;
    }

    if (rawGrowth > 0) {
      const growth = rawGrowth * sCurveGrowthFactor(current, dem.permeability) * 100;
      newReach[demId] = Math.max(0, Math.min(100, current + growth));
    }
  }

  return newReach;
}

/**
 * Update per-demographic brand reach for the player (post-simulation).
 * Applies word-of-mouth growth from sales results and inactivity decay.
 * Marketing channel contributions are already applied pre-simulation via applyMarketingToReach.
 */
export function updateBrandReach(
  state: GameState,
  result: QuarterSimulationResult,
): Record<DemographicId, number> {
  const player = getPlayerCompany(state);
  const oldReach = player.brandReach;
  const newReach = { ...oldReach };
  const hasProductsOnSale = player.models.some(
    (m) => m.status === "manufacturing" || m.status === "onSale",
  );

  // Build per-demographic units sold from player results
  const unitsByDemographic = buildUnitsByDemographic(result.playerResults);

  for (const dem of DEMOGRAPHICS) {
    const demId = dem.id;
    const current = oldReach[demId] ?? 0;

    // Word of mouth — organic from units sold this quarter
    //    Positive perception amplifies WOM, negative perception dampens it
    //    Premium marketing channels add a small WoM multiplier
    let womMultiplier = 1;
    for (const ac of state.activeMarketingChannels) {
      const channel = MARKETING_CHANNELS.find((c) => c.id === ac.channelId);
      if (!channel || !isChannelAvailable(channel, state.year)) continue;
      if (!channel.targetDemographics.includes(demId)) continue;
      if (ac.mode === "premium") womMultiplier += PREMIUM_WOM_BONUS;
    }

    const unitsSold = unitsByDemographic[demId] ?? 0;
    const perception = player.brandPerception[demId] ?? 0;
    const rawGrowth = (unitsSold / WOM_DIVISOR) * (1 + perception / 100) * womMultiplier;

    // Apply S-curve growth + inactivity decay
    newReach[demId] = applyReachGrowth(current, rawGrowth, dem.permeability, hasProductsOnSale);
  }

  return newReach;
}

/**
 * Update per-demographic brand reach for a competitor (quarterly).
 * Uses the same formula as player reach: WoM from sales (perception-amplified).
 * No time-in-market bonus — AI competitors use the exact same pipeline as the player.
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

  // Build per-demographic units sold
  const compResults = result.laptopResults.filter((r) => r.owner === comp.id);
  const unitsByDemographic = buildUnitsByDemographic(compResults);

  for (const dem of DEMOGRAPHICS) {
    const demId = dem.id;
    const current = oldReach[demId] ?? 0;

    // Word of mouth — same formula as player (perception-amplified)
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
 *
 * Each quarter, compute the experience score (company rawVP - market average rawVP).
 * Push it into the per-demographic history window (or 0 if no sales).
 * Perception = mean(window) × PERCEPTION_CONTRIBUTION_SCALE, clamped to [min, max].
 *
 * No exponential decay — perception is purely a function of recent experience.
 */
function applyOneQuarterPerception(
  oldHistory: Record<DemographicId, number[]>,
  allLaptopResults: LaptopSalesResult[],
  companyResults: LaptopSalesResult[],
  marketingModifiers?: Partial<Record<DemographicId, number>>,
): PerceptionUpdateResult {
  const newPerception: Partial<Record<DemographicId, number>> = {};
  const newHistory: Partial<Record<DemographicId, number[]>> = {};

  for (const dem of DEMOGRAPHICS) {
    const demId = dem.id;
    const history = [...(oldHistory[demId] ?? [])];

    const meanRawVP = marketAverageRawVP(demId, allLaptopResults);

    // Collect this company's purchases in this demographic
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

    // Compute experience value for this quarter
    let experienceValue = 0;
    if (companyUnits > 0) {
      const avgExperience = weightedExperience / companyUnits;
      experienceValue = avgExperience < 0 ? avgExperience * NEGATIVITY_MULTIPLIER : avgExperience;
    }

    // Apply marketing quality modifier (aggressive = slight penalty, premium = slight bonus)
    experienceValue += marketingModifiers?.[demId] ?? 0;

    // Push into rolling window, drop oldest if full
    history.push(experienceValue);
    if (history.length > PERCEPTION_WINDOW_SIZE) {
      history.splice(0, history.length - PERCEPTION_WINDOW_SIZE);
    }

    // Perception = mean of window × scale factor
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
 * Build per-demographic marketing perception modifiers from active channels.
 * Aggressive channels penalize perception, premium channels boost it.
 */
function buildMarketingPerceptionModifiers(
  state: GameState,
): Partial<Record<DemographicId, number>> {
  const modifiers: Partial<Record<DemographicId, number>> = {};
  for (const ac of state.activeMarketingChannels) {
    const channel = MARKETING_CHANNELS.find((c) => c.id === ac.channelId);
    if (!channel || !isChannelAvailable(channel, state.year)) continue;
    const bonus = ac.mode === "premium" ? PREMIUM_PERCEPTION_BONUS : AGGRESSIVE_PERCEPTION_PENALTY;
    for (const demId of channel.targetDemographics) {
      modifiers[demId] = (modifiers[demId] ?? 0) + bonus;
    }
  }
  return modifiers;
}

/**
 * Apply a single quarter of perception update for any company.
 * Returns both the new perception values and the updated history window.
 * Pass the GameState to include marketing perception modifiers for the player.
 */
export function applySingleQuarterPerception(
  company: CompanyState,
  allLaptopResults: LaptopSalesResult[],
  state?: GameState,
): PerceptionUpdateResult {
  const companyResults = allLaptopResults.filter((r) => r.owner === company.id);
  const history = company.perceptionHistory ?? {};
  // Only apply marketing modifiers for the player
  const modifiers = company.isPlayer && state ? buildMarketingPerceptionModifiers(state) : undefined;
  return applyOneQuarterPerception(history, allLaptopResults, companyResults, modifiers);
}
