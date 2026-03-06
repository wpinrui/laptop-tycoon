import { useEffect } from "react";
import { useNavigation } from "./NavigationContext";
import { GameLayout } from "../shell/GameLayout";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { tokens } from "../shell/tokens";
import { PauseMenu } from "../shell/PauseMenu";
import { DesignWizard } from "../wizard/DesignWizard";
import { MainMenuScreen } from "../screens/MainMenuScreen";
import { NewGameScreen } from "../screens/NewGameScreen";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { ModelManagementScreen } from "../screens/ModelManagementScreen";

function PlaceholderScreen({ title }: { title: string }) {
  const { navigateTo } = useNavigation();

  return (
    <ContentPanel maxWidth={600}>
      <h2 style={{ margin: 0, marginBottom: tokens.spacing.sm }}>{title}</h2>
      <p style={{ color: tokens.colors.textMuted, margin: 0, marginBottom: tokens.spacing.lg }}>Coming soon</p>
      <MenuButton onClick={() => navigateTo("dashboard")}>
        Back to Dashboard
      </MenuButton>
    </ContentPanel>
  );
}

function ScreenContent() {
  const { screen } = useNavigation();

  switch (screen) {
    case "mainMenu":
      return <MainMenuScreen />;
    case "newGame":
      return <NewGameScreen />;
    case "dashboard":
      return <DashboardScreen />;
    case "designWizard":
      return <DesignWizard />;
    case "modelManagement":
      return <ModelManagementScreen />;
    case "pricingManufacturing":
      return <PlaceholderScreen title="Pricing & Manufacturing" />;
    case "financialHistory":
      return <PlaceholderScreen title="Financial History" />;
    case "marketOverview":
      return <PlaceholderScreen title="Market Overview" />;
    case "brandDetail":
      return <PlaceholderScreen title="Brand Detail" />;
    case "reviewsAwards":
      return <PlaceholderScreen title="Reviews & Awards" />;
    case "news":
      return <PlaceholderScreen title="News" />;
    case "history":
      return <PlaceholderScreen title="History" />;
    default: {
      const _exhaustive: never = screen;
      return _exhaustive;
    }
  }
}

/** Screens where Escape should NOT open the pause menu. */
const NO_PAUSE_SCREENS = new Set(["mainMenu", "newGame"]);

export function ScreenRouter() {
  const { screen, overlay, setOverlay } = useNavigation();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (NO_PAUSE_SCREENS.has(screen)) return;
      setOverlay(overlay === "pauseMenu" ? null : "pauseMenu");
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, overlay, setOverlay]);

  return (
    <GameLayout>
      <ScreenContent />
      {overlay === "pauseMenu" && <PauseMenu />}
    </GameLayout>
  );
}
