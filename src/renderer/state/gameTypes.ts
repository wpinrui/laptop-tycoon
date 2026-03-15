import {
  Component,
  ComponentSlot,
  ChassisOption,
  ScreenSizeInches,
  DemographicId,
} from "../../data/types";
import { FullManufacturingPlan } from "../manufacturing/types";
import { COMPETITORS, CompetitorArchetype } from "../../data/competitors";
import { YearSimulationResult, QuarterSimulationResult } from "../../simulation/salesTypes";
import { LaptopReview, Award } from "../../simulation/reviewsAwards";
import { MarketingTier } from "../../data/types";
import { PERCEPTION_CONTRIBUTION_SCALE, PERCEPTION_WINDOW_SIZE } from "../../simulation/tunables";

export type ModelType = "brandNew" | "successor" | "specBump";

export interface LaptopDesign {
  id: string;
  name: string;
  modelType: ModelType;
  predecessorId: string | null;
  screenSize: ScreenSizeInches;
  components: Partial<Record<ComponentSlot, Component>>;
  ports: Record<string, number>;
  batteryCapacityWh: number;
  thicknessCm: number;
  bezelMm: number;
  chassis: {
    material: ChassisOption | null;
    coolingSolution: ChassisOption | null;
    keyboardFeature: ChassisOption | null;
    trackpadFeature: ChassisOption | null;
  };
  selectedColours: string[];
  unitCost: number;
}

export type ModelStatus = "draft" | "designed" | "manufacturing" | "onSale" | "discontinued";

export interface LaptopModel {
  design: LaptopDesign;
  status: ModelStatus;
  retailPrice: number | null;
  manufacturingQuantity: number | null;
  yearDesigned: number;
  manufacturingPlan: FullManufacturingPlan | null;
  /** Prior-quarter plan saved when an additional order replaces it, so it can be restored on cancel. */
  previousManufacturingPlan?: FullManufacturingPlan | null;
  /** Unsold units carried forward from previous year(s). */
  unitsInStock: number;
  /** Cumulative amount spent on manufacturing this model across all orders. */
  totalProductionSpend: number;
  /** Cumulative units ordered across all manufacturing orders. */
  totalUnitsOrdered: number;
}

/** Returns true if any component in the design has been discontinued by the given year. */
export function hasDiscontinuedComponents(design: LaptopDesign, year: number): boolean {
  for (const component of Object.values(design.components)) {
    if (component && component.yearDiscontinued < year) return true;
  }
  return false;
}

export interface CompanyState {
  id: string;
  name: string;
  isPlayer: boolean;
  brandReach: Record<DemographicId, number>;
  brandPerception: Record<DemographicId, number>;
  /** Rolling window of per-demographic quarterly experience scores (last 12 quarters). */
  perceptionHistory: Record<DemographicId, number[]>;
  models: LaptopModel[];
  archetype?: CompetitorArchetype;
  engineeringBonus?: number;
  /** AI-only: consecutive years with total sales below death-spiral threshold */
  consecutiveLowSalesYears?: number;
}

export type Quarter = 1 | 2 | 3 | 4;

export interface MarketingCampaign {
  demographicId: DemographicId;
  tier: MarketingTier;
  paused: boolean;
}

export interface GameState {
  companies: CompanyState[];
  companyLogo: string | null;
  year: number;
  quarter: Quarter;
  quarterSimulated: boolean;
  cash: number;
  /** Active marketing campaigns — persist until manually changed. */
  marketingCampaigns: MarketingCampaign[];
  yearHistory: YearSimulationResult[];
  lastSimulationResult: QuarterSimulationResult | null;
  /** Accumulated quarterly results for the current year (reset on year advance). */
  quarterHistory: QuarterSimulationResult[];
  /** Reviews published after Q1 for the current year (reset on year advance). */
  currentYearReviews: LaptopReview[];
  /** Awards published after Q4 for the most recently completed year. */
  currentYearAwards: Award[];
}

/** Get the player's company from the unified companies array. */
export function getPlayerCompany(state: GameState): CompanyState {
  return state.companies.find((c) => c.isPlayer)!;
}

/** Format a laptop's display name as "CompanyName ModelName". */
export function modelDisplayName(companyName: string, designName: string): string {
  return `${companyName} ${designName}`;
}

/**
 * Create initial perception history from starting perception values.
 * Seeds 12 quarters so that mean(history) * PERCEPTION_CONTRIBUTION_SCALE = initialPerception.
 */
function initPerceptionHistory(
  perception: Record<DemographicId, number>,
): Record<DemographicId, number[]> {
  const history: Partial<Record<DemographicId, number[]>> = {};
  for (const [demId, p] of Object.entries(perception)) {
    history[demId as DemographicId] = Array(PERCEPTION_WINDOW_SIZE).fill(p / PERCEPTION_CONTRIBUTION_SCALE);
  }
  return history as Record<DemographicId, number[]>;
}

export const STARTING_CASH = 50_000_000;
export const AI_STARTING_YEAR = 2000;
export const STARTING_YEAR = AI_STARTING_YEAR + 1;

const ZERO_DEMOGRAPHICS: Record<DemographicId, number> = {
  // Generalist
  corporate: 0,
  businessProfessional: 0,
  student: 0,
  creativeProfessional: 0,
  gamer: 0,
  techEnthusiast: 0,
  generalConsumer: 0,
  budgetBuyer: 0,
  developer: 0,
  educationK12: 0,
  // Niche
  videoEditor: 0,
  threeDArtist: 0,
  musicProducer: 0,
  esportsPro: 0,
  streamer: 0,
  digitalNomad: 0,
  fieldWorker: 0,
  writer: 0,
  dayTrader: 0,
  desktopReplacement: 0,
};

export function createInitialGameState(
  companyName: string,
  companyLogo: string | null,
): GameState {
  const playerPerception = { ...ZERO_DEMOGRAPHICS };
  const playerCompany: CompanyState = {
    id: "player",
    name: companyName,
    isPlayer: true,
    brandReach: { ...ZERO_DEMOGRAPHICS },
    brandPerception: playerPerception,
    perceptionHistory: initPerceptionHistory(playerPerception),
    models: [],
  };

  const aiCompanies: CompanyState[] = COMPETITORS.map((c) => ({
    id: c.id,
    name: c.name,
    isPlayer: false,
    brandReach: { ...c.brandReach },
    brandPerception: { ...c.brandPerception },
    perceptionHistory: initPerceptionHistory(c.brandPerception),
    models: [],
    archetype: c.archetype,
    engineeringBonus: c.engineeringBonus,
  }));

  return {
    companies: [playerCompany, ...aiCompanies],
    companyLogo,
    year: AI_STARTING_YEAR,
    quarter: 1 as Quarter,
    quarterSimulated: false,
    cash: STARTING_CASH,
    marketingCampaigns: [],
    yearHistory: [],
    lastSimulationResult: null,
    quarterHistory: [],
    currentYearReviews: [],
    currentYearAwards: [],
  };
}
