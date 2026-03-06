import { useWizard } from "./WizardContext";
import {
  GAME_YEAR,
  formatWeight,
  availableVolumeCm3,
  coolingMultiplier,
  minThicknessForVolumeCm,
  chassisCost,
  totalConsumedVolumeCm3,
  maxHeightConstraintCm,
  applyDisplayMultiplier,
  batteryWarningThresholdH,
} from "./constants";
import { getScreenSizeDef } from "../../data/screenSizes";
import { getBatteryEra } from "../../data/batteryEras";
import { PORT_TYPES } from "../../data/portTypes";
import { ChassisOption } from "../../data/types";
import { getAllChassisOptions } from "./types";
import { STAT_CONFIG, computeStatTotals } from "./StatBar";

export function WizardSidebar({
  showChassisTotals,
  showEstimate,
}: {
  showChassisTotals?: boolean;
  showEstimate?: boolean;
}) {
  const { state } = useWizard();
  const screenSizeDef = getScreenSizeDef(state.screenSize);
  const era = getBatteryEra(GAME_YEAR);
  const displayMult = screenSizeDef.displayMultiplier;

  const thickness = state.thicknessCm;
  const bezel = state.bezelMm;

  // --- Running totals (always computed) ---
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

  const allChassisOptions = getAllChassisOptions(state.chassis);
  const selectedChassisOptions = allChassisOptions.filter(
    (o): o is ChassisOption => o !== null,
  );
  const chassisOptionCost = selectedChassisOptions.reduce((sum, o) => sum + chassisCost(o, GAME_YEAR), 0);
  const chassisOptionWeight = selectedChassisOptions.reduce((sum, o) => sum + o.weightG, 0);

  const batteryCost = Math.round(state.batteryCapacityWh * era.costPerWh);
  const batteryWeight = Math.round(state.batteryCapacityWh * era.weightPerWh);

  const totalCost = componentCost + portCost + chassisOptionCost + batteryCost;
  const totalPower = componentPower;
  const totalWeight = componentWeight + portWeight + chassisOptionWeight + batteryWeight;

  // --- Statistics ---
  const statTotals = computeStatTotals(state);

  // Group stats with dividers and category colors
  const statGroups: { stats: string[]; color: string }[] = [
    { stats: ["performance", "gamingPerformance"], color: "#ef5350" },       // red — power/speed
    { stats: ["display", "speakers", "webcam"], color: "#42a5f5" },          // blue — media
    { stats: ["keyboard", "trackpad"], color: "#66bb6a" },                   // green — input
    { stats: ["batteryLife", "thermals", "connectivity"], color: "#ffa726" }, // amber — hardware
    { stats: ["design", "buildQuality"], color: "#ab47bc" },                 // purple — build
  ];

  // --- Estimate (conditionally rendered) ---
  let estimateSection = null;
  if (showEstimate) {
    const totalVolume = totalConsumedVolumeCm3(state.components, state.batteryCapacityWh, state.ports, allChassisOptions);
    const totalAvailable = availableVolumeCm3(state.screenSize, bezel, thickness, GAME_YEAR);
    const volumeOverflow = totalVolume > totalAvailable;
    const volumePercent = totalAvailable > 0 ? Math.min(100, (totalVolume / totalAvailable) * 100) : 100;

    const coolingFromSolution = state.chassis.coolingSolution?.coolingCapacityW ?? 0;
    const spaceUtilization = totalAvailable > 0 ? totalVolume / totalAvailable : 1;
    const coolMult = coolingMultiplier(thickness, bezel, spaceUtilization);
    const effectiveCooling = Math.round(coolingFromSolution * coolMult);
    const thermalWarning = totalPower > effectiveCooling;

    const minFromVolume = minThicknessForVolumeCm(totalVolume, state.screenSize, bezel, GAME_YEAR);
    const minFromHeight = maxHeightConstraintCm(state.components, state.ports, allChassisOptions);
    const minThickness = Math.max(minFromVolume, minFromHeight);
    const thicknessTooThin = thickness < minThickness;

    const estimatedTotalWeight = screenSizeDef.baseWeightG + totalWeight;

    const estimatedHours = totalPower > 0 ? state.batteryCapacityWh / totalPower : 0;
    const batteryWarning = totalPower > 0 && estimatedHours < batteryWarningThresholdH(GAME_YEAR);

    estimateSection = (
      <>
        <SidebarDivider />
        <SidebarHeading>LAPTOP ESTIMATE</SidebarHeading>
        <SidebarRow
          label="Space"
          value={`${Math.round(volumePercent)}%`}
          warning={volumeOverflow ? `${Math.round(totalVolume)} cm³ used but only ${Math.round(totalAvailable)} cm³ available` : undefined}
        />
        <SidebarRow label="Total Weight" value={formatWeight(estimatedTotalWeight)} />
        <SidebarRow
          label="Thickness"
          value={`${thickness.toFixed(1)} cm`}
          warning={thicknessTooThin ? `Components need at least ${minThickness.toFixed(1)} cm` : undefined}
        />
        <SidebarRow label="Bezel" value={`${bezel} mm`} />
        <SidebarRow label="Power Draw" value={`${totalPower} W`} />
        <SidebarRow
          label="Cooling"
          value={`${effectiveCooling} W`}
          warning={thermalWarning ? `Components draw ${totalPower}W but cooling only provides ${effectiveCooling}W` : undefined}
        />
        {totalPower > 0 && (
          <SidebarRow
            label="Battery Life"
            value={`~${estimatedHours.toFixed(1)}h`}
            warning={batteryWarning ? `Very low for ${GAME_YEAR} (${state.batteryCapacityWh}Wh ÷ ${totalPower}W)` : undefined}
          />
        )}
      </>
    );
  }

  return (
    <div
      style={{
        width: "280px",
        flexShrink: 0,
        background: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: "8px",
        padding: "16px",
        overflowY: "auto",
        minHeight: 0,
      }}
    >
      {/* Running Totals */}
      <SidebarHeading>RUNNING TOTALS</SidebarHeading>
      <SidebarRow label="Cost" value={`$${totalCost}`} />
      <SidebarRow label="Power Draw" value={`${totalPower} W`} />
      <SidebarRow label="Weight" value={formatWeight(totalWeight)} />
      {showChassisTotals && (
        <>
          <SidebarDivider />
          <SidebarRow label="Chassis Cost" value={`$${chassisOptionCost}`} />
          <SidebarRow label="Chassis Weight" value={formatWeight(chassisOptionWeight)} />
        </>
      )}

      {/* Statistics */}
      <SidebarDivider />
      <SidebarHeading>STATISTICS</SidebarHeading>
      {statGroups.map((group, groupIdx) => (
        <div key={groupIdx}>
          {groupIdx > 0 && (
            <div style={{ borderTop: "1px solid #2a2a2a", margin: "6px 0" }} />
          )}
          {group.stats.map((statKey) => {
            const config = STAT_CONFIG.find((s) => s.stat === statKey);
            if (!config) return null;
            const { Icon, label } = config;
            const value = statTotals[config.stat] ?? 0;
            return (
              <div
                key={statKey}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: group.color,
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                  }}
                >
                  <Icon size={13} strokeWidth={1.5} />
                  {label}
                </span>
                <span
                  style={{
                    color: "#e0e0e0",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                  }}
                >
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      ))}

      {/* Laptop Estimate */}
      {estimateSection}
    </div>
  );
}

function SidebarHeading({ children }: { children: string }) {
  return (
    <div style={{ color: "#888", fontSize: "0.6875rem", marginBottom: "10px", fontWeight: "bold", letterSpacing: "0.5px" }}>
      {children}
    </div>
  );
}

function SidebarDivider() {
  return <div style={{ borderTop: "1px solid #333", margin: "12px 0" }} />;
}

function SidebarRow({ label, value, warning }: { label: string; value: string; warning?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
      <span style={{ color: "#888", fontSize: "0.8125rem" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ color: warning ? "#ff9800" : "#e0e0e0", fontSize: "0.8125rem", fontWeight: "bold" }}>{value}</span>
        {warning && (
          <span title={warning} style={{ color: "#ff9800", fontSize: "0.875rem", cursor: "help" }}>⚠</span>
        )}
      </span>
    </div>
  );
}
