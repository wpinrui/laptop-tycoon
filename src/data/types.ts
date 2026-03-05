// --- Stats ---

export type LaptopStat =
  // Component-driven
  | "performance"
  | "gamingPerformance"
  | "batteryLife"
  | "display"
  | "connectivity"
  | "speakers"
  | "webcam"
  // Chassis-driven
  | "design"
  | "buildQuality"
  | "keyboard"
  | "trackpad"
  | "repairability"
  | "weight"
  | "thinness"
  | "thermals"
  // Spending-driven
  | "supportAndService";

export type StatVector = Partial<Record<LaptopStat, number>>;

// --- Screen Size ---

export type ScreenSizeClass =
  | "ultraportable"
  | "mainstreamPortable"
  | "standard"
  | "desktopReplacement";

export interface ScreenSizeDefinition {
  id: ScreenSizeClass;
  name: string;
  sizeRange: string;
  baseCoolingCapacityW: number;
  baseBatteryCapacityWh: number;
  baseWeightG: number;
}

export const SCREEN_SIZE_ORDER: ScreenSizeClass[] = [
  "ultraportable",
  "mainstreamPortable",
  "standard",
  "desktopReplacement",
];

// --- Components ---

export type ComponentSlot =
  | "cpu"
  | "gpu"
  | "ram"
  | "storage"
  | "display"
  | "battery"
  | "wifi"
  | "webcam"
  | "speakers"
  | "ports";

export interface ComponentSlotConfig {
  slot: ComponentSlot;
  name: string;
  statDecay: StatVector;
  costDecayRate: number;
}

export interface Component {
  id: string;
  name: string;
  slot: ComponentSlot;
  yearIntroduced: number;
  yearDiscontinued: number;
  costAtLaunch: number;
  powerDrawW: number;
  weightG: number;
  specs: Record<string, string>;
  stats: StatVector;
}

// --- Chassis ---

export type ChassisOptionSlot =
  | "material"
  | "keyboardFeature"
  | "trackpadFeature";

export interface ChassisOption {
  id: string;
  name: string;
  slot: ChassisOptionSlot;
  yearIntroduced: number;
  yearDiscontinued: number | null;
  costAtLaunch: number;
  costDecayRate: number;
  weightG: number;
  stats: StatVector;
  specs: Record<string, string>;
}

// --- Demographics ---

export type DemographicId =
  | "corporate"
  | "businessProfessional"
  | "student"
  | "creativeProfessional"
  | "gamer"
  | "techEnthusiast"
  | "generalConsumer"
  | "budgetBuyer";

export type PriceSensitivity = "low" | "moderate" | "high" | "veryHigh" | "extreme";

export interface ScreenSizePreference {
  preferred: ScreenSizeClass;
  oneAwayPenalty: number;
  twoAwayPenalty: number;
}

export interface Demographic {
  id: DemographicId;
  name: string;
  priceSensitivity: PriceSensitivity;
  screenSizePreference: ScreenSizePreference;
  statWeights: Record<LaptopStat, number>;
  description: string;
}

// --- Era Anchors ---

export interface EraAnchor {
  year: number;
  demandPool: Record<DemographicId, number>;
  description: string;
}
