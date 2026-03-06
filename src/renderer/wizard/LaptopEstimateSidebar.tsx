import { useState, useMemo } from "react";
import { useWizard } from "./WizardContext";
import { LaptopStat, StatVector } from "../../data/types";
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
  avgUsageMultiplier,
} from "./constants";
import { COLOUR_OPTIONS } from "../../data/colourOptions";
import { getScreenSizeDef } from "../../data/screenSizes";
import { getBatteryEra } from "../../data/batteryEras";
import { PORT_TYPES } from "../../data/portTypes";
import { ChassisOption } from "../../data/types";
import { getAllChassisOptions } from "./types";
import { STAT_CONFIG, computeStatTotals, getStatColor } from "./StatBar";

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

  const colourCost = state.selectedColours.reduce((sum, id) => {
    const opt = COLOUR_OPTIONS.find((c) => c.id === id);
    return sum + (opt?.costPerUnit ?? 0);
  }, 0);

  const totalCost = componentCost + portCost + chassisOptionCost + batteryCost + colourCost;
  const totalPower = componentPower;
  const totalWeight = componentWeight + portWeight + chassisOptionWeight + batteryWeight;

  // --- Statistics ---
  const statTotals = useMemo(() => computeStatTotals(state), [state]);

  // Track previous totals: store last-known totals and update *after* render
  // so the current render can compare current vs previous.
  const [snapshotTotals, setSnapshotTotals] = useState<StatVector>(statTotals);
  const [displayTotals, setDisplayTotals] = useState<StatVector>(statTotals);

  const totalsChanged = STAT_CONFIG.some(({ stat }) => (statTotals[stat] ?? 0) !== (displayTotals[stat] ?? 0));
  if (totalsChanged) {
    setSnapshotTotals(displayTotals);
    setDisplayTotals(statTotals);
  }

  function statValueColor(stat: LaptopStat): string {
    const current = statTotals[stat] ?? 0;
    const prev = snapshotTotals[stat] ?? 0;
    if (current > prev) return "#66bb6a";
    if (current < prev) return "#ef5350";
    return "#e0e0e0";
  }

  // Group stats with dividers
  const statGroups: LaptopStat[][] = [
    ["performance", "gamingPerformance"],
    ["display", "speakers", "webcam"],
    ["keyboard", "trackpad"],
    ["thermals", "connectivity"],
    ["design", "buildQuality"],
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

    const avgPower = totalPower * avgUsageMultiplier(GAME_YEAR);
    const estimatedHours = avgPower > 0 ? state.batteryCapacityWh / avgPower : 0;
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
      {statGroups.reduce<{ elements: React.ReactNode[]; renderedCount: number }>((acc, group, groupIdx) => {
        const visibleStats = group.filter((statKey) => (statTotals[statKey] ?? 0) !== 0);
        if (visibleStats.length === 0) return acc;
        acc.elements.push(
          <div key={groupIdx}>
            {acc.renderedCount > 0 && (
              <div style={{ borderTop: "1px solid #2a2a2a", margin: "6px 0" }} />
            )}
            {visibleStats.map((statKey) => {
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
                      color: getStatColor(statKey),
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                    }}
                  >
                    <Icon size={16} strokeWidth={2.5} />
                    {label}
                  </span>
                  <span
                    style={{
                      color: statValueColor(config.stat),
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
        );
        acc.renderedCount++;
        return acc;
      }, { elements: [], renderedCount: 0 }).elements}

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
