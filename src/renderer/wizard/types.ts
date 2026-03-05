import {
  ScreenSizeInches,
  ComponentSlot,
  Component,
  ChassisOption,
} from "../../data/types";

export type WizardStep =
  | "metadata"
  | "screenSize"
  | "processing"
  | "displayMedia"
  | "connectivityPower"
  | "body"
  | "review";

export const WIZARD_STEPS: WizardStep[] = [
  "metadata",
  "screenSize",
  "processing",
  "displayMedia",
  "connectivityPower",
  "body",
  "review",
];

export const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
  metadata: "Metadata",
  screenSize: "Screen Size",
  processing: "Processing",
  displayMedia: "Display & Media",
  connectivityPower: "Connectivity & Power",
  body: "Body",
  review: "Review",
};

export type ModelType = "brandNew" | "successor" | "specBump";

export interface WizardState {
  currentStep: WizardStep;
  name: string;
  modelType: ModelType;
  predecessorId: string | null;
  screenSize: ScreenSizeInches | null;
  components: Partial<Record<ComponentSlot, Component>>;
  chassis: {
    material: ChassisOption | null;
    keyboardFeature: ChassisOption | null;
    trackpadFeature: ChassisOption | null;
  };
}

export const INITIAL_WIZARD_STATE: WizardState = {
  currentStep: "metadata",
  name: "",
  modelType: "brandNew",
  predecessorId: null,
  screenSize: null,
  components: {},
  chassis: {
    material: null,
    keyboardFeature: null,
    trackpadFeature: null,
  },
};
