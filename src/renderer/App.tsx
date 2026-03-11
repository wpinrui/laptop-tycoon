import { GameProvider } from "./state/GameContext";
import { NavigationProvider } from "./navigation/NavigationContext";
import { WizardProvider } from "./wizard/WizardContext";
import { ManufacturingWizardProvider } from "./manufacturing/ManufacturingWizardContext";
import { AutosaveProvider } from "./shell/AutosaveProvider";
import { ScreenRouter } from "./navigation/ScreenRouter";

export default function App() {
  return (
    <GameProvider>
      <AutosaveProvider>
        <NavigationProvider>
          <WizardProvider>
            <ManufacturingWizardProvider>
              <ScreenRouter />
            </ManufacturingWizardProvider>
          </WizardProvider>
        </NavigationProvider>
      </AutosaveProvider>
    </GameProvider>
  );
}
