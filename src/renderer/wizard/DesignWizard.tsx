import { WizardProvider, useWizard } from "./WizardContext";
import { StepIndicator } from "./StepIndicator";
import { WizardStep, WIZARD_STEPS } from "./types";
import { ScreenSizeStep } from "./steps/ScreenSizeStep";
import { ProcessingStep } from "./steps/ProcessingStep";
import { DisplayMediaStep } from "./steps/DisplayMediaStep";
import { ConnectivityPowerStep } from "./steps/ConnectivityPowerStep";
import { BodyStep } from "./steps/BodyStep";
import { ReviewStep } from "./steps/ReviewStep";

function WizardContent() {
  const { state, dispatch } = useWizard();
  const currentIdx = WIZARD_STEPS.indexOf(state.currentStep);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === WIZARD_STEPS.length - 1;

  function canNavigateTo(step: WizardStep) {
    const targetIdx = WIZARD_STEPS.indexOf(step);
    return targetIdx <= currentIdx;
  }

  const stepContent = (() => {
    switch (state.currentStep) {
      case "screenSize":
        return <ScreenSizeStep />;
      case "processing":
        return <ProcessingStep />;
      case "displayMedia":
        return <DisplayMediaStep />;
      case "connectivityPower":
        return <ConnectivityPowerStep />;
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
      <h1 style={{ fontSize: "24px", marginBottom: "8px", flexShrink: 0 }}>Design Wizard</h1>
      <p style={{ color: "#888", marginBottom: "24px", flexShrink: 0 }}>
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
