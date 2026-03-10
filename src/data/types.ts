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
  | "weight"
  | "thinness"
  | "thermals";

export type StatVector = Partial<Record<LaptopStat, number>>;

export const ALL_STATS: LaptopStat[] = [
  "performance", "gamingPerformance", "batteryLife", "display", "connectivity",
  "speakers", "webcam", "design", "buildQuality", "keyboard", "trackpad",
  "weight", "thinness", "thermals",
];

/** Human-readable labels for each laptop stat. */
export const STAT_LABELS: Record<LaptopStat, string> = {
  performance: "Performance",
  gamingPerformance: "Gaming Performance",
  batteryLife: "Battery Life",
  display: "Display",
  connectivity: "Connectivity",
  speakers: "Speakers",
  webcam: "Webcam",
  design: "Design",
  buildQuality: "Build Quality",
  keyboard: "Keyboard",
  trackpad: "Trackpad",
  weight: "Weight",
  thinness: "Thinness",
  thermals: "Thermals",
};

// --- Screen Size ---

export type ScreenSizeInches = 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18;

export interface ScreenSizeDefinition {
  size: ScreenSizeInches;
  baseCoolingCapacityW: number;
  baseBatteryCapacityWh: number;
  baseWeightG: number;
  /** Multiplier for display component cost/power/weight. 14" = 1.0 reference. */
  displayMultiplier: number;
}

// --- Components ---

export type ComponentSlot =
  | "cpu"
  | "gpu"
  | "ram"
  | "storage"
  | "resolution"
  | "displayTech"
  | "displaySurface"
  | "wifi"
  | "webcam"
  | "speakers";

export interface ComponentSlotConfig {
  slot: ComponentSlot;
  name: string;
  statDecay: StatVector;
  costDecayRate: number;
}

export interface Component {
  id: string;
  name: string;
  /** Short player-facing description explaining what this component is and its trade-offs. */
  description: string;
  slot: ComponentSlot;
  yearIntroduced: number;
  yearDiscontinued: number;
  costAtLaunch: number;
  powerDrawW: number;
  weightG: number;
  /** Internal volume consumed (cm³). Competes for chassis space. */
  volumeCm3: number;
  /** Minimum chassis thickness required to fit this component (cm). 0 = no constraint. */
  minThicknessCm: number;
  specs: Record<string, string>;
  stats: StatVector;
}

// --- Ports ---

export interface PortType {
  id: string;
  name: string;
  /** Short player-facing description explaining what this port is used for. */
  description: string;
  /** Category for grouping in the UI. */
  category: "usb" | "video" | "networking" | "expansion" | "audio" | "legacy";
  yearIntroduced: number;
  yearDiscontinued: number | null;
  maxCount: number;
  costPerPort: number;
  weightPerPortG: number;
  /** Volume per port (cm³). */
  volumePerPortCm3: number;
  /** Minimum chassis thickness needed for this port (cm). e.g., RJ45 is tall. */
  minThicknessCm: number;
  stats: StatVector;
  specs: Record<string, string>;
}

// --- Chassis ---

export type ChassisOptionSlot =
  | "material"
  | "coolingSolution"
  | "keyboardFeature"
  | "trackpadFeature";

export interface ChassisOption {
  id: string;
  name: string;
  /** Short player-facing description explaining this option's trade-offs. */
  description: string;
  slot: ChassisOptionSlot;
  yearIntroduced: number;
  yearDiscontinued: number | null;
  costAtLaunch: number;
  costDecayRate: number;
  weightG: number;
  /** Internal volume consumed (cm³). Cooling solutions take significant space. */
  volumeCm3: number;
  /** Minimum chassis thickness required (cm). 0 = no constraint. */
  minThicknessCm: number;
  /** Cooling capacity in watts. Only relevant for coolingSolution slot. */
  coolingCapacityW: number;
  /** Multiplier on chassis shell density. Only relevant for material slot. 1.0 = plastic baseline. */
  shellDensityMultiplier: number;
  stats: StatVector;
  specs: Record<string, string>;
}

// --- Battery ---

export interface BatteryEraConfig {
  yearStart: number;
  yearEnd: number;
  costPerWh: number;
  weightPerWh: number;
  volumePerWh: number;
  techLabel: string;
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

export interface ScreenSizePreference {
  preferredMin: ScreenSizeInches;
  preferredMax: ScreenSizeInches;
  penaltyPerInch: number;
}

export interface Demographic {
  id: DemographicId;
  name: string;
  screenSizePreference: ScreenSizePreference;
  /** Weights across all 14 laptop stats. statWeights + priceWeight must sum to 1.0. */
  statWeights: Record<LaptopStat, number>;
  /** Weight for price score (cheaper = higher score). statWeights + priceWeight must sum to 1.0. */
  priceWeight: number;
  description: string;
}

// --- Starting Demand ---

export type StartingDemandPool = Record<DemographicId, number>;
