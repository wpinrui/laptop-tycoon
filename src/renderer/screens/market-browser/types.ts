import { CSSProperties } from "react";
import { CompanyState, LaptopModel } from "../../state/gameTypes";
import { computeStatsForDesign } from "../../../simulation/statCalculation";
import { ALL_STATS, STAT_LABELS, LaptopStat, ComponentSlot } from "../../../data/types";
import { PORT_TYPES } from "../../../data/portTypes";
import { tokens } from "../../shell/tokens";
import { useGame } from "../../state/GameContext";

export { ALL_STATS, STAT_LABELS, type LaptopStat, type ComponentSlot };
export { computeStatsForDesign };
export { tokens };

export type ViewMode = "cards" | "table" | "compare";

export interface MarketEntry {
  company: CompanyState;
  model: LaptopModel;
}

export type SortKey = "name" | "price" | "brand" | "screenSize" | `stat:${LaptopStat}`;

export const COMPONENT_SLOT_LABELS: Record<ComponentSlot, string> = {
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  storage: "Storage",
  resolution: "Resolution",
  displayTech: "Display Tech",
  displaySurface: "Surface",
  wifi: "WiFi",
  webcam: "Webcam",
  speakers: "Speakers",
};

export const SPEC_SLOTS: ComponentSlot[] = ["cpu", "gpu", "ram", "storage"];
export const DISPLAY_SLOTS: ComponentSlot[] = ["resolution", "displayTech", "displaySurface"];
export const MEDIA_SLOTS: ComponentSlot[] = ["wifi", "webcam", "speakers"];

export const TABLE_STATS: LaptopStat[] = ["performance", "gamingPerformance", "batteryLife", "display", "buildQuality", "thermals", "weight"];

export const RADAR_COLORS = ["#4fc3f7", "#ffb74d", "#ce93d8"];

// --- Helpers ---

export function getMarketEntries(state: ReturnType<typeof useGame>["state"]): MarketEntry[] {
  const entries: MarketEntry[] = [];
  for (const company of state.companies) {
    for (const model of company.models) {
      if (model.status !== "onSale" && model.status !== "manufacturing") continue;
      if (!model.retailPrice) continue;
      entries.push({ company, model });
    }
  }
  return entries;
}

export function getLastQuarterSales(
  state: ReturnType<typeof useGame>["state"],
  laptopId: string,
): number | null {
  const lastSim = state.lastSimulationResult;
  if (!lastSim) return null;
  const result = lastSim.laptopResults.find((r) => r.laptopId === laptopId);
  return result ? result.unitsSold : null;
}

export function getAllStats(model: LaptopModel, year: number): { stat: LaptopStat; label: string; value: number }[] {
  const stats = computeStatsForDesign(model.design, year);
  return ALL_STATS
    .map((stat) => ({ stat, label: STAT_LABELS[stat], value: stats[stat] ?? 0 }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function getMaxStatValue(entries: MarketEntry[], year: number): Partial<Record<LaptopStat, number>> {
  const maxes: Partial<Record<LaptopStat, number>> = {};
  for (const { model } of entries) {
    const stats = computeStatsForDesign(model.design, year);
    for (const stat of ALL_STATS) {
      const val = stats[stat] ?? 0;
      if (!maxes[stat] || val > maxes[stat]) maxes[stat] = val;
    }
  }
  return maxes;
}

export function getPortSummary(ports: Record<string, number>): string[] {
  const lines: string[] = [];
  for (const [portId, count] of Object.entries(ports)) {
    if (count <= 0) continue;
    const portDef = PORT_TYPES.find((p) => p.id === portId);
    const name = portDef?.name ?? portId;
    lines.push(count > 1 ? `${count}x ${name}` : name);
  }
  return lines;
}

export function scoreColor(value: number, allValues: number[], higherIsBetter: boolean): string | undefined {
  if (allValues.length < 2) return undefined;
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
  if (max === min) return undefined;
  if (higherIsBetter) {
    if (value === max) return tokens.colors.success;
    if (value === min) return tokens.colors.danger;
  } else {
    if (value === min) return tokens.colors.success;
    if (value === max) return tokens.colors.danger;
  }
  return undefined;
}

// --- Shared styles ---

export const cardStyle: CSSProperties = {
  background: tokens.colors.cardBg,
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.md,
};

export const playerCardStyle: CSSProperties = {
  ...cardStyle,
  border: `1px solid ${tokens.colors.accent}`,
};

export const cardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: tokens.spacing.sm,
};

export const modelNameStyle: CSSProperties = {
  fontSize: tokens.font.sizeLarge,
  fontWeight: 700,
};

export const brandNameStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
};

export const priceStyle: CSSProperties = {
  fontSize: tokens.font.sizeLarge,
  fontWeight: 700,
  color: tokens.colors.accent,
  textAlign: "right" as const,
};

export const sectionStyle: CSSProperties = {
  marginTop: tokens.spacing.sm,
  paddingTop: tokens.spacing.sm,
  borderTop: `1px solid ${tokens.colors.panelBorder}`,
};

export const sectionTitleStyle: CSSProperties = {
  fontSize: "0.6875rem",
  color: tokens.colors.textMuted,
  fontWeight: "bold",
  letterSpacing: "0.5px",
  marginBottom: tokens.spacing.xs,
};

export const specRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: tokens.font.sizeSmall,
  padding: `1px 0`,
};

export const specLabelStyle: CSSProperties = {
  color: tokens.colors.textMuted,
  flexShrink: 0,
  marginRight: tokens.spacing.sm,
};

export const specValueStyle: CSSProperties = {
  textAlign: "right" as const,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};
