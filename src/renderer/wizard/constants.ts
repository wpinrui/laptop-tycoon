export const GAME_YEAR = 2000; // TODO: inject from game state

export const MIN_BATTERY_WH = 20;
export const BATTERY_STEP_WH = 5;

export function formatWeight(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`;
}
