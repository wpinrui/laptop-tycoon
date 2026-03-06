import { CSSProperties, useState } from "react";
import { useNavigation } from "../navigation/NavigationContext";
import { useGame } from "../state/GameContext";
import { GameState } from "../state/gameTypes";
import { MenuButton } from "./MenuButton";
import { tokens } from "./tokens";

const SAVE_KEY = "laptop-tycoon-save";

function saveGame(state: GameState): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: tokens.zIndex.overlay,
};

const panelStyle: CSSProperties = {
  background: "#1e1e1e",
  border: `1px solid ${tokens.colors.panelBorder}`,
  borderRadius: tokens.borderRadius.lg,
  padding: tokens.spacing.xl,
  minWidth: 320,
  maxWidth: 400,
  display: "flex",
  flexDirection: "column",
  gap: tokens.spacing.sm,
};

const titleStyle: CSSProperties = {
  margin: 0,
  marginBottom: tokens.spacing.md,
  fontSize: tokens.font.sizeTitle,
  fontWeight: 700,
  textAlign: "center",
};

const feedbackStyle: CSSProperties = {
  fontSize: tokens.font.sizeSmall,
  textAlign: "center",
  margin: 0,
  height: 16,
};

export function PauseMenu() {
  const { setOverlay, navigateTo } = useNavigation();
  const { state, dispatch } = useGame();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  function handleSave() {
    const ok = saveGame(state);
    setFeedback(ok ? "Game saved." : "Save failed.");
    if (ok) setTimeout(() => setFeedback(null), 2000);
  }

  function handleQuitToMenu() {
    setOverlay(null);
    navigateTo("mainMenu");
  }

  if (showQuitConfirm) {
    return (
      <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setShowQuitConfirm(false); }}>
        <div style={panelStyle}>
          <h2 style={titleStyle}>Quit to Main Menu?</h2>
          <p style={{ color: "#ccc", fontSize: tokens.font.sizeBase, margin: 0, marginBottom: tokens.spacing.md, textAlign: "center" }}>
            Unsaved progress will be lost.
          </p>
          <MenuButton onClick={handleQuitToMenu} variant="accent">
            Quit Without Saving
          </MenuButton>
          <MenuButton onClick={() => { saveGame(state); handleQuitToMenu(); }}>
            Save & Quit
          </MenuButton>
          <MenuButton onClick={() => setShowQuitConfirm(false)}>
            Cancel
          </MenuButton>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setOverlay(null); }}>
      <div style={panelStyle}>
        <h2 style={titleStyle}>Paused</h2>
        <MenuButton variant="accent" onClick={() => setOverlay(null)}>
          Resume
        </MenuButton>
        <MenuButton onClick={handleSave}>
          Save Game
        </MenuButton>
        <MenuButton onClick={() => setShowQuitConfirm(true)}>
          Quit to Main Menu
        </MenuButton>
        <p style={{ ...feedbackStyle, color: feedback === "Save failed." ? tokens.colors.danger : "#4caf50" }}>
          {feedback ?? "\u00A0"}
        </p>
      </div>
    </div>
  );
}
