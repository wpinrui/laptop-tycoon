import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { DemographicId } from "../../data/types";
import { GameState, Quarter, LaptopDesign, LaptopModel, ModelStatus, CompanyState, createInitialGameState, hasDiscontinuedComponents } from "./gameTypes";
import { FullManufacturingPlan } from "../manufacturing/types";
import { QuarterSimulationResult } from "../../simulation/salesTypes";
import { clearProjectionCache, simulateQuarter } from "../../simulation/salesEngine";
import { updateBrandReach, updateCompetitorBrandReach, applySingleQuarterPerception } from "../../simulation/brandProgression";
import { applyDeathSpiralPrevention } from "../../simulation/deathSpiralPrevention";
import { generateCompetitorModels, discountOldInventoryPrice } from "../../simulation/competitorAI";
import { COMPETITORS } from "../../data/competitors";
import { LaptopReview, Award, applyAwardBonuses } from "../../simulation/reviewsAwards";
import { SPONSORSHIPS, getSponsorshipCost } from "../../data/sponsorships";
import { PERCEPTION_MEANINGFUL_DELTA, AI_MAX_MODEL_AGE } from "../../simulation/tunables";

export interface CompetitorModelEntry {
  competitorId: string;
  model: LaptopModel;
}

type GameAction =
  | { type: "NEW_GAME"; companyName: string; companyLogo: string | null }
  | { type: "LOAD_GAME"; state: GameState }
  | { type: "SET_CASH"; cash: number }
  | { type: "ADVANCE_QUARTER" }
  | { type: "ADD_MODEL"; model: LaptopModel; rdCost: number }
  | { type: "UPDATE_MODEL_STATUS"; modelId: string; status: ModelStatus }
  | { type: "SET_MODEL_PRICING"; modelId: string; retailPrice: number; manufacturingQuantity: number }
  | { type: "UPDATE_MODEL_DESIGN"; modelId: string; design: LaptopDesign }
  | { type: "SET_MANUFACTURING_PLAN"; modelId: string; plan: FullManufacturingPlan }
  | { type: "CANCEL_CURRENT_QUARTER_PLAN"; modelId: string }
  | { type: "SET_RETAIL_PRICE"; modelId: string; retailPrice: number }
  | { type: "ADD_COMPETITOR_MODELS"; models: CompetitorModelEntry[] }
  | { type: "APPLY_QUARTER_RESULT"; result: QuarterSimulationResult }
  | { type: "SET_AWARENESS_BUDGET"; budget: number }
  | { type: "TOGGLE_SPONSORSHIP"; sponsorshipId: string }
  | { type: "SET_REVIEWS"; reviews: LaptopReview[] }
  | { type: "SET_AWARDS"; awards: Award[] };

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

/** Drop depleted/old AI models and discount surviving old inventory. */
function cleanupAIModels(companies: CompanyState[], nextYear: number): CompanyState[] {
  return companies.map((comp) => {
    if (comp.isPlayer) return comp;
    return {
      ...comp,
      models: comp.models
        .filter((m) => m.unitsInStock > 0 && nextYear - m.yearDesigned < AI_MAX_MODEL_AGE)
        .map((m) => {
          if (m.yearDesigned < nextYear) {
            return { ...m, retailPrice: discountOldInventoryPrice(m) };
          }
          return m;
        }),
    };
  });
}

/**
 * Pre-simulate one full year of AI-only play.
 * Generates competitor models, runs 4 quarters of simulation, updates brand
 * reach/perception, then advances the year — so the player starts with an
 * established market.
 */
