import { GameState, getPlayerCompany } from "../../state/gameTypes";
import { tokens } from "../../shell/tokens";

export function getActiveModels(state: GameState) {
  return getPlayerCompany(state).models.filter((m) => m.status !== "discontinued");
}

export function formatPerception(raw: number): { value: number; sign: string; color: string } {
  const value = Math.round(raw);
  return { value, sign: value > 0 ? "+" : "", color: perceptionColor(value) };
}

export function perceptionColor(value: number): string {
  if (value > 10) return tokens.colors.success;
  if (value > 0) return tokens.colors.text;
  if (value < -10) return tokens.colors.danger;
  if (value < 0) return tokens.colors.warning;
  return tokens.colors.textMuted;
}

export function formatPerceptionImpact(perception: number): string {
  const pct = Math.round(perception);
  if (pct === 0) return "0% appeal";
  return `${pct > 0 ? "+" : ""}${pct}% appeal`;
}
