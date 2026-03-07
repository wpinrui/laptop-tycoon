import { ComponentType } from "react";
import { useWizard } from "./WizardContext";
import { LaptopStat, StatVector } from "../../data/types";
import { tokens } from "../shell/tokens";
import { computeRawStatTotals } from "../../simulation/statCalculation";
import {
  Zap,
  Gamepad2,
  Monitor,
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

const STAT_COLORS: Partial<Record<LaptopStat, string>> = {
  performance: "#ef5350",
  gamingPerformance: "#ef5350",
  display: "#42a5f5",
  speakers: "#42a5f5",
  webcam: "#42a5f5",
  keyboard: "#66bb6a",
  trackpad: "#66bb6a",
  thermals: "#ffa726",
  connectivity: "#ffa726",
  design: "#ab47bc",
  buildQuality: "#ab47bc",
};

export function getStatColor(stat: LaptopStat): string {
  return STAT_COLORS[stat] ?? tokens.colors.interactiveAccent;
}

export function computeStatTotals(state: ReturnType<typeof useWizard>["state"], gameYear: number): StatVector {
  return computeRawStatTotals({
    screenSize: state.screenSize,
    components: state.components,
    ports: state.ports,
    chassis: state.chassis,
    batteryCapacityWh: state.batteryCapacityWh,
    thicknessCm: state.thicknessCm,
    bezelMm: state.bezelMm,
    selectedColours: state.selectedColours,
    gameYear,
  });
}

export function StatContributions({ stats }: { stats: StatVector }) {
  const entries = (Object.entries(stats) as [LaptopStat, number][]).filter(([, v]) => v !== 0);
  if (entries.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
      {entries.map(([stat, value]) => {
        const config = STAT_CONFIG.find((s) => s.stat === stat);
        if (!config) return null;
        const { Icon } = config;
        return (
          <span key={stat} style={{ color: getStatColor(stat), fontSize: "0.75rem", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "2px" }}>
            <Icon size={16} strokeWidth={2.5} /> +{value}
          </span>
        );
      })}
    </div>
  );
}
