import { WizardProvider, useWizard } from "./WizardContext";
import { StepIndicator } from "./StepIndicator";
import { WizardStep, WizardState, WIZARD_STEPS } from "./types";
import {
  GAME_YEAR,
  availableVolumeCm3,
  batteryVolumeCm3,
} from "./constants";
import { ComponentSlot } from "../../data/types";
import { PORT_TYPES } from "../../data/portTypes";
import { MetadataStep } from "./steps/MetadataStep";
import { ScreenSizeStep } from "./steps/ScreenSizeStep";
import { ProcessingStep } from "./steps/ProcessingStep";
import { DisplayStep } from "./steps/DisplayStep";
import { MediaConnectivityStep } from "./steps/MediaConnectivityStep";
import { BatteryStep } from "./steps/BatteryStep";
import { BodyStep } from "./steps/BodyStep";
import { ReviewStep } from "./steps/ReviewStep";

const COMPONENT_STEP_SLOTS: Partial<Record<WizardStep, ComponentSlot[]>> = {
  processing: ["cpu", "gpu", "ram", "storage"],
  display: ["resolution", "displayTech", "displaySurface"],
  mediaConnectivity: ["webcam", "speakers", "wifi"],
};

function isStepComplete(step: WizardStep, state: WizardState): boolean {
  switch (step) {
    case "metadata":
      return !!(state.name.trim() && (state.modelType === "brandNew" || state.predecessorId));
    case "screenSize":
    case "battery":
      return true; // sliders with defaults, always valid
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

      // Volume check
      let totalVol = batteryVolumeCm3(state.batteryCapacityWh);
      for (const comp of Object.values(state.components)) {
        if (comp) totalVol += comp.volumeCm3;
      }
      for (const pt of PORT_TYPES) {
        totalVol += (state.ports[pt.id] ?? 0) * pt.volumePerPortCm3;
      }
      for (const opt of Object.values(state.chassis)) {
        if (opt) totalVol += opt.volumeCm3;
      }
      const available = availableVolumeCm3(state.screenSize, state.bezelMm, state.thicknessCm);
      if (totalVol > available) return false;

      // Height constraint check
      let maxHeight = 0;
      for (const comp of Object.values(state.components)) {
        if (comp && comp.minThicknessCm > maxHeight) maxHeight = comp.minThicknessCm;
      }
      for (const pt of PORT_TYPES) {
        if ((state.ports[pt.id] ?? 0) > 0 && pt.minThicknessCm > maxHeight)
          maxHeight = pt.minThicknessCm;
      }
      for (const opt of Object.values(state.chassis)) {
        if (opt && opt.minThicknessCm > maxHeight) maxHeight = opt.minThicknessCm;
      }
      return state.thicknessCm >= maxHeight;
    }
    case "review":
      return true;
  }
}

function WizardContent() {
  const { state, dispatch } = useWizard();
  const currentIdx = WIZARD_STEPS.indexOf(state.currentStep);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === WIZARD_STEPS.length - 1;

  const canAdvance = isStepComplete(state.currentStep, state);

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
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
        color: "#e0e0e0",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "8px", flexShrink: 0 }}>Laptop Builder</h1>
      <p style={{ color: "#888", marginBottom: "24px", flexShrink: 0 }}>
        Design your new laptop model for {GAME_YEAR}
      </p>

      <StepIndicator
        currentStep={state.currentStep}
        onStepClick={(step) => dispatch({ type: "GO_TO_STEP", step })}
        canNavigateTo={canNavigateTo}
      />

      <div
        style={{
          background: "#1e1e1e",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "24px",
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
          marginTop: "16px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => dispatch({ type: "PREV_STEP" })}
          disabled={isFirst}
          style={{
            padding: "10px 24px",
            border: "1px solid #555",
            borderRadius: "6px",
            background: isFirst ? "#2a2a2a" : "#333",
            color: isFirst ? "#666" : "#e0e0e0",
            cursor: isFirst ? "default" : "pointer",
            fontFamily: "inherit",
            fontSize: "14px",
          }}
        >
          Back
        </button>
        <button
          onClick={() => {
            if (isLast) {
              // TODO: finalize design
            } else {
              dispatch({ type: "NEXT_STEP" });
            }
          }}
          disabled={!canAdvance}
          style={{
            padding: "10px 24px",
            border: "none",
            borderRadius: "6px",
            background: !canAdvance ? "#2a2a2a" : isLast ? "#4caf50" : "#1976d2",
            color: !canAdvance ? "#666" : "#fff",
            cursor: !canAdvance ? "default" : "pointer",
            fontFamily: "inherit",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          {isLast ? "Finalize Design" : "Next"}
        </button>
      </div>
    </div>
  );
}

export function DesignWizard() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}
