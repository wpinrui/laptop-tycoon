import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { GameState, LaptopDesign, LaptopModel, ModelStatus, createInitialGameState } from "./gameTypes";
import { FullManufacturingPlan } from "../manufacturing/types";
import { COMPETITORS } from "../../data/competitors";
import { generateCompetitorModels } from "../../simulation/competitorAI";

type GameAction =
  | { type: "NEW_GAME"; companyName: string; companyLogo: string | null }
  | { type: "LOAD_GAME"; state: GameState }
  | { type: "SET_CASH"; cash: number }
  | { type: "ADVANCE_YEAR" }
  | { type: "ADD_MODEL"; model: LaptopModel }
  | { type: "UPDATE_MODEL_STATUS"; modelId: string; status: ModelStatus }
  | { type: "SET_MODEL_PRICING"; modelId: string; retailPrice: number; manufacturingQuantity: number }
  | { type: "UPDATE_MODEL_DESIGN"; modelId: string; design: LaptopDesign }
  | { type: "SET_MANUFACTURING_PLAN"; modelId: string; plan: FullManufacturingPlan }
  | { type: "GENERATE_COMPETITOR_MODELS"; year: number };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "NEW_GAME":
      return createInitialGameState(action.companyName, action.companyLogo);
    case "LOAD_GAME":
      return action.state;
    case "SET_CASH":
      return { ...state, cash: action.cash };
    case "ADVANCE_YEAR":
      return { ...state, year: state.year + 1, yearSimulated: false };
    case "ADD_MODEL":
      return { ...state, models: [...state.models, action.model] };
    case "UPDATE_MODEL_STATUS":
      return {
        ...state,
        models: state.models.map((m) =>
          m.design.id === action.modelId ? { ...m, status: action.status } : m,
        ),
      };
    case "SET_MODEL_PRICING":
      return {
        ...state,
        models: state.models.map((m) =>
          m.design.id === action.modelId
            ? { ...m, retailPrice: action.retailPrice, manufacturingQuantity: action.manufacturingQuantity }
            : m,
        ),
      };
    case "UPDATE_MODEL_DESIGN":
      return {
        ...state,
        models: state.models.map((m) =>
          m.design.id === action.modelId ? { ...m, design: action.design } : m,
        ),
      };
    case "SET_MANUFACTURING_PLAN":
      return {
        ...state,
        models: state.models.map((m) =>
          m.design.id === action.modelId
            ? {
                ...m,
                manufacturingPlan: action.plan,
                retailPrice: action.plan.manufacturing.unitPrice,
                manufacturingQuantity: action.plan.manufacturing.unitsOrdered,
              }
            : m,
        ),
      };
    case "GENERATE_COMPETITOR_MODELS": {
      const newModels = generateCompetitorModels(action.year, COMPETITORS);
      return {
        ...state,
        competitors: state.competitors.map((comp, i) => ({
          ...comp,
          models: [...comp.models, newModels[i]],
        })),
      };
    }
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
