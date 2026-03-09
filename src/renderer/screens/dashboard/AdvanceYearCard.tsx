import { FastForward } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { useNavigation } from "../../navigation/NavigationContext";
import { MenuButton } from "../../shell/MenuButton";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { cardBodyStyle } from "./styles";
import { getActiveModels } from "./utils";
import { hasDiscontinuedComponents, LaptopModel, getPlayerCompany, modelDisplayName } from "../../state/gameTypes";
import { COMPETITORS } from "../../../data/competitors";
import { generateCompetitorModels } from "../../../simulation/competitorAI";
import { simulateQuarter } from "../../../simulation/salesEngine";
import { generateReviews, determineAwards } from "../../../simulation/reviewsAwards";
import { QuarterSimulationResult, LaptopSalesResult } from "../../../simulation/salesTypes";
import { QUARTER_LABELS, formatCash } from "../../utils/formatCash";
import { SPONSORSHIPS, getSponsorshipCost } from "../../../data/sponsorships";

/** Models that need a current-year manufacturing plan before simulation. */
function modelsNeedingPlans(state: { year: number; models: ReturnType<typeof getActiveModels> }) {
  return state.models.filter((m) => {
    // Discontinued components → retail-only from inventory, no plan needed
    if (hasDiscontinuedComponents(m.design, state.year)) return false;
    // Draft or onSale without a current-year plan
    const hasPlanForYear = m.manufacturingPlan?.year === state.year;
    return !hasPlanForYear;
  });
}

/** Aggregate laptop sales results across all quarters for award determination. */
function aggregateLaptopResults(quarters: QuarterSimulationResult[]): LaptopSalesResult[] {
  const map = new Map<string, LaptopSalesResult>();
  for (const q of quarters) {
    for (const lr of q.laptopResults) {
      const existing = map.get(lr.laptopId);
      if (existing) {
        map.set(lr.laptopId, {
          ...existing,
          unitsDemanded: existing.unitsDemanded + lr.unitsDemanded,
          unitsSold: existing.unitsSold + lr.unitsSold,
          revenue: existing.revenue + lr.revenue,
          profit: existing.profit + lr.profit,
          unsoldUnits: lr.unsoldUnits,
        });
      } else {
        map.set(lr.laptopId, { ...lr });
      }
    }
  }
  return Array.from(map.values());
}

