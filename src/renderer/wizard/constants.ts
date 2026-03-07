import { ChassisOption, ChassisOptionSlot, Component, ComponentSlot, ScreenSizeInches } from "../../data/types";
import { PORT_TYPES } from "../../data/portTypes";
import { ALL_COMPONENTS } from "../../data/components";
import { COLOUR_OPTIONS } from "../../data/colourOptions";
import { getScreenSizeDef } from "../../data/screenSizes";
import { getBatteryEra } from "../../data/batteryEras";
import { SLOT_CONFIGS } from "../../data/slotConfigs";
import {
  MATERIALS,
  COOLING_SOLUTIONS,
  KEYBOARD_FEATURES,
  TRACKPAD_FEATURES,
} from "../../data/chassisOptions";

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

// --- Design bonus tuning constants ---

/** Max design points from thinness (cubic curve, huge impact at extremes) */
export const DESIGN_THICKNESS_MAX_BONUS = 40;
/** Max design points from narrow bezels (power of 1.3 curve) */
export const DESIGN_BEZEL_MAX_BONUS = 30;
/** Base multiplier per colour count (sqrt(count) * this) */
export const DESIGN_COLOUR_COUNT_MULTIPLIER = 8;
/** Per-dollar premium colour cost bonus factor */
export const DESIGN_COLOUR_PREMIUM_FACTOR = 0.02;
/** Exponent for bezel bonus curve (1 = linear, higher = more reward for narrow bezels) */
export const DESIGN_BEZEL_EXPONENT = 1.3;
/** Baseline per-unit colour cost used as reference for premium multiplier */
export const DESIGN_COLOUR_BASE_COST = 2;
/** Divisor applied to raw colour bonus (dampens the total) */
export const DESIGN_COLOUR_BONUS_DIVISOR = 2;

// --- Chassis shell weight ---

/**
 * Weight of the chassis shell (top/bottom panels + side walls) in grams.
 * Scales with footprint area, thickness, and material density multiplier.
 *
 * Base density 0.15 g/cm³ (plastic = 1.0x). Material choice scales this:
 *   Carbon fibre (0.45x) → much lighter shell
 *   Magnesium (0.65x)   → light metal
 *   Aluminium (0.85x)   → moderate savings
 *   Plastic (1.0x)      → baseline
 */
const SHELL_DENSITY_G_PER_CM3 = 0.15;

export function chassisShellWeightG(
  screenSizeInches: number,
  bezelMm: number,
  thicknessCm: number,
  materialDensityMultiplier: number = 1.0,
): number {
  const footprint = chassisFootprintCm2(screenSizeInches, bezelMm);
  return Math.round(footprint * thicknessCm * SHELL_DENSITY_G_PER_CM3 * materialDensityMultiplier);
}

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

/** Average usage multiplier — early hardware had crude power management, improves over time */
export function avgUsageMultiplier(year: number): number {
  // Linear interpolation: 0.85 in 2000 → 0.25 in 2020
  return Math.max(0.25, Math.min(0.85, 0.85 - ((year - 2000) / 20) * 0.6));
}

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

