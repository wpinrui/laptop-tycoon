import { DemographicId } from "../data/types";
import { PriceCeiling, DemandGrowthAnchor } from "./salesTypes";
import { PRICE_INFLATION_RATE, PRICE_BASE_YEAR, REPLACEMENT_CYCLE, QUARTER_SHARES, QUARTER_SHARES_SUM } from "./tunables";
import { Quarter } from "../renderer/state/gameTypes";
import { STARTING_DEMAND_POOL } from "../data/startingDemand";

// --- Price Ceilings (year-2000 baseline, inflates ~3% per year) ---

export const PRICE_CEILINGS: PriceCeiling[] = [
  { demographicId: "budgetBuyer", baseCeiling: 600 },
  { demographicId: "student", baseCeiling: 800 },
  { demographicId: "generalConsumer", baseCeiling: 1000 },
  { demographicId: "businessProfessional", baseCeiling: 1500 },
  { demographicId: "corporate", baseCeiling: 1800 },
  { demographicId: "techEnthusiast", baseCeiling: 1500 },
  { demographicId: "gamer", baseCeiling: 2000 },
  { demographicId: "creativeProfessional", baseCeiling: 2500 },
];

export function getPriceCeiling(demographicId: DemographicId, year: number): number {
  const entry = PRICE_CEILINGS.find((p) => p.demographicId === demographicId);
  if (!entry) return 1000;
  const yearsElapsed = year - PRICE_BASE_YEAR;
  return Math.round(entry.baseCeiling * Math.pow(PRICE_INFLATION_RATE, yearsElapsed));
}

// --- Demand Pool Growth ---
// Multipliers relative to year-2000 starting pool. Interpolated between anchors.

export const DEMAND_GROWTH_ANCHORS: DemandGrowthAnchor[] = [
  {
    year: 2000,
    multipliers: {
      corporate: 1.0, businessProfessional: 1.0, student: 1.0,
      creativeProfessional: 1.0, gamer: 1.0, techEnthusiast: 1.0,
      generalConsumer: 1.0, budgetBuyer: 1.0,
    },
  },
  {
    year: 2005,
    multipliers: {
      corporate: 1.3, businessProfessional: 1.5, student: 1.4,
      creativeProfessional: 1.6, gamer: 3.0, techEnthusiast: 1.4,
      generalConsumer: 1.8, budgetBuyer: 1.6,
    },
  },
];

export function getDemandPoolSize(demographicId: DemographicId, year: number, basePool: number): number {
  // Find bounding anchors
  const sorted = DEMAND_GROWTH_ANCHORS;
  if (year <= sorted[0].year) return Math.round(basePool * sorted[0].multipliers[demographicId]);
  if (year >= sorted[sorted.length - 1].year) {
    return Math.round(basePool * sorted[sorted.length - 1].multipliers[demographicId]);
  }

  // Interpolate between anchors
  for (let i = 0; i < sorted.length - 1; i++) {
    if (year >= sorted[i].year && year <= sorted[i + 1].year) {
      const t = (year - sorted[i].year) / (sorted[i + 1].year - sorted[i].year);
      const low = sorted[i].multipliers[demographicId];
      const high = sorted[i + 1].multipliers[demographicId];
      return Math.round(basePool * (low + t * (high - low)));
    }
  }

  return basePool;
}

// --- Quarterly Active Buyers ---

/** How many buyers from a demographic are expected to purchase in a given quarter. */
export function getQuarterlyBuyers(demographicId: DemographicId, year: number, quarter: Quarter): number {
  const basePool = STARTING_DEMAND_POOL[demographicId];
  const population = getDemandPoolSize(demographicId, year, basePool);
  const annualActiveBuyers = population / REPLACEMENT_CYCLE[demographicId];
  const quarterShare = QUARTER_SHARES[quarter - 1] / QUARTER_SHARES_SUM;
  return Math.round(annualActiveBuyers * quarterShare);
}

// --- Screen Size Fit (soft filter) ---

export function getScreenSizeFit(
  laptopScreenSize: number,
  preferredMin: number,
  preferredMax: number,
  penaltyPerInch: number,
): number {
  if (laptopScreenSize >= preferredMin && laptopScreenSize <= preferredMax) return 1.0;

  // Distance from preferred range
  const distance = laptopScreenSize < preferredMin
    ? preferredMin - laptopScreenSize
    : laptopScreenSize - preferredMax;

  // Continuous penalty: each inch outside range reduces by penaltyPerInch
  const penalty = 1.0 - distance * penaltyPerInch;
  return Math.max(0.05, penalty); // floor at 5% to never fully zero out
}
