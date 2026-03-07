import { CSSProperties } from "react";
import { useGame } from "../state/GameContext";
import { formatCash } from "../utils/formatCash";
import { tokens } from "./tokens";
import { Calendar, Coins } from "lucide-react";

const baseStyle: CSSProperties = {
  height: 36,
  background: tokens.colors.panelBg,
  backdropFilter: tokens.backdrop.blur,
  WebkitBackdropFilter: tokens.backdrop.blur,
  borderTop: `1px solid ${tokens.colors.panelBorder}`,
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.lg,
  fontSize: tokens.font.sizeBase,
  color: tokens.colors.textMuted,
  fontFamily: tokens.font.family,
  flexShrink: 0,
};

const fixedStyle: CSSProperties = {
  ...baseStyle,
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  padding: `0 ${tokens.spacing.lg}px`,
  zIndex: tokens.zIndex.overlay - 1,
};

const embeddedStyle: CSSProperties = {
  ...baseStyle,
  margin: `0 -${tokens.spacing.xl}px -${tokens.spacing.xl}px`,
  padding: `0 ${tokens.spacing.xl}px`,
  borderRadius: `0 0 ${tokens.borderRadius.lg}px ${tokens.borderRadius.lg}px`,
};

const itemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.xs,
};

export function StatusBar({ variant = "embedded" }: { variant?: "embedded" | "fixed" }) {
  const { state } = useGame();

  return (
    <div style={variant === "fixed" ? fixedStyle : embeddedStyle}>
      <span style={{ ...itemStyle, color: tokens.colors.statusDate, fontWeight: 700 }}>
        <Calendar size={14} strokeWidth={2.5} />
        {state.yearSimulated ? "Dec" : "Jan"} {state.year}
      </span>
      <span style={{ ...itemStyle, color: tokens.colors.statusCash, fontWeight: 700 }}>
        <Coins size={14} strokeWidth={2.5} />
        {formatCash(state.cash)}
      </span>
    </div>
  );
}
