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
export function batteryVolumeCm3(batteryWh: number): number {
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
 * Cooling capacity multiplier based on chassis dimensions.
 * Combines thickness (room for heatsinks/fans) and bezel width (larger footprint = more surface area).
 *
 * Thickness factor: 0.5 at min → 1.0 at max (linear).
 * Bezel factor:     0.85 at min → 1.15 at max (linear).
 * Result is the product, so a thin + narrow-bezel laptop gets ~0.43x cooling,
 * while a thick + wide-bezel one gets ~1.15x.
 */
export function coolingMultiplier(thicknessCm: number, bezelMm: number): number {
  const tThick = (thicknessCm - THICKNESS_MIN_CM) / (THICKNESS_MAX_CM - THICKNESS_MIN_CM);
  const thicknessFactor = 0.5 + 0.5 * Math.max(0, Math.min(1, tThick));

  const tBezel = (bezelMm - BEZEL_MIN_MM) / (BEZEL_MAX_MM - BEZEL_MIN_MM);
  const bezelFactor = 0.85 + 0.3 * Math.max(0, Math.min(1, tBezel));

  return thicknessFactor * bezelFactor;
}
