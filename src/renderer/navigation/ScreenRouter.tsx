import { useNavigation } from "./NavigationContext";
import { Screen } from "./types";
import { GameLayout } from "../shell/GameLayout";
import { ContentPanel } from "../shell/ContentPanel";
import { DesignWizard } from "../wizard/DesignWizard";

/** Screens that don't show the HUD (pre-game screens). */
const NO_HUD_SCREENS: Screen[] = ["mainMenu", "newGame"];

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <ContentPanel maxWidth={600}>
      <h2 style={{ margin: 0, marginBottom: 8 }}>{title}</h2>
      <p style={{ color: "#888", margin: 0 }}>Coming soon</p>
    </ContentPanel>
  );
}

function ScreenContent() {
  const { screen } = useNavigation();

  switch (screen) {
    case "mainMenu":
      return <PlaceholderScreen title="Main Menu" />;
    case "newGame":
      return <PlaceholderScreen title="New Game" />;
    case "dashboard":
      return <PlaceholderScreen title="Dashboard" />;
    case "designWizard":
      return <DesignWizard />;
    case "modelManagement":
      return <PlaceholderScreen title="Model Management" />;
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
