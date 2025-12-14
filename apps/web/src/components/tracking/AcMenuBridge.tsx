"use client";

/**
 * AcMenuBridge - Bridges Ac actions with AnyclickProvider context menu.
 *
 * Reads from the intent store and injects Ac actions into the
 * AnyclickProvider's context menu when right-clicking within an Ac.Context.
 *
 * Drop this component anywhere inside an AnyclickProvider to enable
 * Ac-defined actions to appear in the right-click context menu.
 *
 * @module components/tracking/AcMenuBridge
 */
import { getTrackingManager } from "@/lib/tracking/manager";
import * as React from "react";
import { type ContextMenuItem, useAnyclick } from "@ewjdev/anyclick-react";
import { useIntentStore } from "./store";
import type { AcAction, AcActionContext } from "./types";

/**
 * Props for AcMenuBridge.
 */
export interface AcMenuBridgeProps {
  /**
   * Whether the bridge is disabled.
   * When disabled, no actions are registered with the provider.
   */
  disabled?: boolean;
}

/**
 * Converts an AcAction to a ContextMenuItem for AnyclickProvider.
 */
function convertToMenuItem(
  action: AcAction,
  targetElement: Element | null,
  containerElement: Element | null,
  closeMenu: () => void,
  metadata: Record<string, unknown>,
): ContextMenuItem {
  return {
    // Stable id for deduplication and React keys
    id: `ac:${action.intent}`,
    type: action.intent,
    label: action.label,
    icon: action.icon,
    // Pass through priority for sorting
    priority: action.priority,
    showComment: action.showComment ?? false,
    status: action.status,
    requiredRoles: action.requiredRoles,
    onClick: async (ctx) => {
      // Build action context
      const actionContext: AcActionContext = {
        intent: action.intent,
        metadata,
        targetElement,
        containerElement: ctx.containerElement,
        closeMenu: ctx.closeMenu,
        track: () => {
          getTrackingManager().track(action.intent, {
            properties: Object.keys(metadata).length > 0 ? metadata : undefined,
          });
        },
        captureScreenshots: async () => {
          // This would need to integrate with anyclick's screenshot system
          // For now, return empty - the default submission flow handles this
          return {};
        },
        submit: async (comment?: string) => {
          // This would submit to the anyclick adapter
          // For now, let the default flow handle it
        },
      };

      // Call custom handler if provided
      if (action.handler) {
        const result = await action.handler(actionContext);
        // If handler returns false, skip default submission
        if (result === false) {
          return false;
        }
      } else {
        // No custom handler - fire tracking event
        actionContext.track();
      }

      // Let default submission flow continue
      return true;
    },
  };
}

/**
 * Hook to get Ac actions for a given element.
 *
 * @param element - The target element (from context menu)
 * @returns Array of ContextMenuItem for AnyclickProvider
 */
export function useAcActions(element: Element | null): ContextMenuItem[] {
  const getActionsForElement = useIntentStore((s) => s.getActionsForElement);
  const getMetadataForElement = useIntentStore((s) => s.getMetadataForElement);

  return React.useMemo(() => {
    if (!element) return [];

    const actions = getActionsForElement(element);
    const metadata = getMetadataForElement(element);

    // Convert to ContextMenuItem format
    return actions.map((action) =>
      convertToMenuItem(
        action,
        element,
        null, // Container will be provided by anyclick
        () => {}, // closeMenu will be provided by anyclick
        metadata,
      ),
    );
  }, [element, getActionsForElement, getMetadataForElement]);
}

/**
 * Hook to get a function that returns Ac actions for any element.
 *
 * Use this to dynamically get actions based on right-click target.
 */
export function useAcActionGetter(): (element: Element) => ContextMenuItem[] {
  const getActionsForElement = useIntentStore((s) => s.getActionsForElement);
  const getMetadataForElement = useIntentStore((s) => s.getMetadataForElement);

  return React.useCallback(
    (element: Element) => {
      const actions = getActionsForElement(element);
      const metadata = getMetadataForElement(element);

      return actions.map((action) =>
        convertToMenuItem(action, element, null, () => {}, metadata),
      );
    },
    [getActionsForElement, getMetadataForElement],
  );
}

/**
 * AcMenuBridge - Component that bridges Ac actions with AnyclickProvider.
 *
 * Place this inside your AnyclickProvider to enable Ac actions in the
 * context menu. The bridge automatically registers itself with the nearest
 * provider and injects actions based on the right-clicked element's context.
 *
 * @example
 * ```tsx
 * <AnyclickProvider adapter={adapter}>
 *   <AcMenuBridge />
 *   <App />
 * </AnyclickProvider>
 * ```
 */
export function AcMenuBridge({ disabled = false }: AcMenuBridgeProps) {
  const getActionsRef = React.useRef(useAcActionGetter());
  const { registerDynamicMenuItems } = useAnyclick();

  // Keep getActions ref updated
  getActionsRef.current = useAcActionGetter();

  // Store registerDynamicMenuItems in a ref to avoid effect re-runs
  const registerRef = React.useRef(registerDynamicMenuItems);
  registerRef.current = registerDynamicMenuItems;

  // Store unregister function
  const unregisterRef = React.useRef<(() => void) | null>(null);

  // Register once on mount, unregister on unmount
  // Uses refs to avoid dependency on changing function references
  React.useEffect(() => {
    if (disabled) return;

    // Create a wrapper that uses the current ref value
    const getActions = (element: Element) => getActionsRef.current(element);

    unregisterRef.current = registerRef.current(getActions);

    return () => {
      if (unregisterRef.current) {
        unregisterRef.current();
        unregisterRef.current = null;
      }
    };
  }, [disabled]); // Only re-run when disabled changes

  // This component doesn't render anything visible
  // It just registers actions with the provider
  return null;
}

AcMenuBridge.displayName = "AcMenuBridge";

/**
 * Debug component to visualize registered contexts and intents.
 * Only use in development.
 */
export function AcDebugPanel() {
  const contexts = useIntentStore((s) => s.contexts);
  const intents = useIntentStore((s) => s.intents);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        background: "rgba(0,0,0,0.9)",
        color: "white",
        padding: 16,
        borderRadius: 8,
        fontSize: 12,
        maxWidth: 400,
        maxHeight: 300,
        overflow: "auto",
        zIndex: 9999,
      }}
    >
      <h4 style={{ margin: "0 0 8px" }}>Ac Registry</h4>
      <div>
        <strong>Contexts ({contexts.size}):</strong>
        <ul style={{ margin: "4px 0", paddingLeft: 16 }}>
          {Array.from(contexts.values()).map((ctx) => (
            <li key={ctx.id}>
              {ctx.name ?? ctx.id} (depth: {ctx.depth}, actions:{" "}
              {ctx.actions.length})
            </li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Intents ({intents.size}):</strong>
        <ul style={{ margin: "4px 0", paddingLeft: 16 }}>
          {Array.from(intents.values()).map((intent) => (
            <li key={intent.id}>
              {intent.intent.split(".").slice(-4).join(".")}
              {intent.optOut && " (opt-out)"}
            </li>
          ))}
          {/* {intents.size > 10 && <li>...and {intents.size - 10} more</li>} */}
        </ul>
      </div>
    </div>
  );
}
