import { CSSProperties, useState } from "react";
import { useNavigation } from "../navigation/NavigationContext";
import { useGame } from "../state/GameContext";
import { hasAnySave, loadFromSlot } from "../shell/saveSystem";
import { SaveSlotPicker } from "../shell/SaveSlotPicker";
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
  const saved = hasAnySave();
  const [showLoadSlots, setShowLoadSlots] = useState(false);

  function handleLoadSlot(slotIndex: number) {
    const state = loadFromSlot(slotIndex);
    if (state) {
      setShowLoadSlots(false);
      dispatch({ type: "LOAD_GAME", state });
      navigateTo("dashboard");
    }
  }

  return (
    <>
      <ContentPanel maxWidth={420}>
        <div style={{ fontSize: 150, textAlign: "center", lineHeight: 1, paddingBottom: "1.5rem" }}>💻</div>
        <h1 style={titleStyle}>Laptop Tycoon</h1>
        <p style={subtitleStyle}>Design. Build. Dominate.</p>

        <div style={menuStyle}>
          <MenuButton variant="accent" onClick={() => navigateTo("newGame")}>
            New Game
          </MenuButton>
          <MenuButton disabled={!saved} onClick={() => setShowLoadSlots(true)}>
            Load Game
          </MenuButton>
          <MenuButton disabled>Settings</MenuButton>
          <MenuButton onClick={() => window.close()}>Quit</MenuButton>
        </div>
      </ContentPanel>
      {showLoadSlots && (
        <SaveSlotPicker
          title="Load Game"
          onSelect={handleLoadSlot}
          onCancel={() => setShowLoadSlots(false)}
          allowDelete
        />
      )}
    </>
  );
}
