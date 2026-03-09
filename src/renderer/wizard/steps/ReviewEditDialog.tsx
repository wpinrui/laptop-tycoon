import { useRef } from "react";
import { useWizard } from "../WizardContext";
import {
  DISPLAY_SLOTS,
  formatWeight,
  totalConsumedVolumeCm3,
  maxHeightConstraintCm,
  applyDisplayMultiplier,
  componentCostDecayed,
  chassisCost,
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
  getAvailableComponents,
  getAvailableChassisOptions,
} from "../../../data/designConstants";
import { getAllChassisOptions } from "../types";
import { getScreenSizeDef, SCREEN_SIZES } from "../../../data/screenSizes";
import { getBatteryEra } from "../../../data/batteryEras";
import { COLOUR_OPTIONS } from "../../../data/colourOptions";
import { ChassisOption, ComponentSlot, ChassisOptionSlot, PortType } from "../../../data/types";
import { StatCard } from "./StatCard";
import { Tooltip } from "../Tooltip";
import { SelectionCard, OptionTooltipContent } from "../SelectionCard";
import { tokens } from "../../shell/tokens";

// ---------- Dialog types ----------
export type DialogTarget =
  | { kind: "screenSize" }
  | { kind: "component"; slot: ComponentSlot; label: string }
  | { kind: "port"; port: PortType }
  | { kind: "battery" }
  | { kind: "thickness" }
  | { kind: "bezel" }
  | { kind: "chassis"; slot: ChassisOptionSlot; label: string; options: ChassisOption[] }
  | { kind: "colours" };

// ---------- Edit Dialog ----------

