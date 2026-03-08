import { CAMPAIGN_COST_INFLATION, CAMPAIGN_BASE_YEAR } from "./tunables";

/**
 * Apply annual cost inflation to a base cost.
 * Formula: base_cost × CAMPAIGN_COST_INFLATION ^ (year - CAMPAIGN_BASE_YEAR)
 */
export function getInflatedCost(baseCost: number, year: number): number {
  const yearsElapsed = year - CAMPAIGN_BASE_YEAR;
  return Math.round(baseCost * Math.pow(CAMPAIGN_COST_INFLATION, yearsElapsed));
}
