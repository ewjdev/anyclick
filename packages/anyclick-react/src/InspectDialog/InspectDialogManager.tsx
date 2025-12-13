"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { IDEConfig } from "../ide";
import type { HighlightColors } from "../types";
import {
  type CompactModeConfig,
  InspectSimple,
  type PinnedPosition,
} from "./InspectSimple";

let didWarnDeprecated = false;
function warnDeprecatedInspectDialogManager() {
  if (didWarnDeprecated) return;
  didWarnDeprecated = true;
  if (process.env.NODE_ENV === "production") return;

  // eslint-disable-next-line no-console
  console.warn(
    [
      "[anyclick-react] InspectDialogManager is deprecated and has moved to @ewjdev/anyclick-devtools.",
      "Update imports to `@ewjdev/anyclick-devtools`.",
    ].join(" "),
  );
}

/**
 * Custom event name for triggering the inspect dialog
 */
export const INSPECT_DIALOG_EVENT = "anyclick:inspect";

/**
 * Custom event detail for the inspect dialog
 */
export interface InspectDialogEventDetail {
  targetElement: Element;
}

/**
 * Dispatch an event to open the inspect dialog for an element
 *
 * @deprecated Moved to `@ewjdev/anyclick-devtools`. Import `openInspectDialog` from there instead.
 */
export function openInspectDialog(targetElement: Element): void {
  if (typeof window === "undefined") return;

  warnDeprecatedInspectDialogManager();

  const event = new CustomEvent<InspectDialogEventDetail>(
    INSPECT_DIALOG_EVENT,
    {
      detail: { targetElement },
      bubbles: true,
      cancelable: true,
    },
  );

  window.dispatchEvent(event);
}

/**
 * Props for InspectDialogManager
 */
export interface InspectDialogManagerProps {
  /** IDE configuration for "Open in IDE" feature */
  ideConfig?: Partial<IDEConfig>;
  /** Custom styles for the dialog */
  dialogStyle?: React.CSSProperties;
  /** Custom class name for the dialog */
  dialogClassName?: string;
  /** Custom highlight colors for the element highlight */
  highlightColors?: HighlightColors;
  /** Whether to show box model overlay (padding/margin visualization). Defaults to true. */
  showBoxModelOverlay?: boolean;
  /** Initial pinned position for the dialog. Defaults to "floating" (centered) */
  initialPinnedPosition?: PinnedPosition;
  /** Custom compact mode configuration. Partially override DEFAULT_COMPACT_CONFIG */
  compactConfig?: Partial<CompactModeConfig>;
}

/**
 * InspectDialogManager - A component that listens for inspect events and renders the dialog
 *
 * Place this component once in your app (e.g., alongside AnyclickProvider) to enable
 * the inspect dialog functionality from the chrome preset.
 *
 * @deprecated Moved to `@ewjdev/anyclick-devtools`. Import `InspectDialogManager` from there instead.
 *
 * @example
 * ```tsx
 * <AnyclickProvider adapter={adapter}>
 *   <InspectDialogManager ideConfig={{ protocol: "cursor", basePath: "/Users/me/project" }} />
 *   {children}
 * </AnyclickProvider>
 * ```
 */
export function InspectDialogManager({
  ideConfig,
  dialogStyle,
  dialogClassName,
  highlightColors,
  showBoxModelOverlay = true,
  initialPinnedPosition = "floating",
  compactConfig,
}: InspectDialogManagerProps) {
  warnDeprecatedInspectDialogManager();

  const [visible, setVisible] = useState(false);
  const [targetElement, setTargetElement] = useState<Element | null>(null);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTargetElement(null);
  }, []);

  // Handle selecting a different element (e.g., from modified elements list)
  const handleSelectElement = useCallback((element: Element) => {
    setTargetElement(element);
    // Keep dialog visible, just switch the target
  }, []);

  useEffect(() => {
    const handleInspectEvent = (event: Event) => {
      console.log("handleInspectEvent", event);
      const customEvent = event as CustomEvent<InspectDialogEventDetail>;
      if (customEvent.detail?.targetElement) {
        setTargetElement(customEvent.detail.targetElement);
        setVisible(true);
      }
    };

    console.log("addEventListener", INSPECT_DIALOG_EVENT);
    window.addEventListener(INSPECT_DIALOG_EVENT, handleInspectEvent);

    return () => {
      window.removeEventListener(INSPECT_DIALOG_EVENT, handleInspectEvent);
    };
  }, []);

  return (
    <InspectSimple
      visible={visible}
      targetElement={targetElement}
      onClose={handleClose}
      onSelectElement={handleSelectElement}
      ideConfig={ideConfig}
      style={dialogStyle}
      className={dialogClassName}
      highlightColors={highlightColors}
      showBoxModelOverlay={showBoxModelOverlay}
      initialPinnedPosition={initialPinnedPosition}
      compactConfig={compactConfig}
    />
  );
}

export default InspectDialogManager;
