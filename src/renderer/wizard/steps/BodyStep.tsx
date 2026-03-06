import { useWizard } from "../WizardContext";
import {
  GAME_YEAR,
  formatWeight,
  THICKNESS_MIN_CM,
  THICKNESS_MAX_CM,
  THICKNESS_STEP_CM,
  BEZEL_MIN_MM,
  BEZEL_MAX_MM,
  BEZEL_STEP_MM,
  availableVolumeCm3,
  batteryVolumeCm3,
  minThicknessForVolumeCm,
  coolingMultiplier,
} from "../constants";
import { getScreenSizeDef } from "../../../data/screenSizes";
import { getBatteryEra } from "../../../data/batteryEras";
import {
  MATERIALS,
  COOLING_SOLUTIONS,
  KEYBOARD_FEATURES,
  TRACKPAD_FEATURES,
} from "../../../data/chassisOptions";
import { PORT_TYPES } from "../../../data/portTypes";
import { ChassisOption, ChassisOptionSlot, ComponentSlot } from "../../../data/types";

const DISPLAY_SLOTS: ComponentSlot[] = ["resolution", "displayTech", "displaySurface"];

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

/** Sum all internal volume consumed: components + battery + ports + chassis options. */
function totalConsumedVolumeCm3(
  components: Record<string, { volumeCm3: number } | undefined>,
  batteryWh: number,
  ports: Record<string, number>,
  chassisOptions: (ChassisOption | null)[],
): number {
  let vol = 0;
  // Components
  for (const comp of Object.values(components)) {
    if (comp) vol += comp.volumeCm3;
  }
  // Battery
  vol += batteryVolumeCm3(batteryWh);
  // Ports
  for (const pt of PORT_TYPES) {
    const count = ports[pt.id] ?? 0;
    vol += count * pt.volumePerPortCm3;
  }
  // Chassis options (cooling solutions take volume)
  for (const opt of chassisOptions) {
    if (opt) vol += opt.volumeCm3;
  }
  return vol;
}

/** Max minThicknessCm across all selected items. */
function maxHeightConstraintCm(
  components: Record<string, { minThicknessCm: number } | undefined>,
  ports: Record<string, number>,
  chassisOptions: (ChassisOption | null)[],
): number {
  let max = 0;
  for (const comp of Object.values(components)) {
    if (comp && comp.minThicknessCm > max) max = comp.minThicknessCm;
  }
  for (const pt of PORT_TYPES) {
    if ((ports[pt.id] ?? 0) > 0 && pt.minThicknessCm > max) max = pt.minThicknessCm;
  }
  for (const opt of chassisOptions) {
    if (opt && opt.minThicknessCm > max) max = opt.minThicknessCm;
  }
  return max;
}

