import {
  LaptopStat,
  StatVector,
  ScreenSizeInches,
  ComponentSlot,
  Component,
  ChassisOption,
} from "../data/types";
import { PORT_TYPES } from "../data/portTypes";
import { COLOUR_OPTIONS } from "../data/colourOptions";
import { getScreenSizeDef } from "../data/screenSizes";
import {
  DISPLAY_SLOTS,
  THICKNESS_MIN_CM,
  THICKNESS_MAX_CM,
  BEZEL_MIN_MM,
  BEZEL_MAX_MM,
  DESIGN_THICKNESS_MAX_BONUS,
  DESIGN_BEZEL_MAX_BONUS,
  DESIGN_COLOUR_COUNT_MULTIPLIER,
  DESIGN_COLOUR_PREMIUM_FACTOR,
  DESIGN_BEZEL_EXPONENT,
  DESIGN_COLOUR_BASE_COST,
  DESIGN_COLOUR_BONUS_DIVISOR,
  applyDisplayMultiplier,
  coolingMultiplier,
  availableVolumeCm3,
  totalConsumedVolumeCm3,
} from "../renderer/wizard/constants";

export interface RawStatTotalsParams {
  screenSize: ScreenSizeInches;
  components: Partial<Record<ComponentSlot, Component>>;
  ports: Record<string, number>;
  chassis: {
    material: ChassisOption | null;
    coolingSolution: ChassisOption | null;
    keyboardFeature: ChassisOption | null;
    trackpadFeature: ChassisOption | null;
  };
  batteryCapacityWh: number;
  thicknessCm: number;
  bezelMm: number;
  selectedColours: string[];
  gameYear: number;
}

export function computeRawStatTotals(params: RawStatTotalsParams): StatVector {
  const {
    screenSize, components, ports, chassis,
    batteryCapacityWh, thicknessCm, bezelMm,
    selectedColours, gameYear,
  } = params;

  const totals: StatVector = {};
  const screenSizeDef = getScreenSizeDef(screenSize);
  const displayMult = screenSizeDef.displayMultiplier;

  // Components
  for (const [slot, comp] of Object.entries(components)) {
    if (!comp) continue;
    const isDisplay = DISPLAY_SLOTS.includes(slot as ComponentSlot);
    for (const [stat, value] of Object.entries(comp.stats)) {
      const adjusted = isDisplay ? Math.round((value as number) * displayMult) : (value as number);
      totals[stat as LaptopStat] = (totals[stat as LaptopStat] ?? 0) + adjusted;
    }
  }

  // Ports
  for (const pt of PORT_TYPES) {
    const count = ports[pt.id] ?? 0;
    if (count === 0) continue;
    for (const [stat, value] of Object.entries(pt.stats)) {
      totals[stat as LaptopStat] = (totals[stat as LaptopStat] ?? 0) + (value as number) * count;
    }
  }

  // Chassis options
  const allChassisOptions = [chassis.material, chassis.coolingSolution, chassis.keyboardFeature, chassis.trackpadFeature];
  for (const opt of allChassisOptions) {
    if (!opt) continue;
    for (const [stat, value] of Object.entries(opt.stats)) {
      totals[stat as LaptopStat] = (totals[stat as LaptopStat] ?? 0) + (value as number);
    }
  }

  // Design bonus from thinness, bezel, and colour range
  const tRaw = 1 - (thicknessCm - THICKNESS_MIN_CM) / (THICKNESS_MAX_CM - THICKNESS_MIN_CM);
  const thicknessBonus = Math.round(tRaw * tRaw * tRaw * DESIGN_THICKNESS_MAX_BONUS);
  const bRaw = 1 - (bezelMm - BEZEL_MIN_MM) / (BEZEL_MAX_MM - BEZEL_MIN_MM);
  const bezelBonus = Math.round(Math.pow(bRaw, DESIGN_BEZEL_EXPONENT) * DESIGN_BEZEL_MAX_BONUS);
  const avgColourCost = selectedColours.reduce((sum, id) => {
    const opt = COLOUR_OPTIONS.find((c) => c.id === id);
    return sum + (opt?.costPerUnit ?? 0);
  }, 0) / (selectedColours.length || 1);
  const countBonus = Math.sqrt(selectedColours.length) * DESIGN_COLOUR_COUNT_MULTIPLIER;
  const premiumMultiplier = 1 + (avgColourCost - DESIGN_COLOUR_BASE_COST) * DESIGN_COLOUR_PREMIUM_FACTOR;
  const colourBonus = Math.round((countBonus * premiumMultiplier) / DESIGN_COLOUR_BONUS_DIVISOR);
  totals.design = (totals.design ?? 0) + thicknessBonus + bezelBonus + colourBonus;

  // Performance penalty when cooling is insufficient
  let totalPower = 0;
  for (const [slot, comp] of Object.entries(components)) {
    if (!comp) continue;
    totalPower += applyDisplayMultiplier(comp.powerDrawW, slot, displayMult);
  }
  if (totalPower > 0) {
    const coolingFromSolution = chassis.coolingSolution?.coolingCapacityW ?? 0;
    const totalVolume = totalConsumedVolumeCm3(components, batteryCapacityWh, ports, allChassisOptions);
    const totalAvailable = availableVolumeCm3(screenSize, bezelMm, thicknessCm, gameYear);
    const spaceUtil = totalAvailable > 0 ? totalVolume / totalAvailable : 1;
    const coolMult = coolingMultiplier(thicknessCm, bezelMm, spaceUtil);
    const effectiveCooling = coolingFromSolution * coolMult;
    if (totalPower > effectiveCooling) {
      const deficit = 1 - effectiveCooling / totalPower;
      const penalty = 0.1 + 0.9 * deficit * deficit * (1 + deficit);
      const perfLoss = Math.round((totals.performance ?? 0) * Math.min(1, penalty));
      const gamingLoss = Math.round((totals.gamingPerformance ?? 0) * Math.min(1, penalty));
      totals.performance = Math.max(0, (totals.performance ?? 0) - perfLoss);
      totals.gamingPerformance = Math.max(0, (totals.gamingPerformance ?? 0) - gamingLoss);
    }
  }

  // Clamp all stats to 0 minimum
  for (const key of Object.keys(totals) as LaptopStat[]) {
    if ((totals[key] ?? 0) < 0) totals[key] = 0;
  }

  return totals;
}
