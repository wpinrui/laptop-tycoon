import { useState } from "react";
import { useMfgWizard } from "./ManufacturingWizardContext";
import { useGame } from "../state/GameContext";
import { getPlayerCompany, modelDisplayName } from "../state/gameTypes";
import { useNavigation } from "../navigation/NavigationContext";
import { MfgStepIndicator } from "./MfgStepIndicator";
import { ManufacturingWizardStep, ManufacturingWizardState, MFG_WIZARD_STEPS, FullManufacturingPlan } from "./types";
import { ManufacturingStep } from "./steps/ManufacturingStep";
import { PressReleaseStep } from "./steps/PressReleaseStep";
import { ConfirmationStep } from "./steps/ConfirmationStep";
import { MenuButton } from "../shell/MenuButton";
import { tokens, wizardShellStyle } from "../shell/tokens";
import { ConfirmDiscardDialog } from "../shell/ConfirmDiscardDialog";
import { buildCostBreakdown } from "./utils/economiesOfScale";
import { StatusBar } from "../shell/StatusBar";

function isStepComplete(step: ManufacturingWizardStep, state: ManufacturingWizardState): boolean {
  switch (step) {
    case "manufacturing":
      return state.unitPrice > 0 && state.unitsOrdered >= 0;
    case "pressRelease":
      return true;
    case "confirmation":
      return true;
  }
}

/** Get visible wizard steps — additional orders skip press release and confirmation. */
function getVisibleSteps(isAdditionalOrder: boolean): ManufacturingWizardStep[] {
  return isAdditionalOrder ? ["manufacturing"] : MFG_WIZARD_STEPS;
}

function WizardContent() {
  const { state, dispatch } = useMfgWizard();
  const { state: gameState, dispatch: gameDispatch } = useGame();
  const { navigateTo } = useNavigation();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [visitedConfirmation, setVisitedConfirmation] = useState(false);

  const visibleSteps = getVisibleSteps(state.isAdditionalOrder);
  const currentIdx = visibleSteps.indexOf(state.currentStep);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === visibleSteps.length - 1;

  if (isLast && !visitedConfirmation) setVisitedConfirmation(true);

  const allStepsComplete = visibleSteps.every((s) => isStepComplete(s, state));
  const canAdvance = isStepComplete(state.currentStep, state);

  function canNavigateTo(step: ManufacturingWizardStep) {
    const targetIdx = visibleSteps.indexOf(step);
    if (targetIdx <= currentIdx) return true;
    for (let i = 0; i < targetIdx; i++) {
      if (!isStepComplete(visibleSteps[i], state)) return false;
    }
    return true;
  }

  function handleConfirm() {
    if (!model) return;

    // Additional order with 0 units = cancel the additional order
    if (state.isAdditionalOrder && state.unitsOrdered === 0) {
      // If we previously saved an additional order this quarter, revert it
      const existingPlan = model.manufacturingPlan;
      const hasSavedAdditionalOrder = existingPlan && existingPlan.year === gameState.year && existingPlan.quarter === gameState.quarter;
      if (hasSavedAdditionalOrder) {
        gameDispatch({ type: "CANCEL_CURRENT_QUARTER_PLAN", modelId: state.modelId });
      }
      navigateTo("modelManagement");
      return;
    }

    const { cost } = buildCostBreakdown(gameState, state);

    const plan: FullManufacturingPlan = {
      laptopModelId: state.modelId,
      year: gameState.year,
      quarter: gameState.quarter,
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

  const player = getPlayerCompany(gameState);
  const model = player.models.find((m) => m.design.id === state.modelId);

  const stepContent = (() => {
    switch (state.currentStep) {
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
            {state.isAdditionalOrder ? "Additional Manufacturing Order" : "Manufacturing Plan"}
          </h1>
          <p style={{ color: tokens.colors.textMuted, marginBottom: tokens.spacing.lg }}>
            {model ? `${modelDisplayName(player.name, model.design.name)} · Year ${gameState.year}` : ""}
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

      {!state.isAdditionalOrder && (
        <MfgStepIndicator
          currentStep={state.currentStep}
          onStepClick={(step) => dispatch({ type: "GO_TO_STEP", step })}
          canNavigateTo={canNavigateTo}
        />
      )}

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
          onClick={() => {
            if (isFirst) {
              setShowCloseConfirm(true);
            } else {
              dispatch({ type: "PREV_STEP" });
            }
          }}
          style={{ fontSize: tokens.font.sizeBase }}
        >
          {isFirst ? "Cancel" : "Back"}
        </MenuButton>
        <div style={{ display: "flex", gap: tokens.spacing.sm }}>
          {!isLast && allStepsComplete && visitedConfirmation && (
            <MenuButton
              variant="accent"
              onClick={handleConfirm}
              style={{ fontSize: tokens.font.sizeBase, fontWeight: 600 }}
            >
              {state.isAdditionalOrder ? "Confirm Order" : "Confirm Manufacturing Plan"}
            </MenuButton>
          )}
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
            {isLast ? (state.isAdditionalOrder ? "Confirm Order" : "Confirm Manufacturing Plan") : "Next"}
          </MenuButton>
        </div>
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

export function ManufacturingWizard() {
  return (
    <div style={wizardShellStyle}>
      <WizardContent />
    </div>
  );
}
