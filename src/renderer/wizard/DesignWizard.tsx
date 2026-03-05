import React from "react";
import { WizardProvider, useWizard } from "./WizardContext";
import { StepIndicator } from "./StepIndicator";
import { WIZARD_STEPS } from "./types";
import { ScreenSizeStep } from "./steps/ScreenSizeStep";
import { ComponentsStep } from "./steps/ComponentsStep";
import { BodyStep } from "./steps/BodyStep";
import { ReviewStep } from "./steps/ReviewStep";

function WizardContent() {
  const { state, dispatch } = useWizard();
  const currentIdx = WIZARD_STEPS.indexOf(state.currentStep);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === WIZARD_STEPS.length - 1;

  function canNavigateTo(step: string) {
    const targetIdx = WIZARD_STEPS.indexOf(step as typeof state.currentStep);
    // Can go back to any completed step, or stay on current
    return targetIdx <= currentIdx;
  }

  const stepContent = (() => {
    switch (state.currentStep) {
      case "screenSize":
        return <ScreenSizeStep />;
      case "components":
        return <ComponentsStep />;
      case "body":
        return <BodyStep />;
      case "review":
        return <ReviewStep />;
    }
  })();

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
        color: "#e0e0e0",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Design Wizard</h1>
      <p style={{ color: "#888", marginBottom: "24px" }}>
        Design your new laptop model
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
          minHeight: "300px",
        }}
      >
        {stepContent}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "16px",
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
          style={{
            padding: "10px 24px",
            border: "none",
            borderRadius: "6px",
            background: isLast ? "#4caf50" : "#1976d2",
            color: "#fff",
            cursor: "pointer",
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
