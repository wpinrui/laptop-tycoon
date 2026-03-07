import { Fragment, useRef, useEffect } from "react";
import { Laptop2, Monitor, Cpu, MonitorSmartphone, Camera, Battery, Laptop, ClipboardCheck, Check, Lock, LucideIcon } from "lucide-react";
import { WizardStep, WIZARD_STEPS, WIZARD_STEP_LABELS } from "./types";
import { tokens } from "../shell/tokens";

const STEP_ICONS: Record<WizardStep, LucideIcon> = {
  metadata: Laptop2,
  screenSize: Monitor,
  processing: Cpu,
  display: MonitorSmartphone,
  mediaConnectivity: Camera,
  battery: Battery,
  body: Laptop,
  review: ClipboardCheck,
};

interface StepIndicatorProps {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
  canNavigateTo: (step: WizardStep) => boolean;
  isStepLocked?: (step: WizardStep) => boolean;
}

export function StepIndicator({
  currentStep,
  onStepClick,
  canNavigateTo,
  isStepLocked,
}: StepIndicatorProps) {
  const currentIdx = WIZARD_STEPS.indexOf(currentStep);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [currentStep]);

  return (
    <div style={{ overflow: "hidden", marginBottom: "24px" }}>
      <div style={{ display: "flex", gap: "4px", whiteSpace: "nowrap" }}>
        {WIZARD_STEPS.map((step, idx) => {
          const locked = isStepLocked?.(step) ?? false;
          const isActive = step === currentStep;
          const isCompleted = idx < currentIdx;
          const canClick = !locked && canNavigateTo(step);

          return (
            <Fragment key={step}>
              {idx > 0 && (
                <div
                  style={{
                    flex: "0 0 16px",
                    height: "2px",
                    alignSelf: "center",
                    background: isCompleted ? "#4caf50" : "#444",
                  }}
                />
              )}
              <button
                ref={isActive ? activeRef : undefined}
                onClick={() => canClick && onStepClick(step)}
                disabled={!canClick}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  border: isActive ? `2px solid ${tokens.colors.interactiveAccent}` : "2px solid transparent",
                  borderRadius: "6px",
                  background: locked
                    ? "#2a2a2a"
                    : isActive
                      ? "#1e3a5f"
                      : isCompleted
                        ? "#1b3d1b"
                        : "#2a2a2a",
                  color: locked
                    ? "#666"
                    : isActive
                      ? tokens.colors.interactiveAccent
                      : isCompleted
                        ? "#4caf50"
                        : "#888",
                  cursor: canClick ? "pointer" : "default",
                  fontFamily: "inherit",
                  fontSize: "0.875rem",
                  opacity: canClick ? 1 : 0.5,
                }}
              >
                {(() => {
                  if (locked) return <Lock size={16} />;
                  if (isCompleted) return <Check size={16} />;
                  const Icon = STEP_ICONS[step];
                  return <Icon size={16} />;
                })()}
                {WIZARD_STEP_LABELS[step]}
              </button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
