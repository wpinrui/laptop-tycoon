/**
 * Computes the theoretical maximum for each stat in a given game year.
 *
 * For each stat, we build 1 virtual laptop that optimises exclusively for that
 * stat, respecting all physical constraints (volume, cooling, thickness, etc.).
 * The result is cached per year since it only depends on the component/chassis
 * database, not on any actual laptops built.
 */

import {
  LaptopStat,
  ALL_STATS,
  ComponentSlot,
  Component,
  ChassisOption,
  ScreenSizeInches,
} from "../data/types";
import { SCREEN_SIZES } from "../data/screenSizes";
import {
  getAvailableComponents,
  getAvailableChassisOptions,
  CHASSIS_SLOTS,
  DISPLAY_SLOTS,
  applyDisplayMultiplier,
  MIN_BATTERY_WH,
  MAX_BATTERY_WH,
  BATTERY_STEP_WH,
  THICKNESS_MIN_CM,
  THICKNESS_MAX_CM,
  THICKNESS_STEP_CM,
  BEZEL_MIN_MM,
  BEZEL_MAX_MM,
  availableVolumeCm3,
  totalConsumedVolumeCm3,
  maxHeightConstraintCm,
  componentCostDecayed,
  chassisCost,
} from "../data/designConstants";
import { COLOUR_OPTIONS } from "../data/colourOptions";
import { PORT_TYPES } from "../data/portTypes";
import { computeRawStatTotals } from "./statCalculation";
import { COMPONENT_STEP_SLOTS } from "../renderer/wizard/types";
import { getBatteryEra } from "../data/batteryEras";

// ---- Cache ----

let cachedYear: number | null = null;
let cachedMaxima: Record<LaptopStat, number> | null = null;
let cachedMaxCost: number | null = null;

/** Returns the theoretical max for every stat in the given year (cached). */
export function getTheoreticalMaxima(year: number): Record<LaptopStat, number> {
  if (cachedYear === year && cachedMaxima) return cachedMaxima;

  const result = {} as Record<LaptopStat, number>;
  for (const stat of ALL_STATS) {
    result[stat] = computeTheoreticalMaxForStat(stat, year);
  }

  cachedYear = year;
  cachedMaxima = result;
  cachedMaxCost = null;
  return result;
}

/**
 * Returns the theoretical maximum unit cost for a valid laptop in the given year.
 * Most expensive component in every slot, most expensive chassis, max battery,
 * all colours, all ports, largest screen.
 */
export function getTheoreticalMaxCost(year: number): number {
  getTheoreticalMaxima(year); // ensure cachedYear is set
  if (cachedMaxCost !== null) return cachedMaxCost;
  cachedMaxCost = computeTheoreticalMaxCost(year);
  return cachedMaxCost;
}

/** Clear cache (call when year advances or on new game). */
export function clearTheoreticalMaxCache(): void {
  cachedYear = null;
  cachedMaxima = null;
  cachedMaxCost = null;
}

// ---- Internal helpers ----

const ALL_COMPONENT_SLOTS: ComponentSlot[] =
  Object.values(COMPONENT_STEP_SLOTS).flat() as ComponentSlot[];

/** All premium colour ids for maximising design. */
const ALL_COLOUR_IDS = COLOUR_OPTIONS.map((c) => c.id);

interface BuildState {
  screenSize: ScreenSizeInches;
  components: Partial<Record<ComponentSlot, Component>>;
  chassis: {
    material: ChassisOption | null;
    coolingSolution: ChassisOption | null;
    keyboardFeature: ChassisOption | null;
    trackpadFeature: ChassisOption | null;
  };
  ports: Record<string, number>;
  batteryCapacityWh: number;
  thicknessCm: number;
  bezelMm: number;
  selectedColours: string[];
}

/** Evaluate the target stat for a full build. */
function evaluate(build: BuildState, targetStat: LaptopStat, year: number): number {
  const stats = computeRawStatTotals({
    screenSize: build.screenSize,
    components: build.components,
    ports: build.ports,
    chassis: build.chassis,
    batteryCapacityWh: build.batteryCapacityWh,
    thicknessCm: build.thicknessCm,
    bezelMm: build.bezelMm,
    selectedColours: build.selectedColours,
    gameYear: year,
  });
  return stats[targetStat] ?? 0;
}

/** Find the minimum thickness that fits all components. */
function findMinViableThickness(
  build: BuildState,
  year: number,
): number {
  const chassisOptions = [
    build.chassis.material,
    build.chassis.coolingSolution,
    build.chassis.keyboardFeature,
    build.chassis.trackpadFeature,
  ];
  const consumedVol = totalConsumedVolumeCm3(
    build.components, build.batteryCapacityWh, build.ports, chassisOptions,
  );
  const minHeight = maxHeightConstraintCm(build.components, build.ports, chassisOptions);

  for (let t = THICKNESS_MIN_CM; t <= THICKNESS_MAX_CM; t = Math.round((t + THICKNESS_STEP_CM) * 10) / 10) {
    const avail = availableVolumeCm3(build.screenSize, build.bezelMm, t, year);
    if (avail >= consumedVol && t >= minHeight) return t;
  }
  return THICKNESS_MAX_CM;
}

