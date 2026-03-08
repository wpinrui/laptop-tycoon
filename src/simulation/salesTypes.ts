import { DemographicId } from "../data/types";

/** Price ceiling for a demographic (year-2000 dollars, inflates over time) */
export interface PriceCeiling {
  demographicId: DemographicId;
  baseCeiling: number;
}

// --- Demand Pool Growth ---

/** Multiplier per demographic per era anchor year */
export interface DemandGrowthAnchor {
  year: number;
  multipliers: Record<DemographicId, number>;
}

// --- Sales Simulation Results ---

export interface DemographicSalesBreakdown {
  demographicId: DemographicId;
  appeal: number;
  marketShare: number;
  unitsDemanded: number;
}

export interface LaptopSalesResult {
  laptopId: string;
  owner: "player" | string; // competitor id
  retailPrice: number;
  unitsDemanded: number;
  unitsSold: number;
  unsoldUnits: number;
  revenue: number;
  manufacturingCost: number;
  profit: number;
  demographicBreakdown: DemographicSalesBreakdown[];
}

export interface YearSimulationResult {
  year: number;
  laptopResults: LaptopSalesResult[];
  playerResults: LaptopSalesResult[];
  totalRevenue: number;
  totalProfit: number;
  cashAfterResolution: number;
  gameOver: boolean;
}

export interface DemandProjection {
  low: number;
  high: number;
  expected: number;
}
