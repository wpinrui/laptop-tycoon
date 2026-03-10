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
  BEZEL_MAX_MM,
  minBezelForYear,
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
let cachedPriceScale: number | null = null;

/** Returns the theoretical max for every stat in the given year (cached). */
export function getTheoreticalMaxima(year: number): Record<LaptopStat, number> {
  if (cachedYear === year && cachedMaxima) return cachedMaxima;

  const result = {} as Record<LaptopStat, number>;
  for (const stat of ALL_STATS) {
    result[stat] = computeTheoreticalMaxForStat(stat, year);
  }

  cachedYear = year;
  cachedMaxima = result;
  cachedPriceScale = null;
  return result;
}

/**
 * Returns the price scale factor for exponential price scoring.
 * Derived from the median cost of a "reasonable" build (median-tier
 * component in every slot, mid-range battery, one colour, 14" screen).
 */
export function getPriceScaleFactor(year: number): number {
  getTheoreticalMaxima(year); // ensure cachedYear is set
  if (cachedPriceScale !== null) return cachedPriceScale;
  cachedPriceScale = computePriceScaleFactor(year);
  return cachedPriceScale;
}

/** Clear cache (call when year advances or on new game). */
export function clearTheoreticalMaxCache(): void {
  cachedYear = null;
  cachedMaxima = null;
  cachedPriceScale = null;
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
    build.components, build.batteryCapacityWh, build.ports, chassisOptions, year,
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
    const minBezel = minBezelForYear(year);
    const bezelMm = targetStat === "design" ? minBezel
      : (targetStat === "performance" || targetStat === "gamingPerformance") ? BEZEL_MAX_MM
      : minBezel;

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
  if (targetStat === "performance" || targetStat === "gamingPerformance" || targetStat === "thermals") {
    // Prefer highest cooling capacity (thermals is derived from headroom ratio)
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

// ---- Price scale factor (median build cost) ----

/**
 * Compute the cost of a median-tier build for a year.
 * Picks the median-cost component in each slot, median chassis option per slot,
 * mid-range battery, one colour, on a 14" screen.
 */
function computePriceScaleFactor(year: number): number {
  const refScreenDef = SCREEN_SIZES.find(s => s.size === 14) ?? SCREEN_SIZES[0];
  const displayMult = refScreenDef.displayMultiplier;

  let cost = 0;

  // Median component per slot
  for (const slot of ALL_COMPONENT_SLOTS) {
    const available = getAvailableComponents(slot, year);
    if (available.length === 0) continue;
    const costs = available
      .map(c => applyDisplayMultiplier(componentCostDecayed(c, year), c.slot, displayMult))
      .sort((a, b) => a - b);
    cost += costs[Math.floor(costs.length / 2)];
  }

  // Median chassis option per slot
  for (const def of CHASSIS_SLOTS) {
    const available = getAvailableChassisOptions(def.options, year);
    if (available.length === 0) continue;
    const costs = available.map(o => chassisCost(o, year)).sort((a, b) => a - b);
    cost += costs[Math.floor(costs.length / 2)];
  }

  // Mid-range battery
  const era = getBatteryEra(year);
  const midBattery = (MIN_BATTERY_WH + MAX_BATTERY_WH) / 2;
  cost += Math.round(midBattery * era.costPerWh);

  // One basic colour
  cost += COLOUR_OPTIONS[0]?.costPerUnit ?? 0;

  return Math.max(1, cost);
}
