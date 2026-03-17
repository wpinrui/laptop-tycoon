/**
 * Generates ephemeral ticker headlines from simulation results.
 * These are presentation-only — not stored in newsHistory.
 */

import { DEMOGRAPHICS } from "../../../data/demographics";
import { DemographicId } from "../../../data/types";
import { QuarterSimulationResult } from "../../../simulation/salesTypes";
import { pickRandom } from "../../../simulation/utils";
import { GameState, getPlayerCompany, modelDisplayName } from "../../state/gameTypes";

export interface TickerHeadline {
  /** Progress (0–1) at which this headline should appear */
  triggerAt: number;
  text: string;
  type: "milestone" | "trend" | "sellout" | "perception";
}

const MAX_HEADLINES = 6;
const HEADLINE_START = 0.15;
const HEADLINE_END = 0.85;
const NEAR_SELLOUT_THRESHOLD = 0.85;
const PERCEPTION_DELTA_THRESHOLD = 0.5;
export const MAX_COMPETITOR_MODELS = 5;

const demName = (id: DemographicId): string =>
  DEMOGRAPHICS.find((d) => d.id === id)?.name ?? id;

/**
 * Generate ticker headlines for the sim animation.
 * Spread across progress 0.15–0.85 so they appear mid-animation.
 */
export function generateTickerHeadlines(
  state: GameState,
  result: QuarterSimulationResult,
): TickerHeadline[] {
  const headlines: TickerHeadline[] = [];
  const player = getPlayerCompany(state);

  // ── Sales milestones ──
  for (const lr of result.playerResults) {
    const model = player.models.find((m) => m.design.id === lr.laptopId);
    if (!model) continue;
    const name = modelDisplayName(player.name, model.design.name);

    if (lr.unitsSold >= 1000) {
      const rounded = Math.floor(lr.unitsSold / 1000) * 1000;
      headlines.push({
        triggerAt: 0,
        text: `${name} crosses ${rounded.toLocaleString()} units sold`,
        type: "milestone",
      });
    } else if (lr.unitsSold >= 100) {
      headlines.push({
        triggerAt: 0,
        text: `${name} sells ${lr.unitsSold.toLocaleString()} units this quarter`,
        type: "milestone",
      });
    }
  }

  // ── Sell-out alerts ──
  for (const lr of result.playerResults) {
    const model = player.models.find((m) => m.design.id === lr.laptopId);
    if (!model) continue;
    const name = modelDisplayName(player.name, model.design.name);

    if (lr.unsoldUnits === 0 && lr.unitsSold > 0) {
      headlines.push({
        triggerAt: 0,
        text: `${name} sells out completely!`,
        type: "sellout",
      });
    } else if (lr.unitsDemanded > 0 && lr.unsoldUnits > 0) {
      const sellThrough = lr.unitsSold / lr.unitsDemanded;
      if (sellThrough > NEAR_SELLOUT_THRESHOLD) {
        headlines.push({
          triggerAt: 0,
          text: `${name} nears sell-out — only ${lr.unsoldUnits.toLocaleString()} left`,
          type: "sellout",
        });
      }
    }
  }

  // ── Top demographic demand trends ──
  const demandByDem = new Map<DemographicId, number>();
  for (const lr of result.laptopResults) {
    for (const db of lr.demographicBreakdown) {
      demandByDem.set(db.demographicId, (demandByDem.get(db.demographicId) ?? 0) + db.unitsDemanded);
    }
  }
  const topDems = [...demandByDem.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  for (const [demId, demand] of topDems) {
    if (demand < 50) continue;
    const templates = [
      `Strong ${demName(demId)} demand this quarter — ${demand.toLocaleString()} units sought`,
      `${demName(demId)} buyers flood the market — ${demand.toLocaleString()} units in demand`,
      `${demName(demId)} segment leads with ${demand.toLocaleString()} units demanded`,
    ];
    headlines.push({
      triggerAt: 0,
      text: pickRandom(templates),
      type: "trend",
    });
  }

  // ── Perception shifts ──
  for (const pc of result.perceptionChanges) {
    if (Math.abs(pc.delta) < PERCEPTION_DELTA_THRESHOLD) continue;
    const dir = pc.delta > 0 ? "rises" : "falls";
    headlines.push({
      triggerAt: 0,
      text: `${player.name} brand perception ${dir} among ${demName(pc.demographicId)}`,
      type: "perception",
    });
  }

  // ── Competitor highlights ──
  const competitorResults = result.laptopResults.filter((lr) => lr.owner !== player.id);
  if (competitorResults.length > 0) {
    const topCompetitor = competitorResults.reduce((best, lr) =>
      lr.unitsSold > best.unitsSold ? lr : best,
    );
    if (topCompetitor.unitsSold > 0) {
      const comp = state.companies.find((c) => c.id === topCompetitor.owner);
      if (comp) {
        const compModel = comp.models.find((m) => m.design.id === topCompetitor.laptopId);
        if (compModel) {
          headlines.push({
            triggerAt: 0,
            text: `${modelDisplayName(comp.name, compModel.design.name)} leads competitor sales with ${topCompetitor.unitsSold.toLocaleString()} units`,
            type: "trend",
          });
        }
      }
    }
  }

  // Cap at MAX_HEADLINES, prioritize variety
  const byType = new Map<string, TickerHeadline[]>();
  for (const h of headlines) {
    const arr = byType.get(h.type) ?? [];
    arr.push(h);
    byType.set(h.type, arr);
  }

  const selected: TickerHeadline[] = [];
  const typeOrder: TickerHeadline["type"][] = ["milestone", "sellout", "trend", "perception"];
  // Round-robin pick 1 from each type, then fill remaining
  for (const t of typeOrder) {
    const arr = byType.get(t);
    if (arr && arr.length > 0) selected.push(arr.shift()!);
  }
  for (const t of typeOrder) {
    const arr = byType.get(t);
    if (arr) {
      for (const h of arr) {
        if (selected.length >= MAX_HEADLINES) break;
        selected.push(h);
      }
    }
  }

  // Space them evenly across HEADLINE_START–HEADLINE_END
  const count = selected.length;
  const range = HEADLINE_END - HEADLINE_START;
  for (let i = 0; i < count; i++) {
    selected[i].triggerAt = count === 1 ? 0.5 : HEADLINE_START + (i / (count - 1)) * range;
  }

  return selected;
}
