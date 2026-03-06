import { CSSProperties } from "react";
import { useGame } from "../state/GameContext";
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

function formatCash(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export function HUD() {
  const { state } = useGame();

  return (
    <div style={containerStyle}>
      <div style={badgeStyle}>{state.year}</div>
      <div style={badgeStyle}>{formatCash(state.cash)}</div>
    </div>
  );
}
