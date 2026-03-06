export const GAME_YEAR = 2000; // TODO: inject from game state

export const MIN_BATTERY_WH = 20;
export const BATTERY_STEP_WH = 5;

export function maxBatteryWh(baseBatteryCapacityWh: number): number {
  return Math.floor(baseBatteryCapacityWh / BATTERY_STEP_WH) * BATTERY_STEP_WH;
}

export function formatWeight(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`;
}

// --- Thickness ---

export const THICKNESS_MIN_CM = 2.0;
export const THICKNESS_MAX_CM = 5.0;
export const THICKNESS_STEP_CM = 0.1;
export const THICKNESS_DEFAULT_CM = 3.5;

// Li-Ion ~175 Wh/L in 2000 → ~5.7 cm³ per Wh
const CM3_PER_WH = 5.7;

// Minimum thickness for motherboard, keyboard mechanism, etc.
const BASE_MIN_THICKNESS_CM = 1.2;

// Approximate internal battery footprint area (cm²) by screen diagonal.
// Larger screens spread the battery over more area, allowing thinner designs
// for the same capacity.
function batteryAreaCm2(screenSizeInches: number): number {
  // Rough model: area scales with screen size squared, calibrated so
  // 14" ≈ 250 cm² of usable battery footprint.
  return (screenSizeInches / 14) * (screenSizeInches / 14) * 250;
}

/** Minimum chassis thickness (cm) given battery capacity and screen size. */
export function minThicknessCm(batteryWh: number, screenSizeInches: number): number {
  const batteryVolume = batteryWh * CM3_PER_WH;
  const area = batteryAreaCm2(screenSizeInches);
  const batteryThickness = batteryVolume / area;
  return Math.ceil((BASE_MIN_THICKNESS_CM + batteryThickness) * 10) / 10; // round up to 1dp
}

/**
 * Cooling capacity multiplier based on thickness.
 * Thinner chassis has less room for heatsinks/fans.
 * At THICKNESS_MAX_CM → 1.0 (full cooling).
 * At THICKNESS_MIN_CM → 0.5 (half cooling).
 * Linear interpolation between.
 */
export function coolingMultiplier(thicknessCm: number): number {
  const t = (thicknessCm - THICKNESS_MIN_CM) / (THICKNESS_MAX_CM - THICKNESS_MIN_CM);
  const clamped = Math.max(0, Math.min(1, t));
  return 0.5 + 0.5 * clamped;
}
