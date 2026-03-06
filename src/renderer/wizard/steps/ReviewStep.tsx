import { useState, useRef } from "react";
import { useWizard } from "../WizardContext";
import {
  GAME_YEAR,
  DISPLAY_SLOTS,
  formatWeight,
  availableVolumeCm3,
  coolingMultiplier,
  totalConsumedVolumeCm3,
  maxHeightConstraintCm,
  applyDisplayMultiplier,
  chassisCost,
  batteryWarningThresholdH,
  avgUsageMultiplier,
  specSummary,
  MIN_BATTERY_WH,
  MAX_BATTERY_WH,
  BATTERY_STEP_WH,
  THICKNESS_MIN_CM,
  THICKNESS_MAX_CM,
  THICKNESS_STEP_CM,
  BEZEL_MIN_MM,
  BEZEL_MAX_MM,
  BEZEL_STEP_MM,
  minThicknessForVolumeCm,
} from "../constants";
import { getAllChassisOptions, WIZARD_STEP_LABELS, WizardStep } from "../types";
import { getScreenSizeDef, SCREEN_SIZES } from "../../../data/screenSizes";
import { getBatteryEra } from "../../../data/batteryEras";
import { PORT_TYPES } from "../../../data/portTypes";
import { COLOUR_OPTIONS } from "../../../data/colourOptions";
import { ALL_COMPONENTS } from "../../../data/components";
import { ChassisOption, ComponentSlot, ChassisOptionSlot, Component, PortType } from "../../../data/types";
import {
  MATERIALS,
  COOLING_SOLUTIONS,
  KEYBOARD_FEATURES,
  TRACKPAD_FEATURES,
} from "../../../data/chassisOptions";
import { StatCard } from "./StatCard";
import { Tooltip } from "../Tooltip";
import { SelectionCard } from "../SelectionCard";
import { StatContributions } from "../StatBar";
import {
  Monitor,
  Cpu,
  MonitorSmartphone,
  Camera,
  Battery,
  Laptop,
  AlertTriangle,
  DollarSign,
  type LucideIcon,
} from "lucide-react";

const COMPANY_NAME = "Your Company"; // TODO: inject from game state

const COMPONENT_SLOT_LABELS: Record<ComponentSlot, string> = {
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  storage: "Storage",
  resolution: "Resolution",
  displayTech: "Display Technology",
  displaySurface: "Display Surface",
  wifi: "WiFi",
  webcam: "Webcam",
  speakers: "Speakers",
};

const CHASSIS_SLOT_LABELS: Record<string, string> = {
  material: "Chassis Material",
  coolingSolution: "Cooling Solution",
  keyboardFeature: "Keyboard",
  trackpadFeature: "Trackpad",
};

const STEP_ICONS: Partial<Record<WizardStep, LucideIcon>> = {
  screenSize: Monitor,
  processing: Cpu,
  display: MonitorSmartphone,
  mediaConnectivity: Camera,
  battery: Battery,
  body: Laptop,
};

const STEP_ORDER: WizardStep[] = [
  "screenSize",
  "processing",
  "display",
  "mediaConnectivity",
  "battery",
  "body",
];

const STEP_SLOTS: Partial<Record<WizardStep, ComponentSlot[]>> = {
  processing: ["cpu", "gpu", "ram", "storage"],
  display: ["resolution", "displayTech", "displaySurface"],
  mediaConnectivity: ["webcam", "speakers", "wifi"],
};

const CHASSIS_SLOTS: { slot: ChassisOptionSlot; label: string; options: ChassisOption[] }[] = [
  { slot: "material", label: "Chassis Material", options: MATERIALS },
  { slot: "coolingSolution", label: "Cooling Solution", options: COOLING_SOLUTIONS },
  { slot: "keyboardFeature", label: "Keyboard", options: KEYBOARD_FEATURES },
  { slot: "trackpadFeature", label: "Trackpad / Pointing Device", options: TRACKPAD_FEATURES },
];

function getAvailableComponents(slot: ComponentSlot, year: number): Component[] {
  return ALL_COMPONENTS
    .filter((c) => c.slot === slot && c.yearIntroduced <= year && c.yearDiscontinued >= year)
    .sort((a, b) => a.costAtLaunch - b.costAtLaunch);
}

function getAvailableChassisOptions(options: ChassisOption[], year: number): ChassisOption[] {
  return options
    .filter((o) => o.yearIntroduced <= year && (o.yearDiscontinued === null || o.yearDiscontinued >= year))
    .sort((a, b) => a.costAtLaunch - b.costAtLaunch);
}

