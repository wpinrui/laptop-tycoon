import { useState } from "react";
import { useMfgWizard } from "./ManufacturingWizardContext";
import { useGame } from "../state/GameContext";
import { useNavigation } from "../navigation/NavigationContext";
import { MfgStepIndicator } from "./MfgStepIndicator";
import { ManufacturingWizardStep, MFG_WIZARD_STEPS, FullManufacturingPlan } from "./types";
import { MarketingStep } from "./steps/MarketingStep";
import { ManufacturingStep } from "./steps/ManufacturingStep";
import { PressReleaseStep } from "./steps/PressReleaseStep";
import { ConfirmationStep } from "./steps/ConfirmationStep";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { tokens, overlayStyle } from "../shell/tokens";
import { AD_CAMPAIGNS, getCampaignCost } from "./data/campaigns";
import { calculateBomUnitCost, calculateCostBreakdown } from "./utils/economiesOfScale";
import {
  MULTI_MODEL_OVERHEAD, ASSEMBLY_QA_COST, PACKAGING_LOGISTICS_COST,
  CHANNEL_MARGIN_RATE, TOOLING_COST, CERTIFICATION_COST,
} from "./utils/constants";
import { getActiveModels } from "../screens/dashboard/utils";
import { StatusBar } from "../shell/StatusBar";

const STATUS_BAR_HEIGHT = 37;

function isStepComplete(step: ManufacturingWizardStep, state: ReturnType<typeof useMfgWizard>["state"]): boolean {
  switch (step) {
    case "marketing":
      return state.campaignId !== null;
    case "manufacturing":
      return state.unitPrice > 0 && state.unitsOrdered > 0;
    case "pressRelease":
      return state.pressReleasePromptIds.every(
        (id) => (state.pressReleaseResponses[id] ?? "").trim().length > 0,
      );
    case "confirmation":
      return true;
  }
}

function ConfirmCloseDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <ContentPanel maxWidth={400}>
        <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, fontWeight: 700, textAlign: "center" }}>
          Discard Plan?
        </h2>
        <p style={{ margin: 0, marginTop: tokens.spacing.xs, fontSize: tokens.font.sizeBase, color: tokens.colors.textMuted, textAlign: "center", marginBottom: tokens.spacing.md }}>
          All unsaved progress on this manufacturing plan will be lost.
        </p>
        <div style={{ display: "flex", gap: tokens.spacing.sm }}>
          <MenuButton onClick={onCancel} style={{ flex: 1 }}>
            Keep Editing
          </MenuButton>
          <MenuButton variant="danger" onClick={onConfirm} style={{ flex: 1 }}>
            Discard
          </MenuButton>
        </div>
      </ContentPanel>
    </div>
  );
}

