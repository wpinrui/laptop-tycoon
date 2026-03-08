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
