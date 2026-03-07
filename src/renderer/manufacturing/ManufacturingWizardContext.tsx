import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { ManufacturingWizardState, ManufacturingWizardStep, MFG_WIZARD_STEPS, FullManufacturingPlan } from "./types";
import { DEMAND_NOISE_MIN, DEMAND_NOISE_MAX, ASSEMBLY_QA_COST, PACKAGING_LOGISTICS_COST } from "./utils/constants";

type MfgWizardAction =
  | { type: "INIT"; modelId: string; promptIds: number[]; baseBomCost: number }
  | { type: "LOAD_PLAN"; modelId: string; plan: FullManufacturingPlan }
  | { type: "SET_CAMPAIGN"; campaignId: string | null }
  | { type: "SET_UNIT_PRICE"; unitPrice: number }
  | { type: "SET_UNITS_ORDERED"; unitsOrdered: number }
  | { type: "SET_SUPPORT_BUDGET"; supportBudget: number }
  | { type: "SET_PRESS_RESPONSE"; promptId: number; response: string }
  | { type: "GO_TO_STEP"; step: ManufacturingWizardStep }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" };

function generateNoiseMargin(): number {
  return DEMAND_NOISE_MIN + Math.random() * (DEMAND_NOISE_MAX - DEMAND_NOISE_MIN);
}

const INITIAL_STATE: ManufacturingWizardState = {
  currentStep: "marketing",
  modelId: "",
  campaignId: null,
  unitPrice: 0,
  unitsOrdered: 1000,
  supportBudget: 15,
  pressReleasePromptIds: [],
  pressReleaseResponses: {},
  noiseMargin: generateNoiseMargin(),
};

function mfgWizardReducer(state: ManufacturingWizardState, action: MfgWizardAction): ManufacturingWizardState {
  switch (action.type) {
    case "INIT": {
      const baseTotalPerUnit = action.baseBomCost + ASSEMBLY_QA_COST + PACKAGING_LOGISTICS_COST + INITIAL_STATE.supportBudget;
      const defaultPrice = Math.max(49, Math.round(baseTotalPerUnit * 1.5 / 50) * 50 - 1);
      return {
        ...INITIAL_STATE,
        modelId: action.modelId,
        unitPrice: defaultPrice,
        pressReleasePromptIds: action.promptIds,
        noiseMargin: generateNoiseMargin(),
      };
    }
    case "LOAD_PLAN":
      return {
        ...INITIAL_STATE,
        modelId: action.modelId,
        campaignId: action.plan.marketing.campaignId,
        unitPrice: action.plan.manufacturing.unitPrice,
        unitsOrdered: action.plan.manufacturing.unitsOrdered,
        supportBudget: action.plan.manufacturing.supportBudget,
        pressReleasePromptIds: action.plan.pressRelease.promptIds,
        pressReleaseResponses: { ...action.plan.pressRelease.responses },
        noiseMargin: generateNoiseMargin(),
      };
    case "SET_CAMPAIGN":
      return { ...state, campaignId: action.campaignId };
    case "SET_UNIT_PRICE":
      return { ...state, unitPrice: action.unitPrice };
    case "SET_UNITS_ORDERED":
      return { ...state, unitsOrdered: action.unitsOrdered };
    case "SET_SUPPORT_BUDGET":
      return { ...state, supportBudget: action.supportBudget };
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