export function EditDialog({
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
          <span style={{ fontSize: "1rem", fontWeight: "bold", color: tokens.colors.interactiveAccent }}>{title}</span>
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
              border: `1px solid ${tokens.colors.interactiveAccent}`,
              borderRadius: "6px",
              color: tokens.colors.interactiveAccent,
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
        <span style={{ fontSize: "2.5rem", fontWeight: "bold", color: tokens.colors.interactiveAccent }}>{state.screenSize}"</span>
        <span style={{ color: "#888", fontSize: "0.875rem" }}>{MAX_SIZE}"</span>
      </div>
      <input
        type="range"
        min={MIN_SIZE}
        max={MAX_SIZE}
        step={1}
        value={state.screenSize}
        onChange={(e) => handleChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: tokens.colors.interactiveAccent }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        {SCREEN_SIZES.map((s) => (
          <span
            key={s.size}
            style={{
              fontSize: "0.6875rem",
              color: state.screenSize === s.size ? tokens.colors.interactiveAccent : "#666",
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
  const { state, dispatch, gameYear } = useWizard();
  const screenSizeDef = getScreenSizeDef(state.screenSize);
  const multiplier = screenSizeDef.displayMultiplier;
  const available = getAvailableComponents(slot, gameYear);
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
          const cost = applyDisplayMultiplier(componentCostDecayed(component, gameYear), slot, multiplier);
          const power = applyDisplayMultiplier(component.powerDrawW, slot, multiplier);
          const weight = applyDisplayMultiplier(component.weightG, slot, multiplier);
          return (
            <Tooltip key={component.id} content={
              <OptionTooltipContent name={component.name} description={component.description} stats={component.stats} />
            }>
              <SelectionCard
                isSelected={isSelected}
                onClick={() => dispatch({ type: "SET_COMPONENT", slot, component })}
                fullWidth
              >
                <div style={{ fontSize: "0.8125rem", fontWeight: "bold", marginBottom: "6px", color: isSelected ? tokens.colors.interactiveAccent : "#e0e0e0" }}>
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
  const { state, dispatch, gameYear } = useWizard();
  const era = getBatteryEra(gameYear);
  const capacity = state.batteryCapacityWh;
  const cost = Math.round(capacity * era.costPerWh);
  const weight = Math.round(capacity * era.weightPerWh);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
        <span style={{ color: "#888", fontSize: "0.875rem" }}>{MIN_BATTERY_WH} Wh</span>
        <span style={{ fontSize: "2.5rem", fontWeight: "bold", color: tokens.colors.interactiveAccent }}>{capacity} Wh</span>
        <span style={{ color: "#888", fontSize: "0.875rem" }}>{MAX_BATTERY_WH} Wh</span>
      </div>
      <input
        type="range"
        min={MIN_BATTERY_WH}
        max={MAX_BATTERY_WH}
        step={BATTERY_STEP_WH}
        value={capacity}
        onChange={(e) => dispatch({ type: "SET_BATTERY_CAPACITY", capacityWh: Number(e.target.value) })}
        style={{ width: "100%", accentColor: tokens.colors.interactiveAccent }}
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
  const { state, dispatch, gameYear } = useWizard();
  const thickness = state.thicknessCm;

  const allChassisOpts = getAllChassisOptions(state.chassis);
  const totalVolume = totalConsumedVolumeCm3(state.components, state.batteryCapacityWh, state.ports, allChassisOpts, gameYear);
  const minFromVolume = minThicknessForVolumeCm(totalVolume, state.screenSize, state.bezelMm, gameYear);
  const minFromHeight = maxHeightConstraintCm(state.components, state.ports, allChassisOpts);
  const minThickness = Math.max(minFromVolume, minFromHeight);
  const tooThin = thickness < minThickness;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
        <span style={{ color: "#888", fontSize: "0.875rem" }}>{THICKNESS_MIN_CM.toFixed(1)} cm</span>
        <span style={{ fontSize: "2.5rem", fontWeight: "bold", color: tooThin ? "#ff9800" : tokens.colors.interactiveAccent }}>
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
        style={{ width: "100%", accentColor: tooThin ? "#ff9800" : tokens.colors.interactiveAccent }}
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
        <span style={{ fontSize: "2.5rem", fontWeight: "bold", color: tokens.colors.interactiveAccent }}>{bezel} mm</span>
        <span style={{ color: "#888", fontSize: "0.875rem" }}>{BEZEL_MAX_MM} mm</span>
      </div>
      <input
        type="range"
        min={BEZEL_MIN_MM}
        max={BEZEL_MAX_MM}
        step={BEZEL_STEP_MM}
        value={bezel}
        onChange={(e) => dispatch({ type: "SET_BEZEL", bezelMm: Number(e.target.value) })}
        style={{ width: "100%", accentColor: tokens.colors.interactiveAccent }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "#666", marginTop: "4px" }}>
        <span>Sleek</span>
        <span>More internal space</span>
      </div>
    </div>
  );
}

function SingleChassisEditor({ slot, options }: { slot: ChassisOptionSlot; options: ChassisOption[] }) {
  const { state, dispatch, gameYear } = useWizard();
  const available = getAvailableChassisOptions(options, gameYear);
  const selected = state.chassis[slot];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {available.map((option) => {
        const isSelected = selected?.id === option.id;
        const cost = chassisCost(option, gameYear);
        return (
          <Tooltip key={option.id} content={
            <OptionTooltipContent name={option.name} description={option.description} stats={option.stats} />
          }>
            <SelectionCard
              isSelected={isSelected}
              onClick={() => dispatch({ type: "SET_CHASSIS_OPTION", slot, option })}
              fullWidth
            >
              <div style={{ fontSize: "0.8125rem", fontWeight: "bold", marginBottom: "6px", color: isSelected ? tokens.colors.interactiveAccent : "#e0e0e0" }}>
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
                {option.shellDensityMultiplier !== 1.0 && (
                  <span style={{ color: option.shellDensityMultiplier < 1.0 ? "#64b5f6" : "#888" }}>
                    {option.shellDensityMultiplier}x density
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
                  <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: isSelected ? tokens.colors.interactiveAccent : "#e0e0e0" }}>
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
