import {
  ScreenSizeInches,
  ComponentSlot,
  Component,
  ChassisOption,
} from "../../data/types";

export type WizardStep =
  | "screenSize"
  | "processing"
  | "displayMedia"
  | "connectivityPower"
  | "body"
  | "review";

export const WIZARD_STEPS: WizardStep[] = [
  "screenSize",
  "processing",
  "displayMedia",
  "connectivityPower",
  "body",
  "review",
];

export const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
  screenSize: "Screen Size",
  processing: "Processing",
  displayMedia: "Display & Media",
  connectivityPower: "Connectivity & Power",
  body: "Body",
  review: "Review",
};

export interface WizardState {
  currentStep: WizardStep;
  screenSize: ScreenSizeInches | null;
  components: Partial<Record<ComponentSlot, Component>>;
  chassis: {
    material: ChassisOption | null;
    keyboardFeature: ChassisOption | null;
    trackpadFeature: ChassisOption | null;
  };
}

export const INITIAL_WIZARD_STATE: WizardState = {
  currentStep: "screenSize",
  screenSize: null,
  components: {},
  chassis: {
    material: null,
    keyboardFeature: null,
    trackpadFeature: null,
  },
};
