import React, { useEffect, useState } from "react";
import { useWizard, isStepLockedBySpecBump } from "./WizardContext";
import { StepIndicator } from "./StepIndicator";
import { WizardStep, WizardState, WIZARD_STEPS, COMPONENT_STEP_SLOTS, getAllChassisOptions } from "./types";
import {
  availableVolumeCm3,
  totalConsumedVolumeCm3,
  maxHeightConstraintCm,
  computeLaptopTotals,
  componentCostDecayed,
  applyDisplayMultiplier,
  chassisCost,
} from "../../data/designConstants";
import { SCREEN_SIZES } from "../../data/screenSizes";
import { computeRawStatTotals } from "../../simulation/statCalculation";
import { getTheoreticalMaxima } from "../../simulation/theoreticalMax";
import { ComponentSlot, LaptopStat, Demographic, ScreenSizeInches } from "../../data/types";
import { useGame } from "../state/GameContext";
import { useNavigation } from "../navigation/NavigationContext";
import { LaptopDesign } from "../state/gameTypes";
import { MenuButton } from "../shell/MenuButton";
import { tokens, wizardShellStyle } from "../shell/tokens";
import { ConfirmDiscardDialog } from "../shell/ConfirmDiscardDialog";
import { MetadataStep } from "./steps/MetadataStep";
import { ScreenSizeStep } from "./steps/ScreenSizeStep";
import { ProcessingStep } from "./steps/ProcessingStep";
import { DisplayStep } from "./steps/DisplayStep";
import { MediaConnectivityStep } from "./steps/MediaConnectivityStep";
import { BatteryStep } from "./steps/BatteryStep";
import { BodyStep } from "./steps/BodyStep";
import { ReviewStep } from "./steps/ReviewStep";
import { WizardSidebar } from "./LaptopEstimateSidebar";
import { StatusBar } from "../shell/StatusBar";
import { DEMOGRAPHICS } from "../../data/demographics";
import { optimiseForDemographic } from "./optimiser";
import { overlayStyle } from "../shell/tokens";
import { ContentPanel } from "../shell/ContentPanel";
import { getDemandPoolSize } from "../../simulation/demographicData";
import { STARTING_DEMAND_POOL } from "../../data/startingDemand";


function DemographicPickerDialog({ onPick, onCancel, year }: { onPick: (d: Demographic) => void; onCancel: () => void; year: number }) {
  return (
    <div
      style={overlayStyle}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <ContentPanel maxWidth={420}>
        <h2 style={{ margin: 0, fontSize: tokens.font.sizeTitle, fontWeight: 700, textAlign: "center" }}>
          Optimise for Demographic
        </h2>
        <p style={{ margin: 0, marginTop: tokens.spacing.xs, fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, textAlign: "center", marginBottom: tokens.spacing.md }}>
          Pick a demographic to optimise weighted stats per unit cost
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.xs }}>
          {DEMOGRAPHICS.map((d) => (
            <button
              key={d.id}
              onClick={() => onPick(d)}
              style={{
                background: tokens.colors.surface,
                border: `1px solid ${tokens.colors.panelBorder}`,
                borderRadius: tokens.borderRadius.sm,
                color: tokens.colors.text,
                fontSize: tokens.font.sizeBase,
                padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = tokens.colors.accent;
                e.currentTarget.style.background = tokens.colors.background;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = tokens.colors.panelBorder;
                e.currentTarget.style.background = tokens.colors.surface;
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>{d.name}</span>
                <span style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
                  {getDemandPoolSize(d.id, year, STARTING_DEMAND_POOL[d.id]).toLocaleString()} buyers
                </span>
              </div>
              <div style={{ fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted, marginTop: 2 }}>
                {d.description}
              </div>
            </button>
          ))}
        </div>
      </ContentPanel>
    </div>
  );
}


function isStepComplete(step: WizardStep, state: WizardState, year: number): boolean {
  if (isStepLockedBySpecBump(step, state)) return true;
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
      const available = availableVolumeCm3(state.screenSize, state.bezelMm, state.thicknessCm, year);
      if (totalVol > available) return false;

      // Height constraint check
      const minHeight = maxHeightConstraintCm(state.components, state.ports, chassisOptions);
      return state.thicknessCm >= minHeight;
    }
    case "review":
      return true;
  }
}

