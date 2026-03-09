import {
  LaptopStat,
  StatVector,
  ScreenSizeInches,
  ComponentSlot,
  Component,
  ChassisOption,
} from "../data/types";
import { LaptopDesign } from "../renderer/state/gameTypes";
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
  BATTERY_LIFE_POINTS_PER_HOUR,
  DERIVED_STAT_MAX,
  WEIGHT_STAT_ZERO_G,
  WEIGHT_STAT_DIVISOR,
  THERMALS_MAX_SCORE,
  THERMALS_HEADROOM_FULL,
  THERMALS_HEADROOM_CAP,
  applyDisplayMultiplier,
  coolingMultiplier,
  availableVolumeCm3,
  totalConsumedVolumeCm3,
  chassisShellWeightG,
  avgUsageMultiplier,
} from "../data/designConstants";
import { getBatteryEra } from "../data/batteryEras";

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

  // Cooling: compute effective cooling and headroom ratio
  let totalPower = 0;
  for (const [slot, comp] of Object.entries(components)) {
    if (!comp) continue;
    totalPower += applyDisplayMultiplier(comp.powerDrawW, slot, displayMult);
  }
  if (totalPower > 0) {
    const coolingFromSolution = chassis.coolingSolution?.coolingCapacityW ?? 0;
    const totalVolume = totalConsumedVolumeCm3(components, batteryCapacityWh, ports, allChassisOptions, gameYear);
    const totalAvailable = availableVolumeCm3(screenSize, bezelMm, thicknessCm, gameYear);
    const spaceUtil = totalAvailable > 0 ? totalVolume / totalAvailable : 1;
    const coolMult = coolingMultiplier(thicknessCm, bezelMm, spaceUtil);
    const effectiveCooling = coolingFromSolution * coolMult;
    const headroom = Math.min(effectiveCooling / totalPower, THERMALS_HEADROOM_CAP);

    // Derived thermals stat: scales linearly with headroom up to THERMALS_HEADROOM_FULL
    totals.thermals = Math.round(THERMALS_MAX_SCORE * Math.min(1, headroom / THERMALS_HEADROOM_FULL));

    // Proportional throttle: a 40W CPU cooled to 20W runs at 50% performance
    if (totalPower > effectiveCooling) {
      const throttleRatio = effectiveCooling / totalPower;
      totals.performance = Math.round((totals.performance ?? 0) * throttleRatio);
      totals.gamingPerformance = Math.round((totals.gamingPerformance ?? 0) * throttleRatio);
    }
  } else {
    // No power draw = perfect thermals (passive build)
    totals.thermals = THERMALS_MAX_SCORE;
  }

  // --- Derived stats: batteryLife, weight, thinness ---

  // batteryLife: hours of use = batteryWh / (totalPower * avgUsageMultiplier)
  if (totalPower > 0) {
    const usageMult = avgUsageMultiplier(gameYear);
    const batteryHours = batteryCapacityWh / (totalPower * usageMult);
    totals.batteryLife = (totals.batteryLife ?? 0) + Math.round(Math.min(DERIVED_STAT_MAX, batteryHours * BATTERY_LIFE_POINTS_PER_HOUR));
  } else {
    totals.batteryLife = (totals.batteryLife ?? 0) + DERIVED_STAT_MAX;
  }

  // weight: lighter = higher score
  // Total weight = base chassis weight + components + ports + chassis options + battery + shell
  const era = getBatteryEra(gameYear);
  let componentWeight = 0;
  for (const [slot, comp] of Object.entries(components)) {
    if (!comp) continue;
    componentWeight += applyDisplayMultiplier(comp.weightG, slot, displayMult);
  }
  let portWeight = 0;
  for (const pt of PORT_TYPES) {
    portWeight += (ports[pt.id] ?? 0) * pt.weightPerPortG;
  }
  const chassisOptionWeight = allChassisOptions.reduce((sum, o) => sum + (o?.weightG ?? 0), 0);
  const batteryWeight = Math.round(batteryCapacityWh * era.weightPerWh);
  const materialDensity = chassis.material?.shellDensityMultiplier ?? 1.0;
  const shellWeight = chassisShellWeightG(screenSize, bezelMm, thicknessCm, materialDensity);
  const totalWeight = screenSizeDef.baseWeightG + componentWeight + portWeight + chassisOptionWeight + batteryWeight + shellWeight;
  totals.weight = (totals.weight ?? 0) + Math.round(Math.max(0, Math.min(DERIVED_STAT_MAX, (WEIGHT_STAT_ZERO_G - totalWeight) / WEIGHT_STAT_DIVISOR)));

  // thinness: thinner = higher score (linear mapping)
  const thinRaw = 1 - (thicknessCm - THICKNESS_MIN_CM) / (THICKNESS_MAX_CM - THICKNESS_MIN_CM);
  totals.thinness = (totals.thinness ?? 0) + Math.round(Math.max(0, Math.min(DERIVED_STAT_MAX, thinRaw * DERIVED_STAT_MAX)));

  // Clamp all stats to 0 minimum
  for (const key of Object.keys(totals) as LaptopStat[]) {
    if ((totals[key] ?? 0) < 0) totals[key] = 0;
  }

  return totals;
}

export function computeStatsForDesign(design: LaptopDesign, gameYear: number): StatVector {
  return computeRawStatTotals({
    screenSize: design.screenSize,
    components: design.components,
    ports: design.ports,
    chassis: design.chassis,
    batteryCapacityWh: design.batteryCapacityWh,
    thicknessCm: design.thicknessCm,
    bezelMm: design.bezelMm,
    selectedColours: design.selectedColours,
    gameYear,
  });
}
