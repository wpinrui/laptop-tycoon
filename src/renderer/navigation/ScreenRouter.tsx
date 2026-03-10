import { useEffect, useState } from "react";
import { DollarSign, Newspaper, History } from "lucide-react";
import { useNavigation } from "./NavigationContext";
import { GameLayout } from "../shell/GameLayout";
import { ContentPanel } from "../shell/ContentPanel";
import { ScreenHeader } from "../shell/ScreenHeader";
import { tokens } from "../shell/tokens";
import { PauseMenu } from "../shell/PauseMenu";
import { StatusBar } from "../shell/StatusBar";
import { DesignWizard } from "../wizard/DesignWizard";
import { ManufacturingWizard } from "../manufacturing/ManufacturingWizard";
import { MainMenuScreen } from "../screens/MainMenuScreen";
import { NewGameScreen } from "../screens/NewGameScreen";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { ModelManagementScreen } from "../screens/ModelManagementScreen";
import { YearEndSummaryScreen } from "../screens/YearEndSummaryScreen";
import { QuarterlySummaryScreen } from "../screens/QuarterlySummaryScreen";
import { GameOverScreen } from "../screens/GameOverScreen";
import { BrandDetailScreen } from "../screens/BrandDetailScreen";
import { ReviewsAwardsScreen } from "../screens/ReviewsAwardsScreen";
import { MarketOverviewScreen } from "../screens/MarketOverviewScreen";
import { MarketBrowserScreen } from "../screens/MarketBrowserScreen";
import { DebugPanel } from "../debug/DebugPanel";

function PlaceholderScreen({ title, icon }: { title: string; icon: React.ComponentType<{ size?: number; color?: string }> }) {
  return (
    <ContentPanel maxWidth={tokens.layout.panelMaxWidth} style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: tokens.layout.panelHeight, width: tokens.layout.panelWidth }}>
      <ScreenHeader title={title} icon={icon} />
      <p style={{ color: tokens.colors.textMuted, margin: 0, flex: 1, paddingTop: tokens.spacing.lg }}>Coming soon</p>
      <StatusBar />
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
    case "manufacturingWizard":
      return <ManufacturingWizard />;
    case "financialHistory":
      return <PlaceholderScreen title="Financial History" icon={DollarSign} />;
    case "marketOverview":
      return <MarketOverviewScreen />;
    case "brandDetail":
      return <BrandDetailScreen />;
    case "reviewsAwards":
      return <ReviewsAwardsScreen />;
    case "news":
      return <PlaceholderScreen title="News" icon={Newspaper} />;
    case "history":
      return <PlaceholderScreen title="History" icon={History} />;
    case "marketBrowser":
      return <MarketBrowserScreen />;
    case "quarterlySummary":
      return <QuarterlySummaryScreen />;
    case "yearEndSummary":
      return <YearEndSummaryScreen />;
    case "gameOver":
      return <GameOverScreen />;
    default: {
      const _exhaustive: never = screen;
      return _exhaustive;
    }
  }
}

/** Screens where Escape should NOT open the pause menu. */
const NO_PAUSE_SCREENS = new Set(["mainMenu", "newGame", "designWizard", "manufacturingWizard", "quarterlySummary", "yearEndSummary", "gameOver"]);

export function ScreenRouter() {
  const { screen, overlay, setOverlay } = useNavigation();
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F9") {
        setShowDebug((prev) => !prev);
        return;
      }
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
      {showDebug && <DebugPanel onClose={() => setShowDebug(false)} />}
    </GameLayout>
  );
}
