import { REFERENCE_QUANTITY } from "./constants";

/** EoS discount applies only to the BOM portion */
export function calculateBomUnitCost(baseBomCost: number, unitsOrdered: number): number {
  if (unitsOrdered <= 0) return baseBomCost;
  const scaleFactor = 1 / (1 + 0.4 * Math.log10(unitsOrdered / REFERENCE_QUANTITY));
  return baseBomCost * Math.max(scaleFactor, 0.7);
}

export interface CostBreakdown {
  // Per-unit
  bomCost: number;           // raw BOM from design
  eosDiscount: number;       // negative: how much EoS saves per unit
  bomAfterEos: number;       // BOM after EoS
  assemblyQa: number;
  packagingLogistics: number;
  supportBudget: number;
  manufacturingCostPerUnit: number; // sum of above
  channelMargin: number;     // retailer's cut per unit (from retail price)
  totalCostPerUnit: number;  // manufacturing + channel + support
  revenuePerUnit: number;    // retail price minus channel margin

  // Fixed costs
  toolingCost: number;
  certificationCost: number;
  multiModelOverhead: number;
  adCost: number;
  totalFixedCosts: number;

  // Amortised
  fixedCostPerUnit: number;  // totalFixedCosts / unitsOrdered
  fullyLoadedCostPerUnit: number; // totalCostPerUnit + fixedCostPerUnit

  // Totals
  totalManufacturingSpend: number;  // manufacturingCostPerUnit * qty + fixed costs (cash outlay)
}

export function calculateCostBreakdown(params: {
  baseBomCost: number;
  unitsOrdered: number;
  retailPrice: number;
  supportBudget: number;
  assemblyQa: number;
  packagingLogistics: number;
  channelMarginRate: number;
  toolingCost: number;
  certificationCost: number;
  multiModelOverhead: number;
  adCost: number;
}): CostBreakdown {
  const {
    baseBomCost, unitsOrdered, retailPrice, supportBudget,
    assemblyQa, packagingLogistics, channelMarginRate,
    toolingCost, certificationCost, multiModelOverhead, adCost,
  } = params;

  const bomAfterEos = calculateBomUnitCost(baseBomCost, unitsOrdered);
  const eosDiscount = bomAfterEos - baseBomCost;
  const manufacturingCostPerUnit = bomAfterEos + assemblyQa + packagingLogistics + supportBudget;

  const channelMargin = retailPrice * channelMarginRate;
  const revenuePerUnit = retailPrice - channelMargin;
  const totalCostPerUnit = manufacturingCostPerUnit;

  const totalFixedCosts = toolingCost + certificationCost + multiModelOverhead + adCost;
  const fixedCostPerUnit = unitsOrdered > 0 ? totalFixedCosts / unitsOrdered : 0;
  const fullyLoadedCostPerUnit = totalCostPerUnit + fixedCostPerUnit;

  const totalManufacturingSpend = manufacturingCostPerUnit * unitsOrdered + totalFixedCosts;

  return {
    bomCost: baseBomCost,
    eosDiscount,
    bomAfterEos,
    assemblyQa,
    packagingLogistics,
    supportBudget,
    manufacturingCostPerUnit,
    channelMargin,
    totalCostPerUnit,
    revenuePerUnit,
    toolingCost,
    certificationCost,
    multiModelOverhead,
    adCost,
    totalFixedCosts,
    fixedCostPerUnit,
    fullyLoadedCostPerUnit,
    totalManufacturingSpend,
  };
}
