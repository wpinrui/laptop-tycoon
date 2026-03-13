import { CSSProperties } from "react";
import { tokens } from "../shell/tokens";

export const titleStyle: CSSProperties = {
  margin: 0,
  marginBottom: tokens.spacing.lg,
  fontSize: tokens.font.sizeTitle,
  fontWeight: 700,
};

export const sectionStyle: CSSProperties = {
  marginBottom: tokens.spacing.lg,
};

export const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: tokens.spacing.sm,
};

export const thStyle: CSSProperties = {
  textAlign: "left",
  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
  borderBottom: `1px solid ${tokens.colors.panelBorder}`,
  color: tokens.colors.textMuted,
  fontSize: tokens.font.sizeSmall,
  fontWeight: 600,
};

export const tdStyle: CSSProperties = {
  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
  borderBottom: `1px solid ${tokens.colors.surface}`,
};

export const tdRight: CSSProperties = { ...tdStyle, textAlign: "right" };

export const summaryRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: `${tokens.spacing.xs}px 0`,
};

export const sectionHeadingStyle: CSSProperties = {
  margin: 0,
  marginBottom: tokens.spacing.sm,
  color: tokens.colors.accent,
};

/** Card wrapper for visually distinct sections */
export const cardStyle: CSSProperties = {
  background: tokens.colors.cardBg,
  border: `1px solid ${tokens.colors.cardBorder}`,
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.md,
  marginBottom: tokens.spacing.md,
};

/** Two-column layout container */
export const twoColumnLayout: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "3fr 2fr",
  gap: tokens.spacing.md,
  alignItems: "start",
};

/** Hero KPI row */
export const kpiRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: tokens.spacing.sm,
  marginBottom: tokens.spacing.lg,
};

/** Individual KPI card */
export const kpiCardStyle: CSSProperties = {
  background: tokens.colors.cardBg,
  border: `1px solid ${tokens.colors.cardBorder}`,
  borderRadius: tokens.borderRadius.md,
  padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
  textAlign: "center",
};

export const kpiLabelStyle: CSSProperties = {
  margin: 0,
  fontSize: tokens.font.sizeSmall,
  color: tokens.colors.textMuted,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

export const kpiValueStyle: CSSProperties = {
  margin: 0,
  marginTop: tokens.spacing.xs,
  fontSize: tokens.font.sizeHero,
  fontWeight: 700,
  lineHeight: 1.1,
};

export const kpiDeltaStyle: CSSProperties = {
  margin: 0,
  marginTop: tokens.spacing.xs,
  fontSize: tokens.font.sizeSmall,
  fontWeight: 600,
};
