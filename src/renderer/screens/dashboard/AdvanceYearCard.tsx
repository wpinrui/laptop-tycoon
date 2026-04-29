import { useState } from "react";
import { FastForward } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { useNavigation } from "../../navigation/NavigationContext";
import { Screen } from "../../navigation/types";
import { ContentPanel } from "../../shell/ContentPanel";
import { MenuButton } from "../../shell/MenuButton";
import { tokens, overlayStyle } from "../../shell/tokens";
import { BentoCard } from "./BentoCard";
import { cardBodyStyle } from "./styles";
import { getActiveModels } from "./utils";
import { GameState, LaptopModel, getPlayerCompany } from "../../state/gameTypes";
import { COMPETITORS } from "../../../data/competitors";
import { generateCompetitorModels } from "../../../simulation/competitorAI";
import { simulateQuarter } from "../../../simulation/salesEngine";
import { applyMarketingToReach } from "../../../simulation/brandProgression";
import { generateReviews } from "../../../simulation/reviewsAwards";
import { QUARTER_LABELS } from "../../utils/formatCash";

interface SimWarning {
  label: string;
  description: string;
  models?: string[];
  actionLabel: string;
  actionScreen: Screen;
}

function getPreSimWarnings(state: GameState): SimWarning[] {
  const warnings: SimWarning[] = [];
  const player = getPlayerCompany(state);
  const activeModels = player.models.filter((m) => m.status !== "discontinued");

  const modelName = (m: LaptopModel) => `${player.name} ${m.design.name}`;

  // 1. Designs with no manufacturing plan
  const unplanned = activeModels.filter((m) => m.status === "designed" && !m.manufacturingPlan);
  if (unplanned.length > 0) {
    warnings.push({
      label: "No manufacturing plan",
      description: "These designs won't be produced or sold without a manufacturing plan.",
      models: unplanned.map(modelName),
      actionLabel: "Go to Model Management",
      actionScreen: "modelManagement",
    });
  }

  // 2. Any model that will have zero units available to sell this quarter
  //    Covers: designed with 0-unit plan, manufacturing/onSale with no stock + no new batch
  const outOfStock = activeModels.filter((m) => {
    if (m.status === "designed" && !m.manufacturingPlan) return false; // Already caught by check 1
    if (m.status === "draft") return false;
    const hasCurrentQuarterPlan =
      m.manufacturingPlan?.year === state.year && m.manufacturingPlan?.quarter === state.quarter;
    const newBatch = hasCurrentQuarterPlan ? (m.manufacturingQuantity ?? 0) : 0;
    return newBatch + m.unitsInStock <= 0;
  });
  if (outOfStock.length > 0) {
    warnings.push({
      label: "Out of stock",
      description: "These models have zero units to sell this quarter.",
      models: outOfStock.map(modelName),
      actionLabel: "Go to Model Management",
      actionScreen: "modelManagement",
    });
  }

  // 3. Zero brand reach (no marketing ever done)
  const totalReach = Object.values(player.brandReach).reduce((sum, v) => sum + v, 0);
  if (totalReach === 0 && state.marketingCampaigns.length === 0) {
    warnings.push({
      label: "Zero brand reach",
      description: "No marketing campaigns set up — your products won't reach any buyers.",
      actionLabel: "Go to Brand Management",
      actionScreen: "brandDetail",
    });
  }

  return warnings;
}

