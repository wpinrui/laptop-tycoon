import { Fragment, useRef, useEffect } from "react";
import { Megaphone, Factory, Newspaper, ClipboardCheck, Check, LucideIcon } from "lucide-react";
import { ManufacturingWizardStep, MFG_WIZARD_STEPS, MFG_STEP_LABELS } from "./types";
import { tokens } from "../shell/tokens";

const STEP_ICONS: Record<ManufacturingWizardStep, LucideIcon> = {
  marketing: Megaphone,
  manufacturing: Factory,
  pressRelease: Newspaper,
  confirmation: ClipboardCheck,
};

interface MfgStepIndicatorProps {
  currentStep: ManufacturingWizardStep;
  onStepClick: (step: ManufacturingWizardStep) => void;
  canNavigateTo: (step: ManufacturingWizardStep) => boolean;
}

export function MfgStepIndicator({
  currentStep,
  onStepClick,
  canNavigateTo,
}: MfgStepIndicatorProps) {
  const currentIdx = MFG_WIZARD_STEPS.indexOf(currentStep);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [currentStep]);

  return (
    <div style={{ overflow: "hidden", marginBottom: `${tokens.spacing.lg}px` }}>
      <div style={{ display: "flex", gap: `${tokens.spacing.xs}px`, whiteSpace: "nowrap" }}>
        {MFG_WIZARD_STEPS.map((step, idx) => {
          const isActive = step === currentStep;
          const isCompleted = idx < currentIdx;
          const canClick = canNavigateTo(step);

          return (
            <Fragment key={step}>
              {idx > 0 && (
                <div
                  style={{
                    flex: "0 0 16px",
                    height: "2px",
                    alignSelf: "center",
                    background: isCompleted ? tokens.colors.success : tokens.colors.cardBorder,
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
                  gap: `${tokens.spacing.sm}px`,
                  padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
                  border: isActive ? `2px solid ${tokens.colors.interactiveAccent}` : "2px solid transparent",
                  borderRadius: `${tokens.borderRadius.sm}px`,
                  background: isActive
                    ? tokens.colors.interactiveAccentBg
                    : isCompleted
                      ? tokens.colors.interactiveCompletedBg
                      : tokens.colors.cardBg,
                  color: isActive
                    ? tokens.colors.interactiveAccent
                    : isCompleted
                      ? tokens.colors.success
                      : tokens.colors.textMuted,
                  cursor: canClick ? "pointer" : "default",
                  fontFamily: "inherit",
                  fontSize: tokens.font.sizeBase,
                  opacity: canClick ? 1 : 0.5,
                }}
              >
                {(() => {
                  if (isCompleted) return <Check size={16} />;
                  const Icon = STEP_ICONS[step];
                  return <Icon size={16} />;
                })()}
                {MFG_STEP_LABELS[step]}
              </button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
