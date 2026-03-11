import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useGame } from "../state/GameContext";
import { autosave, getActiveSlotId } from "./saveSystem";

interface AutosaveContextValue {
  showIndicator: boolean;
}

const AutosaveContext = createContext<AutosaveContextValue>({ showIndicator: false });

export function useAutosaveIndicator(): AutosaveContextValue {
  return useContext(AutosaveContext);
}

export function AutosaveProvider({ children }: { children: ReactNode }) {
  const { state } = useGame();
  const [showIndicator, setShowIndicator] = useState(false);
  const prevSimulated = useRef(state.quarterSimulated);

  // Keep a ref to state updated via effect so we can read it in the async callback
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    // Detect transition: quarterSimulated went from false → true
    const shouldAutosave = state.quarterSimulated && !prevSimulated.current;
    prevSimulated.current = state.quarterSimulated;
    if (!shouldAutosave) return;

    const slotId = getActiveSlotId();
    if (!slotId) return;

    let hideTimer: ReturnType<typeof setTimeout>;
    const showTimer = setTimeout(() => setShowIndicator(true), 0);
    void autosave(slotId, stateRef.current).then(() => {
      hideTimer = setTimeout(() => setShowIndicator(false), 2000);
    });

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [state.quarterSimulated]);

  return (
    <AutosaveContext.Provider value={{ showIndicator }}>
      {children}
    </AutosaveContext.Provider>
  );
}
