import { CSSProperties } from "react";
import { useGame } from "../state/GameContext";
import { formatCash } from "../utils/formatCash";
import { tokens } from "./tokens";

const containerStyle: CSSProperties = {
  position: "fixed",
  top: tokens.spacing.md,
  right: tokens.spacing.md,
  display: "flex",
  gap: tokens.spacing.md,
  zIndex: tokens.zIndex.hud,
  fontFamily: tokens.font.family,
};

const badgeStyle: CSSProperties = {
  background: tokens.colors.hudBg,
  backdropFilter: tokens.backdrop.blur,
  WebkitBackdropFilter: tokens.backdrop.blur,
  borderRadius: tokens.borderRadius.sm,
  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
  color: tokens.colors.text,
  fontSize: tokens.font.sizeSmall,
  fontWeight: 600,
  letterSpacing: 0.5,
  border: `1px solid ${tokens.colors.panelBorder}`,
};

export function HUD() {
  const { state } = useGame();

  return (
    <div style={containerStyle}>
      <div style={badgeStyle}>{state.year}</div>
      <div style={badgeStyle}>{formatCash(state.cash)}</div>
    </div>
  );
}
