import {
  Component,
  ComponentSlot,
  ChassisOption,
  ScreenSizeInches,
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
  brandRecognition: number;
  models: LaptopModel[];
}

export interface GameState {
  companyName: string;
  companyLogo: string | null;
  year: number;
  yearSimulated: boolean;
  cash: number;
  brandRecognition: number;
  nicheReputation: Record<string, number>;
  models: LaptopModel[];
  competitors: CompetitorState[];
  yearHistory: YearSimulationResult[];
  lastSimulationResult: YearSimulationResult | null;
}

export const STARTING_CASH = 50_000_000;
export const STARTING_YEAR = 2000;

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
    brandRecognition: 0,
    nicheReputation: {},
    models: [],
    competitors: COMPETITORS.map((c) => ({
      id: c.id,
      name: c.name,
      archetype: c.archetype,
      brandRecognition: c.brandRecognition,
      models: [],
    })),
    yearHistory: [],
    lastSimulationResult: null,
  };
}
