import {
  Component,
  ComponentSlot,
  ChassisOption,
  ScreenSizeInches,
  DemographicId,
} from "../../data/types";
import { FullManufacturingPlan } from "../manufacturing/types";
import { COMPETITORS, CompetitorArchetype } from "../../data/competitors";
import { YearSimulationResult } from "../../simulation/salesTypes";

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

export type ModelStatus = "draft" | "manufacturing" | "onSale" | "discontinued";

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

export interface CompetitorState {
  id: string;
  name: string;
  archetype: CompetitorArchetype;
  brandReach: Record<DemographicId, number>;
  brandPerception: number;
  models: LaptopModel[];
}

export interface GameState {
  companyName: string;
  companyLogo: string | null;
  year: number;
  yearSimulated: boolean;
  cash: number;
  brandReach: Record<DemographicId, number>;
  brandPerception: number;
  brandAwarenessBudget: number;
  sponsorships: string[];
  nicheReputation: Record<string, number>;
  models: LaptopModel[];
  competitors: CompetitorState[];
  yearHistory: YearSimulationResult[];
  lastSimulationResult: YearSimulationResult | null;
}

export const STARTING_CASH = 50_000_000;
export const STARTING_YEAR = 2000;

const ZERO_REACH: Record<DemographicId, number> = {
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
  return {
    companyName,
    companyLogo,
    year: STARTING_YEAR,
    yearSimulated: false,
    cash: STARTING_CASH,
    brandReach: { ...ZERO_REACH },
    brandPerception: 0,
    brandAwarenessBudget: 0,
    sponsorships: [],
    nicheReputation: {},
    models: [],
    competitors: COMPETITORS.map((c) => ({
      id: c.id,
      name: c.name,
      archetype: c.archetype,
      brandReach: { ...c.brandReach },
      brandPerception: c.brandPerception,
      models: [],
    })),
    yearHistory: [],
    lastSimulationResult: null,
  };
}
