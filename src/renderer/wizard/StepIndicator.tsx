import React from "react";
import { WizardStep, WIZARD_STEPS, WIZARD_STEP_LABELS } from "./types";

interface StepIndicatorProps {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
  canNavigateTo: (step: WizardStep) => boolean;
}

export function StepIndicator({
  currentStep,
  onStepClick,
  canNavigateTo,
}: StepIndicatorProps) {
  const currentIdx = WIZARD_STEPS.indexOf(currentStep);

  return (
    <div style={{ display: "flex", gap: "4px", marginBottom: "24px" }}>
      {WIZARD_STEPS.map((step, idx) => {
        const isActive = step === currentStep;
        const isCompleted = idx < currentIdx;
        const canClick = canNavigateTo(step);

        return (
          <React.Fragment key={step}>
            {idx > 0 && (
              <div
                style={{
                  flex: "0 0 32px",
                  height: "2px",
                  alignSelf: "center",
                  background: isCompleted ? "#4caf50" : "#444",
                }}
              />
            )}
            <button
              onClick={() => canClick && onStepClick(step)}
              disabled={!canClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                border: isActive ? "2px solid #90caf9" : "2px solid transparent",
                borderRadius: "6px",
                background: isActive
                  ? "#1e3a5f"
                  : isCompleted
                    ? "#1b3d1b"
                    : "#2a2a2a",
                color: isActive
                  ? "#90caf9"
                  : isCompleted
                    ? "#4caf50"
                    : "#888",
                cursor: canClick ? "pointer" : "default",
                fontFamily: "inherit",
                fontSize: "14px",
                opacity: canClick ? 1 : 0.5,
              }}
            >
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "bold",
                  background: isActive
                    ? "#90caf9"
                    : isCompleted
                      ? "#4caf50"
                      : "#555",
                  color: isActive || isCompleted ? "#000" : "#ccc",
                }}
              >
                {isCompleted ? "\u2713" : idx + 1}
              </span>
              {WIZARD_STEP_LABELS[step]}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
