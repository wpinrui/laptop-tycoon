import { FastForward } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { useNavigation } from "../../navigation/NavigationContext";
import { MenuButton } from "../../shell/MenuButton";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { cardBodyStyle } from "./styles";
import { getActiveModels } from "./utils";
import { hasDiscontinuedComponents } from "../../state/gameTypes";
import { COMPETITORS } from "../../../data/competitors";
import { generateCompetitorModels } from "../../../simulation/competitorAI";
import { simulateYear } from "../../../simulation/salesEngine";

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

export function AdvanceYearCard() {
  const { state, dispatch } = useGame();
  const { navigateTo } = useNavigation();
  const activeModels = getActiveModels(state);

  // Models that need plans = non-inventory-only models without a current-year plan
  const needPlans = modelsNeedingPlans({ year: state.year, models: activeModels });
  const allReady = activeModels.length > 0 && needPlans.length === 0;
  const warnings: string[] = [];

  if (activeModels.length === 0) {
    warnings.push("Design at least one laptop model");
  }
  if (activeModels.length > 0 && needPlans.length > 0) {
    warnings.push(
      `Add manufacturing plans for: ${needPlans.map((m) => m.design.name).join(", ")}`,
    );
  }

  return (
    <BentoCard title="Advance Year" icon={FastForward}>
      {warnings.length > 0 ? (
        warnings.map((w) => (
          <p key={w} style={{ ...cardBodyStyle, color: tokens.colors.danger }}>
            {w}
          </p>
        ))
      ) : (
        <p style={cardBodyStyle}>All models ready. Advance to simulate the year.</p>
      )}
      <MenuButton
        variant="accent"
        disabled={!allReady}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();

          // 1. Generate competitor models for this year
          const generated = generateCompetitorModels(state.year, COMPETITORS);
          const competitorModels = COMPETITORS.map((c, i) => ({
            competitorId: c.id,
            model: generated[i],
          }));
          dispatch({ type: "ADD_COMPETITOR_MODELS", models: competitorModels });

          // 2. Transition active models with plans to "manufacturing"
          for (const model of activeModels) {
            if (model.manufacturingPlan) {
              dispatch({ type: "UPDATE_MODEL_STATUS", modelId: model.design.id, status: "manufacturing" });
            }
          }

          // 3. Calculate post-manufacturing cash for simulation input
          let totalMfgSpend = 0;
          for (const model of activeModels) {
            if (model.manufacturingPlan) {
              totalMfgSpend += model.manufacturingPlan.manufacturing.totalCost
                + model.manufacturingPlan.marketing.cost;
            }
          }
          const cashAfterManufacturing = state.cash - totalMfgSpend;
          // 4. Run sales simulation with projected state (competitors + adjusted cash + updated statuses)
          const stateForSim = {
            ...state,
            cash: cashAfterManufacturing,
            models: state.models.map((m) =>
              activeModels.some((am) => am.design.id === m.design.id && am.manufacturingPlan)
                ? { ...m, status: "manufacturing" as const }
                : m,
            ),
            competitors: state.competitors.map((comp) => {
              const newModel = competitorModels.find((cm) => cm.competitorId === comp.id);
              return newModel ? { ...comp, models: [...comp.models, newModel.model] } : comp;
            }),
          };
          const result = simulateYear(stateForSim);

          // 5. Apply simulation results (sets cash to revenue + post-manufacturing balance)
          dispatch({ type: "APPLY_SIMULATION_RESULT", result });

          // 5. Navigate to appropriate screen
          if (result.gameOver) {
            navigateTo("gameOver");
          } else {
            navigateTo("yearEndSummary");
          }
        }}
        style={{ marginTop: tokens.spacing.md, width: "100%" }}
      >
        Simulate Year {state.year}
      </MenuButton>
    </BentoCard>
  );
}