/**
 * Compute the theoretical maximum value for a single stat across all possible
 * valid laptop builds in the given year.
 *
 * Strategy per screen size:
 * 1. Seed with heuristic picks for components/chassis.
 * 2. Iteratively refine each slot by trying every available option and keeping
 *    the one that maximises the target stat (until convergence, capped at 10 passes).
 * 3. Sweep battery capacity for battery-sensitive stats.
 * 4. Set thickness/bezel optimally for the stat.
 */
function computeTheoreticalMaxForStat(targetStat: LaptopStat, year: number): number {
  let globalBest = 0;

  for (const screenSizeDef of SCREEN_SIZES) {
    const screenSize = screenSizeDef.size;
    const displayMult = screenSizeDef.displayMultiplier;

    // --- Heuristic seed ---

    const components: Partial<Record<ComponentSlot, Component>> = {};
    for (const slot of ALL_COMPONENT_SLOTS) {
      const available = getAvailableComponents(slot, year);
      if (available.length === 0) continue;
      components[slot] = pickSeedComponent(available, targetStat, slot, displayMult);
    }

    const chassis: BuildState["chassis"] = {
      material: null,
      coolingSolution: null,
      keyboardFeature: null,
      trackpadFeature: null,
    };
    for (const def of CHASSIS_SLOTS) {
      const available = getAvailableChassisOptions(def.options, year);
      if (available.length === 0) continue;
      chassis[def.slot] = pickSeedChassis(available, targetStat);
    }

    // Ports: only connectivity benefits from ports
    const ports: Record<string, number> = {};
    if (targetStat === "connectivity") {
      for (const pt of PORT_TYPES) {
        if (pt.yearIntroduced <= year && (pt.yearDiscontinued === null || pt.yearDiscontinued >= year)) {
          ports[pt.id] = pt.maxCount;
        }
      }
    }

    // Colours: design benefits from all premium colours
    const selectedColours = targetStat === "design" ? ALL_COLOUR_IDS : [COLOUR_OPTIONS[0].id];

    // Bezel
    const bezelMm = targetStat === "design" ? BEZEL_MIN_MM
      : (targetStat === "performance" || targetStat === "gamingPerformance") ? BEZEL_MAX_MM
      : BEZEL_MIN_MM;

    // Battery: initial guess (only batteryLife wants max; everything else starts minimal)
    const initBattery = targetStat === "batteryLife" ? MAX_BATTERY_WH : MIN_BATTERY_WH;

    // Thickness strategy
    const wantThick = targetStat === "performance" || targetStat === "gamingPerformance";

    const build: BuildState = {
      screenSize, components, chassis, ports,
      batteryCapacityWh: initBattery,
      thicknessCm: THICKNESS_MAX_CM, // placeholder
      bezelMm,
      selectedColours,
    };

    // Set thickness
    build.thicknessCm = wantThick ? THICKNESS_MAX_CM : findMinViableThickness(build, year);

    // --- Iterative refinement until convergence (cap at 10 passes) ---
    for (let pass = 0; pass < 10; pass++) {
      const prevScore = evaluate(build, targetStat, year);

      // Refine components
      for (const slot of ALL_COMPONENT_SLOTS) {
        const available = getAvailableComponents(slot, year);
        if (available.length <= 1) continue;
        let bestComp = build.components[slot] ?? null;
        let bestVal = bestComp ? evaluate(build, targetStat, year) : -1;

        for (const comp of available) {
          build.components[slot] = comp;
          build.thicknessCm = wantThick ? THICKNESS_MAX_CM : findMinViableThickness(build, year);
          const val = evaluate(build, targetStat, year);
          if (val > bestVal) {
            bestVal = val;
            bestComp = comp;
          }
        }
        if (bestComp) build.components[slot] = bestComp;
        build.thicknessCm = wantThick ? THICKNESS_MAX_CM : findMinViableThickness(build, year);
      }

      // Refine chassis options
      for (const def of CHASSIS_SLOTS) {
        const available = getAvailableChassisOptions(def.options, year);
        if (available.length <= 1) continue;
        let bestOpt = build.chassis[def.slot];
        let bestVal = bestOpt ? evaluate(build, targetStat, year) : -1;

        for (const opt of available) {
          build.chassis[def.slot] = opt;
          build.thicknessCm = wantThick ? THICKNESS_MAX_CM : findMinViableThickness(build, year);
          const val = evaluate(build, targetStat, year);
          if (val > bestVal) {
            bestVal = val;
            bestOpt = opt;
          }
        }
        build.chassis[def.slot] = bestOpt;
        build.thicknessCm = wantThick ? THICKNESS_MAX_CM : findMinViableThickness(build, year);
      }

      // Converged: no improvement this pass
      if (evaluate(build, targetStat, year) === prevScore) break;
    }

    // --- Sweep battery for battery-sensitive stats ---
    if (targetStat === "batteryLife" || targetStat === "weight") {
      let bestBatt = build.batteryCapacityWh;
      let bestVal = evaluate(build, targetStat, year);
      for (let batt = MIN_BATTERY_WH; batt <= MAX_BATTERY_WH; batt += BATTERY_STEP_WH) {
        build.batteryCapacityWh = batt;
        build.thicknessCm = wantThick ? THICKNESS_MAX_CM : findMinViableThickness(build, year);
        const val = evaluate(build, targetStat, year);
        if (val > bestVal) {
          bestVal = val;
          bestBatt = batt;
        }
      }
      build.batteryCapacityWh = bestBatt;
      build.thicknessCm = wantThick ? THICKNESS_MAX_CM : findMinViableThickness(build, year);
    }

    const finalVal = evaluate(build, targetStat, year);
    if (finalVal > globalBest) globalBest = finalVal;
  }

  // Never return 0 (avoid division by zero in normalisation)
  return Math.max(1, globalBest);
}

