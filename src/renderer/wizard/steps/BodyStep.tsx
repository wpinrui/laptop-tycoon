import { useWizard } from "../WizardContext";
import {
  GAME_YEAR,
  formatWeight,
  THICKNESS_MIN_CM,
  THICKNESS_MAX_CM,
  THICKNESS_STEP_CM,
  minThicknessCm,
  coolingMultiplier,
} from "../constants";
import { getScreenSizeDef } from "../../../data/screenSizes";
import { getBatteryEra } from "../../../data/batteryEras";
import { MATERIALS, KEYBOARD_FEATURES, TRACKPAD_FEATURES } from "../../../data/chassisOptions";
import { ChassisOption, ChassisOptionSlot, ComponentSlot } from "../../../data/types";

const DISPLAY_SLOTS: ComponentSlot[] = ["resolution", "displayTech", "displaySurface"];

interface SlotSectionDef {
  slot: ChassisOptionSlot;
  label: string;
  options: ChassisOption[];
}

const CHASSIS_SLOTS: SlotSectionDef[] = [
  { slot: "material", label: "Chassis Material", options: MATERIALS },
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

function chassisCost(option: ChassisOption, year: number): number {
  const age = year - option.yearIntroduced;
  return Math.round(option.costAtLaunch * Math.pow(1 - option.costDecayRate, age));
}

function specSummary(option: ChassisOption): string {
  return Object.entries(option.specs)
    .map(([key, value]) => `${formatSpecKey(key)}: ${value}`)
    .join(" · ");
}

function formatSpecKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function totalComponentPowerDraw(
  components: Record<string, { powerDrawW: number } | undefined>,
  displayMultiplier: number,
): number {
  return Object.entries(components).reduce((sum, [slot, comp]) => {
    if (!comp) return sum;
    const power = DISPLAY_SLOTS.includes(slot as ComponentSlot)
      ? Math.round(comp.powerDrawW * displayMultiplier)
      : comp.powerDrawW;
    return sum + power;
  }, 0);
}

export function BodyStep() {
  const { state, dispatch } = useWizard();
  const screenSizeDef = getScreenSizeDef(state.screenSize);
  const era = getBatteryEra(GAME_YEAR);

  // --- Thickness ---
  const thickness = state.thicknessCm;
  const minThickness = minThicknessCm(state.batteryCapacityWh, state.screenSize);
  const thicknessTooThin = thickness < minThickness;

  // --- Cooling (adjusted by thickness) ---
  const baseCooling = screenSizeDef.baseCoolingCapacityW;
  const effectiveCooling = Math.round(baseCooling * coolingMultiplier(thickness));

  // --- Running totals for chassis selections ---
  const selectedOptions = [
    state.chassis.material,
    state.chassis.keyboardFeature,
    state.chassis.trackpadFeature,
  ].filter((o): o is ChassisOption => o !== null);

  const totalCost = selectedOptions.reduce((sum, o) => sum + chassisCost(o, GAME_YEAR), 0);
  const totalChassisWeight = selectedOptions.reduce((sum, o) => sum + o.weightG, 0);

  // --- Thermal warning ---
  const totalPower = totalComponentPowerDraw(
    state.components as Record<string, { powerDrawW: number } | undefined>,
    screenSizeDef.displayMultiplier,
  );
  const thermalWarning = totalPower > effectiveCooling;

  // --- Battery life ---
  const batteryWeight = Math.round(state.batteryCapacityWh * era.weightPerWh);
  const componentWeight = Object.entries(state.components).reduce((sum, [slot, comp]) => {
    if (!comp) return sum;
    const w = DISPLAY_SLOTS.includes(slot as ComponentSlot)
      ? Math.round(comp.weightG * screenSizeDef.displayMultiplier)
      : comp.weightG;
    return sum + w;
  }, 0);
  const estimatedTotalWeight =
    screenSizeDef.baseWeightG + componentWeight + batteryWeight + totalChassisWeight;
  const estimatedHours = totalPower > 0 ? state.batteryCapacityWh / totalPower : 0;
  const batteryWarning = totalPower > 0 && estimatedHours < 3;

  return (
    <div style={{ display: "flex", gap: "24px", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <h2>Body / Chassis</h2>
        <p style={{ color: "#aaa", marginTop: "4px", marginBottom: "24px" }}>
          Set chassis thickness, choose material, keyboard, and trackpad.
        </p>

        {/* Thickness slider */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: "#ccc",
              marginBottom: "8px",
            }}
          >
            Chassis Thickness
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "8px",
            }}
          >
            <span style={{ color: "#888", fontSize: "13px" }}>{THICKNESS_MIN_CM.toFixed(1)} cm</span>
            <span
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: thicknessTooThin ? "#ff9800" : "#90caf9",
              }}
            >
              {thickness.toFixed(1)} cm
            </span>
            <span style={{ color: "#888", fontSize: "13px" }}>{THICKNESS_MAX_CM.toFixed(1)} cm</span>
          </div>
          <input
            type="range"
            min={THICKNESS_MIN_CM}
            max={THICKNESS_MAX_CM}
            step={THICKNESS_STEP_CM}
            value={thickness}
            onChange={(e) =>
              dispatch({
                type: "SET_THICKNESS",
                thicknessCm: Math.round(Number(e.target.value) * 10) / 10,
              })
            }
            style={{ width: "100%", accentColor: thicknessTooThin ? "#ff9800" : "#90caf9" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "4px",
              fontSize: "12px",
              color: "#888",
            }}
          >
            <span>Thinner — better portability</span>
            <span>Thicker — more cooling</span>
          </div>
        </div>

        {/* Warnings */}
        {(thicknessTooThin || thermalWarning || batteryWarning) && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}
          >
            {thicknessTooThin && (
              <div
                style={{
                  background: "#4a1c1c",
                  border: "1px solid #f44336",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "13px",
                  color: "#ef9a9a",
                }}
              >
                <strong>Thickness too low:</strong> A {state.batteryCapacityWh}Wh battery in a{" "}
                {state.screenSize}" chassis requires at least {minThickness.toFixed(1)} cm
                thickness. Reduce battery capacity or increase thickness to proceed.
              </div>
            )}
            {thermalWarning && (
              <div
                style={{
                  background: "#3e2723",
                  border: "1px solid #ff9800",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "13px",
                  color: "#ffcc80",
                }}
              >
                <strong>Thermal warning:</strong> Your components draw {totalPower}W but at{" "}
                {thickness.toFixed(1)} cm thickness, this {state.screenSize}" chassis can only
                dissipate {effectiveCooling}W. Expect thermal throttling and high fan noise.
              </div>
            )}
            {batteryWarning && (
              <div
                style={{
                  background: "#33291a",
                  border: "1px solid #ffa726",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "13px",
                  color: "#ffe0b2",
                }}
              >
                <strong>Battery warning:</strong> With a {state.batteryCapacityWh}Wh battery and{" "}
                {totalPower}W power draw, estimated battery life is only ~
                {estimatedHours.toFixed(1)} hours.
              </div>
            )}
          </div>
        )}

        {/* Chassis option slots */}
        {CHASSIS_SLOTS.map(({ slot, label, options }) => {
          const available = getAvailableOptions(options, GAME_YEAR);
          const selected = state.chassis[slot];
          return (
            <div key={slot} style={{ marginBottom: "24px" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#ccc",
                  marginBottom: "8px",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "8px",
                }}
              >
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

      {/* Sidebar */}
      <div
        style={{
          width: "200px",
          flexShrink: 0,
          background: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "16px",
          alignSelf: "flex-start",
          position: "sticky",
          top: 0,
        }}
      >
        <div
          style={{ color: "#888", fontSize: "12px", marginBottom: "12px", fontWeight: "bold" }}
        >
          RUNNING TOTALS
        </div>
        <TotalRow label="Chassis Cost" value={`$${totalCost}`} />
        <TotalRow label="Weight Impact" value={formatWeight(totalChassisWeight)} />
        <div style={{ borderTop: "1px solid #333", marginTop: "12px", paddingTop: "12px" }}>
          <div
            style={{ color: "#888", fontSize: "12px", marginBottom: "12px", fontWeight: "bold" }}
          >
            LAPTOP ESTIMATE
          </div>
          <TotalRow label="Total Weight" value={formatWeight(estimatedTotalWeight)} />
          <TotalRow label="Thickness" value={`${thickness.toFixed(1)} cm`} />
          <TotalRow label="Power Draw" value={`${totalPower}W`} />
          <TotalRow
            label="Cooling"
            value={`${effectiveCooling}W`}
          />
          {totalPower > 0 && (
            <TotalRow label="Battery Life" value={`~${estimatedHours.toFixed(1)}h`} />
          )}
        </div>
      </div>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
      <span style={{ color: "#888", fontSize: "13px" }}>{label}</span>
      <span style={{ color: "#e0e0e0", fontSize: "13px", fontWeight: "bold" }}>{value}</span>
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
          fontSize: "13px",
          fontWeight: "bold",
          marginBottom: "6px",
          color: isSelected ? "#90caf9" : "#e0e0e0",
        }}
      >
        {option.name}
      </div>
      <div style={{ fontSize: "11px", color: "#888", marginBottom: "8px", lineHeight: "1.4" }}>
        {specSummary(option)}
      </div>
      <div style={{ display: "flex", gap: "12px", fontSize: "11px" }}>
        <span style={{ color: "#4caf50" }}>${cost}</span>
        {option.weightG !== 0 && (
          <span style={{ color: option.weightG < 0 ? "#64b5f6" : "#888" }}>
            {option.weightG > 0 ? "+" : ""}
            {option.weightG}g
          </span>
        )}
      </div>
    </button>
  );
}
