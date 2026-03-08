import { DemographicId, LaptopStat, ScreenSizeInches } from "./types";

export type CompetitorArchetype = "budget" | "premium" | "generalist";

export interface CompetitorDefinition {
  id: string;
  name: string;
  archetype: CompetitorArchetype;
  brandReach: Record<DemographicId, number>;
  brandPerception: number;
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
    brandReach: {
      corporate: 15,
      businessProfessional: 10,
      student: 40,
      creativeProfessional: 5,
      gamer: 10,
      techEnthusiast: 20,
      generalConsumer: 35,
      budgetBuyer: 50,
    },
    brandPerception: -5,
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
    brandReach: {
      corporate: 40,
      businessProfessional: 55,
      student: 20,
      creativeProfessional: 60,
      gamer: 15,
      techEnthusiast: 35,
      generalConsumer: 30,
      budgetBuyer: 10,
    },
    brandPerception: 15,
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
    brandReach: {
      corporate: 35,
      businessProfessional: 30,
      student: 30,
      creativeProfessional: 25,
      gamer: 20,
      techEnthusiast: 25,
      generalConsumer: 40,
      budgetBuyer: 30,
    },
    brandPerception: 5,
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
