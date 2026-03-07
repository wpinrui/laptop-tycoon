export type ManufacturingWizardStep =
  | "marketing"
  | "manufacturing"
  | "pressRelease"
  | "confirmation";

export const MFG_WIZARD_STEPS: ManufacturingWizardStep[] = [
  "marketing",
  "manufacturing",
  "pressRelease",
  "confirmation",
];

export const MFG_STEP_LABELS: Record<ManufacturingWizardStep, string> = {
  marketing: "Marketing",
  manufacturing: "Manufacturing & Pricing",
  pressRelease: "Press Release",
  confirmation: "Confirm",
};

export interface AdCampaign {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  distribution: {
    mean: number;
    stdDev: number;
    skew: number;
    min: number;
    max: number;
  };
}

export interface MarketingPlan {
  campaignId: string | null;
  cost: number;
}

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
  marketing: MarketingPlan;
  manufacturing: ManufacturingPlan;
  pressRelease: PressRelease;
  results?: {
    campaignBonusPercent: number;
    unitsSold: number;
    revenue: number;
    profit: number;
    unsoldUnits: number;
  };
}

export interface ManufacturingWizardState {
  currentStep: ManufacturingWizardStep;
  modelId: string;
  campaignId: string | null;
  unitPrice: number;
  unitsOrdered: number;
  supportBudget: number;
  pressReleasePromptIds: number[];
  pressReleaseResponses: Record<number, string>;
  noiseMargin: number;
}
