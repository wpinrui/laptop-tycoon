import { useWizard } from "../WizardContext";
import {
  GAME_YEAR,
  THICKNESS_MIN_CM,
  THICKNESS_MAX_CM,
  THICKNESS_STEP_CM,
  BEZEL_MIN_MM,
  BEZEL_MAX_MM,
  BEZEL_STEP_MM,
  availableVolumeCm3,
  minThicknessForVolumeCm,
  chassisCost,
  totalConsumedVolumeCm3,
  maxHeightConstraintCm,
  specSummary,
} from "../constants";
import {
  MATERIALS,
  COOLING_SOLUTIONS,
  KEYBOARD_FEATURES,
  TRACKPAD_FEATURES,
} from "../../../data/chassisOptions";
import { ChassisOption, ChassisOptionSlot } from "../../../data/types";
import { getAllChassisOptions } from "../types";
import { Tooltip } from "../Tooltip";
import { STAT_CONFIG } from "../StatBar";

const VOLUME_WARNING_PERCENT = 85;

interface SlotSectionDef {
  slot: ChassisOptionSlot;
  label: string;
  options: ChassisOption[];
}

const CHASSIS_SLOTS: SlotSectionDef[] = [
  { slot: "material", label: "Chassis Material", options: MATERIALS },
  { slot: "coolingSolution", label: "Cooling Solution", options: COOLING_SOLUTIONS },
  { slot: "keyboardFeature", label: "Keyboard", options: KEYBOARD_FEATURES },
  { slot: "trackpadFeature", label: "Trackpad / Pointing Device", options: TRACKPAD_FEATURES },
];

function getAvailableOptions(options: ChassisOption[], year: number): ChassisOption[] {
  return options
    .filter(
      (o) =>
        o.yearIntroduced <= year &&
        (o.yearDiscontinued === null || o.yearDiscontinued >= year),
    )
    .sort((a, b) => a.costAtLaunch - b.costAtLaunch);
}

