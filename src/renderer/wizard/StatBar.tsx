import { useWizard } from "./WizardContext";
import { LaptopStat, StatVector } from "../../data/types";
import { getAllChassisOptions } from "./types";
import { DISPLAY_SLOTS } from "./constants";
import { getScreenSizeDef } from "../../data/screenSizes";
import { PORT_TYPES } from "../../data/portTypes";
import { Tooltip } from "./Tooltip";

const STAT_CONFIG: { stat: LaptopStat; icon: string; label: string }[] = [
  { stat: "performance", icon: "\u25B3", label: "Performance" },
  { stat: "gamingPerformance", icon: "\u25C7", label: "Gaming" },
  { stat: "display", icon: "\u25A1", label: "Display" },
  { stat: "batteryLife", icon: "\u25AD", label: "Battery Life" },
  { stat: "connectivity", icon: "\u25CB", label: "Connectivity" },
  { stat: "speakers", icon: "\u266A", label: "Speakers" },
  { stat: "webcam", icon: "\u25CE", label: "Webcam" },
  { stat: "design", icon: "\u2606", label: "Design" },
  { stat: "buildQuality", icon: "\u25A0", label: "Build Quality" },
  { stat: "keyboard", icon: "\u2261", label: "Keyboard" },
  { stat: "trackpad", icon: "\u25A3", label: "Trackpad" },
  { stat: "thermals", icon: "\u2103", label: "Thermals" },
];

export { STAT_CONFIG };

function computeStatTotals(state: ReturnType<typeof useWizard>["state"]): StatVector {
  const totals: StatVector = {};
  const screenSizeDef = getScreenSizeDef(state.screenSize);
  const displayMult = screenSizeDef.displayMultiplier;

  // Components
  for (const [slot, comp] of Object.entries(state.components)) {
    if (!comp) continue;
    const isDisplay = DISPLAY_SLOTS.includes(slot as never);
    for (const [stat, value] of Object.entries(comp.stats)) {
      const adjusted = isDisplay ? Math.round((value as number) * displayMult) : (value as number);
      totals[stat as LaptopStat] = (totals[stat as LaptopStat] ?? 0) + adjusted;
    }
  }

  // Ports
  for (const pt of PORT_TYPES) {
    const count = state.ports[pt.id] ?? 0;
    if (count === 0) continue;
    for (const [stat, value] of Object.entries(pt.stats)) {
      totals[stat as LaptopStat] = (totals[stat as LaptopStat] ?? 0) + (value as number) * count;
    }
  }

  // Chassis options
  for (const opt of getAllChassisOptions(state.chassis)) {
    if (!opt) continue;
    for (const [stat, value] of Object.entries(opt.stats)) {
      totals[stat as LaptopStat] = (totals[stat as LaptopStat] ?? 0) + (value as number);
    }
  }

  return totals;
}

export function StatBar() {
  const { state } = useWizard();
  const totals = computeStatTotals(state);

  return (
    <div
      style={{
        display: "flex",
        gap: "2px",
        background: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: "8px",
        padding: "4px 12px",
        marginTop: "8px",
        flexShrink: 0,
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      {STAT_CONFIG.map(({ stat, icon, label }) => {
        const value = totals[stat] ?? 0;
        return (
          <Tooltip key={stat} content={`${label}: ${value}`}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "13px",
                color: value > 0 ? "#e0e0e0" : "#555",
                cursor: "default",
              }}
            >
              <span style={{ fontSize: "14px" }}>{icon}</span>
              <span style={{ fontWeight: "bold", minWidth: "16px", textAlign: "right" }}>{value}</span>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}
