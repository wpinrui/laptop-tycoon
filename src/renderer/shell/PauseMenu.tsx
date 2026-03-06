import { CSSProperties, useState } from "react";
import { useNavigation } from "../navigation/NavigationContext";
import { useGame } from "../state/GameContext";
import { ContentPanel } from "./ContentPanel";
import { MenuButton } from "./MenuButton";
import { SaveSlotPicker } from "./SaveSlotPicker";
import { saveToSlot } from "./saveSystem";
import { tokens } from "./tokens";

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: tokens.zIndex.overlay,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: tokens.font.sizeHero,
  fontWeight: 700,
  textAlign: "center",
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  marginTop: tokens.spacing.xs,
  fontSize: tokens.font.sizeBase,
  color: tokens.colors.textMuted,
  textAlign: "center",
};

const menuStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: tokens.spacing.sm,
  marginTop: tokens.spacing.xl,
};

const feedbackStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  textAlign: "center",
  margin: 0,
  marginTop: tokens.spacing.sm,
  height: 16,
};

export function PauseMenu() {
  const { setOverlay, navigateTo } = useNavigation();
  const { state } = useGame();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showSaveSlots, setShowSaveSlots] = useState(false);
  const [quitAfterSave, setQuitAfterSave] = useState(false);

  function handleSaveToSlot(slotIndex: number) {
    const ok = saveToSlot(slotIndex, state);
    setShowSaveSlots(false);
    if (quitAfterSave) {
      setQuitAfterSave(false);
      handleQuitToMenu();
      return;
    }
    setFeedback(ok ? `Saved to Slot ${slotIndex + 1}.` : "Save failed.");
    if (ok) setTimeout(() => setFeedback(null), 2000);
  }

  function handleQuitToMenu() {
    setOverlay(null);
    navigateTo("mainMenu");
  }

  return (
    <>
      <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setOverlay(null); }}>
        <ContentPanel maxWidth={420}>
          <h1 style={titleStyle}>Paused</h1>
          <p style={subtitleStyle}>{state.companyName}</p>
          <div style={menuStyle}>
            <MenuButton variant="accent" onClick={() => setOverlay(null)}>
              Resume
            </MenuButton>
            <MenuButton onClick={() => setShowSaveSlots(true)}>
              Save Game
            </MenuButton>
            <MenuButton onClick={() => setShowQuitConfirm(true)}>
              Quit to Main Menu
            </MenuButton>
          </div>
          <p style={{ ...feedbackStyle, color: feedback?.includes("failed") ? tokens.colors.danger : "#4caf50" }}>
            {feedback ?? "\u00A0"}
          </p>
        </ContentPanel>
      </div>
      {showSaveSlots && (
        <SaveSlotPicker
          title="Save Game"
          onSelect={handleSaveToSlot}
          onCancel={() => { setShowSaveSlots(false); setQuitAfterSave(false); }}
        />
      )}
      {showQuitConfirm && (
        <div
          style={{ ...overlayStyle, background: "transparent", zIndex: tokens.zIndex.overlay + 1 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowQuitConfirm(false); }}
        >
          <ContentPanel maxWidth={560}>
            <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, fontWeight: 700, textAlign: "center" }}>
              Quit to Main Menu?
            </h2>
            <p style={{ ...subtitleStyle, marginBottom: tokens.spacing.md }}>
              Unsaved progress will be lost.
            </p>
            <div style={{ display: "flex", gap: tokens.spacing.sm }}>
              <MenuButton onClick={() => setShowQuitConfirm(false)} style={{ flex: 1 }}>
                Cancel
              </MenuButton>
              <MenuButton onClick={() => { setShowQuitConfirm(false); setQuitAfterSave(true); setShowSaveSlots(true); }} style={{ flex: 1 }}>
                Save & Quit
              </MenuButton>
              <MenuButton variant="danger" onClick={handleQuitToMenu} style={{ flex: 1 }}>
                Quit
              </MenuButton>
            </div>
          </ContentPanel>
        </div>
      )}
    </>
  );
}
