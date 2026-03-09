/**
 * Debug optimiser: finds the best laptop configuration for a given demographic
 * by maximising the actual sales engine VP formula (weighted normalised stats / cost^exponent).
 *
 * Uses iterative hill-climbing: seed with cheapest parts, then repeatedly try
 * swapping each slot to every alternative and keep whichever swap improves the
 * full-build score the most. Repeat until no single swap improves the score.
 */

import { Demographic, ComponentSlot, Component, ChassisOption, ChassisOptionSlot, LaptopStat, ScreenSizeInches } from "../../data/types";
import { SCREEN_SIZES } from "../../data/screenSizes";
import {
  getAvailableComponents,
  getAvailableChassisOptions,
  CHASSIS_SLOTS,
  componentCostDecayed,
  chassisCost,
  applyDisplayMultiplier,
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
import { getTheoreticalMaxima } from "../../simulation/theoreticalMax";
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

// ─── helpers ───────────────────────────────────────────────────────────

function computeBuildCost(config: BuildConfig, year: number): number {
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

/**
 * Score a complete build using the exact sales engine VP formula:
 *   (weightedNormalisedScore × screenPenalty) / cost^sensitivityExponent
 */
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

  const maxima = getTheoreticalMaxima(year);
  let weightedScore = 0;
  for (const [stat, weight] of Object.entries(demographic.statWeights)) {
    const raw = stats[stat as LaptopStat] ?? 0;
    const max = maxima[stat as LaptopStat] ?? 1;
    const norm = max > 0 ? raw / max : 0;
    weightedScore += norm * weight;
  }

  const pref = demographic.screenSizePreference;
  const screenPenalty = getScreenSizeFit(screenSize, pref.preferredMin, pref.preferredMax, pref.penaltyPerInch);
  const totalCost = computeBuildCost(config, year);

  return (weightedScore * screenPenalty) / Math.pow(Math.max(1, totalCost), sensitivityExp);
}

// ─── main optimiser ────────────────────────────────────────────────────

const ALL_COMPONENT_SLOTS: ComponentSlot[] = Object.values(COMPONENT_STEP_SLOTS).flat() as ComponentSlot[];

/**
 * Seed a build with the cheapest available option in every slot.
 */
function seedCheapestBuild(screenSize: ScreenSizeInches, year: number): {
  components: Partial<Record<ComponentSlot, Component>>;
  chassis: WizardState["chassis"];
} {
  const screenDef = SCREEN_SIZES.find(s => s.size === screenSize)!;
  const displayMult = screenDef.displayMultiplier;

  const components: Partial<Record<ComponentSlot, Component>> = {};
  for (const slot of ALL_COMPONENT_SLOTS) {
    const available = getAvailableComponents(slot, year);
    if (available.length === 0) continue;
    // Pick cheapest (or first if free)
    let cheapest = available[0];
    let cheapestCost = applyDisplayMultiplier(componentCostDecayed(cheapest, year), slot, displayMult);
    for (let i = 1; i < available.length; i++) {
      const c = applyDisplayMultiplier(componentCostDecayed(available[i], year), available[i].slot, displayMult);
      if (c < cheapestCost) { cheapestCost = c; cheapest = available[i]; }
    }
    components[slot] = cheapest;
  }

  const chassis: WizardState["chassis"] = { material: null, coolingSolution: null, keyboardFeature: null, trackpadFeature: null };
  for (const def of CHASSIS_SLOTS) {
    const available = getAvailableChassisOptions(def.options, year);
    if (available.length === 0) continue;
    let cheapest = available[0];
    let cheapestCost = chassisCost(cheapest, year);
    for (let i = 1; i < available.length; i++) {
      const c = chassisCost(available[i], year);
      if (c < cheapestCost) { cheapestCost = c; cheapest = available[i]; }
    }
    chassis[def.slot] = cheapest;
  }

  return { components, chassis };
}

/**
 * Hill-climb: repeatedly try every alternative for each slot, keep the best swap.
 * Stops when a full pass over all slots produces no improvement.
 */
function hillClimb(
  screenSize: ScreenSizeInches,
  initComponents: Partial<Record<ComponentSlot, Component>>,
  initChassis: WizardState["chassis"],
  demographic: Demographic,
  year: number,
  sensitivityExp: number,
): { components: Partial<Record<ComponentSlot, Component>>; chassis: WizardState["chassis"]; batteryCapacityWh: number } {
  const screenDef = SCREEN_SIZES.find(s => s.size === screenSize)!;
  const displayMult = screenDef.displayMultiplier;
  const selectedColours = [COLOUR_OPTIONS[0].id];

  let components = { ...initComponents };
  let chassis = { ...initChassis };
  let batteryCapacityWh = MIN_BATTERY_WH;

  const makeConfig = (): BuildConfig => ({
    screenSize, components, chassis, batteryCapacityWh, selectedColours, displayMult,
  });

  let currentScore = scoreBuild(makeConfig(), demographic, year, sensitivityExp);
  let improved = true;

  while (improved) {
    improved = false;

    // Try swapping each component slot
    for (const slot of ALL_COMPONENT_SLOTS) {
      const available = getAvailableComponents(slot, year);
      const current = components[slot];
      let bestForSlot = current;
      let bestSlotScore = currentScore;

      for (const candidate of available) {
        if (candidate === current) continue;
        const trial = { ...components, [slot]: candidate };
        const config: BuildConfig = { screenSize, components: trial, chassis, batteryCapacityWh, selectedColours, displayMult };
        const s = scoreBuild(config, demographic, year, sensitivityExp);
        if (s > bestSlotScore) {
          bestSlotScore = s;
          bestForSlot = candidate;
        }
      }

      if (bestForSlot !== current) {
        components = { ...components, [slot]: bestForSlot };
        currentScore = bestSlotScore;
        improved = true;
      }
    }

    // Try swapping each chassis slot
    for (const def of CHASSIS_SLOTS) {
      const available = getAvailableChassisOptions(def.options, year);
      const current = chassis[def.slot];
      let bestForSlot = current;
      let bestSlotScore = currentScore;

      for (const candidate of available) {
        if (candidate === current) continue;
        const trialChassis = { ...chassis, [def.slot]: candidate };
        const config: BuildConfig = { screenSize, components, chassis: trialChassis, batteryCapacityWh, selectedColours, displayMult };
        const s = scoreBuild(config, demographic, year, sensitivityExp);
        if (s > bestSlotScore) {
          bestSlotScore = s;
          bestForSlot = candidate;
        }
      }

      if (bestForSlot !== current) {
        chassis = { ...chassis, [def.slot]: bestForSlot };
        currentScore = bestSlotScore;
        improved = true;
      }
    }

    // Try every battery capacity
    {
      let bestBatt = batteryCapacityWh;
      let bestBattScore = currentScore;
      for (let batt = MIN_BATTERY_WH; batt <= MAX_BATTERY_WH; batt += BATTERY_STEP_WH) {
        if (batt === batteryCapacityWh) continue;
        const config: BuildConfig = { screenSize, components, chassis, batteryCapacityWh: batt, selectedColours, displayMult };
        const s = scoreBuild(config, demographic, year, sensitivityExp);
        if (s > bestBattScore) {
          bestBattScore = s;
          bestBatt = batt;
        }
      }
      if (bestBatt !== batteryCapacityWh) {
        batteryCapacityWh = bestBatt;
        currentScore = bestBattScore;
        improved = true;
      }
    }
  }

  return { components, chassis, batteryCapacityWh };
}

/**
 * Find the optimal laptop configuration for a demographic.
 *
 * Strategy:
 * 1. For each screen size, seed with cheapest parts
 * 2. Hill-climb by swapping one slot at a time, keeping swaps that improve the full-build VP score
 * 3. Repeat until no single swap improves the score
 * 4. Pick the screen size with the best final score
 */
export function optimiseForDemographic(demographic: Demographic, year: number): OptimisedResult {
  const sensitivityExp = PRICE_SENSITIVITY_EXPONENT[demographic.priceSensitivity];
  const selectedColours = [COLOUR_OPTIONS[0].id];

  let bestResult: OptimisedResult | null = null;
  let bestScore = -Infinity;

  for (const screenDef of SCREEN_SIZES) {
    const screenSize = screenDef.size;
    const displayMult = screenDef.displayMultiplier;

    const seed = seedCheapestBuild(screenSize, year);
    const optimised = hillClimb(screenSize, seed.components, seed.chassis, demographic, year, sensitivityExp);

    const chassisOptions = [optimised.chassis.material, optimised.chassis.coolingSolution, optimised.chassis.keyboardFeature, optimised.chassis.trackpadFeature];
    const thickness = findMinThickness(screenSize, optimised.components, optimised.batteryCapacityWh, chassisOptions, year);

    const config: BuildConfig = {
      screenSize,
      components: optimised.components,
      chassis: optimised.chassis,
      batteryCapacityWh: optimised.batteryCapacityWh,
      selectedColours,
      displayMult,
    };
    const score = scoreBuild(config, demographic, year, sensitivityExp);

    if (score > bestScore) {
      bestScore = score;
      bestResult = {
        screenSize,
        components: optimised.components,
        chassis: optimised.chassis,
        batteryCapacityWh: optimised.batteryCapacityWh,
        thicknessCm: thickness,
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
