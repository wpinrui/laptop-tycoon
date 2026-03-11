/**
 * Re-exports from centralised tunables for backwards-compatible imports.
 */
export {
  REFERENCE_QUANTITY,
  MULTI_MODEL_OVERHEAD,
  DEMAND_NOISE_MIN,
  DEMAND_NOISE_MAX,
  MIN_BATCH_SIZE,
  MIN_PRICE_MULTIPLIER,
  DEFAULT_PRICE_MULTIPLIER,
  MAX_PRICE_MULTIPLIER,
  ASSEMBLY_QA_COST,
  PACKAGING_LOGISTICS_COST,
  CHANNEL_MARGIN_RATE,
  TOOLING_COST,
  CERTIFICATION_COST,
} from "../../../simulation/tunables";

/** Absolute floor for retail pricing. */
export const MIN_RETAIL_PRICE = 49;

/** Snap price to nearest $50 ending in 9, e.g. $449, $499, $549 */
export function snapPrice(raw: number): number {
  return Math.round(raw / 50) * 50 - 1;
}
