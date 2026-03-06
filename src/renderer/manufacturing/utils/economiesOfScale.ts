import { REFERENCE_QUANTITY } from "./constants";

export function calculateUnitCost(baseManufacturingCost: number, unitsOrdered: number): number {
  if (unitsOrdered <= 0) return baseManufacturingCost;
  const scaleFactor = 1 / (1 + Math.log10(unitsOrdered / REFERENCE_QUANTITY));
  return baseManufacturingCost * Math.max(scaleFactor, 0.1);
}

export function calculateTotalCost(
  baseManufacturingCost: number,
  unitsOrdered: number,
  activeModelCount: number,
  multiModelOverhead: number,
): number {
  const unitCost = calculateUnitCost(baseManufacturingCost, unitsOrdered);
  const overhead = activeModelCount > 1 ? multiModelOverhead : 0;
  return unitCost * unitsOrdered + overhead;
}