export function componentCostDecayed(component: Component, year: number): number {
  const slotConfig = SLOT_CONFIGS.find((s) => s.slot === component.slot);
  if (!slotConfig) return component.costAtLaunch;
  const age = Math.max(0, year - component.yearIntroduced);
  return Math.round(component.costAtLaunch * Math.pow(1 - slotConfig.costDecayRate, age));
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

// --- Shared data lookups ---

export interface ChassisSlotDef {
  slot: ChassisOptionSlot;
  label: string;
  options: ChassisOption[];
}

export const CHASSIS_SLOTS: ChassisSlotDef[] = [
  { slot: "material", label: "Chassis Material", options: MATERIALS },
  { slot: "coolingSolution", label: "Cooling Solution", options: COOLING_SOLUTIONS },
  { slot: "keyboardFeature", label: "Keyboard", options: KEYBOARD_FEATURES },
  { slot: "trackpadFeature", label: "Trackpad / Pointing Device", options: TRACKPAD_FEATURES },
];

export function getAvailableComponents(slot: ComponentSlot, year: number): Component[] {
  return ALL_COMPONENTS
    .filter((c) => c.slot === slot && c.yearIntroduced <= year && c.yearDiscontinued >= year)
    .sort((a, b) => a.costAtLaunch - b.costAtLaunch);
}

export function getAvailableChassisOptions(options: ChassisOption[], year: number): ChassisOption[] {
  return options
    .filter((o) => o.yearIntroduced <= year && (o.yearDiscontinued === null || o.yearDiscontinued >= year))
    .sort((a, b) => a.costAtLaunch - b.costAtLaunch);
}

// --- Laptop totals (shared by Sidebar + ReviewStep) ---

export interface LaptopTotals {
  componentCost: number;
  componentPower: number;
  componentWeight: number;
  portCost: number;
  portWeight: number;
  chassisOptionCost: number;
  chassisOptionWeight: number;
  batteryCost: number;
  batteryWeight: number;
  colourCost: number;
  shellWeight: number;
  /** Sum of all additive weights (components + ports + chassis options + battery + shell). Does NOT include screenSizeDef.baseWeightG. */
  subtotalWeight: number;
  totalCost: number;
  totalPower: number;
}

export function computeLaptopTotals(
  components: Partial<Record<ComponentSlot, Component>>,
  ports: Record<string, number>,
  chassis: { material: ChassisOption | null; coolingSolution: ChassisOption | null; keyboardFeature: ChassisOption | null; trackpadFeature: ChassisOption | null },
  batteryCapacityWh: number,
  selectedColours: string[],
  screenSize: ScreenSizeInches,
  bezelMm: number,
  thicknessCm: number,
  year: number,
): LaptopTotals {
  const screenSizeDef = getScreenSizeDef(screenSize);
  const era = getBatteryEra(year);
  const displayMult = screenSizeDef.displayMultiplier;

  let componentCost = 0;
  let componentPower = 0;
  let componentWeight = 0;
  for (const [slot, comp] of Object.entries(components)) {
    if (!comp) continue;
    componentCost += applyDisplayMultiplier(componentCostDecayed(comp, year), slot, displayMult);
    componentPower += applyDisplayMultiplier(comp.powerDrawW, slot, displayMult);
    componentWeight += applyDisplayMultiplier(comp.weightG, slot, displayMult);
  }

  let portCost = 0;
  let portWeight = 0;
  for (const pt of PORT_TYPES) {
    const count = ports[pt.id] ?? 0;
    portCost += count * pt.costPerPort;
    portWeight += count * pt.weightPerPortG;
  }

  const allChassisOptions = [chassis.material, chassis.coolingSolution, chassis.keyboardFeature, chassis.trackpadFeature];
  const selectedChassisOptions = allChassisOptions.filter((o): o is ChassisOption => o !== null);
  const chassisOptionCost = selectedChassisOptions.reduce((sum, o) => sum + chassisCost(o, year), 0);
  const chassisOptionWeight = selectedChassisOptions.reduce((sum, o) => sum + o.weightG, 0);

  const batteryCost = Math.round(batteryCapacityWh * era.costPerWh);
  const batteryWeight = Math.round(batteryCapacityWh * era.weightPerWh);

  const colourCost = selectedColours.reduce((sum, id) => {
    const opt = COLOUR_OPTIONS.find((c) => c.id === id);
    return sum + (opt?.costPerUnit ?? 0);
  }, 0);

  const materialDensity = chassis.material?.shellDensityMultiplier ?? 1.0;
  const shellWeight = chassisShellWeightG(screenSize, bezelMm, thicknessCm, materialDensity);

  const subtotalWeight = componentWeight + portWeight + chassisOptionWeight + batteryWeight + shellWeight;
  const totalCost = componentCost + portCost + chassisOptionCost + batteryCost + colourCost;
  const totalPower = componentPower;

  return {
    componentCost, componentPower, componentWeight,
    portCost, portWeight,
    chassisOptionCost, chassisOptionWeight,
    batteryCost, batteryWeight,
    colourCost, shellWeight,
    subtotalWeight, totalCost, totalPower,
  };
}
