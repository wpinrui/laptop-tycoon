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
  /** Unsold units carried forward from previous year(s). */
  unitsInStock: number;
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
  models: LaptopModel[];
  archetype?: CompetitorArchetype;
  engineeringBonus?: number;
  /** AI-only: consecutive years with total sales below death-spiral threshold */
  consecutiveLowSalesYears?: number;
}

export type Quarter = 1 | 2 | 3 | 4;

export interface GameState {
  companies: CompanyState[];
  companyLogo: string | null;
  year: number;
  quarter: Quarter;
  quarterSimulated: boolean;
  cash: number;
  brandAwarenessBudget: number;
  sponsorships: string[];
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

export const STARTING_CASH = 50_000_000;
export const STARTING_YEAR = 2000;

const ZERO_DEMOGRAPHICS: Record<DemographicId, number> = {
  corporate: 0,
  businessProfessional: 0,
  student: 0,
  creativeProfessional: 0,
  gamer: 0,
  techEnthusiast: 0,
  generalConsumer: 0,
  budgetBuyer: 0,
};

export function createInitialGameState(
  companyName: string,
  companyLogo: string | null,
): GameState {
  const playerCompany: CompanyState = {
    id: "player",
    name: companyName,
    isPlayer: true,
    brandReach: { ...ZERO_DEMOGRAPHICS },
    brandPerception: { ...ZERO_DEMOGRAPHICS },
    models: [],
  };

  const aiCompanies: CompanyState[] = COMPETITORS.map((c) => ({
    id: c.id,
    name: c.name,
    isPlayer: false,
    brandReach: { ...c.brandReach },
    brandPerception: { ...c.brandPerception },
    models: [],
    archetype: c.archetype,
    engineeringBonus: c.engineeringBonus,
  }));

  return {
    companies: [playerCompany, ...aiCompanies],
    companyLogo,
    year: STARTING_YEAR,
    quarter: 1 as Quarter,
    quarterSimulated: false,
    cash: STARTING_CASH,
    brandAwarenessBudget: 0,
    sponsorships: [],
    yearHistory: [],
    lastSimulationResult: null,
    quarterHistory: [],
    currentYearReviews: [],
    currentYearAwards: [],
  };
}
