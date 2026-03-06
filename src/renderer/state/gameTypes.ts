import {
  Component,
  ComponentSlot,
  ChassisOption,
  ScreenSizeInches,
} from "../../data/types";

export interface LaptopDesign {
  id: string;
  name: string;
  modelType: "brandNew" | "successor" | "specBump";
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
  };
}
