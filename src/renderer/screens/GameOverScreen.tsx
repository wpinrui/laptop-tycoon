import { CSSProperties } from "react";
import { useGame } from "../state/GameContext";
import { useNavigation } from "../navigation/NavigationContext";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { tokens } from "../shell/tokens";

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  minHeight: 400,
  gap: tokens.spacing.lg,
};

export function GameOverScreen() {
  const { state } = useGame();
  const { navigateTo } = useNavigation();
  const result = state.lastSimulationResult;

  return (
    <ContentPanel maxWidth={600}>
      <div style={containerStyle}>
        <h1 style={{
          margin: 0,
          fontSize: tokens.font.sizeHero,
          color: tokens.colors.danger,
          fontWeight: 700,
        }}>
          Game Over
        </h1>

        <p style={{
          margin: 0,
          fontSize: tokens.font.sizeLarge,
          color: tokens.colors.textMuted,
          maxWidth: 400,
        }}>
          {state.companyName} has run out of cash after Year {result?.year ?? state.year}.
          The company could not cover its debts and has been forced to close.
        </p>

        {result && (
          <p style={{ margin: 0, color: tokens.colors.danger, fontSize: tokens.font.sizeLarge }}>
            Final Balance: ${result.cashAfterResolution.toLocaleString("en-US")}
          </p>
        )}

        <p style={{ margin: 0, color: tokens.colors.textMuted }}>
          Years survived: {(result?.year ?? state.year) - 2000}
        </p>

        <MenuButton
          variant="accent"
          onClick={() => {
            navigateTo("mainMenu");
          }}
          style={{ marginTop: tokens.spacing.lg, width: 200 }}
        >
          Main Menu
        </MenuButton>
      </div>
    </ContentPanel>
  );
}
