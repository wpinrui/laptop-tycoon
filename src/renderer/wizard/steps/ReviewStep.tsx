import { useWizard } from "../WizardContext";
import {
  GAME_YEAR,
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
} from "../constants";
import { getAllChassisOptions, WIZARD_STEP_LABELS, WizardStep } from "../types";
import { getScreenSizeDef } from "../../../data/screenSizes";
import { getBatteryEra } from "../../../data/batteryEras";
import { PORT_TYPES } from "../../../data/portTypes";
import { COLOUR_OPTIONS } from "../../../data/colourOptions";
import { ChassisOption, ComponentSlot } from "../../../data/types";
import { StatCard } from "./StatCard";

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

export function ReviewStep() {
  const { state, dispatch } = useWizard();
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
        Review your laptop design before finalizing.
      </p>

      {/* Laptop name header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#90caf9" }}>
          {state.name || "Unnamed Laptop"}
        </div>
        <div style={{ fontSize: "0.8125rem", color: "#888", marginTop: "4px" }}>
          {state.screenSize}" &middot; {state.modelType === "brandNew" ? "Brand New" : state.modelType === "successor" ? "Successor" : "Spec Bump"}
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

      {/* Warnings */}
      {(thermalWarning || batteryWarning || thicknessTooThin || spaceUtilization > 1) && (
        <div style={{ marginBottom: "24px" }}>
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

      {/* Spec breakdown by step */}
      {STEP_ORDER.map((step) => {
        const slots = STEP_SLOTS[step];
        if (step === "screenSize") {
          return (
            <ReviewSection
              key={step}
              title={WIZARD_STEP_LABELS[step]}
              onEdit={() => dispatch({ type: "GO_TO_STEP", step })}
            >
              <SpecRow label="Screen Size" value={`${state.screenSize}"`} />
              <SpecRow label="Display Multiplier" value={`${displayMult.toFixed(2)}x`} />
              <SpecRow label="Base Weight" value={formatWeight(screenSizeDef.baseWeightG)} />
            </ReviewSection>
          );
        }

        if (step === "battery") {
          return (
            <ReviewSection
              key={step}
              title={WIZARD_STEP_LABELS[step]}
              onEdit={() => dispatch({ type: "GO_TO_STEP", step })}
            >
              <SpecRow label="Capacity" value={`${state.batteryCapacityWh} Wh`} />
              <SpecRow label="Technology" value={era.techLabel} />
              <SpecRow label="Cost" value={`$${batteryCost}`} />
              <SpecRow label="Weight" value={formatWeight(batteryWeight)} />
            </ReviewSection>
          );
        }

        if (step === "body") {
          return (
            <ReviewSection
              key={step}
              title={WIZARD_STEP_LABELS[step]}
              onEdit={() => dispatch({ type: "GO_TO_STEP", step })}
            >
              <SpecRow label="Thickness" value={`${state.thicknessCm.toFixed(1)} cm`} />
              <SpecRow label="Bezel Width" value={`${state.bezelMm} mm`} />
              <SpecRow label="Power Draw" value={`${totalPower} W`} />
              <SpecRow label="Effective Cooling" value={`${effectiveCooling} W`} />
              {Object.entries(state.chassis).map(([slot, option]) =>
                option ? (
                  <SpecRow
                    key={slot}
                    label={CHASSIS_SLOT_LABELS[slot] ?? slot}
                    value={option.name}
                    detail={specSummary(option.specs)}
                  />
                ) : null,
              )}
              {selectedColours.length > 0 && (
                <div style={{ marginTop: "8px" }}>
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
              )}
            </ReviewSection>
          );
        }

        if (slots) {
          const components = slots
            .map((s) => ({ slot: s, comp: state.components[s] }))
            .filter((c) => c.comp);

          return (
            <ReviewSection
              key={step}
              title={WIZARD_STEP_LABELS[step]}
              onEdit={() => dispatch({ type: "GO_TO_STEP", step })}
            >
              {components.map(({ slot, comp }) =>
                comp ? (
                  <SpecRow
                    key={slot}
                    label={COMPONENT_SLOT_LABELS[slot]}
                    value={comp.name}
                    detail={specSummary(comp.specs)}
                    cost={applyDisplayMultiplier(comp.costAtLaunch, slot, displayMult)}
                  />
                ) : null,
              )}
              {step === "mediaConnectivity" && activePorts.length > 0 && (
                <>
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
                  {activePorts.map((pt) => (
                    <SpecRow
                      key={pt.id}
                      label={pt.name}
                      value={`x${state.ports[pt.id]}`}
                      cost={pt.costPerPort * state.ports[pt.id]}
                    />
                  ))}
                </>
              )}
            </ReviewSection>
          );
        }

        return null;
      })}

      {/* Cost breakdown */}
      <div
        style={{
          background: "#1a2a1a",
          border: "1px solid #2e4a2e",
          borderRadius: "8px",
          padding: "16px",
          marginTop: "8px",
        }}
      >
        <div style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#81c784", marginBottom: "12px" }}>
          Cost Breakdown
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
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
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
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#ccc" }}>{title}</div>
        <button
          onClick={onEdit}
          style={{
            background: "none",
            border: "1px solid #555",
            borderRadius: "4px",
            color: "#90caf9",
            fontSize: "0.75rem",
            padding: "4px 10px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function SpecRow({
  label,
  value,
  detail,
  cost,
}: {
  label: string;
  value: string;
  detail?: string;
  cost?: number;
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
    <div
      style={{
        background: "#2a2010",
        border: "1px solid #5a4020",
        borderRadius: "6px",
        padding: "8px 12px",
        fontSize: "0.8125rem",
        color: "#ff9800",
        marginBottom: "6px",
      }}
    >
      {text}
    </div>
  );
}
