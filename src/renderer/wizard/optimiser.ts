/**
 * Debug optimiser: finds the best laptop configuration for a given demographic
 * by maximising weighted stat score per unit cost.
 */

import { Demographic, ComponentSlot, Component, ChassisOption, LaptopStat, ScreenSizeInches } from "../../data/types";
import { SCREEN_SIZES } from "../../data/screenSizes";
import {
  getAvailableComponents,
  getAvailableChassisOptions,
  CHASSIS_SLOTS,
  componentCostDecayed,
  chassisCost,
  applyDisplayMultiplier,
  DISPLAY_SLOTS,
  availableVolumeCm3,
  totalConsumedVolumeCm3,
  maxHeightConstraintCm,
  THICKNESS_MIN_CM,
  THICKNESS_MAX_CM,
  THICKNESS_STEP_CM,
  BEZEL_MIN_MM,
  MIN_BATTERY_WH,
  MAX_BATTERY_WH,
  BATTERY_STEP_WH,
} from "../../data/designConstants";
import { COLOUR_OPTIONS } from "../../data/colourOptions";
import { computeRawStatTotals } from "../../simulation/statCalculation";
import { PRICE_SENSITIVITY_EXPONENT } from "../../simulation/tunables";
import { getScreenSizeFit } from "../../simulation/demographicData";
import { WizardState } from "./types";
import { COMPONENT_STEP_SLOTS } from "./types";
import { getBatteryEra } from "../../data/batteryEras";

interface OptimisedResult {
  screenSize: ScreenSizeInches;
  components: Partial<Record<ComponentSlot, Component>>;
  chassis: WizardState["chassis"];
  batteryCapacityWh: number;
  thicknessCm: number;
  bezelMm: number;
  selectedColours: string[];
}

interface BuildConfig {
  screenSize: ScreenSizeInches;
  components: Partial<Record<ComponentSlot, Component>>;
  chassis: WizardState["chassis"];
  batteryCapacityWh: number;
  selectedColours: string[];
  displayMult: number;
}

const COOLING_CAPACITY_THRESHOLD = 0.7;
const COOLING_ADEQUATE_BONUS = 0.5;

/**
 * Score a component for a demographic by computing its weighted stat contribution
 * divided by its decayed cost. Higher = better value.
 */
function scoreComponent(
  comp: Component,
  demographic: Demographic,
  year: number,
  displayMultiplier: number,
): number {
  const cost = Math.max(1, applyDisplayMultiplier(componentCostDecayed(comp, year), comp.slot, displayMultiplier));
  let weightedStats = 0;
  for (const [stat, value] of Object.entries(comp.stats)) {
    const weight = demographic.statWeights[stat as LaptopStat] ?? 0;
    const adjusted = DISPLAY_SLOTS.includes(comp.slot) ? (value as number) * displayMultiplier : (value as number);
    weightedStats += adjusted * weight;
  }
  return weightedStats / cost;
}

/**
 * Score a chassis option for a demographic by its weighted stat contribution per cost.
 */
function scoreChassisOption(
  opt: ChassisOption,
  demographic: Demographic,
  year: number,
): number {
  const cost = Math.max(1, chassisCost(opt, year));
  let weightedStats = 0;
  for (const [stat, value] of Object.entries(opt.stats)) {
    const weight = demographic.statWeights[stat as LaptopStat] ?? 0;
    weightedStats += (value as number) * weight;
  }
  return weightedStats / cost;
}

function computeWeightedScore(
  stats: Record<string, number>,
  demographic: Demographic,
): number {
  let score = 0;
  for (const [stat, weight] of Object.entries(demographic.statWeights)) {
    score += (stats[stat as LaptopStat] ?? 0) * weight;
  }
  return score;
}