export function AdvanceYearCard() {
  const { state, dispatch } = useGame();
  const { navigateTo } = useNavigation();
  const player = getPlayerCompany(state);
  const activeModels = getActiveModels(state);
  const isQ1 = state.quarter === 1;
  const quarterLabel = QUARTER_LABELS[state.quarter - 1];

  // Only require manufacturing plans in Q1 — subsequent quarters can proceed freely
  const needPlans = isQ1 ? modelsNeedingPlans({ year: state.year, models: activeModels }) : [];
  const allReady = isQ1
    ? activeModels.length > 0 && needPlans.length === 0
    : activeModels.length > 0;
  const warnings: string[] = [];

  if (isQ1 && activeModels.length === 0) {
    warnings.push("Design at least one laptop model");
  }
  if (isQ1 && activeModels.length > 0 && needPlans.length > 0) {
    warnings.push(
      `Add manufacturing plans for: ${needPlans.map((m) => modelDisplayName(player.name, m.design.name)).join(", ")}`,
    );
  }

  // Calculate brand marketing spend for display
  const sponsorshipCost = state.sponsorships.reduce((sum, id) => {
    const s = SPONSORSHIPS.find((sp) => sp.id === id);
    return sum + (s ? getSponsorshipCost(s, state.year) : 0);
  }, 0);
  const brandSpend = state.brandAwarenessBudget + sponsorshipCost;

  return (
    <BentoCard title={`Simulate ${quarterLabel}`} icon={FastForward}>
      {warnings.length > 0 ? (
        warnings.map((w) => (
          <p key={w} style={{ ...cardBodyStyle, color: tokens.colors.danger }}>
            {w}
          </p>
        ))
      ) : (
        <p style={cardBodyStyle}>
          {isQ1
            ? `All models ready. Simulate ${quarterLabel} ${state.year}.`
            : `Simulate ${quarterLabel} ${state.year}. Adjust prices, order more units, or run new campaigns from Model Management.`
          }
        </p>
      )}
      {brandSpend > 0 && (
        <p style={{ ...cardBodyStyle, color: tokens.colors.textMuted }}>
          Brand marketing: {formatCash(brandSpend)}
          {state.brandAwarenessBudget > 0 && sponsorshipCost > 0
            ? ` (${formatCash(state.brandAwarenessBudget)} awareness + ${formatCash(sponsorshipCost)} sponsorships)`
            : ""}
        </p>
      )}
      <MenuButton
        variant="accent"
        disabled={!allReady}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();

          // Q1 only: generate competitor models once (reused for dispatch + simulation)
          // Pass companies so AI reads live engineeringBonus (death spiral prevention)
          const generated = isQ1 ? generateCompetitorModels(state.year, COMPETITORS, state.companies) : [];

          if (isQ1) {
            const competitorModels = COMPETITORS.map((c, i) => ({
              competitorId: c.id,
              model: generated[i],
            }));
            dispatch({ type: "ADD_COMPETITOR_MODELS", models: competitorModels });
          }

          // Q1: transition active models with current-year plans to "manufacturing"
          const hasCurrentPlan = (m: LaptopModel) => m.manufacturingPlan?.year === state.year;
          if (isQ1) {
            for (const model of activeModels) {
              if (hasCurrentPlan(model)) {
                dispatch({ type: "UPDATE_MODEL_STATUS", modelId: model.design.id, status: "manufacturing" });
              }
            }
          }

          // Calculate post-manufacturing cash for simulation input
          // Only count manufacturing costs for plans created this quarter (not already deducted)
          const hasCurrentQuarterPlan = (m: LaptopModel) =>
            m.manufacturingPlan?.year === state.year && m.manufacturingPlan?.quarter === state.quarter;
          let totalMfgSpend = 0;
          for (const model of activeModels) {
            if (hasCurrentQuarterPlan(model)) {
              totalMfgSpend += model.manufacturingPlan!.manufacturing.totalCost
                + model.manufacturingPlan!.marketing.cost;
            }
          }
          const cashAfterManufacturing = state.cash - totalMfgSpend;

          // Build state for simulation
          const stateForSim = (() => {
            if (isQ1) {
              const byCompetitorId = new Map(COMPETITORS.map((c, i) => [c.id, generated[i]]));
              return {
                ...state,
                cash: cashAfterManufacturing,
                companies: state.companies.map((comp) => {
                  if (comp.isPlayer) {
                    return {
                      ...comp,
                      models: comp.models.map((m) =>
                        activeModels.some((am) => am.design.id === m.design.id && hasCurrentPlan(am))
                          ? { ...m, status: "manufacturing" as const }
                          : m,
                      ),
                    };
                  }
                  const newModel = byCompetitorId.get(comp.id);
                  return newModel ? { ...comp, models: [...comp.models, newModel] } : comp;
                }),
              };
            }
            return { ...state, cash: cashAfterManufacturing };
          })();

          const result = simulateQuarter(stateForSim);

          // Apply quarterly simulation results
          dispatch({ type: "APPLY_QUARTER_RESULT", result });

          // After Q1: generate and publish laptop reviews
          if (state.quarter === 1) {
            const reviews = generateReviews(stateForSim, result);
            dispatch({ type: "SET_REVIEWS", reviews });
          }

          // After Q4: determine year-end awards (uses all quarterly results)
          if (state.quarter === 4) {
            const allQuarterResults = [...state.quarterHistory, result];
            // Aggregate laptop results across all quarters for award determination
            const yearLaptopResults = aggregateLaptopResults(allQuarterResults);
            const awards = determineAwards(stateForSim, yearLaptopResults);
            dispatch({ type: "SET_AWARDS", awards });
          }

          // Navigate: game over only at end of Q4
          if (state.quarter === 4 && result.cashAfterResolution < 0) {
            navigateTo("gameOver");
          } else if (state.quarter === 4) {
            navigateTo("yearEndSummary");
          } else {
            navigateTo("quarterlySummary");
          }
        }}
        style={{ marginTop: tokens.spacing.md, width: "100%" }}
      >
        Simulate {quarterLabel} {state.year}
      </MenuButton>
    </BentoCard>
  );
}
