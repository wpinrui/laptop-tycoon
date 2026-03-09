import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import {
  WizardState,
  WizardStep,
  ModelType,
  INITIAL_WIZARD_STATE,
  WIZARD_STEPS,
  COMPONENT_STEP_SLOTS,
} from "./types";
import {
  ScreenSizeInches,
  ComponentSlot,
  Component,
  ChassisOption,
  ChassisOptionSlot,
} from "../../data/types";
import { LaptopDesign } from "../state/gameTypes";
import { useGame } from "../state/GameContext";
import { getAvailableComponents, getAvailableChassisOptions, CHASSIS_SLOTS } from "../../data/designConstants";
import { COLOUR_OPTIONS } from "../../data/colourOptions";
import { Demographic } from "../../data/types";
import { optimiseForDemographic } from "./optimiser";

type WizardAction =
  | { type: "SET_NAME"; name: string }
  | { type: "SET_MODEL_TYPE"; modelType: ModelType }
  | { type: "SET_PREDECESSOR"; predecessorId: string | null; predecessorDesign?: LaptopDesign; gameYear?: number }
  | { type: "SET_SCREEN_SIZE"; size: ScreenSizeInches }
  | { type: "SET_COMPONENT"; slot: ComponentSlot; component: Component }
  | { type: "REMOVE_COMPONENT"; slot: ComponentSlot }
  | { type: "SET_PORT_COUNT"; portId: string; count: number }
  | { type: "SET_BATTERY_CAPACITY"; capacityWh: number }
  | { type: "SET_THICKNESS"; thicknessCm: number }
  | { type: "SET_BEZEL"; bezelMm: number }
  | { type: "SET_CHASSIS_OPTION"; slot: ChassisOptionSlot; option: ChassisOption }
  | { type: "TOGGLE_COLOUR"; colourId: string }
  | { type: "GO_TO_STEP"; step: WizardStep }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" }
  | { type: "LOAD_DESIGN"; design: LaptopDesign }
  | { type: "DEBUG_AUTOFILL"; year: number }
  | { type: "DEBUG_OPTIMISE"; demographic: Demographic; year: number };