// ---------- Dialog types ----------
type DialogTarget =
  | { kind: "screenSize" }
  | { kind: "component"; slot: ComponentSlot; label: string }
  | { kind: "port"; port: PortType }
  | { kind: "battery" }
  | { kind: "thickness" }
  | { kind: "bezel" }
  | { kind: "chassis"; slot: ChassisOptionSlot; label: string; options: ChassisOption[] }
  | { kind: "colours" };

export function ReviewStep() {
  const { state, dispatch } = useWizard();
  const [dialogTarget, setDialogTarget] = useState<DialogTarget | null>(null);
  const screenSizeDef = getScreenSizeDef(state.screenSize);
  const era = getBatteryEra(GAME_YEAR);
  const displayMult = screenSizeDef.displayMultiplier;

  const allChassisOptions = getAllChassisOptions(state.chassis);
  const selectedChassisOptions = allChassisOptions.filter(
    (o): o is ChassisOption => o !== null,
  );

  // --- Cost breakdown ---
  let componentCost = 0;
  let componentPower = 0;
  let componentWeight = 0;
  for (const [slot, comp] of Object.entries(state.components)) {
    if (!comp) continue;
    componentCost += applyDisplayMultiplier(comp.costAtLaunch, slot, displayMult);
    componentPower += applyDisplayMultiplier(comp.powerDrawW, slot, displayMult);
    componentWeight += applyDisplayMultiplier(comp.weightG, slot, displayMult);
  }

  let portCost = 0;
  let portWeight = 0;
  for (const pt of PORT_TYPES) {
    const count = state.ports[pt.id] ?? 0;
    portCost += count * pt.costPerPort;
    portWeight += count * pt.weightPerPortG;
  }

  const chassisOptionCost = selectedChassisOptions.reduce((sum, o) => sum + chassisCost(o, GAME_YEAR), 0);
  const chassisOptionWeight = selectedChassisOptions.reduce((sum, o) => sum + o.weightG, 0);

  const batteryCost = Math.round(state.batteryCapacityWh * era.costPerWh);
  const batteryWeight = Math.round(state.batteryCapacityWh * era.weightPerWh);

  const colourCost = state.selectedColours.reduce((sum, id) => {
    const opt = COLOUR_OPTIONS.find((c) => c.id === id);
    return sum + (opt?.costPerUnit ?? 0);
  }, 0);

  const totalCost = componentCost + portCost + chassisOptionCost + batteryCost + colourCost;
  const totalPower = componentPower;
  const totalWeight = screenSizeDef.baseWeightG + componentWeight + portWeight + chassisOptionWeight + batteryWeight;

  // --- Volume & cooling ---
  const totalVolume = totalConsumedVolumeCm3(state.components, state.batteryCapacityWh, state.ports, allChassisOptions);
  const totalAvailable = availableVolumeCm3(state.screenSize, state.bezelMm, state.thicknessCm, GAME_YEAR);
  const spaceUtilization = totalAvailable > 0 ? totalVolume / totalAvailable : 1;
  const spacePercent = Math.round(Math.min(100, spaceUtilization * 100));

  const coolingFromSolution = state.chassis.coolingSolution?.coolingCapacityW ?? 0;
  const coolMult = coolingMultiplier(state.thicknessCm, state.bezelMm, spaceUtilization);
  const effectiveCooling = Math.round(coolingFromSolution * coolMult);
  const thermalWarning = totalPower > effectiveCooling;

  const minFromHeight = maxHeightConstraintCm(state.components, state.ports, allChassisOptions);
  const thicknessTooThin = state.thicknessCm < minFromHeight;

  const avgPower = totalPower * avgUsageMultiplier(GAME_YEAR);
  const estimatedHours = avgPower > 0 ? state.batteryCapacityWh / avgPower : 0;
  const batteryWarning = totalPower > 0 && estimatedHours < batteryWarningThresholdH(GAME_YEAR);

  // --- Active ports ---
  const activePorts = PORT_TYPES.filter((pt) => (state.ports[pt.id] ?? 0) > 0);

  // --- Selected colours ---
  const selectedColours = state.selectedColours
    .map((id) => COLOUR_OPTIONS.find((c) => c.id === id))
    .filter((c) => c != null);

  return (
    <div>
      <h2>Review</h2>
      <p style={{ color: "#aaa", marginTop: "4px", marginBottom: "24px" }}>
        Review your laptop design before finalizing. Click any spec to edit it.
      </p>

      {/* Laptop name header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#90caf9" }}>
          {COMPANY_NAME} {state.name || "Unnamed Laptop"}
        </div>
        <div style={{ fontSize: "0.8125rem", color: "#888", marginTop: "4px" }}>
          {state.screenSize}" &middot; {state.modelType === "brandNew" ? "Brand New" : state.modelType === "successor" ? "Successor" : "Spec Bump"} &middot; {GAME_YEAR}
        </div>
      </div>

      {/* Key stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <StatCard label="Est. Cost / Unit" value={`$${totalCost}`} />
        <StatCard label="Total Weight" value={formatWeight(totalWeight)} />
        <StatCard
          label="Battery Life"
          value={totalPower > 0 ? `~${estimatedHours.toFixed(1)}h` : "N/A"}
          warning={batteryWarning}
        />
        <StatCard
          label="Chassis Space Utilisation"
          value={`${spacePercent}%`}
          warning={spaceUtilization > 1}
        />
      </div>

      {/* Spec breakdown by step — 2-column masonry */}
      <div style={{ columnCount: 2, columnGap: "12px" }}>
      {/* Warnings */}
      {(thermalWarning || batteryWarning || thicknessTooThin || spaceUtilization > 1) && (
        <div
          style={{
            background: "#2a2010",
            border: "1px solid #5a4020",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "12px",
            breakInside: "avoid",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <AlertTriangle size={16} color="#ff9800" />
            <span style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#ff9800" }}>Warnings</span>
          </div>
          {thermalWarning && (
            <WarningRow text={`Thermal issue: components draw ${totalPower}W but cooling only provides ${effectiveCooling}W`} />
          )}
          {batteryWarning && (
            <WarningRow text={`Low battery life: ~${estimatedHours.toFixed(1)}h (${state.batteryCapacityWh}Wh \u00F7 ${avgPower.toFixed(0)}W avg)`} />
          )}
          {thicknessTooThin && (
            <WarningRow text={`Chassis too thin: components need at least ${minFromHeight.toFixed(1)} cm`} />
          )}
          {spaceUtilization > 1 && (
            <WarningRow text={`Over capacity: ${Math.round(totalVolume)} cm\u00B3 used but only ${Math.round(totalAvailable)} cm\u00B3 available`} />
          )}
        </div>
      )}
      {STEP_ORDER.map((step) => {
        const slots = STEP_SLOTS[step];
        if (step === "screenSize") {
          return (
            <ReviewSection key={step} icon={STEP_ICONS[step]} title={WIZARD_STEP_LABELS[step]}>
              <ClickableSpecRow
                label="Screen Size"
                value={`${state.screenSize}"`}
                onClick={() => setDialogTarget({ kind: "screenSize" })}
              />
              <SpecRow label="Display Multiplier" value={`${displayMult.toFixed(2)}x`} />
              <SpecRow label="Base Weight" value={formatWeight(screenSizeDef.baseWeightG)} />
            </ReviewSection>
          );
        }

        if (step === "battery") {
          return (
            <ReviewSection key={step} icon={STEP_ICONS[step]} title={WIZARD_STEP_LABELS[step]}>
              <ClickableSpecRow
                label="Capacity"
                value={`${state.batteryCapacityWh} Wh`}
                onClick={() => setDialogTarget({ kind: "battery" })}
              />
              <SpecRow label="Technology" value={era.techLabel} />
              <SpecRow label="Cost" value={`$${batteryCost}`} />
              <SpecRow label="Weight" value={formatWeight(batteryWeight)} />
            </ReviewSection>
          );
        }

        if (step === "body") {
          return (
            <ReviewSection key={step} icon={STEP_ICONS[step]} title={WIZARD_STEP_LABELS[step]}>
              <ClickableSpecRow
                label="Thickness"
                value={`${state.thicknessCm.toFixed(1)} cm`}
                onClick={() => setDialogTarget({ kind: "thickness" })}
              />
              <ClickableSpecRow
                label="Bezel Width"
                value={`${state.bezelMm} mm`}
                onClick={() => setDialogTarget({ kind: "bezel" })}
              />
              <SpecRow label="Power Draw" value={`${totalPower} W`} />
              <SpecRow label="Effective Cooling" value={`${effectiveCooling} W`} />
              {CHASSIS_SLOTS.map(({ slot, label, options }) => {
                const option = state.chassis[slot];
                return option ? (
                  <ClickableSpecRow
                    key={slot}
                    label={CHASSIS_SLOT_LABELS[slot] ?? slot}
                    value={option.name}
                    detail={specSummary(option.specs)}
                    onClick={() => setDialogTarget({ kind: "chassis", slot, label, options })}
                  />
                ) : (
                  <ClickableSpecRow
                    key={slot}
                    label={CHASSIS_SLOT_LABELS[slot] ?? slot}
                    value="None"
                    onClick={() => setDialogTarget({ kind: "chassis", slot, label, options })}
                  />
                );
              })}
              {selectedColours.length > 0 ? (
                <div
                  style={{ marginTop: "8px", cursor: "pointer", borderRadius: "4px", padding: "2px 0" }}
                  onClick={() => setDialogTarget({ kind: "colours" })}
                  onMouseEnter={(e) => { (e.currentTarget.style.background = "#333"); }}
                  onMouseLeave={(e) => { (e.currentTarget.style.background = ""); }}
                >
                  <span style={{ color: "#888", fontSize: "0.8125rem" }}>Colours: </span>
                  <span style={{ display: "inline-flex", gap: "6px", marginLeft: "4px", verticalAlign: "middle" }}>
                    {selectedColours.map((c) => (
                      <span
                        key={c.id}
                        title={c.name}
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          background: c.hex,
                          border: "1px solid #555",
                          display: "inline-block",
                        }}
                      />
                    ))}
                  </span>
                  <span style={{ color: "#4caf50", fontSize: "0.75rem", marginLeft: "8px" }}>
                    +${colourCost}/unit
                  </span>
                </div>
              ) : (
                <ClickableSpecRow
                  label="Colours"
                  value="None selected"
                  onClick={() => setDialogTarget({ kind: "colours" })}
                />
              )}
            </ReviewSection>
          );
        }

        if (slots) {
          const components = slots
            .map((s) => ({ slot: s, comp: state.components[s] }))
            .filter((c) => c.comp);

          return (
            <ReviewSection key={step} icon={STEP_ICONS[step]} title={WIZARD_STEP_LABELS[step]}>
              {slots.map((slot) => {
                const comp = state.components[slot];
                return (
                  <ClickableSpecRow
                    key={slot}
                    label={COMPONENT_SLOT_LABELS[slot]}
                    value={comp?.name ?? "Not selected"}
                    detail={comp ? specSummary(comp.specs) : undefined}
                    cost={comp ? applyDisplayMultiplier(comp.costAtLaunch, slot, displayMult) : undefined}
                    onClick={() => setDialogTarget({ kind: "component", slot, label: COMPONENT_SLOT_LABELS[slot] })}
                  />
                );
              })}
              {step === "mediaConnectivity" && (
                <>
                  {activePorts.length > 0 && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#888",
                        fontWeight: "bold",
                        marginTop: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      PORTS
                    </div>
                  )}
                  {activePorts.map((pt) => (
                    <ClickableSpecRow
                      key={pt.id}
                      label={pt.name}
                      value={`x${state.ports[pt.id]}`}
                      cost={pt.costPerPort * state.ports[pt.id]}
                      onClick={() => setDialogTarget({ kind: "port", port: pt })}
                    />
                  ))}
                </>
              )}
            </ReviewSection>
          );
        }

        return null;
      })}

      {/* Cost breakdown — inside masonry */}
      <div
        style={{
          background: "#1a2a1a",
          border: "1px solid #2e4a2e",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "12px",
          breakInside: "avoid",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <DollarSign size={16} color="#81c784" />
          <span style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#81c784" }}>Cost Breakdown</span>
        </div>
        <CostRow label="Components" value={componentCost} />
        <CostRow label="Ports" value={portCost} />
        <CostRow label="Battery" value={batteryCost} />
        <CostRow label="Chassis Options" value={chassisOptionCost} />
        {colourCost > 0 && <CostRow label="Colours" value={colourCost} />}
        <div
          style={{
            borderTop: "1px solid #2e4a2e",
            marginTop: "8px",
            paddingTop: "8px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#e0e0e0" }}>
            Estimated Cost / Unit
          </span>
          <span style={{ fontSize: "1rem", fontWeight: "bold", color: "#4caf50" }}>
            ${totalCost}
          </span>
        </div>
      </div>
      </div>

      {/* Edit dialog */}
      {dialogTarget && (
        <EditDialog target={dialogTarget} onClose={() => setDialogTarget(null)} />
      )}
    </div>
  );
}

// ---------- Edit Dialog ----------

function EditDialog({
  target,
  onClose,
}: {
  target: DialogTarget;
  onClose: () => void;
}) {
  const { state, dispatch } = useWizard();
  const title = dialogTitle(target);

  // Snapshot all mutable state so Cancel can revert
  const snapshot = useRef({
    screenSize: state.screenSize,
    batteryCapacityWh: state.batteryCapacityWh,
    thicknessCm: state.thicknessCm,
    bezelMm: state.bezelMm,
    ports: { ...state.ports },
    selectedColours: [...state.selectedColours],
    components: { ...state.components },
    chassis: { ...state.chassis },
  });

  function handleCancel() {
    const s = snapshot.current;
    switch (target.kind) {
      case "screenSize":
        dispatch({ type: "SET_SCREEN_SIZE", size: s.screenSize });
        break;
      case "battery":
        dispatch({ type: "SET_BATTERY_CAPACITY", capacityWh: s.batteryCapacityWh });
        break;
      case "thickness":
        dispatch({ type: "SET_THICKNESS", thicknessCm: s.thicknessCm });
        break;
      case "bezel":
        dispatch({ type: "SET_BEZEL", bezelMm: s.bezelMm });
        break;
      case "port":
        dispatch({ type: "SET_PORT_COUNT", portId: target.port.id, count: s.ports[target.port.id] ?? 0 });
        break;
      case "component": {
        const prev = s.components[target.slot];
        if (prev) dispatch({ type: "SET_COMPONENT", slot: target.slot, component: prev });
        else dispatch({ type: "REMOVE_COMPONENT", slot: target.slot });
        break;
      }
      case "chassis": {
        const prev = s.chassis[target.slot];
        if (prev) dispatch({ type: "SET_CHASSIS_OPTION", slot: target.slot, option: prev });
        break;
      }
      case "colours":
        for (const id of state.selectedColours) {
          if (!s.selectedColours.includes(id)) dispatch({ type: "TOGGLE_COLOUR", colourId: id });
        }
        for (const id of s.selectedColours) {
          if (!state.selectedColours.includes(id)) dispatch({ type: "TOGGLE_COLOUR", colourId: id });
        }
        break;
    }
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 500,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div
        style={{
          background: "#1e1e1e",
          border: "1px solid #444",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "640px",
          width: "90vw",
          maxHeight: "80vh",
          overflow: "auto",
          position: "relative",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <span style={{ fontSize: "1rem", fontWeight: "bold", color: "#90caf9" }}>{title}</span>
        </div>
        <EditDialogContent target={target} />
        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button
            onClick={handleCancel}
            style={{
              background: "none",
              border: "1px solid #555",
              borderRadius: "6px",
              color: "#aaa",
              fontSize: "0.8125rem",
              padding: "6px 16px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#888"; e.currentTarget.style.color = "#ccc"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#aaa"; }}
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            style={{
              background: "#1a3a5c",
              border: "1px solid #90caf9",
              borderRadius: "6px",
              color: "#90caf9",
              fontSize: "0.8125rem",
              padding: "6px 16px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: "bold",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#254a70"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#1a3a5c"; }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function dialogTitle(target: DialogTarget): string {
  switch (target.kind) {
    case "screenSize": return "Screen Size";
    case "component": return target.label;
    case "port": return target.port.name;
    case "battery": return "Battery Capacity";
    case "thickness": return "Chassis Thickness";
    case "bezel": return "Bezel Width";
    case "chassis": return target.label;
    case "colours": return "Colour Range";
  }
}

function EditDialogContent({ target }: { target: DialogTarget }) {
  switch (target.kind) {
    case "screenSize": return <ScreenSizeEditor />;
    case "component": return <SingleComponentEditor slot={target.slot} />;
    case "port": return <SinglePortEditor port={target.port} />;
    case "battery": return <BatteryEditor />;
    case "thickness": return <ThicknessEditor />;
    case "bezel": return <BezelEditor />;
    case "chassis": return <SingleChassisEditor slot={target.slot} options={target.options} />;
    case "colours": return <ColourEditor />;
  }
}

// ---------- Inline Editors ----------

function ScreenSizeEditor() {
  const { state, dispatch } = useWizard();
  const MIN_SIZE = SCREEN_SIZES[0].size;
  const MAX_SIZE = SCREEN_SIZES[SCREEN_SIZES.length - 1].size;

  function handleChange(value: number) {
    const closest = SCREEN_SIZES.reduce((prev, curr) =>
      Math.abs(curr.size - value) < Math.abs(prev.size - value) ? curr : prev
    );
    dispatch({ type: "SET_SCREEN_SIZE", size: closest.size });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
        <span style={{ color: "#888", fontSize: "0.875rem" }}>{MIN_SIZE}"</span>
        <span style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#90caf9" }}>{state.screenSize}"</span>
        <span style={{ color: "#888", fontSize: "0.875rem" }}>{MAX_SIZE}"</span>
      </div>
      <input
        type="range"
        min={MIN_SIZE}
        max={MAX_SIZE}
        step={1}
        value={state.screenSize}
        onChange={(e) => handleChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#90caf9" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        {SCREEN_SIZES.map((s) => (
          <span
            key={s.size}
            style={{
              fontSize: "0.6875rem",
              color: state.screenSize === s.size ? "#90caf9" : "#666",
              fontWeight: state.screenSize === s.size ? "bold" : "normal",
              width: 0,
              textAlign: "center",
              overflow: "visible",
            }}
          >
            {s.size}
          </span>
        ))}
      </div>
    </div>
  );
}

function SingleComponentEditor({ slot }: { slot: ComponentSlot }) {
  const { state, dispatch } = useWizard();
  const screenSizeDef = getScreenSizeDef(state.screenSize);
  const multiplier = screenSizeDef.displayMultiplier;
  const available = getAvailableComponents(slot, GAME_YEAR);
  const selected = state.components[slot] ?? null;
  const isDisplay = DISPLAY_SLOTS.includes(slot);

  return (
    <div>
      {isDisplay && multiplier !== 1.0 && (
        <div style={{ color: "#888", fontSize: "0.75rem", marginBottom: "12px" }}>
          {screenSizeDef.size}" size: {multiplier}x cost/power/weight multiplier
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {available.map((component) => {
          const isSelected = selected?.id === component.id;
          const cost = applyDisplayMultiplier(component.costAtLaunch, slot, multiplier);
          const power = applyDisplayMultiplier(component.powerDrawW, slot, multiplier);
          const weight = applyDisplayMultiplier(component.weightG, slot, multiplier);
          return (
            <Tooltip key={component.id} content={
              <div>
                <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#90caf9" }}>{component.name}</div>
                <div style={{ color: "#ccc", marginBottom: "6px" }}>{component.description}</div>
                <StatContributions stats={component.stats as Record<string, number>} />
              </div>
            }>
              <SelectionCard
                isSelected={isSelected}
                onClick={() => dispatch({ type: "SET_COMPONENT", slot, component })}
                fullWidth
              >
                <div style={{ fontSize: "0.8125rem", fontWeight: "bold", marginBottom: "6px", color: isSelected ? "#90caf9" : "#e0e0e0" }}>
                  {component.name}
                </div>
                <div style={{ fontSize: "0.6875rem", color: "#888", marginBottom: "8px", lineHeight: "1.4" }}>
                  {specSummary(component.specs)}
                </div>
                <div style={{ display: "flex", gap: "12px", fontSize: "0.6875rem" }}>
                  <span style={{ color: "#4caf50" }}>${cost}</span>
                  {power > 0 && <span style={{ color: "#ff9800" }}>{power}W</span>}
                  {weight > 0 && <span style={{ color: "#888" }}>{weight}g</span>}
                </div>
              </SelectionCard>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

function SinglePortEditor({ port }: { port: PortType }) {
  const { state, dispatch } = useWizard();
  const count = state.ports[port.id] ?? 0;

  return (
    <div>
      <div style={{ color: "#ccc", fontSize: "0.8125rem", marginBottom: "12px" }}>
        {port.description}
      </div>
      <div style={{ color: "#888", fontSize: "0.75rem", marginBottom: "16px" }}>
        ${port.costPerPort}/ea · {port.weightPerPortG}g · {port.volumePerPortCm3}cm³
        {port.minThicknessCm > 0 && ` · min ${port.minThicknessCm}cm thick`}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={() => dispatch({ type: "SET_PORT_COUNT", portId: port.id, count: Math.max(0, count - 1) })}
          disabled={count <= 0}
          style={{
            width: "36px", height: "36px",
            border: "1px solid #555", borderRadius: "6px",
            background: count <= 0 ? "#1a1a1a" : "#333",
            color: count <= 0 ? "#555" : "#e0e0e0",
            cursor: count <= 0 ? "default" : "pointer",
            fontFamily: "inherit", fontSize: "1.25rem", lineHeight: "1",
          }}
        >&#8722;</button>
        <span style={{ fontWeight: "bold", fontSize: "1.5rem", minWidth: "24px", textAlign: "center", color: "#e0e0e0" }}>
          {count}
        </span>
        <button
          onClick={() => dispatch({ type: "SET_PORT_COUNT", portId: port.id, count: Math.min(port.maxCount, count + 1) })}
          disabled={count >= port.maxCount}
          style={{
            width: "36px", height: "36px",
            border: "1px solid #555", borderRadius: "6px",
            background: count >= port.maxCount ? "#1a1a1a" : "#333",
            color: count >= port.maxCount ? "#555" : "#e0e0e0",
            cursor: count >= port.maxCount ? "default" : "pointer",
            fontFamily: "inherit", fontSize: "1.25rem", lineHeight: "1",
          }}
        >+</button>
        <span style={{ color: "#666", fontSize: "0.8125rem" }}>max {port.maxCount}</span>
      </div>
    </div>
  );
}

function BatteryEditor() {
  const { state, dispatch } = useWizard();
  const era = getBatteryEra(GAME_YEAR);
  const capacity = state.batteryCapacityWh;
  const cost = Math.round(capacity * era.costPerWh);
  const weight = Math.round(capacity * era.weightPerWh);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
        <span style={{ color: "#888", fontSize: "0.875rem" }}>{MIN_BATTERY_WH} Wh</span>
        <span style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#90caf9" }}>{capacity} Wh</span>
        <span style={{ color: "#888", fontSize: "0.875rem" }}>{MAX_BATTERY_WH} Wh</span>
      </div>
      <input
        type="range"
        min={MIN_BATTERY_WH}
        max={MAX_BATTERY_WH}
        step={BATTERY_STEP_WH}
        value={capacity}
        onChange={(e) => dispatch({ type: "SET_BATTERY_CAPACITY", capacityWh: Number(e.target.value) })}
        style={{ width: "100%", accentColor: "#90caf9" }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "16px" }}>
        <StatCard label="Cost" value={`$${cost}`} />
        <StatCard label="Weight" value={formatWeight(weight)} />
        <StatCard label="Technology" value={era.techLabel} />
      </div>
    </div>
  );
}

function ThicknessEditor() {
  const { state, dispatch } = useWizard();
  const thickness = state.thicknessCm;

  const allChassisOpts = getAllChassisOptions(state.chassis);
  const totalVolume = totalConsumedVolumeCm3(state.components, state.batteryCapacityWh, state.ports, allChassisOpts);
  const minFromVolume = minThicknessForVolumeCm(totalVolume, state.screenSize, state.bezelMm, GAME_YEAR);
  const minFromHeight = maxHeightConstraintCm(state.components, state.ports, allChassisOpts);
  const minThickness = Math.max(minFromVolume, minFromHeight);
  const tooThin = thickness < minThickness;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
        <span style={{ color: "#888", fontSize: "0.875rem" }}>{THICKNESS_MIN_CM.toFixed(1)} cm</span>
        <span style={{ fontSize: "2.5rem", fontWeight: "bold", color: tooThin ? "#ff9800" : "#90caf9" }}>
          {thickness.toFixed(1)} cm
        </span>
        <span style={{ color: "#888", fontSize: "0.875rem" }}>{THICKNESS_MAX_CM.toFixed(1)} cm</span>
      </div>
      <input
        type="range"
        min={THICKNESS_MIN_CM}
        max={THICKNESS_MAX_CM}
        step={THICKNESS_STEP_CM}
        value={thickness}
        onChange={(e) => dispatch({ type: "SET_THICKNESS", thicknessCm: Math.round(Number(e.target.value) * 10) / 10 })}
        style={{ width: "100%", accentColor: tooThin ? "#ff9800" : "#90caf9" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "#666", marginTop: "4px" }}>
        <span>Thinner</span>
        <span>Thicker</span>
      </div>
      {tooThin && (
        <div style={{ fontSize: "0.75rem", color: "#ff9800", marginTop: "8px" }}>
          Components need at least {minThickness.toFixed(1)} cm
        </div>
      )}
    </div>
  );
}

function BezelEditor() {
  const { state, dispatch } = useWizard();
  const bezel = state.bezelMm;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
        <span style={{ color: "#888", fontSize: "0.875rem" }}>{BEZEL_MIN_MM} mm</span>
        <span style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#90caf9" }}>{bezel} mm</span>
        <span style={{ color: "#888", fontSize: "0.875rem" }}>{BEZEL_MAX_MM} mm</span>
      </div>
      <input
        type="range"
        min={BEZEL_MIN_MM}
        max={BEZEL_MAX_MM}
        step={BEZEL_STEP_MM}
        value={bezel}
        onChange={(e) => dispatch({ type: "SET_BEZEL", bezelMm: Number(e.target.value) })}
        style={{ width: "100%", accentColor: "#90caf9" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "#666", marginTop: "4px" }}>
        <span>Sleek</span>
        <span>More internal space</span>
      </div>
    </div>
  );
}

function SingleChassisEditor({ slot, options }: { slot: ChassisOptionSlot; options: ChassisOption[] }) {
  const { state, dispatch } = useWizard();
  const available = getAvailableChassisOptions(options, GAME_YEAR);
  const selected = state.chassis[slot];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {available.map((option) => {
        const isSelected = selected?.id === option.id;
        const cost = chassisCost(option, GAME_YEAR);
        return (
          <Tooltip key={option.id} content={
            <div>
              <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#90caf9" }}>{option.name}</div>
              <div style={{ color: "#ccc", marginBottom: "6px" }}>{option.description}</div>
              <StatContributions stats={option.stats as Record<string, number>} />
            </div>
          }>
            <SelectionCard
              isSelected={isSelected}
              onClick={() => dispatch({ type: "SET_CHASSIS_OPTION", slot, option })}
              fullWidth
            >
              <div style={{ fontSize: "0.8125rem", fontWeight: "bold", marginBottom: "6px", color: isSelected ? "#90caf9" : "#e0e0e0" }}>
                {option.name}
              </div>
              <div style={{ fontSize: "0.6875rem", color: "#888", marginBottom: "8px", lineHeight: "1.4" }}>
                {specSummary(option.specs)}
              </div>
              <div style={{ display: "flex", gap: "12px", fontSize: "0.6875rem", flexWrap: "wrap" }}>
                <span style={{ color: "#4caf50" }}>${cost}</span>
                {option.weightG !== 0 && (
                  <span style={{ color: option.weightG < 0 ? "#64b5f6" : "#888" }}>
                    {option.weightG > 0 ? "+" : ""}{option.weightG}g
                  </span>
                )}
                {option.volumeCm3 > 0 && <span style={{ color: "#ce93d8" }}>{option.volumeCm3}cm³</span>}
                {option.coolingCapacityW > 0 && <span style={{ color: "#4fc3f7" }}>{option.coolingCapacityW}W cooling</span>}
              </div>
            </SelectionCard>
          </Tooltip>
        );
      })}
    </div>
  );
}

function ColourEditor() {
  const { state, dispatch } = useWizard();

  return (
    <div>
      <div style={{ fontSize: "0.8125rem", color: "#888", marginBottom: "12px" }}>
        {state.selectedColours.length} selected — more colours boost design appeal
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {COLOUR_OPTIONS.map((colour) => {
          const isSelected = state.selectedColours.includes(colour.id);
          return (
            <SelectionCard
              key={colour.id}
              isSelected={isSelected}
              onClick={() => dispatch({ type: "TOGGLE_COLOUR", colourId: colour.id })}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%",
                  background: colour.hex, border: "1px solid #555", flexShrink: 0,
                }} />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: isSelected ? "#90caf9" : "#e0e0e0" }}>
                    {colour.name}
                  </div>
                  <div style={{ fontSize: "0.625rem", color: "#888" }}>+${colour.costPerUnit}/unit</div>
                </div>
              </div>
            </SelectionCard>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Shared sub-components ----------

function ReviewSection({
  icon: Icon,
  title,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#252525",
        border: "1px solid #383838",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "12px",
        breakInside: "avoid",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        {Icon && <Icon size={16} color="#888" />}
        <span style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#ccc" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function ClickableSpecRow({
  label,
  value,
  detail,
  cost,
  onClick,
}: {
  label: string;
  value: string;
  detail?: string;
  cost?: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "4px 4px",
        margin: "0 -4px",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#333"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
    >
      <span style={{ color: "#888", fontSize: "0.8125rem", flexShrink: 0 }}>{label}</span>
      <div style={{ textAlign: "right", marginLeft: "12px" }}>
        <span style={{ color: "#e0e0e0", fontSize: "0.8125rem", fontWeight: "bold" }}>{value}</span>
        {cost !== undefined && (
          <span style={{ color: "#4caf50", fontSize: "0.75rem", marginLeft: "8px" }}>${cost}</span>
        )}
        {detail && (
          <div style={{ color: "#666", fontSize: "0.6875rem", marginTop: "2px" }}>{detail}</div>
        )}
      </div>
    </div>
  );
}

function SpecRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "4px 0",
      }}
    >
      <span style={{ color: "#888", fontSize: "0.8125rem", flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#e0e0e0", fontSize: "0.8125rem", fontWeight: "bold", marginLeft: "12px" }}>{value}</span>
    </div>
  );
}

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "3px 0",
      }}
    >
      <span style={{ color: "#aaa", fontSize: "0.8125rem" }}>{label}</span>
      <span style={{ color: "#e0e0e0", fontSize: "0.8125rem" }}>${value}</span>
    </div>
  );
}

function WarningRow({ text }: { text: string }) {
  return (
    <div style={{ fontSize: "0.8125rem", color: "#ffcc80", padding: "2px 0" }}>
      &bull; {text}
    </div>
  );
}
