import { CSSProperties, useState, ReactNode } from "react";
import { tokens } from "./tokens";

const baseStyle: CSSProperties = {
  padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
  border: "none",
  borderRadius: tokens.borderRadius.md,
  fontSize: tokens.font.sizeLarge,
  fontFamily: tokens.font.family,
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 0.15s",
  color: tokens.colors.text,
  background: tokens.colors.surface,
};

interface MenuButtonProps {
  children: ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: "surface" | "accent" | "danger";
  disabled?: boolean;
  style?: CSSProperties;
}

export function MenuButton({ children, onClick, variant = "surface", disabled, style }: MenuButtonProps) {
  const [hovered, setHovered] = useState(false);

  const bg = disabled
    ? tokens.colors.surface
    : variant === "accent"
      ? hovered ? tokens.colors.accentHover : tokens.colors.accent
      : variant === "danger"
        ? hovered ? "#f44336" : tokens.colors.danger
        : hovered ? tokens.colors.surfaceHover : tokens.colors.surface;

  const isBold = (variant === "accent" || variant === "danger") && !disabled;

  return (
    <button
      style={{
        ...baseStyle,
        background: bg,
        color: isBold ? "#000" : tokens.colors.text,
        fontWeight: isBold ? 600 : 500,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}
