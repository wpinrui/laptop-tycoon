import { ChassisOption, ComponentSlot } from "../../data/types";
import { PORT_TYPES } from "../../data/portTypes";

export const GAME_YEAR = 2000; // TODO: inject from game state

export const MIN_BATTERY_WH = 20;
export const MAX_BATTERY_WH = 100;
export const BATTERY_STEP_WH = 5;

export function formatWeight(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`;
}

// --- Thickness ---

export const THICKNESS_MIN_CM = 0.5;
export const THICKNESS_MAX_CM = 8.0;
export const THICKNESS_STEP_CM = 0.1;
export const THICKNESS_DEFAULT_CM = 3.5;

// --- Bezel ---

export const BEZEL_MIN_MM = 3;
export const BEZEL_MAX_MM = 40;
export const BEZEL_STEP_MM = 1;
export const BEZEL_DEFAULT_MM = 20;

// --- Volume calculation ---

// Li-Ion ~175 Wh/L in 2000 → ~5.7 cm³ per Wh
export const CM3_PER_WH = 5.7;

/**
 * Minimum thickness overhead for structural elements (PCB, keyboard, case walls).
 * Decreases over time as manufacturing tech improves.
 * 2000: 0.8 cm (thick PCBs, bulky keyboards)
 * 2025: 0.4 cm (ultra-thin internals, low-profile switches)
 * Linear interpolation between.
 */
export function baseMinThicknessCm(year: number): number {
  const t = Math.max(0, Math.min(1, (year - 2000) / 25));
  return 0.8 - 0.4 * t;
}

/**
 * Calculate chassis footprint area (cm²) from screen size and bezel width.
 * Assumes 4:3 aspect ratio for screens (standard in 2000-2005 era).
 * The base (bottom half) of the laptop roughly matches the lid dimensions.
 */
export function chassisFootprintCm2(screenSizeInches: number, bezelMm: number): number {
  const diagonalCm = screenSizeInches * 2.54;
  // 4:3 aspect → width = diagonal * 4/5, height = diagonal * 3/5
  const screenWidthCm = diagonalCm * (4 / 5);
  const screenHeightCm = diagonalCm * (3 / 5);
  const bezelCm = bezelMm / 10;
  const chassisWidth = screenWidthCm + 2 * bezelCm;
  const chassisDepth = screenHeightCm + 2 * bezelCm;
  return chassisWidth * chassisDepth;
}

/**
 * Available internal volume (cm³) given chassis dimensions.
 * Subtracts era-dependent base thickness for PCB/keyboard/case walls from total height.
 */
export function availableVolumeCm3(
  screenSizeInches: number,
  bezelMm: number,
  thicknessCm: number,
  year: number,
): number {
  const footprint = chassisFootprintCm2(screenSizeInches, bezelMm);
  const usableHeight = Math.max(0, thicknessCm - baseMinThicknessCm(year));
  return footprint * usableHeight;
}

/**
 * Battery volume in cm³.
 */
function batteryVolumeCm3(batteryWh: number): number {
  return batteryWh * CM3_PER_WH;
}

/**
 * Calculate minimum thickness required to fit all components by volume.
 * Returns the thickness where available volume = total consumed volume.
 */
export function minThicknessForVolumeCm(
  totalVolumeCm3: number,
  screenSizeInches: number,
  bezelMm: number,
  year: number,
): number {
  const footprint = chassisFootprintCm2(screenSizeInches, bezelMm);
  if (footprint <= 0) return THICKNESS_MAX_CM;
  const requiredUsableHeight = totalVolumeCm3 / footprint;
  return Math.ceil((baseMinThicknessCm(year) + requiredUsableHeight) * 10) / 10;
}

/**
 * Cooling capacity multiplier based on chassis dimensions and internal space usage.
 * Combines thickness, bezel width, and airflow (free internal space).
 *
 * Thickness factor: 0.5 at min → 1.0 at max (linear).
 * Bezel factor:     0.85 at min → 1.15 at max (linear).
 * Airflow factor:   1.15 at 0% usage → 0.75 at 100% usage (linear).
 *   More free space inside = better airflow around components.
 */
export function coolingMultiplier(
  thicknessCm: number,
  bezelMm: number,
  spaceUtilization: number,
): number {
  const tThick = (thicknessCm - THICKNESS_MIN_CM) / (THICKNESS_MAX_CM - THICKNESS_MIN_CM);
  const thicknessFactor = 0.5 + 0.5 * Math.max(0, Math.min(1, tThick));

  const tBezel = (bezelMm - BEZEL_MIN_MM) / (BEZEL_MAX_MM - BEZEL_MIN_MM);
  const bezelFactor = 0.85 + 0.3 * Math.max(0, Math.min(1, tBezel));

  const utilClamped = Math.max(0, Math.min(1, spaceUtilization));
  const airflowFactor = 1.15 - 0.4 * utilClamped;

  return thicknessFactor * bezelFactor * airflowFactor;
}

// --- Shared helpers ---

export const DISPLAY_SLOTS: ComponentSlot[] = ["resolution", "displayTech", "displaySurface"];

export function applyDisplayMultiplier(value: number, slot: string, multiplier: number): number {
  return DISPLAY_SLOTS.includes(slot as ComponentSlot) ? Math.round(value * multiplier) : value;
}

export function specSummary(specs: Record<string, string>): string {
  return Object.entries(specs)
    .map(([key, value]) => `${formatSpecKey(key)}: ${value}`)
    .join(" · ");
}

function formatSpecKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

const BATTERY_WARNING_THRESHOLDS: [number, number][] = [
  [2002, 1.5],
  [2005, 2],
  [2009, 2.5],
  [2014, 3],
  [Infinity, 4],
];

/** Average usage multiplier for battery life estimates (40% of max TDP) */
export const AVG_USAGE_MULTIPLIER = 0.4;

export function batteryWarningThresholdH(year: number): number {
  for (const [maxYear, threshold] of BATTERY_WARNING_THRESHOLDS) {
    if (year <= maxYear) return threshold;
  }
  return 4;
}

export function chassisCost(option: ChassisOption, year: number): number {
  const age = year - option.yearIntroduced;
  return Math.round(option.costAtLaunch * Math.pow(1 - option.costDecayRate, age));
}

/** Sum all internal volume consumed: components + battery + ports + chassis options. */
export function totalConsumedVolumeCm3(
  components: Partial<Record<ComponentSlot, { volumeCm3: number }>>,
  batteryWh: number,
  ports: Record<string, number>,
  chassisOptions: (ChassisOption | null)[],
): number {
  let vol = 0;
  for (const comp of Object.values(components)) {
    if (comp) vol += comp.volumeCm3;
  }
  vol += batteryVolumeCm3(batteryWh);
  for (const pt of PORT_TYPES) {
    vol += (ports[pt.id] ?? 0) * pt.volumePerPortCm3;
  }
  for (const opt of chassisOptions) {
    if (opt) vol += opt.volumeCm3;
  }
  return vol;
}

/** Max minThicknessCm across all selected items. */
export function maxHeightConstraintCm(
  components: Partial<Record<ComponentSlot, { minThicknessCm: number }>>,
  ports: Record<string, number>,
  chassisOptions: (ChassisOption | null)[],
): number {
  let max = 0;
  for (const comp of Object.values(components)) {
    if (comp && comp.minThicknessCm > max) max = comp.minThicknessCm;
  }
  for (const pt of PORT_TYPES) {
    if ((ports[pt.id] ?? 0) > 0 && pt.minThicknessCm > max) max = pt.minThicknessCm;
  }
  for (const opt of chassisOptions) {
    if (opt && opt.minThicknessCm > max) max = opt.minThicknessCm;
  }
  return max;
}