function preSimulateAIYear(initial: GameState): GameState {
  let s = initial;

  // Generate AI models for this year
  const generated = generateCompetitorModels(s.year, COMPETITORS, s.companies);
  const modelByCompetitor = new Map(COMPETITORS.map((c, i) => [c.id, generated[i]]));
  s = {
    ...s,
    companies: s.companies.map((comp) => {
      if (comp.isPlayer) return comp;
      const model = modelByCompetitor.get(comp.id);
      return model ? { ...comp, models: [...comp.models, model] } : comp;
    }),
  };

  // Simulate all 4 quarters
  for (let q = 1; q <= 4; q++) {
    s = { ...s, quarter: q as Quarter };
    const result = simulateQuarter(s);

    // Update competitor brand reach, perception, and inventory (same as APPLY_QUARTER_RESULT)
    const simByLaptop = new Map(
      result.laptopResults.map((r) => [r.laptopId, r]),
    );
    s = {
      ...s,
      companies: s.companies.map((comp) => {
        if (comp.isPlayer) return comp;
        return {
          ...comp,
          brandReach: updateCompetitorBrandReach(comp, result),
          brandPerception: applySingleQuarterPerception(comp, result.laptopResults),
          models: comp.models.map((m) => {
            const sim = simByLaptop.get(m.design.id);
            if (!sim) return m;
            return { ...m, unitsInStock: sim.unsoldUnits };
          }),
        };
      }),
    };
  }

  // Clean up AI models: drop depleted/old, discount surviving old inventory
  const nextPreSimYear = s.year + 1;
  s = { ...s, companies: cleanupAIModels(s.companies, nextPreSimYear) };

  // Advance to next year Q1
  return {
    ...s,
    year: nextPreSimYear,
    quarter: 1 as Quarter,
    quarterSimulated: false,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "NEW_GAME":
      clearProjectionCache();
      return preSimulateAIYear(createInitialGameState(action.companyName, action.companyLogo));
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

      // Death spiral prevention: check AI competitor sales and nudge if struggling
      const currentYearResult = state.yearHistory[state.yearHistory.length - 1];
      const companiesAfterSpiral = currentYearResult
        ? applyDeathSpiralPrevention(state.companies, currentYearResult)
        : state.companies;

      return {
        ...state,
        year: nextYear,
        quarter: 1 as Quarter,
        quarterSimulated: false,
        quarterHistory: [],
        currentYearReviews: [],
        currentYearAwards: [],
        brandAwarenessBudget: 0,
        sponsorships: [],
        companies: cleanupAIModels(companiesAfterSpiral, nextYear).map((comp) => {
          if (!comp.isPlayer) return comp;
          return {
            ...comp,
            models: comp.models.map((m) => {
              if (m.status === "discontinued") return m;

              // Auto-discontinue drafts/designed models whose components are now obsolete
              if ((m.status === "draft" || m.status === "designed") && hasDiscontinuedComponents(m.design, nextYear)) {
                return { ...m, status: "discontinued" as const, manufacturingPlan: null, manufacturingQuantity: null };
              }

              // Find sim results for this model to get unsold units
              const simResult = lastSim?.laptopResults.find((r) => r.laptopId === m.design.id);
              const newStock = simResult ? simResult.unsoldUnits : m.unitsInStock;

              // Models that were manufacturing/onSale transition to onSale
              if (m.status === "manufacturing" || m.status === "onSale") {
                const discontinued = hasDiscontinuedComponents(m.design, nextYear);

                if (discontinued && newStock <= 0) {
                  return { ...m, status: "discontinued" as const, unitsInStock: 0, manufacturingPlan: null, manufacturingQuantity: null };
                }

                // Auto-carry-forward manufacturing plan for non-discontinued models
                const carriedPlan = !discontinued && m.manufacturingPlan
                  ? { ...m.manufacturingPlan, year: nextYear, quarter: 1 as const }
                  : null;

                return {
                  ...m,
                  status: "onSale" as const,
                  unitsInStock: newStock,
                  manufacturingPlan: carriedPlan,
                };
              }

              return m;
            }),
          };
        }),
      };
    }
    case "ADD_MODEL":
      return {
        ...state,
        cash: state.cash - action.rdCost,
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
    case "SET_MANUFACTURING_PLAN": {
      const newCost = action.plan.manufacturing.totalCost;
      return {
        ...state,
        companies: updatePlayerModels(state.companies, (models) =>
          models.map((m) => {
            if (m.design.id !== action.modelId) return m;
            // If editing an existing same-quarter plan, subtract the old cost first
            const oldPlan = m.manufacturingPlan;
            const isEdit = oldPlan && oldPlan.year === action.plan.year && oldPlan.quarter === action.plan.quarter;
            const oldCost = isEdit ? oldPlan.manufacturing.totalCost : 0;
            const oldUnits = isEdit ? oldPlan.manufacturing.unitsOrdered : 0;
            // Save the prior-quarter plan so it can be restored if the additional order is cancelled
            const previousPlan = !isEdit && oldPlan ? oldPlan : m.previousManufacturingPlan;
            return {
              ...m,
              manufacturingPlan: action.plan,
              previousManufacturingPlan: previousPlan,
              retailPrice: action.plan.manufacturing.unitPrice,
              manufacturingQuantity: action.plan.manufacturing.unitsOrdered,
              totalProductionSpend: (m.totalProductionSpend ?? 0) - oldCost + newCost,
              totalUnitsOrdered: (m.totalUnitsOrdered ?? 0) - oldUnits + action.plan.manufacturing.unitsOrdered,
            };
          }),
        ),
      };
    }
    case "CANCEL_CURRENT_QUARTER_PLAN": {
      return {
        ...state,
        companies: updatePlayerModels(state.companies, (models) =>
          models.map((m) => {
            if (m.design.id !== action.modelId) return m;
            const plan = m.manufacturingPlan;
            if (!plan || plan.year !== state.year || plan.quarter !== state.quarter) return m;
            // Undo the cost/units that were accumulated when this plan was saved
            const planCost = plan.manufacturing.totalCost;
            const restored = m.previousManufacturingPlan ?? null;
            return {
              ...m,
              manufacturingPlan: restored,
              previousManufacturingPlan: null,
              retailPrice: restored?.manufacturing.unitPrice ?? m.retailPrice,
              manufacturingQuantity: restored?.manufacturing.unitsOrdered ?? null,
              totalProductionSpend: (m.totalProductionSpend ?? 0) - planCost,
              totalUnitsOrdered: (m.totalUnitsOrdered ?? 0) - plan.manufacturing.unitsOrdered,
            };
          }),
        ),
      };
    }
    case "SET_RETAIL_PRICE":
      return {
        ...state,
        companies: updatePlayerModels(state.companies, (models) =>
          models.map((m) =>
            m.design.id === action.modelId
              ? { ...m, retailPrice: action.retailPrice }
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
      // Build lookup for all laptops (including AI) to update inventory
      const allSimByLaptop = new Map(
        result.laptopResults.map((r) => [r.laptopId, r]),
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
              const updatedStock = sim.unsoldUnits;

              // Auto-discontinue retail-only models that have sold out
              if (updatedStock <= 0 && hasDiscontinuedComponents(m.design, state.year)) {
                return {
                  ...m,
                  status: "discontinued" as const,
                  unitsInStock: 0,
                  manufacturingPlan: null,
                  manufacturingQuantity: null,
                };
              }

              return {
                ...m,
                // Update units in stock after quarter sales
                unitsInStock: updatedStock,
                manufacturingPlan: {
                  ...m.manufacturingPlan,
                  results: {
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
        // Competitor: update brand reach, perception, and inventory
        return {
          ...comp,
          brandReach: updateCompetitorBrandReach(comp, result),
          brandPerception: applySingleQuarterPerception(comp, result.laptopResults),
          models: comp.models.map((m) => {
            const sim = allSimByLaptop.get(m.design.id);
            if (!sim) return m;
            return { ...m, unitsInStock: sim.unsoldUnits };
          }),
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
    case "SET_AWARENESS_BUDGET": {
      // Refund old budget, charge new budget
      const cashDelta = state.brandAwarenessBudget - action.budget;
      return {
        ...state,
        cash: state.cash + cashDelta,
        brandAwarenessBudget: action.budget,
      };
    }
    case "TOGGLE_SPONSORSHIP": {
      const isActive = state.sponsorships.includes(action.sponsorshipId);
      const sponsorship = SPONSORSHIPS.find((s) => s.id === action.sponsorshipId);
      if (!sponsorship) return state;
      const cost = getSponsorshipCost(sponsorship, state.year);
      if (isActive) {
        // Remove and refund
        return {
          ...state,
          cash: state.cash + cost,
          sponsorships: state.sponsorships.filter((id) => id !== action.sponsorshipId),
        };
      }
      // Purchase
      if (state.cash < cost) return state;
      return {
        ...state,
        cash: state.cash - cost,
        sponsorships: [...state.sponsorships, action.sponsorshipId],
      };
    }
    case "SET_REVIEWS":
      return { ...state, currentYearReviews: action.reviews };
    case "SET_AWARDS":
      return {
        ...state,
        currentYearAwards: action.awards,
        companies: applyAwardBonuses(state.companies, action.awards),
      };
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
  const perceptionChanges = firstQ.perceptionChanges.map((pc, i) => {
    const newPerception = lastQ.perceptionChanges[i]?.newPerception ?? pc.newPerception;
    const delta = newPerception - pc.oldPerception;
    // Pick the reason from the quarter whose delta best represents the year-level change:
    // find the quarter with the largest absolute delta matching the overall sign
    let reason = lastQ.perceptionChanges[i]?.reason ?? pc.reason;
    const sameSignQuarters = quarters
      .map((q) => q.perceptionChanges[i])
      .filter((qpc) => qpc && Math.sign(qpc.delta) === Math.sign(delta) && Math.abs(qpc.delta) >= PERCEPTION_MEANINGFUL_DELTA);
    if (sameSignQuarters.length > 0) {
      sameSignQuarters.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
      reason = sameSignQuarters[0].reason;
    }
    return { ...pc, newPerception, delta, reason };
  });

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
            match.totalPool += db.totalPool;
            match.marketShare = db.marketShare; // Use latest quarter's share
            match.rawVP = db.rawVP;
            match.weightedStatScore = db.weightedStatScore; // Use latest
            match.screenPenalty = db.screenPenalty;
            match.perceptionMod = db.perceptionMod;
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
