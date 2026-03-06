import { useNavigation } from "./NavigationContext";
import { Screen } from "./types";
import { GameLayout } from "../shell/GameLayout";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { tokens } from "../shell/tokens";
import { DesignWizard } from "../wizard/DesignWizard";
import { MainMenuScreen } from "../screens/MainMenuScreen";
import { NewGameScreen } from "../screens/NewGameScreen";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { ModelManagementScreen } from "../screens/ModelManagementScreen";

/** Screens that don't show the HUD (pre-game screens). */
const NO_HUD_SCREENS: Screen[] = ["mainMenu", "newGame"];

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

export function ScreenRouter() {
  const { screen } = useNavigation();
  const showHUD = !NO_HUD_SCREENS.includes(screen);

  return (
    <GameLayout showHUD={showHUD}>
      <ScreenContent />
    </GameLayout>
  );
}
