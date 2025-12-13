import { createContext, useContext } from "react";
import {
  PointerContextValue,
  defaultPointerConfig,
  defaultPointerTheme,
} from "./types";

/**
 * Default context state
 */
const defaultContextValue: PointerContextValue = {
  state: {
    position: { x: 0, y: 0 },
    interactionState: "normal",
    isVisible: false,
    isInBounds: false,
  },
  isEnabled: true,
  theme: defaultPointerTheme,
  config: defaultPointerConfig,
  setInteractionState: () => {},
  setEnabled: () => {},
  setTheme: () => {},
  setConfig: () => {},
};

/**
 * React context for pointer state and configuration
 */
export const PointerContext =
  createContext<PointerContextValue>(defaultContextValue);

/**
 * Hook to access pointer context
 */
export function usePointer(): PointerContextValue {
  const context = useContext(PointerContext);
  if (!context) {
    throw new Error(
      "usePointerSimple must be used within a PointerProviderSimple",
    );
  }
  return context;
}