export function BodyStep() {
  const { state, dispatch } = useWizard();
  const screenSizeDef = getScreenSizeDef(state.screenSize);
  const era = getBatteryEra(GAME_YEAR);

  const thickness = state.thicknessCm;
  const bezel = state.bezelMm;

  // --- Volume ---
  const allChassisOptions = [
    state.chassis.material,
    state.chassis.coolingSolution,
    state.chassis.keyboardFeature,
    state.chassis.trackpadFeature,
  ];
  const totalVolume = totalConsumedVolumeCm3(
    state.components as Record<string, { volumeCm3: number } | undefined>,
    state.batteryCapacityWh,
    state.ports,
    allChassisOptions,
  );
  const totalAvailable = availableVolumeCm3(state.screenSize, bezel, thickness);
  const volumeOverflow = totalVolume > totalAvailable;
  const volumePercent = totalAvailable > 0 ? Math.min(100, (totalVolume / totalAvailable) * 100) : 100;

  // --- Min thickness (from both volume and height constraints) ---
  const minFromVolume = minThicknessForVolumeCm(totalVolume, state.screenSize, bezel);
  const minFromHeight = maxHeightConstraintCm(
    state.components as Record<string, { minThicknessCm: number } | undefined>,
    state.ports,
    allChassisOptions,
  );
  const minThickness = Math.max(minFromVolume, minFromHeight);
  const thicknessTooThin = thickness < minThickness;

  // --- Cooling ---
  const coolingFromSolution = state.chassis.coolingSolution?.coolingCapacityW ?? 0;
  const thicknessMultiplier = coolingMultiplier(thickness, bezel);
  const effectiveCooling = Math.round(coolingFromSolution * thicknessMultiplier);

  // --- Running totals for chassis selections ---
  const selectedOptions = allChassisOptions.filter(
    (o): o is ChassisOption => o !== null,
  );
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
  const portWeight = PORT_TYPES.reduce(
    (sum, p) => sum + (state.ports[p.id] ?? 0) * p.weightPerPortG,
    0,
  );
  const estimatedTotalWeight =
    screenSizeDef.baseWeightG + componentWeight + batteryWeight + totalChassisWeight + portWeight;
  const estimatedHours = totalPower > 0 ? state.batteryCapacityWh / totalPower : 0;
  // Era-appropriate battery warning: early 2000s ~1.5h was bad, modern ~4h is bad
  const batteryWarningThresholdH = GAME_YEAR <= 2002 ? 1.5 : GAME_YEAR <= 2005 ? 2 : GAME_YEAR <= 2009 ? 2.5 : GAME_YEAR <= 2014 ? 3 : 4;
  const batteryWarning = totalPower > 0 && estimatedHours < batteryWarningThresholdH;

  return (
    <div style={{ display: "flex", gap: "24px", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <h2>Body / Chassis</h2>
        <p style={{ color: "#aaa", marginTop: "4px", marginBottom: "24px" }}>
          Configure chassis dimensions, material, cooling, keyboard, and trackpad.
        </p>

        {/* Sliders: thickness and bezel */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          {/* Thickness slider */}
          <div>
            <div style={{ fontSize: "14px", fontWeight: "bold", color: "#ccc", marginBottom: "8px" }}>
              Chassis Thickness
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
              <span style={{ color: "#888", fontSize: "12px" }}>{THICKNESS_MIN_CM.toFixed(1)} cm</span>
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: thicknessTooThin ? "#ff9800" : "#90caf9",
                }}
              >
                {thickness.toFixed(1)} cm
              </span>
              <span style={{ color: "#888", fontSize: "12px" }}>{THICKNESS_MAX_CM.toFixed(1)} cm</span>
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
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#666", marginTop: "2px" }}>
              <span>Thinner</span>
              <span>Thicker</span>
            </div>
          </div>

          {/* Bezel slider */}
          <div>
            <div style={{ fontSize: "14px", fontWeight: "bold", color: "#ccc", marginBottom: "8px" }}>
              Bezel Width (uniform)
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
              <span style={{ color: "#888", fontSize: "12px" }}>{BEZEL_MIN_MM} mm</span>
              <span style={{ fontSize: "28px", fontWeight: "bold", color: "#90caf9" }}>
                {bezel} mm
              </span>
              <span style={{ color: "#888", fontSize: "12px" }}>{BEZEL_MAX_MM} mm</span>
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
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#666", marginTop: "2px" }}>
              <span>Sleek</span>
              <span>More internal space</span>
            </div>
          </div>
        </div>

        {/* Volume bar */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "12px", fontWeight: "bold", color: "#ccc" }}>
              Internal Space Usage
            </span>
            <span style={{ fontSize: "12px", color: volumeOverflow ? "#f44336" : "#888" }}>
              {Math.round(totalVolume)} / {Math.round(totalAvailable)} cm³
            </span>
          </div>
          <div style={{ height: "8px", background: "#2a2a2a", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, volumePercent)}%`,
                background: volumeOverflow ? "#f44336" : volumePercent > 85 ? "#ff9800" : "#4caf50",
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
              <div style={{ fontSize: "14px", fontWeight: "bold", color: "#ccc", marginBottom: "8px" }}>
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
        <div style={{ color: "#888", fontSize: "12px", marginBottom: "12px", fontWeight: "bold" }}>
          RUNNING TOTALS
        </div>
        <TotalRow label="Chassis Cost" value={`$${totalCost}`} />
        <TotalRow label="Weight Impact" value={formatWeight(totalChassisWeight)} />
        <div style={{ borderTop: "1px solid #333", marginTop: "12px", paddingTop: "12px" }}>
          <div style={{ color: "#888", fontSize: "12px", marginBottom: "12px", fontWeight: "bold" }}>
            LAPTOP ESTIMATE
          </div>
          <TotalRow
            label="Space"
            value={`${Math.round(volumePercent)}%`}
            warning={volumeOverflow ? `${Math.round(totalVolume)} cm³ used but only ${Math.round(totalAvailable)} cm³ available` : undefined}
          />
          <TotalRow label="Total Weight" value={formatWeight(estimatedTotalWeight)} />
          <TotalRow
            label="Thickness"
            value={`${thickness.toFixed(1)} cm`}
            warning={thicknessTooThin ? `Components need at least ${minThickness.toFixed(1)} cm` : undefined}
          />
          <TotalRow label="Bezel" value={`${bezel} mm`} />
          <TotalRow label="Power Draw" value={`${totalPower}W`} />
          <TotalRow
            label="Cooling"
            value={`${effectiveCooling}W`}
            warning={thermalWarning ? `Components draw ${totalPower}W but cooling only provides ${effectiveCooling}W` : undefined}
          />
          {totalPower > 0 && (
            <TotalRow
              label="Battery Life"
              value={`~${estimatedHours.toFixed(1)}h`}
              warning={batteryWarning ? `Very low for ${GAME_YEAR} (${state.batteryCapacityWh}Wh ÷ ${totalPower}W)` : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TotalRow({ label, value, warning }: { label: string; value: string; warning?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
      <span style={{ color: "#888", fontSize: "13px" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ color: warning ? "#ff9800" : "#e0e0e0", fontSize: "13px", fontWeight: "bold" }}>{value}</span>
        {warning && (
          <span title={warning} style={{ color: "#ff9800", fontSize: "14px", cursor: "help" }}>⚠</span>
        )}
      </span>
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
      <div style={{ display: "flex", gap: "12px", fontSize: "11px", flexWrap: "wrap" }}>
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
  );
}
