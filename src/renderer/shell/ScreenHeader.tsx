import { CSSProperties, ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigation } from "../navigation/NavigationContext";
import { tokens } from "./tokens";

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: tokens.spacing.md,
  paddingBottom: tokens.spacing.lg,
  borderBottom: `1px solid ${tokens.colors.panelBorder}`,
  flexShrink: 0,
};

const backButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: tokens.colors.textMuted,
  cursor: "pointer",
  padding: tokens.spacing.xs,
  borderRadius: tokens.borderRadius.sm,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "color 0.15s",
};

interface ScreenHeaderProps {
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  iconColor?: string;
  /** Extra content rendered on the right side of the header */
  right?: ReactNode;
  /** Hide the bottom border */
  noBorder?: boolean;
}

export function ScreenHeader({ title, icon: Icon, iconColor = tokens.colors.accent, right, noBorder }: ScreenHeaderProps) {
  const { navigateTo } = useNavigation();

  return (
    <div style={noBorder ? { ...headerStyle, borderBottom: "none" } : headerStyle}>
      <button
        style={backButtonStyle}
        onClick={() => navigateTo("dashboard")}
        onMouseEnter={(e) => { e.currentTarget.style.color = tokens.colors.text; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = tokens.colors.textMuted; }}
      >
        <ArrowLeft size={20} />
      </button>
      <Icon size={22} color={iconColor} />
      <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, fontWeight: 700 }}>{title}</h2>
      {right && <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: tokens.spacing.sm }}>{right}</div>}
    </div>
  );
}
