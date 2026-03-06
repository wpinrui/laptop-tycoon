import {
  ScreenSizeInches,
  ComponentSlot,
  Component,
  ChassisOption,
} from "../../data/types";
import { SCREEN_SIZES } from "../../data/screenSizes";
import { MIN_BATTERY_WH, BATTERY_STEP_WH, maxBatteryWh, THICKNESS_DEFAULT_CM } from "./constants";

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
  metadata: "Metadata",
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
  batteryCapacityWh: number;
  thicknessCm: number;
  chassis: {
    material: ChassisOption | null;
    keyboardFeature: ChassisOption | null;
    trackpadFeature: ChassisOption | null;
  };
}

const DEFAULT_SIZE_DEF = SCREEN_SIZES[Math.floor(SCREEN_SIZES.length / 2)];

export const INITIAL_WIZARD_STATE: WizardState = {
  currentStep: "metadata",
  name: "",
  modelType: "brandNew",
  predecessorId: null,
  screenSize: DEFAULT_SIZE_DEF.size,
  components: {},
  batteryCapacityWh: (() => {
    const max = maxBatteryWh(DEFAULT_SIZE_DEF.baseBatteryCapacityWh);
    return Math.round((MIN_BATTERY_WH + max) / 2 / BATTERY_STEP_WH) * BATTERY_STEP_WH;
  })(),
  thicknessCm: THICKNESS_DEFAULT_CM,
  chassis: {
    material: null,
    keyboardFeature: null,
    trackpadFeature: null,
  },
};
