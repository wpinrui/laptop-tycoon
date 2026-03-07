import { FastForward } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { useNavigation } from "../../navigation/NavigationContext";
import { MenuButton } from "../../shell/MenuButton";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { cardBodyStyle } from "./styles";
import { getActiveModels } from "./utils";
import { COMPETITORS } from "../../../data/competitors";
import { generateCompetitorModels } from "../../../simulation/competitorAI";
import { simulateYear } from "../../../simulation/salesEngine";

export function AdvanceYearCard() {
  const { state, dispatch } = useGame();
  const { navigateTo } = useNavigation();
  const activeModels = getActiveModels(state);
  const allHavePlans = activeModels.length > 0 && activeModels.every(
    (m) => m.manufacturingPlan !== null
  );
  const warnings: string[] = [];

  if (activeModels.length === 0) {
    warnings.push("Design at least one laptop model");
  }
  if (activeModels.length > 0 && !allHavePlans) {
    const modelsWithoutPlans = activeModels.filter((m) => m.manufacturingPlan === null);
    warnings.push(
      `Add manufacturing plans for: ${modelsWithoutPlans.map((m) => m.design.name).join(", ")}`,
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
        disabled={!allHavePlans}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();

          // 1. Generate competitor models for this year
          const generated = generateCompetitorModels(state.year, COMPETITORS);
          const competitorModels = COMPETITORS.map((c, i) => ({
            competitorId: c.id,
            model: generated[i],
          }));
          dispatch({ type: "ADD_COMPETITOR_MODELS", models: competitorModels });

          // 2. Calculate post-manufacturing cash for simulation input
          let totalMfgSpend = 0;
          for (const model of activeModels) {
            if (model.manufacturingPlan) {
              totalMfgSpend += model.manufacturingPlan.manufacturing.totalCost
                + model.manufacturingPlan.marketing.cost;
            }
          }
          const cashAfterManufacturing = state.cash - totalMfgSpend;
          // 3. Run sales simulation with projected state (competitors + adjusted cash)
          const stateForSim = {
            ...state,
            cash: cashAfterManufacturing,
            competitors: state.competitors.map((comp) => {
              const newModel = competitorModels.find((cm) => cm.competitorId === comp.id);
              return newModel ? { ...comp, models: [...comp.models, newModel.model] } : comp;
            }),
          };
          const result = simulateYear(stateForSim);

          // 4. Apply simulation results (sets cash to revenue + post-manufacturing balance)
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
