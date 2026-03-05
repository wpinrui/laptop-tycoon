import { ScreenSizeDefinition } from "./types";

export const SCREEN_SIZES: ScreenSizeDefinition[] = [
  {
    id: "ultraportable",
    name: "Ultraportable",
    sizeRange: "10–12\"",
    baseCoolingCapacityW: 25,
    baseBatteryCapacityWh: 35,
    baseWeightG: 1200,
  },
  {
    id: "mainstreamPortable",
    name: "Mainstream Portable",
    sizeRange: "13–14\"",
    baseCoolingCapacityW: 45,
    baseBatteryCapacityWh: 50,
    baseWeightG: 1800,
  },
  {
    id: "standard",
    name: "Standard",
    sizeRange: "15–16\"",
    baseCoolingCapacityW: 65,
    baseBatteryCapacityWh: 60,
    baseWeightG: 2500,
  },
  {
    id: "desktopReplacement",
    name: "Desktop Replacement",
    sizeRange: "17\"+",
    baseCoolingCapacityW: 90,
    baseBatteryCapacityWh: 75,
    baseWeightG: 3200,
  },
];
