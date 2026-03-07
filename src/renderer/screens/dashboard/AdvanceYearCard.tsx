import { FastForward } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { MenuButton } from "../../shell/MenuButton";
import { tokens } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { cardBodyStyle } from "./styles";
import { getActiveModels } from "./utils";

export function AdvanceYearCard() {
  const { state, dispatch } = useGame();
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
          dispatch({ type: "ADVANCE_YEAR" });
          dispatch({ type: "GENERATE_COMPETITOR_MODELS", year: state.year + 1 });
        }}
        style={{ marginTop: tokens.spacing.md, width: "100%" }}
      >
        Simulate Year {state.year}
      </MenuButton>
    </BentoCard>
  );
}