/** Steps locked by spec bump — screen size and body are inherited from predecessor. */
export function isStepLockedBySpecBump(step: WizardStep, state: WizardState): boolean {
  return state.modelType === "specBump" && state.predecessorId !== null
    && (step === "screenSize" || step === "body");
}

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
    case "SET_PREDECESSOR": {
      const base = { ...state, predecessorId: action.predecessorId };
      if (!action.predecessorDesign) return base;
      const d = action.predecessorDesign;
      const year = action.gameYear ?? 9999;

      // Prefill components from predecessor, skipping discontinued ones
      const prefillComponents: typeof state.components = {};
      for (const [slot, component] of Object.entries(d.components)) {
        if (component && component.yearDiscontinued >= year) {
          prefillComponents[slot as ComponentSlot] = component;
        }
      }

      if (state.modelType === "specBump") {
        // Spec bump: lock screen size, body, ports + prefill components
        return {
          ...base,
          components: prefillComponents,
          screenSize: d.screenSize,
          thicknessCm: d.thicknessCm,
          bezelMm: d.bezelMm,
          chassis: { ...d.chassis },
          selectedColours: [...d.selectedColours],
          ports: { ...d.ports },
        };
      }

      // Successor: prefill components only (body/screen can be changed)
      return {
        ...base,
        components: prefillComponents,
        batteryCapacityWh: d.batteryCapacityWh,
        ports: { ...d.ports },
      };
    }
    case "SET_SCREEN_SIZE":
      return { ...state, screenSize: action.size };
    case "SET_COMPONENT":
      return {
        ...state,
        components: { ...state.components, [action.slot]: action.component },
      };
    case "REMOVE_COMPONENT": {
      const { [action.slot]: _, ...rest } = state.components;
      return { ...state, components: rest };
    }
    case "SET_PORT_COUNT": {
      const newPorts = { ...state.ports };
      if (action.count <= 0) {
        delete newPorts[action.portId];
      } else {
        newPorts[action.portId] = action.count;
      }
      return { ...state, ports: newPorts };
    }
    case "SET_BATTERY_CAPACITY":
      return { ...state, batteryCapacityWh: action.capacityWh };
    case "SET_THICKNESS":
      return { ...state, thicknessCm: action.thicknessCm };
    case "SET_BEZEL":
      return { ...state, bezelMm: action.bezelMm };
    case "SET_CHASSIS_OPTION":
      return {
        ...state,
        chassis: { ...state.chassis, [action.slot]: action.option },
      };
    case "TOGGLE_COLOUR": {
      const has = state.selectedColours.includes(action.colourId);
      const selectedColours = has
        ? state.selectedColours.filter((c) => c !== action.colourId)
        : [...state.selectedColours, action.colourId];
      return { ...state, selectedColours };
    }
    case "GO_TO_STEP": {
      if (isStepLockedBySpecBump(action.step, state)) return state;
      const visited = new Set(state.visitedSteps);
      visited.add(action.step);
      return { ...state, currentStep: action.step, visitedSteps: visited };
    }
    case "NEXT_STEP": {
      let idx = WIZARD_STEPS.indexOf(state.currentStep);
      while (idx < WIZARD_STEPS.length - 1) {
        idx++;
        const nextStep = WIZARD_STEPS[idx];
        if (!isStepLockedBySpecBump(nextStep, state)) {
          const visited = new Set(state.visitedSteps);
          visited.add(nextStep);
          return { ...state, currentStep: nextStep, visitedSteps: visited };
        }
      }
      return state;
    }
    case "PREV_STEP": {
      let idx = WIZARD_STEPS.indexOf(state.currentStep);
      while (idx > 0) {
        idx--;
        if (!isStepLockedBySpecBump(WIZARD_STEPS[idx], state)) {
          return { ...state, currentStep: WIZARD_STEPS[idx] };
        }
      }
      return state;
    }
    case "RESET":
      return INITIAL_WIZARD_STATE;
    case "DEBUG_AUTOFILL": {
      const allSlots: ComponentSlot[] = Object.values(COMPONENT_STEP_SLOTS).flat() as ComponentSlot[];
      const components: Partial<Record<ComponentSlot, Component>> = {};
      for (const slot of allSlots) {
        const available = getAvailableComponents(slot, action.year);
        if (available.length > 0) components[slot] = available[0];
      }
      const chassis: WizardState["chassis"] = { material: null, coolingSolution: null, keyboardFeature: null, trackpadFeature: null };
      for (const def of CHASSIS_SLOTS) {
        const available = getAvailableChassisOptions(def.options, action.year);
        if (available.length > 0) chassis[def.slot] = available[0];
      }
      return {
        ...state,
        name: state.name || "Debug Laptop",
        modelType: "brandNew",
        components,
        chassis,
        selectedColours: [COLOUR_OPTIONS[0].id],
        visitedSteps: new Set<WizardStep>(WIZARD_STEPS),
        currentStep: "review",
      };
    }
    case "DEBUG_OPTIMISE": {
      const result = optimiseForDemographic(action.demographic, action.year);
      return {
        ...state,
        name: `Optimised (${action.demographic.name})`,
        modelType: "brandNew",
        screenSize: result.screenSize,
        components: result.components,
        chassis: result.chassis,
        batteryCapacityWh: result.batteryCapacityWh,
        thicknessCm: result.thicknessCm,
        bezelMm: result.bezelMm,
        selectedColours: result.selectedColours,
        visitedSteps: new Set<WizardStep>(WIZARD_STEPS),
        currentStep: "review",
      };
    }
    case "LOAD_DESIGN": {
      const d = action.design;
      return {
        currentStep: "metadata",
        editingModelId: d.id,
        name: d.name,
        modelType: d.modelType,
        predecessorId: d.predecessorId,
        screenSize: d.screenSize,
        components: d.components,
        ports: d.ports,
        batteryCapacityWh: d.batteryCapacityWh,
        thicknessCm: d.thicknessCm,
        bezelMm: d.bezelMm,
        chassis: d.chassis,
        selectedColours: d.selectedColours,
        visitedSteps: new Set<WizardStep>(WIZARD_STEPS),
      };
    }
    default:
      return state;
  }
}

interface WizardContextValue {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  gameYear: number;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_WIZARD_STATE);
  const { state: gameState } = useGame();
  const gameYear = gameState.year;
  return (
    <WizardContext.Provider value={{ state, dispatch, gameYear }}>
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
