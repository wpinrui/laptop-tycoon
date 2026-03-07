import { LaptopStat, ScreenSizeInches } from "./types";

export type CompetitorArchetype = "budget" | "premium" | "generalist";

export interface CompetitorDefinition {
  id: string;
  name: string;
  archetype: CompetitorArchetype;
  brandRecognition: number;
  statPriorities: {
    high: LaptopStat[];
    low: LaptopStat[];
  };
  pricingStrategy: {
    marginMultiplier: number;
  };
  screenSizePreference: ScreenSizeInches[];
  chassisPreferences: {
    materialTier: "low" | "mid" | "high";
    thicknessTarget: "thin" | "average" | "thick";
  };
  engineeringBonus: number;
}

export const COMPETITORS: CompetitorDefinition[] = [
  {
    id: "valuetech",
    name: "ValueTech",
    archetype: "budget",
    brandRecognition: 30,
    statPriorities: {
      high: [],
      low: ["buildQuality", "design", "supportAndService", "display"],
    },
    pricingStrategy: { marginMultiplier: 0.85 },
    screenSizePreference: [14, 15],
    chassisPreferences: {
      materialTier: "low",
      thicknessTarget: "thick",
    },
    engineeringBonus: 0,
  },
  {
    id: "prestige",
    name: "Prestige Computing",
    archetype: "premium",
    brandRecognition: 50,
    statPriorities: {
      high: ["design", "display", "buildQuality", "keyboard"],
      low: [],
    },
    pricingStrategy: { marginMultiplier: 1.15 },
    screenSizePreference: [13, 14, 15],
    chassisPreferences: {
      materialTier: "high",
      thicknessTarget: "thin",
    },
    engineeringBonus: 0,
  },
  {
    id: "omnibook",
    name: "OmniBook",
    archetype: "generalist",
    brandRecognition: 40,
    statPriorities: {
      high: [],
      low: [],
    },
    pricingStrategy: { marginMultiplier: 1.0 },
    screenSizePreference: [14, 15, 16],
    chassisPreferences: {
      materialTier: "mid",
      thicknessTarget: "average",
    },
    engineeringBonus: 0,
  },
];
