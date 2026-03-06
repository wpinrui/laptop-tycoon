import { CSSProperties } from "react";

/** Shared design tokens for the game shell UI. */

export const tokens = {
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 20,
  },
  colors: {
    panelBg: "rgba(0, 0, 0, 0.82)",
    panelBorder: "rgba(255, 255, 255, 0.18)",
    text: "#e0e0e0",
    textMuted: "#888",
    accent: "#4fc3f7",
    accentHover: "#81d4fa",
    danger: "#ef5350",
    dangerHover: "#f44336",
    background: "#121212",
    surface: "rgba(255, 255, 255, 0.05)",
    surfaceHover: "rgba(255, 255, 255, 0.1)",
  },
  backdrop: {
    blur: "blur(20px)",
  },
  zIndex: {
    overlay: 500,
    tooltip: 1000,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  font: {
    family: "'Segoe UI', system-ui, -apple-system, sans-serif",
    sizeSmall: 12,
    sizeBase: 14,
    sizeLarge: 18,
    sizeTitle: 24,
    sizeHero: 36,
  },
  layout: {
    panelHeight: "75vh",
    panelWidth: "92vw",
    panelMaxWidth: 1800,
  },
} as const;

/** Reusable modal overlay style (dark scrim + centered flex). */
export const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: tokens.zIndex.overlay,
};
