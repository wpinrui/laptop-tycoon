import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { DemographicId } from "../../data/types";
import { GameState, LaptopDesign, LaptopModel, ModelStatus, CompanyState, createInitialGameState, hasDiscontinuedComponents } from "./gameTypes";
import { FullManufacturingPlan } from "../manufacturing/types";
import { YearSimulationResult } from "../../simulation/salesTypes";
import { clearProjectionCache } from "../../simulation/salesEngine";
import { updateBrandReach, updateCompetitorBrandReach, updateBrandPerception } from "../../simulation/brandProgression";

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
  | { type: "APPLY_SIMULATION_RESULT"; result: YearSimulationResult }
  | { type: "RUN_AWARENESS_CAMPAIGN"; cost: number; reachBoost: number };

/** Update a specific company in the companies array. */
function updateCompany(
  companies: CompanyState[],
  predicate: (c: CompanyState) => boolean,
  updater: (c: CompanyState) => CompanyState,
): CompanyState[] {
  return companies.map((c) => (predicate(c) ? updater(c) : c));
}

/** Update the player company in the companies array. */
function updatePlayer(
  companies: CompanyState[],
  updater: (c: CompanyState) => CompanyState,
): CompanyState[] {
  return updateCompany(companies, (c) => c.isPlayer, updater);
}

/** Update player's models. */
function updatePlayerModels(
  companies: CompanyState[],
  modelUpdater: (models: LaptopModel[]) => LaptopModel[],
): CompanyState[] {
  return updatePlayer(companies, (p) => ({ ...p, models: modelUpdater(p.models) }));
}

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
        companies: updatePlayerModels(state.companies, (models) =>
          models.map((m) => {
            if (m.status === "discontinued") return m;

            // Find sim results for this model to get unsold units.
            const simResult = lastSim?.laptopResults.find((r) => r.laptopId === m.design.id);
            const newStock = simResult ? simResult.unsoldUnits : m.unitsInStock;

            // Models that were manufacturing/onSale transition to onSale
            if (m.status === "manufacturing" || m.status === "onSale") {
              const discontinued = hasDiscontinuedComponents(m.design, nextYear);

              if (discontinued && newStock <= 0) {
                return { ...m, status: "discontinued" as const, unitsInStock: 0, manufacturingPlan: null, manufacturingQuantity: null };
              }

              return {
                ...m,
                status: "onSale" as const,
                unitsInStock: newStock,
              };
            }

            return m;
          }),
        ),
      };
    }
    case "ADD_MODEL":
      return {
        ...state,
        companies: updatePlayer(state.companies, (p) => ({
          ...p,
          models: [...p.models, action.model],
        })),
      };
    case "UPDATE_MODEL_STATUS":
      return {
        ...state,
        companies: updatePlayerModels(state.companies, (models) =>
          models.map((m) =>
            m.design.id === action.modelId ? { ...m, status: action.status } : m,
          ),
        ),
      };
    case "SET_MODEL_PRICING":
      return {
        ...state,
        companies: updatePlayerModels(state.companies, (models) =>
          models.map((m) =>
            m.design.id === action.modelId
              ? { ...m, retailPrice: action.retailPrice, manufacturingQuantity: action.manufacturingQuantity }
              : m,
          ),
        ),
      };
    case "UPDATE_MODEL_DESIGN":
      return {
        ...state,
        companies: updatePlayerModels(state.companies, (models) =>
          models.map((m) =>
            m.design.id === action.modelId ? { ...m, design: action.design } : m,
          ),
        ),
      };
    case "SET_MANUFACTURING_PLAN":
      return {
        ...state,
        companies: updatePlayerModels(state.companies, (models) =>
          models.map((m) =>
            m.design.id === action.modelId
              ? {
                  ...m,
                  manufacturingPlan: action.plan,
                  retailPrice: action.plan.manufacturing.unitPrice,
                  manufacturingQuantity: action.plan.manufacturing.unitsOrdered,
                }
              : m,
          ),
        ),
      };
    case "ADD_COMPETITOR_MODELS": {
      const byId = new Map(action.models.map((m) => [m.competitorId, m.model]));
      return {
        ...state,
        companies: updateCompany(
          state.companies,
          (c) => !c.isPlayer && byId.has(c.id),
          (comp) => ({ ...comp, models: [...comp.models, byId.get(comp.id)!] }),
        ),
      };
    }
    case "APPLY_SIMULATION_RESULT": {
      const result = action.result;
      // Build lookup of simulation results by laptop id for storing on plans
      const simByLaptop = new Map(
        result.playerResults.map((r) => [r.laptopId, r]),
      );

      const newPlayerReach = updateBrandReach(state, result);
      const newPlayerPerception = Object.fromEntries(
        result.perceptionChanges.map((pc) => [pc.demographicId, pc.newPerception]),
      ) as Record<DemographicId, number>;

      return {
        ...state,
        cash: result.cashAfterResolution,
        companies: state.companies.map((comp) => {
          if (comp.isPlayer) {
            return {
              ...comp,
              brandReach: newPlayerReach,
              brandPerception: newPlayerPerception,
              models: comp.models.map((m) => {
                const sim = simByLaptop.get(m.design.id);
                if (!sim || !m.manufacturingPlan) return m;
                return {
                  ...m,
                  manufacturingPlan: {
                    ...m.manufacturingPlan,
                    results: {
                      campaignPerceptionMod: sim.campaignPerceptionMod,
                      unitsSold: sim.unitsSold,
                      revenue: sim.revenue,
                      profit: sim.profit,
                      unsoldUnits: sim.unsoldUnits,
                    },
                  },
                };
              }),
            };
          }
          // Competitor: update brand reach & perception
          return {
            ...comp,
            brandReach: updateCompetitorBrandReach(comp, result),
            brandPerception: updateBrandPerception(comp, result.laptopResults),
          };
        }),
        yearSimulated: true,
        yearHistory: [...state.yearHistory, result],
        lastSimulationResult: result,
      };
    }
    case "RUN_AWARENESS_CAMPAIGN": {
      return {
        ...state,
        cash: state.cash - action.cost,
        companies: updatePlayer(state.companies, (p) => {
          const newReach = { ...p.brandReach };
          for (const key of Object.keys(newReach) as DemographicId[]) {
            newReach[key] = Math.min(100, newReach[key] + action.reachBoost);
          }
          return { ...p, brandReach: newReach };
        }),
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
