import { useEffect, useState } from "react";
import { useWizard } from "./WizardContext";
import { StepIndicator } from "./StepIndicator";
import { WizardStep, WizardState, WIZARD_STEPS, COMPONENT_STEP_SLOTS, getAllChassisOptions } from "./types";
import {
  GAME_YEAR,
  availableVolumeCm3,
  totalConsumedVolumeCm3,
  maxHeightConstraintCm,
  computeLaptopTotals,
} from "./constants";
import { useGame } from "../state/GameContext";
import { useNavigation } from "../navigation/NavigationContext";
import { LaptopDesign } from "../state/gameTypes";
import { ContentPanel } from "../shell/ContentPanel";
import { MenuButton } from "../shell/MenuButton";
import { tokens } from "../shell/tokens";
import { MetadataStep } from "./steps/MetadataStep";
import { ScreenSizeStep } from "./steps/ScreenSizeStep";
import { ProcessingStep } from "./steps/ProcessingStep";
import { DisplayStep } from "./steps/DisplayStep";
import { MediaConnectivityStep } from "./steps/MediaConnectivityStep";
import { BatteryStep } from "./steps/BatteryStep";
import { BodyStep } from "./steps/BodyStep";
import { ReviewStep } from "./steps/ReviewStep";
import { WizardSidebar } from "./LaptopEstimateSidebar";

function isStepComplete(step: WizardStep, state: WizardState): boolean {
  switch (step) {
    case "metadata":
      return !!(state.name.trim() && (state.modelType === "brandNew" || state.predecessorId));
    case "screenSize":
    case "battery":
      return state.visitedSteps.has(step);
    case "processing":
    case "display":
    case "mediaConnectivity": {
      const slots = COMPONENT_STEP_SLOTS[step]!;
      return slots.every((slot) => state.components[slot]);
    }
    case "body": {
      if (
        !state.chassis.material ||
        !state.chassis.coolingSolution ||
        !state.chassis.keyboardFeature ||
        !state.chassis.trackpadFeature
      )
        return false;

      const chassisOptions = getAllChassisOptions(state.chassis);

      // Volume check
      const totalVol = totalConsumedVolumeCm3(state.components, state.batteryCapacityWh, state.ports, chassisOptions);
      const available = availableVolumeCm3(state.screenSize, state.bezelMm, state.thicknessCm, GAME_YEAR);
      if (totalVol > available) return false;

      // Height constraint check
      const minHeight = maxHeightConstraintCm(state.components, state.ports, chassisOptions);
      return state.thicknessCm >= minHeight;
    }
    case "review":
      return true;
  }
}

function wizardStateToDesign(state: WizardState): LaptopDesign {
  const totals = computeLaptopTotals(
    state.components,
    state.ports,
    state.chassis,
    state.batteryCapacityWh,
    state.selectedColours,
    state.screenSize,
    state.bezelMm,
    state.thicknessCm,
    GAME_YEAR,
  );
  return {
    id: state.editingModelId ?? crypto.randomUUID(),
    name: state.name,
    modelType: state.modelType,
    predecessorId: state.predecessorId,
    screenSize: state.screenSize,
    components: state.components,
    ports: state.ports,
    batteryCapacityWh: state.batteryCapacityWh,
    thicknessCm: state.thicknessCm,
    bezelMm: state.bezelMm,
    chassis: state.chassis,
    selectedColours: state.selectedColours,
    unitCost: totals.totalCost,
  };
}

function ConfirmCloseDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: tokens.zIndex.overlay,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <ContentPanel maxWidth={400}>
        <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, fontWeight: 700, textAlign: "center" }}>
          Discard Design?
        </h2>
        <p style={{ margin: 0, marginTop: tokens.spacing.xs, fontSize: tokens.font.sizeBase, color: tokens.colors.textMuted, textAlign: "center", marginBottom: tokens.spacing.md }}>
          All unsaved progress on this laptop design will be lost.
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
  const { state, dispatch } = useWizard();
  const { state: gameState, dispatch: gameDispatch } = useGame();
  const { navigateTo } = useNavigation();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const currentIdx = WIZARD_STEPS.indexOf(state.currentStep);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === WIZARD_STEPS.length - 1;

  const allStepsComplete = WIZARD_STEPS.every((s) => isStepComplete(s, state));

  const canAdvance = isStepComplete(state.currentStep, state)
    && (state.currentStep !== "body" || state.selectedColours.length > 0)
    && (!isLast || allStepsComplete);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Enter" && canAdvance && !isLast) {
        dispatch({ type: "NEXT_STEP" });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canAdvance, isLast, dispatch]);

  function canNavigateTo(step: WizardStep) {
    const targetIdx = WIZARD_STEPS.indexOf(step);
    if (targetIdx <= currentIdx) return true;
    // Can jump forward if all prior steps are complete
    for (let i = 0; i < targetIdx; i++) {
      if (!isStepComplete(WIZARD_STEPS[i], state)) return false;
    }
    return true;
  }

  const stepContent = (() => {
    switch (state.currentStep) {
      case "metadata":
        return <MetadataStep />;
      case "screenSize":
        return <ScreenSizeStep />;
      case "processing":
        return <ProcessingStep />;
      case "display":
        return <DisplayStep />;
      case "mediaConnectivity":
        return <MediaConnectivityStep />;
      case "battery":
        return <BatteryStep />;
      case "body":
        return <BodyStep />;
      case "review":
        return <ReviewStep />;
    }
  })();

  return (
    <div
      style={{
        padding: tokens.spacing.lg,
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
          <h1 style={{ fontSize: tokens.font.sizeTitle, marginBottom: tokens.spacing.sm }}>Laptop Builder</h1>
          <p style={{ color: tokens.colors.textMuted, marginBottom: tokens.spacing.lg }}>
            {state.editingModelId ? `Editing ${state.name}` : `Design your new laptop model for ${GAME_YEAR}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: tokens.spacing.sm, flexShrink: 0 }}>
        <button
          onClick={() => dispatch({ type: "DEBUG_AUTOFILL" })}
          style={{
            background: "none",
            border: `1px solid ${tokens.colors.panelBorder}`,
            borderRadius: tokens.borderRadius.sm,
            color: tokens.colors.accent,
            fontSize: tokens.font.sizeSmall,
            padding: `${tokens.spacing.xs + 2}px ${tokens.spacing.sm + 4}px`,
            cursor: "pointer",
            fontFamily: "inherit",
            lineHeight: "1",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = tokens.colors.accent; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = tokens.colors.panelBorder; }}
        >
          Auto-fill
        </button>
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
      </div>

      <StepIndicator
        currentStep={state.currentStep}
        onStepClick={(step) => dispatch({ type: "GO_TO_STEP", step })}
        canNavigateTo={canNavigateTo}
      />

      <div
        style={{
          display: "flex",
          gap: tokens.spacing.lg,
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            background: tokens.colors.background,
            border: `1px solid ${tokens.colors.panelBorder}`,
            borderRadius: tokens.borderRadius.md,
            padding: tokens.spacing.lg,
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
            position: "relative",
            zIndex: 0,
          }}
        >
          {stepContent}
        </div>
        <WizardSidebar
          showChassisTotals={state.currentStep === "body"}
          showEstimate={allStepsComplete}
        />
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
              const design = wizardStateToDesign(state);
              if (state.editingModelId) {
                gameDispatch({ type: "UPDATE_MODEL_DESIGN", modelId: state.editingModelId, design });
              } else {
                gameDispatch({
                  type: "ADD_MODEL",
                  model: {
                    design,
                    status: "draft",
                    retailPrice: null,
                    manufacturingQuantity: null,
                    yearDesigned: gameState.year,
                  },
                });
              }
              dispatch({ type: "RESET" });
              navigateTo("modelManagement");
            } else {
              dispatch({ type: "NEXT_STEP" });
            }
          }}
          disabled={!canAdvance}
          style={{ fontSize: tokens.font.sizeBase, fontWeight: 600 }}
        >
          {isLast ? (state.editingModelId ? "Save Changes" : "Finalize Design") : "Next"}
        </MenuButton>
      </div>
      {showCloseConfirm && (
        <ConfirmCloseDialog
          onConfirm={() => {
            dispatch({ type: "RESET" });
            navigateTo(state.editingModelId ? "modelManagement" : "dashboard");
          }}
          onCancel={() => setShowCloseConfirm(false)}
        />
      )}
    </div>
  );
}

export function DesignWizard() {
  return <WizardContent />;
}
