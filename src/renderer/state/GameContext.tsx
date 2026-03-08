import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { GameState, LaptopDesign, LaptopModel, ModelStatus, createInitialGameState, hasDiscontinuedComponents } from "./gameTypes";
import { FullManufacturingPlan } from "../manufacturing/types";
import { YearSimulationResult } from "../../simulation/salesTypes";
import { clearProjectionCache } from "../../simulation/salesEngine";

export interface CompetitorModelEntry {
  competitorId: string;
  model: LaptopModel;
}

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
  | { type: "ADD_COMPETITOR_MODELS"; models: CompetitorModelEntry[] }
  | { type: "APPLY_SIMULATION_RESULT"; result: YearSimulationResult };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "NEW_GAME":
      clearProjectionCache();
      return createInitialGameState(action.companyName, action.companyLogo);
    case "LOAD_GAME":
      clearProjectionCache();
      return action.state;
    case "SET_CASH":
      return { ...state, cash: action.cash };
    case "ADVANCE_YEAR": {
      const nextYear = state.year + 1;
      const lastSim = state.lastSimulationResult;
      return {
        ...state,
        year: nextYear,
        yearSimulated: false,
        models: state.models.map((m) => {
          if (m.status === "discontinued") return m;

          // Find sim results for this model to get unsold units.
          // unsoldUnits already includes existing inventory (simulation sets manufacturingQuantity = newBatch + unitsInStock),
          // so we use it directly — NOT added to m.unitsInStock, which would double-count.
          const simResult = lastSim?.laptopResults.find((r) => r.laptopId === m.design.id);
          const newStock = simResult ? simResult.unsoldUnits : m.unitsInStock;

          // Models that were manufacturing/onSale transition to onSale
          if (m.status === "manufacturing" || m.status === "onSale") {
            const discontinued = hasDiscontinuedComponents(m.design, nextYear);

            // Auto-discontinue if components are discontinued and no inventory
            if (discontinued && newStock <= 0) {
              return { ...m, status: "discontinued" as const, unitsInStock: 0, manufacturingPlan: null, manufacturingQuantity: null };
            }

            return {
              ...m,
              status: "onSale" as const,
              unitsInStock: newStock,
              // Keep plan for prefill, but it won't count as a current-year plan
              // (AdvanceYearCard checks plan.year === state.year)
            };
          }

          return m;
        }),
      };
    }
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
    case "ADD_COMPETITOR_MODELS": {
      const byId = new Map(action.models.map((m) => [m.competitorId, m.model]));
      return {
        ...state,
        competitors: state.competitors.map((comp) => {
          const newModel = byId.get(comp.id);
          return newModel ? { ...comp, models: [...comp.models, newModel] } : comp;
        }),
      };
    }
    case "APPLY_SIMULATION_RESULT": {
      const result = action.result;
      return {
        ...state,
        cash: result.cashAfterResolution,
        yearSimulated: true,
        yearHistory: [...state.yearHistory, result],
        lastSimulationResult: result,
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
