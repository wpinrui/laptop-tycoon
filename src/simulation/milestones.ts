/**
 * Milestone detection — runs after each quarter simulation to detect
 * notable events (model launches, financial thresholds, market share crossings).
 * Award milestones are detected separately when SET_AWARDS fires.
 */

import { DemographicId } from "../data/types";
import { DEMOGRAPHICS } from "../data/demographics";
import {
  GameState,
  Milestone,
  Quarter,
  getPlayerCompany,
} from "../renderer/state/gameTypes";
import { QuarterSimulationResult } from "./salesTypes";

let _nextId = 0;
function milestoneId(): string {
  return `ms_${Date.now()}_${_nextId++}`;
}

// ─── Revenue / Profit Thresholds ─────────────────────────────

const CUMULATIVE_REVENUE_THRESHOLDS = [1_000_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000];
const MARKET_SHARE_THRESHOLDS = [0.10, 0.25, 0.50];

function formatThreshold(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return `$${n}`;
}

// ─── Detection Functions ─────────────────────────────────────

/**
 * Detect milestones from a quarter simulation result.
 * Called after APPLY_QUARTER_RESULT with the pre-update state and the result.
 */
export function detectQuarterMilestones(
  state: GameState,
  result: QuarterSimulationResult,
): Milestone[] {
  const milestones: Milestone[] = [];
  const { year, quarter } = result;
  const player = getPlayerCompany(state);
  const existing = state.milestones;

  // ── Model launches ──
  // A model is "launched" when it first appears in simulation results
  const launchedModelIds = new Set(
    existing.filter((m) => m.type === "model").map((m) => m.modelId),
  );
  for (const pr of result.playerResults) {
    if (launchedModelIds.has(pr.laptopId)) continue;
    const model = player.models.find((m) => m.design.id === pr.laptopId);
    if (!model) continue;
    milestones.push({
      id: milestoneId(),
      type: "model",
      year,
      quarter: quarter as Quarter,
      title: `Launched ${model.design.name}`,
      detail: `${model.design.screenSize}" laptop — ${formatThreshold(model.retailPrice ?? 0)} retail`,
      modelId: pr.laptopId,
    });
  }

  // ── Financial: first profitable quarter ──
  const hasFirstProfitableQuarter = existing.some(
    (m) => m.type === "financial" && m.title === "First profitable quarter",
  );
  if (!hasFirstProfitableQuarter && result.totalProfit > 0) {
    milestones.push({
      id: milestoneId(),
      type: "financial",
      year,
      quarter: quarter as Quarter,
      title: "First profitable quarter",
      detail: `${formatThreshold(result.totalProfit)} profit in ${QUARTER_LABEL(quarter)} ${year}`,
    });
  }

  // ── Financial: cumulative revenue thresholds ──
  const prevCumulativeRevenue = cumulativePlayerRevenue(state);
  const newCumulativeRevenue = prevCumulativeRevenue + result.totalRevenue;
  const crossedRevThresholds = existing
    .filter((m) => m.type === "financial" && m.title.includes("revenue exceeded"))
    .map((m) => m.title);

  for (const threshold of CUMULATIVE_REVENUE_THRESHOLDS) {
    if (prevCumulativeRevenue < threshold && newCumulativeRevenue >= threshold) {
      const label = `Cumulative revenue exceeded ${formatThreshold(threshold)}`;
      if (!crossedRevThresholds.includes(label)) {
        milestones.push({
          id: milestoneId(),
          type: "financial",
          year,
          quarter: quarter as Quarter,
          title: label,
          detail: `Total lifetime revenue crossed the ${formatThreshold(threshold)} mark`,
        });
      }
    }
  }

  // ── Financial: first profitable year (checked at Q4) ──
  if (quarter === 4) {
    const hasFirstProfitableYear = existing.some(
      (m) => m.type === "financial" && m.title === "First profitable year",
    );
    if (!hasFirstProfitableYear) {
      // Sum profit across all quarters this year
      const yearProfit =
        state.quarterHistory.reduce((s, q) => s + q.totalProfit, 0) + result.totalProfit;
      if (yearProfit > 0) {
        milestones.push({
          id: milestoneId(),
          type: "financial",
          year,
          quarter: quarter as Quarter,
          title: "First profitable year",
          detail: `Annual profit of ${formatThreshold(yearProfit)} — a turning point for the company`,
        });
      }
    }
  }

  // ── Market share thresholds ──
  const playerResults = result.laptopResults.filter((r) => r.owner === "player");
  if (playerResults.length > 0) {
    // Compute player market share per demographic from this quarter's results
    const playerShareByDemo: Partial<Record<DemographicId, number>> = {};
    for (const dem of DEMOGRAPHICS) {
      let playerUnits = 0;
      let totalUnits = 0;
      for (const lr of result.laptopResults) {
        const db = lr.demographicBreakdown.find((b) => b.demographicId === dem.id);
        if (db) {
          totalUnits += db.unitsDemanded;
          if (lr.owner === "player") playerUnits += db.unitsDemanded;
        }
      }
      if (totalUnits > 0) {
        playerShareByDemo[dem.id] = playerUnits / totalUnits;
      }
    }

    const crossedMarketMilestones = new Set(
      existing.filter((m) => m.type === "market").map((m) => m.title),
    );

    for (const dem of DEMOGRAPHICS) {
      const share = playerShareByDemo[dem.id] ?? 0;
      for (const threshold of MARKET_SHARE_THRESHOLDS) {
        const pctLabel = `${Math.round(threshold * 100)}%`;
        const title = `Reached ${pctLabel} market share in ${dem.shortName}`;
        if (share >= threshold && !crossedMarketMilestones.has(title)) {
          crossedMarketMilestones.add(title);
          milestones.push({
            id: milestoneId(),
            type: "market",
            year,
            quarter: quarter as Quarter,
            title,
            detail: `Captured ${pctLabel} of the ${dem.name} laptop market`,
            marketShareSnapshot: { ...playerShareByDemo } as Partial<Record<DemographicId, number>>,
          });
        }
      }
    }
  }

  return milestones;
}

// ─── Helpers ─────────────────────────────────────────────────

function QUARTER_LABEL(q: number): string {
  return `Q${q}`;
}

function cumulativePlayerRevenue(state: GameState): number {
  let total = 0;
  for (const yr of state.yearHistory) {
    total += yr.totalRevenue;
  }
  for (const q of state.quarterHistory) {
    total += q.totalRevenue;
  }
  return total;
}
