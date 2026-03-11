import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { ManufacturingWizardState, ManufacturingWizardStep, MFG_WIZARD_STEPS, FullManufacturingPlan } from "./types";
import { DEMAND_NOISE_MIN, DEMAND_NOISE_MAX, DEFAULT_PRICE_MULTIPLIER, MIN_RETAIL_PRICE, snapPrice, getBaseCostPerUnit } from "./utils/constants";
import { AD_CAMPAIGNS } from "./data/campaigns";

type MfgWizardAction =
  | { type: "INIT"; modelId: string; promptIds: number[]; baseBomCost: number; isAdditionalOrder?: boolean; existingRetailPrice?: number }
  | { type: "LOAD_PLAN"; modelId: string; plan: FullManufacturingPlan; isAdditionalOrder?: boolean }
  | { type: "SET_CAMPAIGN"; campaignId: string | null }
  | { type: "SET_UNIT_PRICE"; unitPrice: number }
  | { type: "SET_UNITS_ORDERED"; unitsOrdered: number }
  | { type: "SET_PRESS_RESPONSE"; promptId: number; response: string }
  | { type: "GO_TO_STEP"; step: ManufacturingWizardStep }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" };

function generateNoiseMargin(): number {
  return DEMAND_NOISE_MIN + Math.random() * (DEMAND_NOISE_MAX - DEMAND_NOISE_MIN);
}

const DEFAULT_CAMPAIGN_ID = AD_CAMPAIGNS[0].id;

const INITIAL_STATE: ManufacturingWizardState = {
  currentStep: "manufacturing",
  modelId: "",
  campaignId: DEFAULT_CAMPAIGN_ID,
  unitPrice: 0,
  unitsOrdered: 1000,
  pressReleasePromptIds: [],
  pressReleaseResponses: {},
  noiseMargin: generateNoiseMargin(),
  isAdditionalOrder: false,
};

function mfgWizardReducer(state: ManufacturingWizardState, action: MfgWizardAction): ManufacturingWizardState {
  switch (action.type) {
    case "INIT": {
      const baseTotalPerUnit = getBaseCostPerUnit(action.baseBomCost);
      const defaultPrice = action.existingRetailPrice ?? Math.max(MIN_RETAIL_PRICE, snapPrice(baseTotalPerUnit * DEFAULT_PRICE_MULTIPLIER));
      return {
        ...INITIAL_STATE,
        modelId: action.modelId,
        unitPrice: defaultPrice,
        pressReleasePromptIds: action.promptIds,
        noiseMargin: generateNoiseMargin(),
        isAdditionalOrder: action.isAdditionalOrder ?? false,
      };
    }
    case "LOAD_PLAN":
      return {
        ...INITIAL_STATE,
        modelId: action.modelId,
        campaignId: action.plan.marketing.campaignId ?? DEFAULT_CAMPAIGN_ID,
        unitPrice: action.plan.manufacturing.unitPrice,
        unitsOrdered: action.plan.manufacturing.unitsOrdered,
        pressReleasePromptIds: action.plan.pressRelease.promptIds,
        pressReleaseResponses: { ...action.plan.pressRelease.responses },
        noiseMargin: generateNoiseMargin(),
        isAdditionalOrder: action.isAdditionalOrder ?? false,
      };
    case "SET_CAMPAIGN":
      return { ...state, campaignId: action.campaignId };
    case "SET_UNIT_PRICE":
      return { ...state, unitPrice: action.unitPrice };
    case "SET_UNITS_ORDERED":
      return { ...state, unitsOrdered: action.unitsOrdered };
    case "SET_PRESS_RESPONSE":
      return {
        ...state,
        pressReleaseResponses: {
          ...state.pressReleaseResponses,
          [action.promptId]: action.response,
        },
      };
    case "GO_TO_STEP":
      return { ...state, currentStep: action.step };
    case "NEXT_STEP": {
      const idx = MFG_WIZARD_STEPS.indexOf(state.currentStep);
      if (idx < MFG_WIZARD_STEPS.length - 1) {
        return { ...state, currentStep: MFG_WIZARD_STEPS[idx + 1] };
      }
      return state;
    }
    case "PREV_STEP": {
      const idx = MFG_WIZARD_STEPS.indexOf(state.currentStep);
      if (idx > 0) {
        return { ...state, currentStep: MFG_WIZARD_STEPS[idx - 1] };
      }
      return state;
    }
    default:
      return state;
  }
}

interface MfgWizardContextValue {
  state: ManufacturingWizardState;
  dispatch: Dispatch<MfgWizardAction>;
}

const MfgWizardContext = createContext<MfgWizardContextValue | null>(null);

export function ManufacturingWizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mfgWizardReducer, INITIAL_STATE);
  return (
    <MfgWizardContext.Provider value={{ state, dispatch }}>
      {children}
    </MfgWizardContext.Provider>
  );
}

export function useMfgWizard(): MfgWizardContextValue {
  const ctx = useContext(MfgWizardContext);
  if (!ctx) {
    throw new Error("useMfgWizard must be used within a ManufacturingWizardProvider");
  }
  return ctx;
}
