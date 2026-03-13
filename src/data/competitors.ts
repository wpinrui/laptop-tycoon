import { DemographicId, LaptopStat, ScreenSizeInches } from "./types";

export type CompetitorArchetype = "budget" | "premium" | "generalist";

export interface CompetitorDefinition {
  id: string;
  name: string;
  productLine: string;
  archetype: CompetitorArchetype;
  brandReach: Record<DemographicId, number>;
  brandPerception: Record<DemographicId, number>;
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
    productLine: "EconoBook",
    archetype: "budget",
    brandReach: {
      // Generalist
      corporate: 15,
      businessProfessional: 10,
      student: 40,
      creativeProfessional: 5,
      gamer: 10,
      techEnthusiast: 20,
      generalConsumer: 35,
      budgetBuyer: 50,
      developer: 10,
      educationK12: 30,
      // Niche — budget brand has minimal niche presence
      videoEditor: 5,
      threeDArtist: 0,
      musicProducer: 5,
      esportsPro: 0,
      streamer: 5,
      digitalNomad: 15,
      fieldWorker: 20,
      writer: 15,
      dayTrader: 0,
      desktopReplacement: 15,
    },
    brandPerception: {
      // Generalist
      corporate: -10,
      businessProfessional: -15,
      student: 10,
      creativeProfessional: -10,
      gamer: -5,
      techEnthusiast: 0,
      generalConsumer: 5,
      budgetBuyer: 25,
      developer: -5,
      educationK12: 15,
      // Niche
      videoEditor: -10,
      threeDArtist: -15,
      musicProducer: -5,
      esportsPro: -15,
      streamer: -5,
      digitalNomad: 0,
      fieldWorker: 5,
      writer: 5,
      dayTrader: -10,
      desktopReplacement: 0,
    },
    statPriorities: {
      high: [],
      low: ["buildQuality", "design", "display"],
    },
    pricingStrategy: { marginMultiplier: 1.15 },
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
    productLine: "EliteBook",
    archetype: "premium",
    brandReach: {
      // Generalist
      corporate: 40,
      businessProfessional: 55,
      student: 20,
      creativeProfessional: 60,
      gamer: 15,
      techEnthusiast: 35,
      generalConsumer: 30,
      budgetBuyer: 10,
      developer: 30,
      educationK12: 10,
      // Niche — premium brand reaches professional niches
      videoEditor: 45,
      threeDArtist: 50,
      musicProducer: 35,
      esportsPro: 10,
      streamer: 15,
      digitalNomad: 40,
      fieldWorker: 5,
      writer: 30,
      dayTrader: 35,
      desktopReplacement: 20,
    },
    brandPerception: {
      // Generalist
      corporate: 10,
      businessProfessional: 20,
      student: -5,
      creativeProfessional: 25,
      gamer: -10,
      techEnthusiast: 10,
      generalConsumer: 5,
      budgetBuyer: -20,
      developer: 15,
      educationK12: -10,
      // Niche
      videoEditor: 20,
      threeDArtist: 20,
      musicProducer: 15,
      esportsPro: 0,
      streamer: 5,
      digitalNomad: 15,
      fieldWorker: -5,
      writer: 15,
      dayTrader: 10,
      desktopReplacement: 5,
    },
    statPriorities: {
      high: ["design", "display", "buildQuality", "keyboard"],
      low: [],
    },
    pricingStrategy: { marginMultiplier: 1.40 },
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
    productLine: "Voyager",
    archetype: "generalist",
    brandReach: {
      // Generalist
      corporate: 35,
      businessProfessional: 30,
      student: 30,
      creativeProfessional: 25,
      gamer: 20,
      techEnthusiast: 25,
      generalConsumer: 40,
      budgetBuyer: 30,
      developer: 20,
      educationK12: 25,
      // Niche — generalist has shallow presence everywhere
      videoEditor: 15,
      threeDArtist: 10,
      musicProducer: 10,
      esportsPro: 5,
      streamer: 10,
      digitalNomad: 20,
      fieldWorker: 15,
      writer: 20,
      dayTrader: 15,
      desktopReplacement: 25,
    },
    brandPerception: {
      // Generalist
      corporate: 10,
      businessProfessional: 8,
      student: 7,
      creativeProfessional: 5,
      gamer: 5,
      techEnthusiast: 6,
      generalConsumer: 10,
      budgetBuyer: 7,
      developer: 5,
      educationK12: 5,
      // Niche
      videoEditor: 3,
      threeDArtist: 3,
      musicProducer: 3,
      esportsPro: 0,
      streamer: 3,
      digitalNomad: 5,
      fieldWorker: 5,
      writer: 5,
      dayTrader: 5,
      desktopReplacement: 5,
    },
    statPriorities: {
      high: [],
      low: [],
    },
    pricingStrategy: { marginMultiplier: 1.25 },
    screenSizePreference: [14, 15, 16],
    chassisPreferences: {
      materialTier: "mid",
      thicknessTarget: "average",
    },
    engineeringBonus: 0,
  },
];
