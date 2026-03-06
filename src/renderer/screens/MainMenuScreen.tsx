import { CSSProperties } from "react";
import { useNavigation } from "../navigation/NavigationContext";
import { ContentPanel } from "../shell/ContentPanel";
import { tokens } from "../shell/tokens";

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 36,
  fontWeight: 700,
  letterSpacing: 1,
  textAlign: "center",
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  marginTop: tokens.spacing.xs,
  fontSize: tokens.font.sizeBase,
  color: tokens.colors.textMuted,
  textAlign: "center",
  letterSpacing: 0.5,
};

const menuStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: tokens.spacing.sm,
  marginTop: tokens.spacing.xl,
};

const buttonBase: CSSProperties = {
  padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
  border: "none",
  borderRadius: tokens.borderRadius.md,
  fontSize: tokens.font.sizeLarge,
  fontFamily: tokens.font.family,
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 0.15s, opacity 0.15s",
  color: tokens.colors.text,
  background: tokens.colors.surface,
};

export function MainMenuScreen() {
  const { navigateTo } = useNavigation();

  return (
    <ContentPanel maxWidth={420}>
      <h1 style={titleStyle}>Laptop Tycoon</h1>
      <p style={subtitleStyle}>Design. Build. Dominate.</p>

      <div style={menuStyle}>
        <button
          style={{ ...buttonBase, background: tokens.colors.accent, color: "#000", fontWeight: 600 }}
          onClick={() => navigateTo("newGame")}
          onMouseEnter={(e) => (e.currentTarget.style.background = tokens.colors.accentHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = tokens.colors.accent)}
        >
          New Game
        </button>
        <button
          style={{ ...buttonBase, opacity: 0.4, cursor: "not-allowed" }}
          disabled
        >
          Continue
        </button>
        <button
          style={{ ...buttonBase, opacity: 0.4, cursor: "not-allowed" }}
          disabled
        >
          Load Game
        </button>
        <button
          style={{ ...buttonBase, opacity: 0.4, cursor: "not-allowed" }}
          disabled
        >
          Settings
        </button>
        <button
          style={buttonBase}
          onClick={() => window.close()}
          onMouseEnter={(e) => (e.currentTarget.style.background = tokens.colors.surfaceHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = tokens.colors.surface)}
        >
          Quit
        </button>
      </div>
    </ContentPanel>
  );
}
