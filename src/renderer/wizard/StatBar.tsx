import { ComponentType } from "react";
import { useWizard } from "./WizardContext";
import { LaptopStat, StatVector } from "../../data/types";
import { getAllChassisOptions } from "./types";
import { tokens } from "../shell/tokens";
import {
  DISPLAY_SLOTS,
  THICKNESS_MIN_CM,
  THICKNESS_MAX_CM,
  BEZEL_MIN_MM,
  BEZEL_MAX_MM,
  DESIGN_THICKNESS_MAX_BONUS,
  DESIGN_BEZEL_MAX_BONUS,
  DESIGN_COLOUR_COUNT_MULTIPLIER,
  DESIGN_COLOUR_PREMIUM_FACTOR,
  DESIGN_BEZEL_EXPONENT,
  DESIGN_COLOUR_BASE_COST,
  DESIGN_COLOUR_BONUS_DIVISOR,
  applyDisplayMultiplier,
  coolingMultiplier,
  availableVolumeCm3,
  totalConsumedVolumeCm3,
} from "./constants";
import { getScreenSizeDef } from "../../data/screenSizes";
import { PORT_TYPES } from "../../data/portTypes";
import { COLOUR_OPTIONS } from "../../data/colourOptions";
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
  const allChassisOptions = getAllChassisOptions(state.chassis);
  for (const opt of allChassisOptions) {
    if (!opt) continue;
    for (const [stat, value] of Object.entries(opt.stats)) {
      totals[stat as LaptopStat] = (totals[stat as LaptopStat] ?? 0) + (value as number);
    }
  }

  // Design bonus from thinness, bezel, and colour range
  const tRaw = 1 - (state.thicknessCm - THICKNESS_MIN_CM) / (THICKNESS_MAX_CM - THICKNESS_MIN_CM);
  const thicknessBonus = Math.round(tRaw * tRaw * tRaw * DESIGN_THICKNESS_MAX_BONUS);
  const bRaw = 1 - (state.bezelMm - BEZEL_MIN_MM) / (BEZEL_MAX_MM - BEZEL_MIN_MM);
  const bezelBonus = Math.round(Math.pow(bRaw, DESIGN_BEZEL_EXPONENT) * DESIGN_BEZEL_MAX_BONUS);
  const avgColourCost = state.selectedColours.reduce((sum, id) => {
    const opt = COLOUR_OPTIONS.find((c) => c.id === id);
    return sum + (opt?.costPerUnit ?? 0);
  }, 0) / (state.selectedColours.length || 1);
  const countBonus = Math.sqrt(state.selectedColours.length) * DESIGN_COLOUR_COUNT_MULTIPLIER;
  const premiumMultiplier = 1 + (avgColourCost - DESIGN_COLOUR_BASE_COST) * DESIGN_COLOUR_PREMIUM_FACTOR;
  const colourBonus = Math.round((countBonus * premiumMultiplier) / DESIGN_COLOUR_BONUS_DIVISOR);
  totals.design = (totals.design ?? 0) + thicknessBonus + bezelBonus + colourBonus;

  // Performance penalty when cooling is insufficient (quadratic curve)
  let totalPower = 0;
  for (const [slot, comp] of Object.entries(state.components)) {
    if (!comp) continue;
    totalPower += applyDisplayMultiplier(comp.powerDrawW, slot, displayMult);
  }
  if (totalPower > 0) {
    const coolingFromSolution = state.chassis.coolingSolution?.coolingCapacityW ?? 0;
    const totalVolume = totalConsumedVolumeCm3(state.components, state.batteryCapacityWh, state.ports, allChassisOptions);
    const totalAvailable = availableVolumeCm3(state.screenSize, state.bezelMm, state.thicknessCm, gameYear);
    const spaceUtil = totalAvailable > 0 ? totalVolume / totalAvailable : 1;
    const coolMult = coolingMultiplier(state.thicknessCm, state.bezelMm, spaceUtil);
    const effectiveCooling = coolingFromSolution * coolMult;
    if (totalPower > effectiveCooling) {
      const deficit = 1 - effectiveCooling / totalPower; // 0–1
      // Immediate 10% base penalty + cubic ramp for severe deficits
      const penalty = 0.1 + 0.9 * deficit * deficit * (1 + deficit);
      const perfLoss = Math.round((totals.performance ?? 0) * Math.min(1, penalty));
      const gamingLoss = Math.round((totals.gamingPerformance ?? 0) * Math.min(1, penalty));
      totals.performance = Math.max(0, (totals.performance ?? 0) - perfLoss);
      totals.gamingPerformance = Math.max(0, (totals.gamingPerformance ?? 0) - gamingLoss);
    }
  }

  // Clamp all stats to 0 minimum
  for (const key of Object.keys(totals) as LaptopStat[]) {
    if ((totals[key] ?? 0) < 0) totals[key] = 0;
  }

  return totals;
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
