import { GameProvider } from "./state/GameContext";
import { NavigationProvider } from "./navigation/NavigationContext";
import { ScreenRouter } from "./navigation/ScreenRouter";

export default function App() {
  return (
    <GameProvider>
      <NavigationProvider>
        <ScreenRouter />
      </NavigationProvider>
    </GameProvider>
  );
}