// ---- Seed heuristics ----

/** Pick a seed component: for additive stats, prefer highest target stat; for derived stats, optimise the physical property. */
function pickSeedComponent(
  available: Component[],
  targetStat: LaptopStat,
  slot: string,
  displayMult: number,
): Component {
  if (targetStat === "weight") {
    // Lightest component
    return available.reduce((best, c) => {
      const w = applyDisplayMultiplier(c.weightG, slot, displayMult);
      const bw = applyDisplayMultiplier(best.weightG, slot, displayMult);
      return w < bw ? c : best;
    });
  }
  if (targetStat === "batteryLife") {
    // Lowest power draw
    return available.reduce((best, c) => {
      const p = applyDisplayMultiplier(c.powerDrawW, slot, displayMult);
      const bp = applyDisplayMultiplier(best.powerDrawW, slot, displayMult);
      return p < bp ? c : best;
    });
  }
  if (targetStat === "thinness") {
    // Smallest volume + thinnest
    return available.reduce((best, c) =>
      c.volumeCm3 + c.minThicknessCm < best.volumeCm3 + best.minThicknessCm ? c : best,
    );
  }
  // Additive stat: pick component with highest raw stat contribution
  return available.reduce((best, c) => {
    const isDisplay = DISPLAY_SLOTS.includes(slot as ComponentSlot);
    const val = isDisplay ? ((c.stats[targetStat] ?? 0) * displayMult) : (c.stats[targetStat] ?? 0);
    const bestVal = isDisplay ? ((best.stats[targetStat] ?? 0) * displayMult) : (best.stats[targetStat] ?? 0);
    return val > bestVal ? c : best;
  });
}

/** Pick a seed chassis option: highest target stat value. */
function pickSeedChassis(available: ChassisOption[], targetStat: LaptopStat): ChassisOption {
  if (targetStat === "performance" || targetStat === "gamingPerformance") {
    // Prefer highest cooling capacity (to avoid penalty)
    return available.reduce((best, o) =>
      (o.coolingCapacityW ?? 0) > (best.coolingCapacityW ?? 0) ? o : best,
    );
  }
  if (targetStat === "weight") {
    return available.reduce((best, o) => o.weightG < best.weightG ? o : best);
  }
  return available.reduce((best, o) =>
    (o.stats[targetStat] ?? 0) > (best.stats[targetStat] ?? 0) ? o : best,
  );
}

// ---- Theoretical max cost ----

/**
 * Compute the most expensive valid laptop build for a year.
 * Pick the most expensive option in every slot, largest screen, max battery, all colours, all ports.
 */
function computeTheoreticalMaxCost(year: number): number {
  let maxCost = 0;

  for (const screenSizeDef of SCREEN_SIZES) {
    const displayMult = screenSizeDef.displayMultiplier;
    let cost = 0;

    // Most expensive component per slot
    for (const slot of ALL_COMPONENT_SLOTS) {
      const available = getAvailableComponents(slot, year);
      if (available.length === 0) continue;
      let highest = 0;
      for (const comp of available) {
        const c = applyDisplayMultiplier(componentCostDecayed(comp, year), comp.slot, displayMult);
        if (c > highest) highest = c;
      }
      cost += highest;
    }

    // Most expensive chassis option per slot
    for (const def of CHASSIS_SLOTS) {
      const available = getAvailableChassisOptions(def.options, year);
      if (available.length === 0) continue;
      let highest = 0;
      for (const opt of available) {
        const c = chassisCost(opt, year);
        if (c > highest) highest = c;
      }
      cost += highest;
    }

    // Max battery
    const era = getBatteryEra(year);
    cost += Math.round(MAX_BATTERY_WH * era.costPerWh);

    // All colours
    for (const colour of COLOUR_OPTIONS) {
      cost += colour.costPerUnit;
    }

    // All ports at max count
    for (const pt of PORT_TYPES) {
      if (pt.yearIntroduced <= year && (pt.yearDiscontinued === null || pt.yearDiscontinued >= year)) {
        cost += pt.maxCount * pt.costPerPort;
      }
    }

    if (cost > maxCost) maxCost = cost;
  }

  return Math.max(1, maxCost);
}