function wizardStateToDesign(state: WizardState, year: number): LaptopDesign {
  const totals = computeLaptopTotals(
    state.components,
    state.ports,
    state.chassis,
    state.batteryCapacityWh,
    state.selectedColours,
    state.screenSize,
    state.bezelMm,
    state.thicknessCm,
    year,
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


const toolbarBtnStyle: React.CSSProperties = {
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
};

function ToolbarButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={toolbarBtnStyle}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = tokens.colors.accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = tokens.colors.panelBorder; }}
    >
      {children}
    </button>
  );
}

const SLOT_LABELS: Record<string, string> = {
  cpu: "CPU", gpu: "GPU", ram: "RAM", storage: "Storage",
  resolution: "Resolution", displayTech: "Display Tech", displaySurface: "Display Surface",
  wifi: "WiFi", webcam: "Webcam", speakers: "Speakers",
};
const CHASSIS_LABELS: Record<string, string> = {
  material: "Material", coolingSolution: "Cooling", keyboardFeature: "Keyboard", trackpadFeature: "Trackpad",
};
const STAT_LABELS: Record<string, string> = {
  performance: "Performance", gamingPerformance: "Gaming", display: "Display",
  connectivity: "Connectivity", webcam: "Webcam", wifi: "WiFi",
  speakers: "Speakers", keyboard: "Keyboard", trackpad: "Trackpad",
  design: "Design", buildQuality: "Build Quality", thinness: "Thinness",
  weight: "Weight", thermals: "Thermals", batteryLife: "Battery Life",
};

function buildCopyTextForBuild(
  name: string,
  components: Partial<Record<ComponentSlot, import("../../data/types").Component>>,
  chassis: WizardState["chassis"],
  screenSize: ScreenSizeInches,
  batteryCapacityWh: number,
  thicknessCm: number,
  bezelMm: number,
  selectedColours: string[],
  ports: Record<string, number>,
  year: number,
): string {
  const lines: string[] = [];
  lines.push(`## ${name}`);
  lines.push(`Year: ${year}`);
  lines.push(`Screen: ${screenSize}"`);
  lines.push("");

  const screenDef = SCREEN_SIZES.find(s => s.size === screenSize);
  const displayMult = screenDef?.displayMultiplier ?? 1;

  lines.push("### Components");
  for (const [slot, comp] of Object.entries(components)) {
    if (!comp) continue;
    const cost = Math.round(applyDisplayMultiplier(componentCostDecayed(comp, year), slot, displayMult));
    lines.push(`- ${SLOT_LABELS[slot] ?? slot}: ${comp.name} ($${cost})`);
  }

  lines.push("");
  lines.push("### Chassis");
  for (const [slot, opt] of Object.entries(chassis)) {
    if (!opt) continue;
    const cost = Math.round(chassisCost(opt, year));
    lines.push(`- ${CHASSIS_LABELS[slot] ?? slot}: ${opt.name} ($${cost})`);
  }

  lines.push("");
  lines.push(`Battery: ${batteryCapacityWh} Wh`);
  lines.push(`Thickness: ${thicknessCm} cm`);

  const totals = computeLaptopTotals(
    components, ports, chassis,
    batteryCapacityWh, selectedColours,
    screenSize, bezelMm, thicknessCm, year,
  );
  lines.push(`Total cost: $${Math.round(totals.totalCost)}`);

  const stats = computeRawStatTotals({
    screenSize, components, ports,
    chassis, batteryCapacityWh,
    thicknessCm, bezelMm,
    selectedColours, gameYear: year,
  });
  const maxima = getTheoreticalMaxima(year);

  lines.push("");
  lines.push("### Normalised Stats");
  for (const [stat, raw] of Object.entries(stats)) {
    const max = maxima[stat as LaptopStat] ?? 1;
    const norm = max > 0 ? (raw as number) / max : 0;
    const label = STAT_LABELS[stat] ?? stat;
    lines.push(`- ${label}: ${norm.toFixed(3)} (raw: ${(raw as number).toFixed(1)}, max: ${max.toFixed(1)})`);
  }

  return lines.join("\n");
}

