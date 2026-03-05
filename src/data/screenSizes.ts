import { ScreenSizeDefinition, ScreenSizeInches } from "./types";

export function getScreenSizeDef(size: ScreenSizeInches): ScreenSizeDefinition {
  return SCREEN_SIZES.find((s) => s.size === size) ?? SCREEN_SIZES[0];
}

export const SCREEN_SIZES: ScreenSizeDefinition[] = [
  { size: 10, baseCoolingCapacityW: 20, baseBatteryCapacityWh: 35, baseWeightG: 400, displayMultiplier: 0.65 },
  { size: 11, baseCoolingCapacityW: 25, baseBatteryCapacityWh: 42, baseWeightG: 450, displayMultiplier: 0.72 },
  { size: 12, baseCoolingCapacityW: 30, baseBatteryCapacityWh: 50, baseWeightG: 520, displayMultiplier: 0.80 },
  { size: 13, baseCoolingCapacityW: 38, baseBatteryCapacityWh: 60, baseWeightG: 600, displayMultiplier: 0.88 },
  { size: 14, baseCoolingCapacityW: 45, baseBatteryCapacityWh: 72, baseWeightG: 700, displayMultiplier: 1.00 },
  { size: 15, baseCoolingCapacityW: 58, baseBatteryCapacityWh: 84, baseWeightG: 820, displayMultiplier: 1.12 },
  { size: 16, baseCoolingCapacityW: 65, baseBatteryCapacityWh: 99, baseWeightG: 950, displayMultiplier: 1.25 },
  { size: 17, baseCoolingCapacityW: 80, baseBatteryCapacityWh: 99, baseWeightG: 1100, displayMultiplier: 1.40 },
  { size: 18, baseCoolingCapacityW: 95, baseBatteryCapacityWh: 99, baseWeightG: 1250, displayMultiplier: 1.55 },
];
