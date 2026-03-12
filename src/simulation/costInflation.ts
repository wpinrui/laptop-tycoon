import { COST_INFLATION, COST_BASE_YEAR } from "./tunables";

/**
 * Apply annual cost inflation to a base cost.
 * Formula: base_cost × COST_INFLATION ^ (year - COST_BASE_YEAR)
 */
export function getInflatedCost(baseCost: number, year: number): number {
  const yearsElapsed = year - COST_BASE_YEAR;
  return Math.round(baseCost * Math.pow(COST_INFLATION, yearsElapsed));
}
