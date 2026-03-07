export const REFERENCE_QUANTITY = 5_000;
export const MULTI_MODEL_OVERHEAD = 500_000;
export const DEMAND_NOISE_MIN = 5;
export const DEMAND_NOISE_MAX = 10;
export const MIN_BATCH_SIZE = 1_000;
export const MAX_PRICE_MULTIPLIER = 4;

// Per-unit cost layers (flat, on top of BOM)
export const ASSEMBLY_QA_COST = 10;
export const PACKAGING_LOGISTICS_COST = 15;

// Channel margin — retailer takes this % of retail price
export const CHANNEL_MARGIN_RATE = 0.20;

// Support budget slider range
export const SUPPORT_BUDGET_MIN = 0;
export const SUPPORT_BUDGET_MAX = 50;

// Fixed costs by model type
export const TOOLING_COST: Record<string, number> = {
  brandNew: 800_000,
  successor: 300_000,
  specBump: 0,
};

export const CERTIFICATION_COST: Record<string, number> = {
  brandNew: 50_000,
  successor: 50_000,
  specBump: 0,
};
