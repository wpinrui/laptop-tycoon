import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { GameState, createInitialGameState } from "./gameTypes";

type GameAction =
  | { type: "NEW_GAME"; companyName: string; companyLogo: string | null }
  | { type: "LOAD_GAME"; state: GameState }
  | { type: "SET_CASH"; cash: number }
  | { type: "ADVANCE_YEAR" };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "NEW_GAME":
      return createInitialGameState(action.companyName, action.companyLogo);
    case "LOAD_GAME":
      return action.state;
    case "SET_CASH":
      return { ...state, cash: action.cash };
    case "ADVANCE_YEAR":
      return { ...state, year: state.year + 1 };
    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

const PLACEHOLDER_STATE = createInitialGameState("", null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, PLACEHOLDER_STATE);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return ctx;
}
