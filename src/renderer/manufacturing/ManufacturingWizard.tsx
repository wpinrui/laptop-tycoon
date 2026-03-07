import { useState } from "react";
import { useMfgWizard } from "./ManufacturingWizardContext";
import { useGame } from "../state/GameContext";
import { useNavigation } from "../navigation/NavigationContext";
import { MfgStepIndicator } from "./MfgStepIndicator";
import { ManufacturingWizardStep, ManufacturingWizardState, MFG_WIZARD_STEPS, FullManufacturingPlan } from "./types";
import { MarketingStep } from "./steps/MarketingStep";
import { ManufacturingStep } from "./steps/ManufacturingStep";
import { PressReleaseStep } from "./steps/PressReleaseStep";
import { ConfirmationStep } from "./steps/ConfirmationStep";
import { MenuButton } from "../shell/MenuButton";
import { tokens } from "../shell/tokens";
import { ConfirmDiscardDialog } from "../shell/ConfirmDiscardDialog";
import { buildCostBreakdown } from "./utils/economiesOfScale";
import { StatusBar } from "../shell/StatusBar";

function isStepComplete(step: ManufacturingWizardStep, state: ManufacturingWizardState): boolean {
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
    if (!model) return;
    const { cost, campaignCost } = buildCostBreakdown(gameState, state);

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
        supportBudget: state.supportBudget,
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
        paddingBottom: tokens.layout.statusBarHeight + tokens.spacing.lg,
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
        <ConfirmDiscardDialog
          title="Discard Plan?"
          message="All unsaved progress on this manufacturing plan will be lost."
          onConfirm={() => navigateTo("modelManagement")}
          onCancel={() => setShowCloseConfirm(false)}
        />
      )}
      <StatusBar variant="fixed" />
    </div>
  );
}

const wizardShellStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  background: tokens.colors.panelBg,
  backdropFilter: tokens.backdrop.blur,
  WebkitBackdropFilter: tokens.backdrop.blur,
};

export function ManufacturingWizard() {
  return (
    <div style={wizardShellStyle}>
      <WizardContent />
    </div>
  );
}
