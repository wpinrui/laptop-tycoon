import { DemographicId } from "../data/types";
import { PriceCeiling, DemandGrowthAnchor } from "./salesTypes";
import { PRICE_INFLATION_RATE, PRICE_BASE_YEAR, REPLACEMENT_CYCLE, QUARTER_SHARES, QUARTER_SHARES_SUM } from "./tunables";
import { Quarter } from "../renderer/state/gameTypes";
import { STARTING_DEMAND_POOL } from "../data/startingDemand";

// --- Price Ceilings (year-2000 baseline, inflates ~3% per year) ---

export const PRICE_CEILINGS: PriceCeiling[] = [
  // Generalist
  { demographicId: "budgetBuyer", baseCeiling: 600 },
  { demographicId: "student", baseCeiling: 800 },
  { demographicId: "generalConsumer", baseCeiling: 1000 },
  { demographicId: "educationK12", baseCeiling: 500 },
  { demographicId: "businessProfessional", baseCeiling: 1500 },
  { demographicId: "corporate", baseCeiling: 1800 },
  { demographicId: "techEnthusiast", baseCeiling: 1500 },
  { demographicId: "developer", baseCeiling: 2000 },
  { demographicId: "gamer", baseCeiling: 2000 },
  { demographicId: "creativeProfessional", baseCeiling: 2500 },
  // Niche
  { demographicId: "writer", baseCeiling: 1200 },
  { demographicId: "musicProducer", baseCeiling: 2000 },
  { demographicId: "digitalNomad", baseCeiling: 2000 },
  { demographicId: "fieldWorker", baseCeiling: 2500 },
  { demographicId: "videoEditor", baseCeiling: 2500 },
  { demographicId: "streamer", baseCeiling: 2500 },
  { demographicId: "desktopReplacement", baseCeiling: 2500 },
  { demographicId: "threeDArtist", baseCeiling: 3000 },
  { demographicId: "dayTrader", baseCeiling: 3000 },
  { demographicId: "esportsPro", baseCeiling: 3500 },
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
      developer: 1.0, educationK12: 1.0,
      videoEditor: 1.0, threeDArtist: 1.0, musicProducer: 1.0,
      esportsPro: 1.0, streamer: 1.0, digitalNomad: 1.0,
      fieldWorker: 1.0, writer: 1.0, dayTrader: 1.0, desktopReplacement: 1.0,
    },
  },
  {
    year: 2005,
    multipliers: {
      corporate: 1.3, businessProfessional: 1.5, student: 1.4,
      creativeProfessional: 1.6, gamer: 3.0, techEnthusiast: 1.4,
      generalConsumer: 1.8, budgetBuyer: 1.6,
      developer: 1.5, educationK12: 1.3,
      videoEditor: 1.8, threeDArtist: 1.6, musicProducer: 1.4,
      esportsPro: 4.0, streamer: 5.0, digitalNomad: 2.0,
      fieldWorker: 1.2, writer: 1.3, dayTrader: 2.5, desktopReplacement: 1.5,
    },
  },
  {
    year: 2010,
    multipliers: {
      corporate: 1.8, businessProfessional: 2.5, student: 2.5,
      creativeProfessional: 3.0, gamer: 6.0, techEnthusiast: 2.0,
      generalConsumer: 3.5, budgetBuyer: 3.0,
      developer: 2.5, educationK12: 2.0,
      videoEditor: 3.5, threeDArtist: 3.0, musicProducer: 2.5,
      esportsPro: 10.0, streamer: 15.0, digitalNomad: 4.0,
      fieldWorker: 1.5, writer: 1.8, dayTrader: 5.0, desktopReplacement: 2.5,
    },
  },
  {
    year: 2015,
    multipliers: {
      corporate: 2.2, businessProfessional: 3.5, student: 4.0,
      creativeProfessional: 5.0, gamer: 10.0, techEnthusiast: 2.5,
      generalConsumer: 5.0, budgetBuyer: 4.5,
      developer: 4.0, educationK12: 3.5,
      videoEditor: 6.0, threeDArtist: 5.0, musicProducer: 4.0,
      esportsPro: 20.0, streamer: 40.0, digitalNomad: 8.0,
      fieldWorker: 2.0, writer: 2.5, dayTrader: 8.0, desktopReplacement: 3.5,
    },
  },
  {
    year: 2020,
    multipliers: {
      corporate: 2.5, businessProfessional: 4.5, student: 6.0,
      creativeProfessional: 7.0, gamer: 15.0, techEnthusiast: 3.0,
      generalConsumer: 6.5, budgetBuyer: 6.0,
      developer: 6.0, educationK12: 5.0,
      videoEditor: 8.0, threeDArtist: 7.0, musicProducer: 5.5,
      esportsPro: 30.0, streamer: 80.0, digitalNomad: 15.0,
      fieldWorker: 2.5, writer: 3.5, dayTrader: 12.0, desktopReplacement: 4.0,
    },
  },
  {
    year: 2025,
    multipliers: {
      corporate: 2.8, businessProfessional: 5.0, student: 7.0,
      creativeProfessional: 8.0, gamer: 18.0, techEnthusiast: 3.5,
      generalConsumer: 7.5, budgetBuyer: 7.0,
      developer: 8.0, educationK12: 6.0,
      videoEditor: 12.0, threeDArtist: 9.0, musicProducer: 7.0,
      esportsPro: 40.0, streamer: 150.0, digitalNomad: 25.0,
      fieldWorker: 3.0, writer: 4.0, dayTrader: 18.0, desktopReplacement: 5.5,
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

/** Total buyers for a demographic across all 4 quarters in a given year. */
export function getAnnualBuyers(demographicId: DemographicId, year: number): number {
  let total = 0;
  for (let q = 1; q <= 4; q++) {
    total += getQuarterlyBuyers(demographicId, year, q as 1 | 2 | 3 | 4);
  }
  return total;
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