function computeBuildCost(
  config: BuildConfig,
  year: number,
): number {
  const { components, chassis, batteryCapacityWh, selectedColours, displayMult } = config;
  const chassisOptions = [chassis.material, chassis.coolingSolution, chassis.keyboardFeature, chassis.trackpadFeature];
  const era = getBatteryEra(year);

  let cost = 0;
  for (const [slot, comp] of Object.entries(components)) {
    if (comp) cost += applyDisplayMultiplier(componentCostDecayed(comp, year), slot, displayMult);
  }
  for (const opt of chassisOptions) {
    if (opt) cost += chassisCost(opt, year);
  }
  cost += Math.round(batteryCapacityWh * era.costPerWh);
  cost += COLOUR_OPTIONS.find(c => c.id === selectedColours[0])?.costPerUnit ?? 0;
  return cost;
}

function findMinThickness(
  screenSize: ScreenSizeInches,
  components: Partial<Record<ComponentSlot, Component>>,
  batteryWh: number,
  chassisOptions: (ChassisOption | null)[],
  year: number,
): number {
  const consumedVol = totalConsumedVolumeCm3(components, batteryWh, {}, chassisOptions);
  const minHeight = maxHeightConstraintCm(components, {}, chassisOptions);

  for (let t = THICKNESS_MIN_CM; t <= THICKNESS_MAX_CM; t = Math.round((t + THICKNESS_STEP_CM) * 10) / 10) {
    const avail = availableVolumeCm3(screenSize, BEZEL_MIN_MM, t, year);
    if (avail >= consumedVol && t >= minHeight) {
      return t;
    }
  }
  return THICKNESS_MAX_CM;
}

function scoreBuild(
  config: BuildConfig,
  demographic: Demographic,
  year: number,
  sensitivityExp: number,
): number {
  const { screenSize, components, chassis, batteryCapacityWh, selectedColours } = config;
  const chassisOptions = [chassis.material, chassis.coolingSolution, chassis.keyboardFeature, chassis.trackpadFeature];
  const thickness = findMinThickness(screenSize, components, batteryCapacityWh, chassisOptions, year);

  const stats = computeRawStatTotals({
    screenSize,
    components,
    ports: {},
    chassis,
    batteryCapacityWh,
    thicknessCm: thickness,
    bezelMm: BEZEL_MIN_MM,
    selectedColours,
    gameYear: year,
  });

  const weightedScore = computeWeightedScore(stats, demographic);
  const pref = demographic.screenSizePreference;
  const screenPenalty = getScreenSizeFit(screenSize, pref.preferredMin, pref.preferredMax, pref.penaltyPerInch);
  const totalCost = computeBuildCost(config, year);

  return (weightedScore * screenPenalty) / Math.pow(Math.max(1, totalCost), sensitivityExp);
}

/**
 * Find the optimal laptop configuration for a demographic.
 *
 * Strategy:
 * 1. Try each screen size in the demographic's preferred range
 * 2. For each, pick the best component per slot (highest weighted stats / cost)
 * 3. Pick the best chassis options similarly
 * 4. Find optimal battery (balancing battery life stat vs cost)
 * 5. Use the thinnest viable chassis thickness
 * 6. Pick the cheapest colour
 * 7. Score the full build and pick the best screen size
 */
