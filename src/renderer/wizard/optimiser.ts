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
        // Calculate total power draw
        let totalPower = 0;
        for (const [slot, comp] of Object.entries(components)) {
          if (comp) totalPower += applyDisplayMultiplier(comp.powerDrawW, slot, displayMult);
        }
        // Pick cooling solution that provides enough cooling at best value
        let bestOpt = available[0];
        let bestOptScore = scoreChassisOption(bestOpt, demographic, year);
        // Bonus for actually providing enough cooling
        for (const opt of available) {
          let s = scoreChassisOption(opt, demographic, year);
          // Add bonus if cooling capacity meets power needs
          if (opt.coolingCapacityW >= totalPower * 0.7) {
            s += 0.5; // significant bonus for adequate cooling
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

    // Use cheapest colour
    const selectedColours = [COLOUR_OPTIONS[0].id];

    // Try different battery capacities
    let bestBattery = MIN_BATTERY_WH;
    let bestBatteryScore = -Infinity;

    const chassisOptions = [chassis.material, chassis.coolingSolution, chassis.keyboardFeature, chassis.trackpadFeature];

    for (let batt = MIN_BATTERY_WH; batt <= MAX_BATTERY_WH; batt += BATTERY_STEP_WH) {
      // Find minimum viable thickness for this battery
      const consumedVol = totalConsumedVolumeCm3(components, batt, {}, chassisOptions);
      const minHeightForComponents = maxHeightConstraintCm(components, {}, chassisOptions);

      // Binary search for minimum thickness that fits
      let thickness = THICKNESS_MIN_CM;
      for (let t = THICKNESS_MIN_CM; t <= THICKNESS_MAX_CM; t = Math.round((t + THICKNESS_STEP_CM) * 10) / 10) {
        const avail = availableVolumeCm3(screenSize, BEZEL_MIN_MM, t, year);
        if (avail >= consumedVol && t >= minHeightForComponents) {
          thickness = t;
          break;
        }
        thickness = t;
      }

      // Compute stats for this configuration
      const stats = computeRawStatTotals({
        screenSize,
        components,
        ports: {},
        chassis,
        batteryCapacityWh: batt,
        thicknessCm: thickness,
        bezelMm: BEZEL_MIN_MM,
        selectedColours,
        gameYear: year,
      });

      // Weighted stat score
      let weightedScore = 0;
      for (const [stat, weight] of Object.entries(demographic.statWeights)) {
        weightedScore += (stats[stat as LaptopStat] ?? 0) * weight;
      }

      // Screen size penalty
      let screenPenalty = 1.0;
      if (screenSize < pref.preferredMin) {
        screenPenalty = Math.max(0.05, 1.0 - (pref.preferredMin - screenSize) * pref.penaltyPerInch);
      } else if (screenSize > pref.preferredMax) {
        screenPenalty = Math.max(0.05, 1.0 - (screenSize - pref.preferredMax) * pref.penaltyPerInch);
      }

      // Estimate total cost
      const era = getBatteryEra(year);
      let totalCost = 0;
      for (const [slot, comp] of Object.entries(components)) {
        if (comp) totalCost += applyDisplayMultiplier(componentCostDecayed(comp, year), slot, displayMult);
      }
      for (const opt of chassisOptions) {
        if (opt) totalCost += chassisCost(opt, year);
      }
      totalCost += Math.round(batt * era.costPerWh);
      totalCost += COLOUR_OPTIONS.find(c => c.id === selectedColours[0])?.costPerUnit ?? 0;

      // Value proposition: score / price^sensitivity
      const vp = (weightedScore * screenPenalty) / Math.pow(Math.max(1, totalCost), sensitivityExp);

      if (vp > bestBatteryScore) {
        bestBatteryScore = vp;
        bestBattery = batt;
      }
    }

    // Now compute final thickness for the best battery
    const finalConsumedVol = totalConsumedVolumeCm3(components, bestBattery, {}, chassisOptions);
    const finalMinHeight = maxHeightConstraintCm(components, {}, chassisOptions);
    let finalThickness = THICKNESS_MAX_CM;
    for (let t = THICKNESS_MIN_CM; t <= THICKNESS_MAX_CM; t = Math.round((t + THICKNESS_STEP_CM) * 10) / 10) {
      const avail = availableVolumeCm3(screenSize, BEZEL_MIN_MM, t, year);
      if (avail >= finalConsumedVol && t >= finalMinHeight) {
        finalThickness = t;
        break;
      }
    }

    // Final score
    const finalStats = computeRawStatTotals({
      screenSize,
      components,
      ports: {},
      chassis,
      batteryCapacityWh: bestBattery,
      thicknessCm: finalThickness,
      bezelMm: BEZEL_MIN_MM,
      selectedColours,
      gameYear: year,
    });

    let finalWeighted = 0;
    for (const [stat, weight] of Object.entries(demographic.statWeights)) {
      finalWeighted += (finalStats[stat as LaptopStat] ?? 0) * weight;
    }

    let finalScreenPenalty = 1.0;
    if (screenSize < pref.preferredMin) {
      finalScreenPenalty = Math.max(0.05, 1.0 - (pref.preferredMin - screenSize) * pref.penaltyPerInch);
    } else if (screenSize > pref.preferredMax) {
      finalScreenPenalty = Math.max(0.05, 1.0 - (screenSize - pref.preferredMax) * pref.penaltyPerInch);
    }

    const era = getBatteryEra(year);
    let finalCost = 0;
    for (const [slot, comp] of Object.entries(components)) {
      if (comp) finalCost += applyDisplayMultiplier(componentCostDecayed(comp, year), slot, displayMult);
    }
    for (const opt of chassisOptions) {
      if (opt) finalCost += chassisCost(opt, year);
    }
    finalCost += Math.round(bestBattery * era.costPerWh);
    finalCost += COLOUR_OPTIONS.find(c => c.id === selectedColours[0])?.costPerUnit ?? 0;

    const finalVP = (finalWeighted * finalScreenPenalty) / Math.pow(Math.max(1, finalCost), sensitivityExp);

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
      thicknessCm: 3.5,
      bezelMm: BEZEL_MIN_MM,
      selectedColours: [COLOUR_OPTIONS[0].id],
    };
  }

  return bestResult;
}
