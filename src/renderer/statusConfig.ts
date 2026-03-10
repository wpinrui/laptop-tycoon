import { LaptopModel, ModelStatus } from "./state/gameTypes";
import { tokens } from "./shell/tokens";

export type DisplayStatus = ModelStatus | "ready";

export interface StatusStyle {
  label: string;
  color: string;
  bg: string;
}

export const STATUS_CONFIG: Record<DisplayStatus, StatusStyle> = {
  draft: { label: "Draft", color: tokens.colors.textMuted, bg: tokens.colors.surface },
  ready: { label: "Ready", color: tokens.colors.accent, bg: tokens.colors.accentBg },
  manufacturing: { label: "Manufacturing", color: tokens.colors.warning, bg: "rgba(255, 167, 38, 0.12)" },
  onSale: { label: "On Sale", color: tokens.colors.success, bg: "rgba(102, 187, 106, 0.12)" },
  discontinued: { label: "Discontinued", color: tokens.colors.textMuted, bg: tokens.colors.surface },
};

export function getDisplayStatus(model: LaptopModel, gameYear: number, gameQuarter: 1 | 2 | 3 | 4): DisplayStatus {
  if (model.status === "draft" && model.manufacturingPlan !== null
    && model.manufacturingPlan.year === gameYear && model.manufacturingPlan.quarter === gameQuarter) {
    return "ready";
  }
  return model.status;
}
