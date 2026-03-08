import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { DemographicId } from "../../data/types";
import { GameState, Quarter, LaptopDesign, LaptopModel, ModelStatus, CompanyState, createInitialGameState, hasDiscontinuedComponents } from "./gameTypes";
import { FullManufacturingPlan } from "../manufacturing/types";
import { QuarterSimulationResult } from "../../simulation/salesTypes";
import { clearProjectionCache } from "../../simulation/salesEngine";
import { updateBrandReach, updateCompetitorBrandReach, applySingleQuarterPerception } from "../../simulation/brandProgression";

export interface CompetitorModelEntry {
  competitorId: string;
  model: LaptopModel;
}

type GameAction =
  | { type: "NEW_GAME"; companyName: string; companyLogo: string | null }
  | { type: "LOAD_GAME"; state: GameState }
  | { type: "SET_CASH"; cash: number }
  | { type: "ADVANCE_QUARTER" }
  | { type: "ADD_MODEL"; model: LaptopModel }
  | { type: "UPDATE_MODEL_STATUS"; modelId: string; status: ModelStatus }
  | { type: "SET_MODEL_PRICING"; modelId: string; retailPrice: number; manufacturingQuantity: number }
  | { type: "UPDATE_MODEL_DESIGN"; modelId: string; design: LaptopDesign }
  | { type: "SET_MANUFACTURING_PLAN"; modelId: string; plan: FullManufacturingPlan }
  | { type: "ADD_COMPETITOR_MODELS"; models: CompetitorModelEntry[] }
  | { type: "APPLY_QUARTER_RESULT"; result: QuarterSimulationResult }
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
    case "ADVANCE_QUARTER": {
      if (state.quarter < 4) {
        // Advance to next quarter within the same year
        const nextQuarter = (state.quarter + 1) as Quarter;
        return {
          ...state,
          quarter: nextQuarter,
          quarterSimulated: false,
        };
      }

      // Q4 → next year Q1: advance year, transition models, reset quarter history
      const nextYear = state.year + 1;
      const lastSim = state.lastSimulationResult;
      return {
        ...state,
        year: nextYear,
        quarter: 1 as Quarter,
        quarterSimulated: false,
        quarterHistory: [],
        companies: updatePlayerModels(state.companies, (models) =>
          models.map((m) => {
            if (m.status === "discontinued") return m;

            // Find sim results for this model to get unsold units
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
    case "APPLY_QUARTER_RESULT": {
      const result = action.result;
      // Build lookup of simulation results by laptop id for storing on plans
      const simByLaptop = new Map(
        result.playerResults.map((r) => [r.laptopId, r]),
      );

      const newPlayerReach = updateBrandReach(state, result);
      const newPlayerPerception = Object.fromEntries(
        result.perceptionChanges.map((pc) => [pc.demographicId, pc.newPerception]),
      ) as Record<DemographicId, number>;

      // Build cumulative year result for yearHistory (aggregated after Q4)
      const isQ4 = state.quarter === 4;

      // Accumulate units sold on models (add to existing results if any)
      const updatedCompanies = state.companies.map((comp) => {
        if (comp.isPlayer) {
          return {
            ...comp,
            brandReach: newPlayerReach,
            brandPerception: newPlayerPerception,
            models: comp.models.map((m) => {
              const sim = simByLaptop.get(m.design.id);
              if (!sim || !m.manufacturingPlan) return m;

              const existingResults = m.manufacturingPlan.results;
              return {
                ...m,
                // Update units in stock after quarter sales
                unitsInStock: sim.unsoldUnits,
                manufacturingPlan: {
                  ...m.manufacturingPlan,
                  results: {
                    campaignPerceptionMod: sim.campaignPerceptionMod,
                    unitsSold: (existingResults?.unitsSold ?? 0) + sim.unitsSold,
                    revenue: (existingResults?.revenue ?? 0) + sim.revenue,
                    profit: (existingResults?.profit ?? 0) + sim.profit,
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
          brandPerception: applySingleQuarterPerception(comp, result.laptopResults),
        };
      });

      // Build year-end aggregate result for yearHistory if Q4
      const yearHistory = isQ4
        ? [...state.yearHistory, buildYearResult(state, result, [...state.quarterHistory, result])]
        : state.yearHistory;

      return {
        ...state,
        cash: result.cashAfterResolution,
        companies: updatedCompanies,
        quarterSimulated: true,
        quarterHistory: [...state.quarterHistory, result],
        yearHistory,
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

/** Build an aggregated year result from all quarterly results for yearHistory. */
function buildYearResult(
  state: GameState,
  lastQuarter: QuarterSimulationResult,
  quarters: QuarterSimulationResult[],
) {
  const totalRevenue = quarters.reduce((s, q) => s + q.totalRevenue, 0);
  const totalProfit = quarters.reduce((s, q) => s + q.totalProfit, 0);

  // Aggregate perception changes: use first quarter's old values and last quarter's new values
  const firstQ = quarters[0];
  const lastQ = quarters[quarters.length - 1];
  const perceptionChanges = firstQ.perceptionChanges.map((pc, i) => ({
    ...pc,
    newPerception: lastQ.perceptionChanges[i]?.newPerception ?? pc.newPerception,
    delta: (lastQ.perceptionChanges[i]?.newPerception ?? pc.newPerception) - pc.oldPerception,
  }));

  // Aggregate laptop results (sum across quarters)
  const laptopResultMap = new Map<string, typeof lastQuarter.laptopResults[0]>();
  for (const q of quarters) {
    for (const lr of q.laptopResults) {
      const existing = laptopResultMap.get(lr.laptopId);
      if (existing) {
        // Merge demographicBreakdown: sum unitsDemanded per demographic across quarters
        const mergedBreakdown = [...existing.demographicBreakdown];
        for (const db of lr.demographicBreakdown) {
          const match = mergedBreakdown.find((b) => b.demographicId === db.demographicId);
          if (match) {
            match.unitsDemanded += db.unitsDemanded;
            match.marketShare = db.marketShare; // Use latest quarter's share
            match.rawVP = db.rawVP;
          } else {
            mergedBreakdown.push({ ...db });
          }
        }
        laptopResultMap.set(lr.laptopId, {
          ...existing,
          unitsDemanded: existing.unitsDemanded + lr.unitsDemanded,
          unitsSold: existing.unitsSold + lr.unitsSold,
          revenue: existing.revenue + lr.revenue,
          profit: existing.profit + lr.profit,
          unsoldUnits: lr.unsoldUnits, // Last quarter's unsold
          demographicBreakdown: mergedBreakdown,
        });
      } else {
        laptopResultMap.set(lr.laptopId, { ...lr });
      }
    }
  }

  const laptopResults = Array.from(laptopResultMap.values());
  const playerResults = laptopResults.filter((r) => r.owner === "player");

  return {
    year: state.year,
    laptopResults,
    playerResults,
    totalRevenue,
    totalProfit,
    cashAfterResolution: lastQuarter.cashAfterResolution,
    gameOver: lastQuarter.cashAfterResolution < 0,
    perceptionChanges,
  };
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
