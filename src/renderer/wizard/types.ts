import {
  ScreenSizeInches,
  ComponentSlot,
  Component,
  ChassisOption,
} from "../../data/types";
import { SCREEN_SIZES } from "../../data/screenSizes";
import {
  MIN_BATTERY_WH,
  MAX_BATTERY_WH,
  BATTERY_STEP_WH,
  THICKNESS_DEFAULT_CM,
  BEZEL_DEFAULT_MM,
} from "./constants";

export type WizardStep =
  | "metadata"
  | "screenSize"
  | "processing"
  | "display"
  | "mediaConnectivity"
  | "battery"
  | "body"
  | "review";

export const WIZARD_STEPS: WizardStep[] = [
  "metadata",
  "screenSize",
  "processing",
  "display",
  "mediaConnectivity",
  "battery",
  "body",
  "review",
];

export const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
  metadata: "Laptop Info",
  screenSize: "Screen Size",
  processing: "Processing",
  display: "Display",
  mediaConnectivity: "Media & Connectivity",
  battery: "Battery",
  body: "Body",
  review: "Review",
};

export type ModelType = "brandNew" | "successor" | "specBump";

export interface WizardState {
  currentStep: WizardStep;
  name: string;
  modelType: ModelType;
  predecessorId: string | null;
  screenSize: ScreenSizeInches;
  components: Partial<Record<ComponentSlot, Component>>;
  /** Port counts keyed by PortType id. */
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
  visitedSteps: Set<WizardStep>;
}

const DEFAULT_SIZE_DEF = SCREEN_SIZES.find((s) => s.size === 10) ?? SCREEN_SIZES[0];

export function getAllChassisOptions(chassis: WizardState["chassis"]): (ChassisOption | null)[] {
  return [chassis.material, chassis.coolingSolution, chassis.keyboardFeature, chassis.trackpadFeature];
}

export const INITIAL_WIZARD_STATE: WizardState = {
  currentStep: "metadata",
  name: "",
  modelType: "brandNew",
  predecessorId: null,
  screenSize: DEFAULT_SIZE_DEF.size,
  components: {},
  ports: {},
  batteryCapacityWh: MIN_BATTERY_WH,
  thicknessCm: THICKNESS_DEFAULT_CM,
  bezelMm: BEZEL_DEFAULT_MM,
  chassis: {
    material: null,
    coolingSolution: null,
    keyboardFeature: null,
    trackpadFeature: null,
  },
  visitedSteps: new Set<WizardStep>(["metadata"]),
};
