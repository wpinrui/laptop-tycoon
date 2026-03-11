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
    success: "#66bb6a",
    successBg: "rgba(102, 187, 106, 0.1)",
    successBorder: "rgba(102, 187, 106, 0.3)",
    dangerBg: "rgba(239, 83, 80, 0.1)",
    accentBg: "rgba(79, 195, 247, 0.1)",
    warning: "#ffa726",
    warningDark: "#d32f2f",
    interactiveAccent: "#90caf9",
    interactiveAccentBg: "#1a3a5c",
    interactiveCompletedBg: "#1b3d1b",
    cardBg: "#1a1a1a",
    cardBgHover: "#222",
    cardBorder: "#444",
    statusDate: "#f87171",
    statusCash: "#facc15",
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
    sizeSmall: 13,
    sizeBase: 15,
    sizeLarge: 18,
    sizeTitle: 24,
    sizeHero: 36,
  },
  layout: {
    panelHeight: "75vh",
    panelWidth: "92vw",
    panelMaxWidth: 1800,
    statusBarHeight: 37,
  },
} as const;

/** Glassmorphic shell style for wizard panels. */
export const wizardShellStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  background: tokens.colors.panelBg,
  backdropFilter: tokens.backdrop.blur,
  WebkitBackdropFilter: tokens.backdrop.blur,
};

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
