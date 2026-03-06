import { GameProvider } from "./state/GameContext";
import { NavigationProvider } from "./navigation/NavigationContext";
import { WizardProvider } from "./wizard/WizardContext";
import { ScreenRouter } from "./navigation/ScreenRouter";

export default function App() {
  return (
    <GameProvider>
      <NavigationProvider>
        <WizardProvider>
          <ScreenRouter />
        </WizardProvider>
      </NavigationProvider>
    </GameProvider>
  );
}
