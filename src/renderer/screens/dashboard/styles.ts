import { CSSProperties } from "react";
import { tokens } from "../../shell/tokens";

export const cardStyle: CSSProperties = {
  background: tokens.colors.cardBg,
  borderRadius: tokens.borderRadius.md,
  padding: tokens.spacing.xl,
  transition: "background 0.15s",
  border: `1px solid ${tokens.colors.panelBorder}`,
};

export const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: tokens.font.sizeTitle,
  fontWeight: 600,
  marginBottom: tokens.spacing.md,
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.sm,
};

export const cardBodyStyle: CSSProperties = {
  color: tokens.colors.textMuted,
  fontSize: tokens.font.sizeBase,
  margin: 0,
};

export const sectionDividerStyle: CSSProperties = {
  borderTop: `1px solid ${tokens.colors.panelBorder}`,
  marginTop: tokens.spacing.md,
  paddingTop: tokens.spacing.md,
};

export const sectionHeadingStyle: CSSProperties = {
  ...cardBodyStyle,
  fontWeight: 600,
};

export const smallTextStyle: CSSProperties = {
  ...cardBodyStyle,
  fontSize: tokens.font.sizeSmall,
};

export const hintStyle: CSSProperties = {
  ...smallTextStyle,
  fontStyle: "italic",
};

export const tableCellStyle: CSSProperties = {
  ...cardBodyStyle,
  padding: `${tokens.spacing.xs}px 0`,
};

export const emptyStateStyle: CSSProperties = {
  ...cardBodyStyle,
  fontStyle: "italic",
};