function buildCopyText(state: WizardState, year: number): string {
  return buildCopyTextForBuild(
    state.name, state.components, state.chassis, state.screenSize,
    state.batteryCapacityWh, state.thicknessCm, state.bezelMm,
    state.selectedColours, state.ports, year,
  );
}

function buildAllDemographicsCopyText(year: number): string {
  const sections: string[] = [`# Optimiser Results (Year ${year})`, ""];
  for (const demo of DEMOGRAPHICS) {
    const result = optimiseForDemographic(demo, year);
    sections.push(buildCopyTextForBuild(
      `Optimised (${demo.name})`,
      result.components, result.chassis, result.screenSize,
      result.batteryCapacityWh, result.thicknessCm, result.bezelMm,
      result.selectedColours, {}, year,
    ));
    sections.push("");
    sections.push("---");
    sections.push("");
  }
  return sections.join("\n");
}

function WizardContent() {
  const { state, dispatch } = useWizard();
  const { state: gameState, dispatch: gameDispatch } = useGame();
  const { navigateTo } = useNavigation();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showOptimisePicker, setShowOptimisePicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const currentIdx = WIZARD_STEPS.indexOf(state.currentStep);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === WIZARD_STEPS.length - 1;

  const allStepsComplete = WIZARD_STEPS.every((s) => isStepComplete(s, state, gameState.year));

  const canAdvance = isStepComplete(state.currentStep, state, gameState.year)
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
      if (!isStepComplete(WIZARD_STEPS[i], state, gameState.year)) return false;
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
          <h1 style={{ fontSize: tokens.font.sizeTitle, marginBottom: tokens.spacing.sm }}>Laptop Builder</h1>
          <p style={{ color: tokens.colors.textMuted, marginBottom: tokens.spacing.lg }}>
            {state.editingModelId ? `Editing ${state.name}` : `Design your new laptop model for ${gameState.year}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: tokens.spacing.sm, flexShrink: 0 }}>
        <ToolbarButton onClick={() => dispatch({ type: "DEBUG_AUTOFILL", year: gameState.year })}>Auto-fill</ToolbarButton>
        <ToolbarButton onClick={() => setShowOptimisePicker(true)}>Optimise</ToolbarButton>
        <ToolbarButton onClick={() => {
          navigator.clipboard.writeText(buildCopyText(state, gameState.year));
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}>{copied ? "Copied!" : "Copy Build"}</ToolbarButton>
        <ToolbarButton onClick={() => {
          navigator.clipboard.writeText(buildAllDemographicsCopyText(gameState.year));
          setCopiedAll(true);
          setTimeout(() => setCopiedAll(false), 1500);
        }}>{copiedAll ? "Copied!" : "Copy All Demographics"}</ToolbarButton>
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
        isStepLocked={(step) => isStepLockedBySpecBump(step, state)}
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
              const design = wizardStateToDesign(state, gameState.year);
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
                    manufacturingPlan: null,
                    unitsInStock: 0,
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
        <ConfirmDiscardDialog
          title="Discard Design?"
          message="All unsaved progress on this laptop design will be lost."
          onConfirm={() => {
            dispatch({ type: "RESET" });
            navigateTo(state.editingModelId ? "modelManagement" : "dashboard");
          }}
          onCancel={() => setShowCloseConfirm(false)}
        />
      )}
      {showOptimisePicker && (
        <DemographicPickerDialog
          year={gameState.year}
          onPick={(d) => {
            dispatch({ type: "DEBUG_OPTIMISE", demographic: d, year: gameState.year });
            setShowOptimisePicker(false);
          }}
          onCancel={() => setShowOptimisePicker(false)}
        />
      )}
      <StatusBar variant="fixed" />
    </div>
  );
}

export function DesignWizard() {
  return (
    <div style={wizardShellStyle}>
      <WizardContent />
    </div>
  );
}
