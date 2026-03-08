import { CompanyState } from "../renderer/state/gameTypes";
import { YearSimulationResult } from "./salesTypes";
import {
  DEATH_SPIRAL_SALES_THRESHOLD,
  DEATH_SPIRAL_CONSECUTIVE_YEARS,
  DEATH_SPIRAL_BONUS_NUDGE,
  DEATH_SPIRAL_MAX_BONUS,
} from "./tunables";

/**
 * Check each AI competitor's annual sales and apply death spiral prevention.
 * Called at year-end (Q4 → Q1 transition) after yearHistory is finalized.
 *
 * If an AI brand's total annual unit sales fall below the threshold for
 * DEATH_SPIRAL_CONSECUTIVE_YEARS+ years, nudge their engineeringBonus up
 * to help them pick better components next year.
 */
export function applyDeathSpiralPrevention(
  companies: CompanyState[],
  yearResult: YearSimulationResult,
): CompanyState[] {
  return companies.map((comp) => {
    if (comp.isPlayer) return comp;

    // Sum total units sold across all of this competitor's laptops this year
    const totalSales = yearResult.laptopResults
      .filter((lr) => lr.owner === comp.id)
      .reduce((sum, lr) => sum + lr.unitsSold, 0);

    const wasLow = totalSales < DEATH_SPIRAL_SALES_THRESHOLD;
    const prevConsecutive = comp.consecutiveLowSalesYears ?? 0;
    const consecutiveLowSalesYears = wasLow ? prevConsecutive + 1 : 0;

    let engineeringBonus = comp.engineeringBonus ?? 0;
    if (consecutiveLowSalesYears >= DEATH_SPIRAL_CONSECUTIVE_YEARS) {
      engineeringBonus = Math.min(
        engineeringBonus + DEATH_SPIRAL_BONUS_NUDGE,
        DEATH_SPIRAL_MAX_BONUS,
      );
    }

    return {
      ...comp,
      consecutiveLowSalesYears,
      engineeringBonus,
    };
  });
}
