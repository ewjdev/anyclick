import { createContext, useContext } from "react";

/**
 * Context for compact mode (when pinned to edges)
 */
interface CompactModeContextValue {
  isCompact: boolean;
  styles: Record<string, React.CSSProperties>;
}

const CompactModeContext = createContext<CompactModeContextValue>({
  isCompact: false,
  styles: {}, // Empty default, will be provided by Provider
});

const useCompactMode = () => {
  const { isCompact, styles } = useContext(CompactModeContext);
  return { isCompact, compactStyles: styles };
};

export default useCompactMode;