function WizardContent() {
  const { state, dispatch } = useMfgWizard();
  const { state: gameState, dispatch: gameDispatch } = useGame();
  const { navigateTo } = useNavigation();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const currentIdx = MFG_WIZARD_STEPS.indexOf(state.currentStep);
  const isFirst = currentIdx === 0;
  const isLast = state.currentStep === "confirmation";

  const allStepsComplete = MFG_WIZARD_STEPS.every((s) => isStepComplete(s, state));
  const canAdvance = isStepComplete(state.currentStep, state);

  function canNavigateTo(step: ManufacturingWizardStep) {
    const targetIdx = MFG_WIZARD_STEPS.indexOf(step);
    if (targetIdx <= currentIdx) return true;
    for (let i = 0; i < targetIdx; i++) {
      if (!isStepComplete(MFG_WIZARD_STEPS[i], state)) return false;
    }
    return true;
  }

  function handleConfirm() {
    const campaign = AD_CAMPAIGNS.find((c) => c.id === state.campaignId) ?? AD_CAMPAIGNS[0];
    const campaignCost = getCampaignCost(campaign, gameState.year);
    const activeModelCount = getActiveModels(gameState).length;
    const designModel = gameState.models.find((m) => m.design.id === state.modelId)!;
    const modelType = designModel.design.modelType ?? "brandNew";
    const overhead = activeModelCount > 1 ? MULTI_MODEL_OVERHEAD : 0;

    const cost = calculateCostBreakdown({
      baseBomCost: designModel.design.unitCost,
      unitsOrdered: state.unitsOrdered,
      retailPrice: state.unitPrice,
      supportBudget: state.supportBudget,
      assemblyQa: ASSEMBLY_QA_COST,
      packagingLogistics: PACKAGING_LOGISTICS_COST,
      channelMarginRate: CHANNEL_MARGIN_RATE,
      toolingCost: TOOLING_COST[modelType] ?? 0,
      certificationCost: CERTIFICATION_COST[modelType] ?? 0,
      multiModelOverhead: overhead,
      adCost: campaignCost,
    });

    const plan: FullManufacturingPlan = {
      laptopModelId: state.modelId,
      year: gameState.year,
      marketing: {
        campaignId: state.campaignId,
        cost: campaignCost,
      },
      manufacturing: {
        unitPrice: state.unitPrice,
        unitsOrdered: state.unitsOrdered,
        unitCost: Math.round(cost.manufacturingCostPerUnit),
        totalCost: Math.round(cost.totalManufacturingSpend),
      },
      pressRelease: {
        promptIds: state.pressReleasePromptIds,
        responses: state.pressReleaseResponses,
      },
    };

    gameDispatch({
      type: "SET_MANUFACTURING_PLAN",
      modelId: state.modelId,
      plan,
    });

    navigateTo("modelManagement");
  }

  const model = gameState.models.find((m) => m.design.id === state.modelId);

  const stepContent = (() => {
    switch (state.currentStep) {
      case "marketing":
        return <MarketingStep />;
      case "manufacturing":
        return <ManufacturingStep />;
      case "pressRelease":
        return <PressReleaseStep />;
      case "confirmation":
        return <ConfirmationStep />;
    }
  })();

  return (
    <div
      style={{
        padding: tokens.spacing.lg,
        paddingBottom: STATUS_BAR_HEIGHT + tokens.spacing.lg,
        fontFamily: tokens.font.family,
        color: tokens.colors.text,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: tokens.font.sizeTitle, marginBottom: tokens.spacing.sm }}>
            Manufacturing Plan
          </h1>
          <p style={{ color: tokens.colors.textMuted, marginBottom: tokens.spacing.lg }}>
            {model ? `${model.design.name} · Year ${gameState.year}` : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCloseConfirm(true)}
          style={{
            background: "none",
            border: `1px solid ${tokens.colors.panelBorder}`,
            borderRadius: tokens.borderRadius.sm,
            color: tokens.colors.textMuted,
            fontSize: tokens.font.sizeLarge,
            width: "36px",
            height: "36px",
            cursor: "pointer",
            fontFamily: "inherit",
            lineHeight: "1",
            flexShrink: 0,
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = tokens.colors.danger; e.currentTarget.style.color = tokens.colors.danger; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = tokens.colors.panelBorder; e.currentTarget.style.color = tokens.colors.textMuted; }}
        >
          ✕
        </button>
      </div>

      <MfgStepIndicator
        currentStep={state.currentStep}
        onStepClick={(step) => dispatch({ type: "GO_TO_STEP", step })}
        canNavigateTo={canNavigateTo}
      />

      <div
        style={{
          background: tokens.colors.background,
          border: `1px solid ${tokens.colors.panelBorder}`,
          borderRadius: tokens.borderRadius.md,
          padding: tokens.spacing.lg,
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {stepContent}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: tokens.spacing.md,
          flexShrink: 0,
        }}
      >
        <MenuButton
          onClick={() => dispatch({ type: "PREV_STEP" })}
          disabled={isFirst}
          style={{ fontSize: tokens.font.sizeBase }}
        >
          Back
        </MenuButton>
        <MenuButton
          variant={isLast ? "accent" : "surface"}
          onClick={() => {
            if (isLast) {
              handleConfirm();
            } else {
              dispatch({ type: "NEXT_STEP" });
            }
          }}
          disabled={isLast ? !allStepsComplete : !canAdvance}
          style={{ fontSize: tokens.font.sizeBase, fontWeight: 600 }}
        >
          {isLast ? "Confirm Manufacturing Plan" : "Next"}
        </MenuButton>
      </div>

      {showCloseConfirm && (
        <ConfirmCloseDialog
          onConfirm={() => navigateTo("modelManagement")}
          onCancel={() => setShowCloseConfirm(false)}
        />
      )}
      <StatusBar variant="fixed" />
    </div>
  );
}

export function ManufacturingWizard() {
  return <WizardContent />;
}
