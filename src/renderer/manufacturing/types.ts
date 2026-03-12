export type ManufacturingWizardStep =
  | "manufacturing"
  | "pressRelease"
  | "confirmation";

export const MFG_WIZARD_STEPS: ManufacturingWizardStep[] = [
  "manufacturing",
  "pressRelease",
  "confirmation",
];

export const MFG_STEP_LABELS: Record<ManufacturingWizardStep, string> = {
  manufacturing: "Manufacturing & Pricing",
  pressRelease: "Press Release",
  confirmation: "Confirm",
};

export interface ManufacturingPlan {
  unitPrice: number;
  unitsOrdered: number;
  unitCost: number;
  totalCost: number;
}

export interface PressReleasePrompt {
  id: number;
  text: string;
  example: string;
  requiresModelType?: "successor" | "specBump";
}

export interface PressRelease {
  promptIds: number[];
  responses: Record<number, string>;
}

export interface FullManufacturingPlan {
  laptopModelId: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  manufacturing: ManufacturingPlan;
  pressRelease: PressRelease;
  results?: {
    campaignPerceptionMod: number;
    unitsSold: number;
    revenue: number;
    profit: number;
    unsoldUnits: number;
  };
}

export interface ManufacturingWizardState {
  currentStep: ManufacturingWizardStep;
  modelId: string;
  unitPrice: number;
  unitsOrdered: number;
  pressReleasePromptIds: number[];
  pressReleaseResponses: Record<number, string>;
  noiseMargin: number;
  /** True when placing an additional order on a model that already has a prior-quarter plan this year. */
  isAdditionalOrder: boolean;
}
