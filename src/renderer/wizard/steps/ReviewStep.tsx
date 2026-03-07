import { useState } from "react";
import { useWizard } from "../WizardContext";
import { useGame } from "../../state/GameContext";
import {
  formatWeight,
  availableVolumeCm3,
  coolingMultiplier,
  totalConsumedVolumeCm3,
  maxHeightConstraintCm,
  applyDisplayMultiplier,
  batteryWarningThresholdH,
  avgUsageMultiplier,
  specSummary,
  CHASSIS_SLOTS,
  computeLaptopTotals,
  componentCostDecayed,
} from "../constants";
import { getAllChassisOptions, WIZARD_STEP_LABELS, WIZARD_STEPS, COMPONENT_STEP_SLOTS, WizardStep } from "../types";
import { getScreenSizeDef } from "../../../data/screenSizes";
import { getBatteryEra } from "../../../data/batteryEras";
import { PORT_TYPES } from "../../../data/portTypes";
import { COLOUR_OPTIONS } from "../../../data/colourOptions";
import { ComponentSlot } from "../../../data/types";
import { StatCard } from "./StatCard";
import { EditDialog, DialogTarget } from "./ReviewEditDialog";
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

const STEP_ICONS: Partial<Record<WizardStep, LucideIcon>> = {
  screenSize: Monitor,
  processing: Cpu,
  display: MonitorSmartphone,
  mediaConnectivity: Camera,
  battery: Battery,
  body: Laptop,
};

/** Steps shown in the review — everything except metadata and review itself. */
const STEP_ORDER = WIZARD_STEPS.filter((s) => s !== "metadata" && s !== "review");

export function ReviewStep() {
  const { state, gameYear } = useWizard();
  const { state: gameState } = useGame();
  const [dialogTarget, setDialogTarget] = useState<DialogTarget | null>(null);
  const screenSizeDef = getScreenSizeDef(state.screenSize);
  const era = getBatteryEra(gameYear);
  const displayMult = screenSizeDef.displayMultiplier;

  const allChassisOptions = getAllChassisOptions(state.chassis);

  // --- Cost breakdown ---
  const totals = computeLaptopTotals(
    state.components, state.ports, state.chassis,
    state.batteryCapacityWh, state.selectedColours,
    state.screenSize, state.bezelMm, state.thicknessCm, gameYear,
  );
  const {
    componentCost, portCost, chassisOptionCost, batteryCost, batteryWeight, colourCost,
    totalCost, totalPower,
  } = totals;
  const totalWeight = screenSizeDef.baseWeightG + totals.subtotalWeight;

  // --- Volume & cooling ---
  const totalVolume = totalConsumedVolumeCm3(state.components, state.batteryCapacityWh, state.ports, allChassisOptions);
  const totalAvailable = availableVolumeCm3(state.screenSize, state.bezelMm, state.thicknessCm, gameYear);
  const spaceUtilization = totalAvailable > 0 ? totalVolume / totalAvailable : 1;
  const spacePercent = Math.round(Math.min(100, spaceUtilization * 100));

  const coolingFromSolution = state.chassis.coolingSolution?.coolingCapacityW ?? 0;
  const coolMult = coolingMultiplier(state.thicknessCm, state.bezelMm, spaceUtilization);
  const effectiveCooling = Math.round(coolingFromSolution * coolMult);
  const thermalWarning = totalPower > effectiveCooling;

  const minFromHeight = maxHeightConstraintCm(state.components, state.ports, allChassisOptions);
  const thicknessTooThin = state.thicknessCm < minFromHeight;

  const avgPower = totalPower * avgUsageMultiplier(gameYear);
  const estimatedHours = avgPower > 0 ? state.batteryCapacityWh / avgPower : 0;
  const batteryWarning = totalPower > 0 && estimatedHours < batteryWarningThresholdH(gameYear);

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
          {gameState.companyName} {state.name || "Unnamed Laptop"}
        </div>
        <div style={{ fontSize: "0.8125rem", color: "#888", marginTop: "4px" }}>
          {state.screenSize}" &middot; {state.modelType === "brandNew" ? "Brand New" : state.modelType === "successor" ? "Successor" : "Spec Bump"} &middot; {gameYear}
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
        const slots = COMPONENT_STEP_SLOTS[step];
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
                    label={label}
                    value={option.name}
                    detail={specSummary(option.specs)}
                    onClick={() => setDialogTarget({ kind: "chassis", slot, label, options })}
                  />
                ) : (
                  <ClickableSpecRow
                    key={slot}
                    label={label}
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
                    cost={comp ? applyDisplayMultiplier(componentCostDecayed(comp, gameYear), slot, displayMult) : undefined}
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
