import { CSSProperties } from "react";
import { useNavigation } from "../navigation/NavigationContext";
import { useGame } from "../state/GameContext";
import { loadGame, hasSavedGame } from "../shell/PauseMenu";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { tokens } from "../shell/tokens";

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: tokens.font.sizeHero,
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

export function MainMenuScreen() {
  const { navigateTo } = useNavigation();
  const { dispatch } = useGame();
  const saved = hasSavedGame();

  function handleLoad() {
    const state = loadGame();
    if (state) {
      dispatch({ type: "LOAD_GAME", state });
      navigateTo("dashboard");
    }
  }

  return (
    <ContentPanel maxWidth={420}>
      <h1 style={titleStyle}>Laptop Tycoon</h1>
      <p style={subtitleStyle}>Design. Build. Dominate.</p>

      <div style={menuStyle}>
        <MenuButton variant="accent" onClick={() => navigateTo("newGame")}>
          New Game
        </MenuButton>
        <MenuButton disabled={!saved} onClick={handleLoad}>
          Continue
        </MenuButton>
        <MenuButton disabled={!saved} onClick={handleLoad}>
          Load Game
        </MenuButton>
        <MenuButton disabled>Settings</MenuButton>
        <MenuButton onClick={() => window.close()}>Quit</MenuButton>
      </div>
    </ContentPanel>
  );
}