export function AdvanceYearCard() {
  const { state, dispatch } = useGame();
  const { navigateTo } = useNavigation();
  const activeModels = getActiveModels(state);
  const quarterLabel = QUARTER_LABELS[state.quarter - 1];
  const [warnings, setWarnings] = useState<SimWarning[] | null>(null);

  const runSimulation = () => {
    setWarnings(null);

    // Generate competitor models for any competitor whose launch quarter matches current quarter
    const launchingCompetitors = COMPETITORS.filter((c) => c.launchQuarter === state.quarter);
    const generated = launchingCompetitors.length > 0
      ? generateCompetitorModels(state.year, launchingCompetitors, state.companies)
      : [];

    if (launchingCompetitors.length > 0) {
      const competitorModels = launchingCompetitors.map((c, i) => ({
        competitorId: c.id,
        model: generated[i],
      }));
      dispatch({ type: "ADD_COMPETITOR_MODELS", models: competitorModels });
    }

    // Transition active models with current-year plans to "manufacturing"
    // (applies in any quarter — models designed mid-year need this too)
    const hasCurrentPlan = (m: LaptopModel) => m.manufacturingPlan?.year === state.year;
    for (const model of activeModels) {
      if (hasCurrentPlan(model) && model.status === "designed") {
        dispatch({ type: "UPDATE_MODEL_STATUS", modelId: model.design.id, status: "manufacturing" });
      }
    }

    // Calculate post-manufacturing cash for simulation input
    // Only count manufacturing costs for plans created this quarter (not already deducted)
    const hasCurrentQuarterPlan = (m: LaptopModel) =>
      m.manufacturingPlan?.year === state.year && m.manufacturingPlan?.quarter === state.quarter;
    let totalMfgSpend = 0;
    for (const model of activeModels) {
      if (hasCurrentQuarterPlan(model)) {
        totalMfgSpend += model.manufacturingPlan!.manufacturing.totalCost;
      }
    }
    const cashAfterManufacturing = state.cash - totalMfgSpend;

    // Apply marketing reach BEFORE simulation so marketing spend
    // affects this quarter's sales (not just the next quarter's)
    const marketingReach = applyMarketingToReach(state);

    // Build state for simulation
    const stateForSim = (() => {
      const byCompetitorId = launchingCompetitors.length > 0
        ? new Map(launchingCompetitors.map((c, i) => [c.id, generated[i]]))
        : new Map<string, (typeof generated)[0]>();
      return {
        ...state,
        cash: cashAfterManufacturing,
        companies: state.companies.map((comp) => {
          if (comp.isPlayer) {
            return {
              ...comp,
              brandReach: marketingReach,
              models: comp.models.map((m) =>
                m.status === "designed" &&
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
    })();

    const result = simulateQuarter(stateForSim);

    // Apply quarterly simulation results
    dispatch({ type: "APPLY_QUARTER_RESULT", result });

    // Generate and publish laptop reviews after every quarter
    const reviews = generateReviews(stateForSim, result);
    dispatch({ type: "SET_REVIEWS", reviews });

    // Navigate to pre-sim news carousel (handles routing to results internally)
    navigateTo("preSimNews");
  };

  const handleSimulateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const detected = getPreSimWarnings(state);
    if (detected.length > 0) {
      setWarnings(detected);
    } else {
      runSimulation();
    }
  };

  return (
    <BentoCard title={`Simulate ${quarterLabel}`} icon={FastForward}>
      <p style={cardBodyStyle}>
        {`Simulate ${quarterLabel} ${state.year}. You can place additional manufacturing orders or adjust pricing from Model Management.`}
      </p>
      <MenuButton
        variant="accent"
        onClick={handleSimulateClick}
        style={{ marginTop: tokens.spacing.md, width: "100%" }}
      >
        Simulate {quarterLabel} {state.year}
      </MenuButton>

      {warnings && (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setWarnings(null); }}>
          <ContentPanel maxWidth={540}>
            <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, fontWeight: 700, textAlign: "center" }}>
              Before you simulate...
            </h2>
            <div style={{ marginTop: tokens.spacing.md, display: "flex", flexDirection: "column", gap: tokens.spacing.sm }}>
              {warnings.map((w) => (
                <div
                  key={w.label}
                  style={{
                    background: tokens.colors.warningBg,
                    border: `1px solid ${tokens.colors.warningBorder}`,
                    borderRadius: tokens.borderRadius.sm,
                    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
                  }}
                >
                  <div style={{ fontWeight: 600, color: tokens.colors.warning, fontSize: tokens.font.sizeBase }}>
                    {w.label}{w.models ? `: ${w.models.join(", ")}` : ""}
                  </div>
                  <div style={{ color: tokens.colors.textMuted, fontSize: tokens.font.sizeBase, marginTop: tokens.spacing.xs }}>
                    {w.description}
                  </div>
                  <MenuButton
                    onClick={() => { setWarnings(null); navigateTo(w.actionScreen); }}
                    style={{ marginTop: tokens.spacing.sm, width: "100%", padding: `${tokens.spacing.xs}px ${tokens.spacing.md}px`, fontSize: tokens.font.sizeBase }}
                  >
                    {w.actionLabel}
                  </MenuButton>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: tokens.spacing.sm, marginTop: tokens.spacing.lg }}>
              <MenuButton onClick={() => setWarnings(null)} style={{ flex: 1 }}>
                Go Back
              </MenuButton>
              <MenuButton variant="accent" onClick={runSimulation} style={{ flex: 1 }}>
                Simulate Anyway
              </MenuButton>
            </div>
          </ContentPanel>
        </div>
      )}
    </BentoCard>
  );
}
