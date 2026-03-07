import { GameProvider } from "./state/GameContext";
import { NavigationProvider } from "./navigation/NavigationContext";
import { WizardProvider } from "./wizard/WizardContext";
import { ManufacturingWizardProvider } from "./manufacturing/ManufacturingWizardContext";
import { ScreenRouter } from "./navigation/ScreenRouter";

export default function App() {
  return (
    <GameProvider>
      <NavigationProvider>
        <WizardProvider>
          <ManufacturingWizardProvider>
            <ScreenRouter />
          </ManufacturingWizardProvider>
        </WizardProvider>
      </NavigationProvider>
    </GameProvider>
  );
}
