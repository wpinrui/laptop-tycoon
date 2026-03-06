import { ComponentType } from "react";
import { useWizard } from "./WizardContext";
import { LaptopStat, StatVector } from "../../data/types";
import { getAllChassisOptions } from "./types";
import { DISPLAY_SLOTS } from "./constants";
import { getScreenSizeDef } from "../../data/screenSizes";
import { PORT_TYPES } from "../../data/portTypes";
import { Tooltip } from "./Tooltip";
import {
  Zap,
  Gamepad2,
  Monitor,
  BatteryMedium,
  Wifi,
  Volume2,
  Camera,
  Sparkles,
  Shield,
  Keyboard,
  Mouse,
  Thermometer,
} from "lucide-react";

interface StatConfigEntry {
  stat: LaptopStat;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
}

const STAT_CONFIG: StatConfigEntry[] = [
  { stat: "performance", Icon: Zap, label: "Performance" },
  { stat: "gamingPerformance", Icon: Gamepad2, label: "Gaming" },
  { stat: "display", Icon: Monitor, label: "Display" },
  { stat: "batteryLife", Icon: BatteryMedium, label: "Battery Life" },
  { stat: "connectivity", Icon: Wifi, label: "Connectivity" },
  { stat: "speakers", Icon: Volume2, label: "Speakers" },
  { stat: "webcam", Icon: Camera, label: "Webcam" },
  { stat: "design", Icon: Sparkles, label: "Design" },
  { stat: "buildQuality", Icon: Shield, label: "Build Quality" },
  { stat: "keyboard", Icon: Keyboard, label: "Keyboard" },
  { stat: "trackpad", Icon: Mouse, label: "Trackpad" },
  { stat: "thermals", Icon: Thermometer, label: "Thermals" },
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
        gap: "4px",
        background: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: "8px",
        padding: "8px 16px",
        marginTop: "8px",
        flexShrink: 0,
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      {STAT_CONFIG.map(({ stat, Icon, label }) => {
        const value = totals[stat] ?? 0;
        return (
          <Tooltip key={stat} content={`${label}: ${value}`}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 10px",
                borderRadius: "4px",
                fontSize: "14px",
                color: value > 0 ? "#e0e0e0" : "#555",
                cursor: "default",
              }}
            >
              <Icon size={16} strokeWidth={1.5} />
              <span style={{ fontWeight: "bold", minWidth: "16px", textAlign: "right" }}>{value}</span>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}
