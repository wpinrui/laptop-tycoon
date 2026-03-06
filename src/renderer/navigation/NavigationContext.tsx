import { createContext, useContext, useReducer, useCallback, ReactNode } from "react";
import { Screen, Overlay } from "./types";

interface NavigationState {
  screen: Screen;
  history: Screen[];
  overlay: Overlay;
}

type NavigationAction =
  | { type: "NAVIGATE"; screen: Screen }
  | { type: "GO_BACK" }
  | { type: "SET_OVERLAY"; overlay: Overlay };

function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case "NAVIGATE":
      return {
        ...state,
        screen: action.screen,
        history: [...state.history, state.screen],
        overlay: null,
      };
    case "GO_BACK": {
      if (state.history.length === 0) return state;
      const history = [...state.history];
      const screen = history.pop()!;
      return { ...state, screen, history, overlay: null };
    }
    case "SET_OVERLAY":
      return { ...state, overlay: action.overlay };
    default:
      return state;
  }
}

interface NavigationContextValue {
  screen: Screen;
  overlay: Overlay;
  navigateTo: (screen: Screen) => void;
  goBack: () => void;
  canGoBack: boolean;
  setOverlay: (overlay: Overlay) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

const INITIAL_STATE: NavigationState = {
  screen: "mainMenu",
  history: [],
  overlay: null,
};

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(navigationReducer, INITIAL_STATE);

  const navigateTo = useCallback((screen: Screen) => {
    dispatch({ type: "NAVIGATE", screen });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: "GO_BACK" });
  }, []);

  const setOverlay = useCallback((overlay: Overlay) => {
    dispatch({ type: "SET_OVERLAY", overlay });
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        screen: state.screen,
        overlay: state.overlay,
        navigateTo,
        goBack,
        canGoBack: state.history.length > 0,
        setOverlay,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return ctx;
}
