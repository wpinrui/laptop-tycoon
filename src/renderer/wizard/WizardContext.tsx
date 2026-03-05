import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import {
  WizardState,
  WizardStep,
  ModelType,
  INITIAL_WIZARD_STATE,
  WIZARD_STEPS,
} from "./types";
import {
  ScreenSizeInches,
  ComponentSlot,
  Component,
  ChassisOption,
  ChassisOptionSlot,
} from "../../data/types";
import { getScreenSizeDef } from "../../data/screenSizes";
import { MIN_BATTERY_WH, maxBatteryWh } from "./constants";

type WizardAction =
  | { type: "SET_NAME"; name: string }
  | { type: "SET_MODEL_TYPE"; modelType: ModelType }
  | { type: "SET_PREDECESSOR"; predecessorId: string | null }
  | { type: "SET_SCREEN_SIZE"; size: ScreenSizeInches }
  | { type: "SET_COMPONENT"; slot: ComponentSlot; component: Component }
  | { type: "REMOVE_COMPONENT"; slot: ComponentSlot }
  | { type: "SET_BATTERY_CAPACITY"; capacityWh: number }
  | { type: "SET_CHASSIS_OPTION"; slot: ChassisOptionSlot; option: ChassisOption }
  | { type: "GO_TO_STEP"; step: WizardStep }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.name };
    case "SET_MODEL_TYPE":
      return {
        ...state,
        modelType: action.modelType,
        predecessorId: action.modelType === "brandNew" ? null : state.predecessorId,
      };
    case "SET_PREDECESSOR":
      return { ...state, predecessorId: action.predecessorId };
    case "SET_SCREEN_SIZE": {
      const sizeDef = getScreenSizeDef(action.size);
      const maxWh = maxBatteryWh(sizeDef.baseBatteryCapacityWh);
      return {
        ...state,
        screenSize: action.size,
        batteryCapacityWh: Math.max(MIN_BATTERY_WH, Math.min(state.batteryCapacityWh, maxWh)),
      };
    }
    case "SET_COMPONENT":
      return {
        ...state,
        components: { ...state.components, [action.slot]: action.component },
      };
    case "REMOVE_COMPONENT": {
      const { [action.slot]: _, ...rest } = state.components;
      return { ...state, components: rest };
    }
    case "SET_BATTERY_CAPACITY":
      return { ...state, batteryCapacityWh: action.capacityWh };
    case "SET_CHASSIS_OPTION":
      return {
        ...state,
        chassis: { ...state.chassis, [action.slot]: action.option },
      };
    case "GO_TO_STEP":
      return { ...state, currentStep: action.step };
    case "NEXT_STEP": {
      const idx = WIZARD_STEPS.indexOf(state.currentStep);
      if (idx < WIZARD_STEPS.length - 1) {
        return { ...state, currentStep: WIZARD_STEPS[idx + 1] };
      }
      return state;
    }
    case "PREV_STEP": {
      const idx = WIZARD_STEPS.indexOf(state.currentStep);
      if (idx > 0) {
        return { ...state, currentStep: WIZARD_STEPS[idx - 1] };
      }
      return state;
    }
    case "RESET":
      return INITIAL_WIZARD_STATE;
    default:
      return state;
  }
}

interface WizardContextValue {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_WIZARD_STATE);
  return (
    <WizardContext.Provider value={{ state, dispatch }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return ctx;
}
