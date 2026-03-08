import { ModelStatus } from "./state/gameTypes";
import { tokens } from "./shell/tokens";

export interface StatusStyle {
  label: string;
  color: string;
  bg: string;
}

export const STATUS_CONFIG: Record<ModelStatus, StatusStyle> = {
  draft: { label: "Draft", color: tokens.colors.textMuted, bg: tokens.colors.surface },
  manufacturing: { label: "Manufacturing", color: tokens.colors.warning, bg: "rgba(255, 167, 38, 0.12)" },
  onSale: { label: "On Sale", color: tokens.colors.success, bg: "rgba(102, 187, 106, 0.12)" },
  discontinued: { label: "Discontinued", color: tokens.colors.textMuted, bg: tokens.colors.surface },
};