export function BodyStep() {
  const { state, dispatch } = useWizard();

  const thickness = state.thicknessCm;
  const bezel = state.bezelMm;

  // --- Volume ---
  const allChassisOptions = getAllChassisOptions(state.chassis);
  const totalVolume = totalConsumedVolumeCm3(
    state.components,
    state.batteryCapacityWh,
    state.ports,
    allChassisOptions,
  );
  const totalAvailable = availableVolumeCm3(state.screenSize, bezel, thickness, GAME_YEAR);
  const volumeOverflow = totalVolume > totalAvailable;
  const volumePercent = totalAvailable > 0 ? Math.min(100, (totalVolume / totalAvailable) * 100) : 100;

  // --- Min thickness (from both volume and height constraints) ---
  const minFromVolume = minThicknessForVolumeCm(totalVolume, state.screenSize, bezel, GAME_YEAR);
  const minFromHeight = maxHeightConstraintCm(
    state.components,
    state.ports,
    allChassisOptions,
  );
  const minThickness = Math.max(minFromVolume, minFromHeight);
  const thicknessTooThin = thickness < minThickness;

  return (
    <div>
      <h2>Body / Chassis</h2>
      <p style={{ color: "#aaa", marginTop: "4px", marginBottom: "24px" }}>
        Configure chassis dimensions, material, cooling, keyboard, and trackpad.
      </p>

        {/* Sliders: thickness and bezel */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          {/* Thickness slider */}
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#ccc", marginBottom: "8px" }}>
              Chassis Thickness
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
              <span style={{ color: "#888", fontSize: "0.75rem" }}>{THICKNESS_MIN_CM.toFixed(1)} cm</span>
              <span
                style={{
                  fontSize: "1.75rem",
                  fontWeight: "bold",
                  color: thicknessTooThin ? "#ff9800" : "#90caf9",
                }}
              >
                {thickness.toFixed(1)} cm
              </span>
              <span style={{ color: "#888", fontSize: "0.75rem" }}>{THICKNESS_MAX_CM.toFixed(1)} cm</span>
            </div>
            <input
              type="range"
              min={THICKNESS_MIN_CM}
              max={THICKNESS_MAX_CM}
              step={THICKNESS_STEP_CM}
              value={thickness}
              onChange={(e) =>
                dispatch({ type: "SET_THICKNESS", thicknessCm: Math.round(Number(e.target.value) * 10) / 10 })
              }
              style={{ width: "100%", accentColor: thicknessTooThin ? "#ff9800" : "#90caf9" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "#666", marginTop: "2px" }}>
              <span>Thinner</span>
              <span>Thicker</span>
            </div>
            <div style={{ fontSize: "0.625rem", color: "#666", marginTop: "4px" }}>
              Affects: internal space, cooling efficiency, weight
            </div>
          </div>

          {/* Bezel slider */}
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#ccc", marginBottom: "8px" }}>
              Bezel Width (uniform)
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
              <span style={{ color: "#888", fontSize: "0.75rem" }}>{BEZEL_MIN_MM} mm</span>
              <span style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#90caf9" }}>
                {bezel} mm
              </span>
              <span style={{ color: "#888", fontSize: "0.75rem" }}>{BEZEL_MAX_MM} mm</span>
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
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "#666", marginTop: "2px" }}>
              <span>Sleek</span>
              <span>More internal space</span>
            </div>
            <div style={{ fontSize: "0.625rem", color: "#666", marginTop: "4px" }}>
              Affects: internal space, overall footprint, cooling efficiency
            </div>
          </div>
        </div>

        {/* Volume bar */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#ccc" }}>
              Internal Space Usage
            </span>
            <span style={{ fontSize: "0.75rem", color: volumeOverflow ? "#f44336" : "#888" }}>
              {Math.round(totalVolume)} / {Math.round(totalAvailable)} cm³
            </span>
          </div>
          <div style={{ height: "8px", background: "#2a2a2a", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, volumePercent)}%`,
                background: volumeOverflow ? "#f44336" : volumePercent > VOLUME_WARNING_PERCENT ? "#ff9800" : "#4caf50",
                borderRadius: "4px",
                transition: "width 0.2s, background 0.2s",
              }}
            />
          </div>
        </div>

        {/* Chassis option slots */}
        {CHASSIS_SLOTS.map(({ slot, label, options }) => {
          const available = getAvailableOptions(options, GAME_YEAR);
          const selected = state.chassis[slot];
          return (
            <div key={slot} style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#ccc", marginBottom: "8px" }}>
                {label}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {available.map((option) => (
                  <ChassisCard
                    key={option.id}
                    option={option}
                    isSelected={selected?.id === option.id}
                    onSelect={() => dispatch({ type: "SET_CHASSIS_OPTION", slot, option })}
                  />
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}

function ChassisTooltipContent({ option }: { option: ChassisOption }) {
  const statEntries = Object.entries(option.stats).filter(([, v]) => (v as number) !== 0);

  return (
    <div>
      <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#90caf9" }}>{option.name}</div>
      <div style={{ color: "#ccc", marginBottom: "6px" }}>{option.description}</div>
      {statEntries.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
          {statEntries.map(([stat, value]) => {
            const config = STAT_CONFIG.find((s) => s.stat === stat);
            if (!config) return null;
            const { Icon } = config;
            return (
              <span key={stat} style={{ color: "#90caf9", fontSize: "0.6875rem", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                <Icon size={11} strokeWidth={1.5} /> +{value as number} {config.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChassisCard({
  option,
  isSelected,
  onSelect,
}: {
  option: ChassisOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const cost = chassisCost(option, GAME_YEAR);

  return (
    <Tooltip content={<ChassisTooltipContent option={option} />}>
      <button
        onClick={onSelect}
        style={{
          background: isSelected ? "#1a3a5c" : "#2a2a2a",
          border: isSelected ? "2px solid #90caf9" : "1px solid #444",
          borderRadius: "8px",
          padding: "12px",
          textAlign: "left",
          cursor: "pointer",
          color: "#e0e0e0",
          fontFamily: "inherit",
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        <div
          style={{
            fontSize: "0.8125rem",
            fontWeight: "bold",
            marginBottom: "6px",
            color: isSelected ? "#90caf9" : "#e0e0e0",
          }}
        >
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
          {option.volumeCm3 > 0 && (
            <span style={{ color: "#ce93d8" }}>{option.volumeCm3}cm³</span>
          )}
          {option.coolingCapacityW > 0 && (
            <span style={{ color: "#4fc3f7" }}>{option.coolingCapacityW}W cooling</span>
          )}
        </div>
      </button>
    </Tooltip>
  );
}