export function optimiseForDemographic(demographic: Demographic, year: number): OptimisedResult {
  const pref = demographic.screenSizePreference;
  const sensitivityExp = PRICE_SENSITIVITY_EXPONENT[demographic.priceSensitivity];

  // Screen sizes to try: preferred range first, then all others
  const candidateSizes = SCREEN_SIZES
    .filter(s => s.size >= pref.preferredMin && s.size <= pref.preferredMax)
    .map(s => s.size);

  // Also try sizes just outside preference for completeness
  const allSizes = SCREEN_SIZES.map(s => s.size);
  const sizesToTry = [...new Set([...candidateSizes, ...allSizes])];

  let bestResult: OptimisedResult | null = null;
  let bestScore = -Infinity;

  for (const screenSize of sizesToTry) {
    const screenDef = SCREEN_SIZES.find(s => s.size === screenSize)!;
    const displayMult = screenDef.displayMultiplier;

    // Pick best component for each slot
    const allSlots: ComponentSlot[] = Object.values(COMPONENT_STEP_SLOTS).flat() as ComponentSlot[];
    const components: Partial<Record<ComponentSlot, Component>> = {};
    for (const slot of allSlots) {
      const available = getAvailableComponents(slot, year);
      if (available.length === 0) continue;
      let bestComp = available[0];
      let bestCompScore = scoreComponent(bestComp, demographic, year, displayMult);
      for (let i = 1; i < available.length; i++) {
        const s = scoreComponent(available[i], demographic, year, displayMult);
        if (s > bestCompScore) {
          bestCompScore = s;
          bestComp = available[i];
        }
      }
      components[slot] = bestComp;
    }

    // Pick best chassis option for each slot
    const chassis: WizardState["chassis"] = {
      material: null,
      coolingSolution: null,
      keyboardFeature: null,
      trackpadFeature: null,
    };
    for (const def of CHASSIS_SLOTS) {
      const available = getAvailableChassisOptions(def.options, year);
      if (available.length === 0) continue;

      // For cooling solutions, also factor in whether we need cooling capacity
      if (def.slot === "coolingSolution") {
        let totalPower = 0;
        for (const [slot, comp] of Object.entries(components)) {
          if (comp) totalPower += applyDisplayMultiplier(comp.powerDrawW, slot, displayMult);
        }
        let bestOpt = available[0];
        let bestOptScore = scoreChassisOption(bestOpt, demographic, year);
        for (const opt of available) {
          let s = scoreChassisOption(opt, demographic, year);
          if (opt.coolingCapacityW >= totalPower * COOLING_CAPACITY_THRESHOLD) {
            s += COOLING_ADEQUATE_BONUS;
          }
          if (s > bestOptScore) {
            bestOptScore = s;
            bestOpt = opt;
          }
        }
        chassis[def.slot] = bestOpt;
      } else {
        let bestOpt = available[0];
        let bestOptScore = scoreChassisOption(bestOpt, demographic, year);
        for (let i = 1; i < available.length; i++) {
          const s = scoreChassisOption(available[i], demographic, year);
          if (s > bestOptScore) {
            bestOptScore = s;
            bestOpt = available[i];
          }
        }
        chassis[def.slot] = bestOpt;
      }
    }

    const selectedColours = [COLOUR_OPTIONS[0].id];
    const chassisOptions = [chassis.material, chassis.coolingSolution, chassis.keyboardFeature, chassis.trackpadFeature];

    // Try different battery capacities
    let bestBattery = MIN_BATTERY_WH;
    let bestBatteryScore = -Infinity;

    for (let batt = MIN_BATTERY_WH; batt <= MAX_BATTERY_WH; batt += BATTERY_STEP_WH) {
      const config: BuildConfig = { screenSize, components, chassis, batteryCapacityWh: batt, selectedColours, displayMult };
      const vp = scoreBuild(config, demographic, year, sensitivityExp);
      if (vp > bestBatteryScore) {
        bestBatteryScore = vp;
        bestBattery = batt;
      }
    }

    // Final score with best battery
    const finalConfig: BuildConfig = { screenSize, components, chassis, batteryCapacityWh: bestBattery, selectedColours, displayMult };
    const finalThickness = findMinThickness(screenSize, components, bestBattery, chassisOptions, year);
    const finalVP = scoreBuild(finalConfig, demographic, year, sensitivityExp);

    if (finalVP > bestScore) {
      bestScore = finalVP;
      bestResult = {
        screenSize,
        components,
        chassis,
        batteryCapacityWh: bestBattery,
        thicknessCm: finalThickness,
        bezelMm: BEZEL_MIN_MM,
        selectedColours,
      };
    }
  }

  // Fallback (shouldn't happen)
  if (!bestResult) {
    return {
      screenSize: 14,
      components: {},
      chassis: { material: null, coolingSolution: null, keyboardFeature: null, trackpadFeature: null },
      batteryCapacityWh: MIN_BATTERY_WH,
      thicknessCm: THICKNESS_MAX_CM,
      bezelMm: BEZEL_MIN_MM,
      selectedColours: [COLOUR_OPTIONS[0].id],
    };
  }

  return bestResult;
}
