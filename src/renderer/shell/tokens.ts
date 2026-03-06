/** Shared design tokens for the game shell UI. */

export const tokens = {
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 20,
  },
  colors: {
    panelBg: "rgba(0, 0, 0, 0.75)",
    panelBorder: "rgba(255, 255, 255, 0.08)",
    hudBg: "rgba(0, 0, 0, 0.6)",
    text: "#e0e0e0",
    textMuted: "#888",
    accent: "#4fc3f7",
    accentHover: "#81d4fa",
    danger: "#ef5350",
    background: "#121212",
    surface: "rgba(255, 255, 255, 0.05)",
    surfaceHover: "rgba(255, 255, 255, 0.1)",
  },
  backdrop: {
    blur: "blur(20px)",
  },
  zIndex: {
    hud: 100,
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
  },
} as const;
