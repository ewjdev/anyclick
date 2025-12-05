"use client";

// Core inspector components
export {
  InspectDialog,
  DEFAULT_COMPACT_CONFIG,
} from "./InspectDialog/InspectDialog";
export type {
  InspectDialogProps,
  PinnedPosition,
  CompactModeConfig,
} from "./InspectDialog/InspectDialog";

// Manager + event helpers
export {
  InspectDialogManager,
  openInspectDialog,
  INSPECT_DIALOG_EVENT,
} from "./InspectDialog/InspectDialogManager";
export type {
  InspectDialogManagerProps,
  InspectDialogEventDetail,
} from "./InspectDialog/InspectDialogManager";

// Store utilities
export {
  useInspectStore,
  useHasHydrated,
  waitForHydration,
  generateElementId,
  getElementDescription,
} from "./InspectDialog/inspectStore";

// Modification indicator
export { ModificationIndicator } from "./InspectDialog/ModificationIndicator";
export type { ModificationIndicatorProps } from "./InspectDialog/ModificationIndicator";

// Supporting types/utilities
export type { HighlightColors } from "./types";
export { generateCompactStyles } from "./types";

// IDE helpers (re-exported for convenience)
export {
  buildIDEUrl,
  openInIDE,
  isIDEProtocolSupported,
  detectPreferredIDE,
  findSourceLocationInAncestors,
  formatSourceLocation,
  type IDEConfig,
  type SourceLocation,
} from "./ide";

// Highlight helpers
export {
  findContainerParent,
  highlightTarget,
  highlightContainer,
  applyHighlights,
  clearHighlights,
  defaultHighlightColors,
  defaultContainerSelectors,
} from "./highlight";
