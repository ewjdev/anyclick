"use client";

/**
 * Type definitions for Ac tracking components.
 *
 * @module components/tracking/types
 */
import type { ReactNode, RefObject } from "react";

// ============================================================================
// Action Types
// ============================================================================

/**
 * Context passed to action handlers when triggered from the context menu.
 */
export interface AcActionContext {
  /** The intent identifier */
  intent: string;
  /** Merged metadata from context hierarchy */
  metadata: Record<string, unknown>;
  /** Target element that was right-clicked */
  targetElement: Element | null;
  /** Container element identified by anyclick */
  containerElement: Element | null;
  /** Close the context menu */
  closeMenu: () => void;
  /** Fire the intent tracking event */
  track: () => void;
  /** Capture screenshots (returns promise with screenshot data) */
  captureScreenshots: () => Promise<unknown>;
  /** Submit to anyclick adapter */
  submit: (comment?: string) => Promise<void>;
}

/**
 * Action definition for context menu items.
 *
 * Actions can be defined on Ac.Context or derived from Ac.Intent components.
 */
export interface AcAction {
  /** Unique intent identifier */
  intent: string;
  /** Display label in context menu */
  label: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Priority for sorting (1-10, where 10 = highest priority, default: 5) */
  priority?: number;
  /** Show comment input when selected */
  showComment?: boolean;
  /**
   * Custom handler for this action.
   * Return false to skip default submission flow.
   */
  handler?: (
    context: AcActionContext,
  ) => boolean | Promise<boolean | void> | void;
  /** Action status (available, comingSoon) */
  status?: "available" | "comingSoon";
  /** Required roles to see this action */
  requiredRoles?: string[];
}

// ============================================================================
// Registration Types
// ============================================================================

/**
 * Event types that can trigger intent tracking.
 */
export type IntentEventType = "click" | "hover" | "view";

/**
 * Registered intent in the store.
 *
 * Created when Ac.Intent or Ac.View mounts (unless context={false}).
 */
export interface RegisteredIntent {
  /** Unique ID for this registration */
  id: string;
  /** The intent identifier */
  intent: string;
  /** Context ID this intent belongs to */
  contextId: string | null;
  /** Metadata from this intent (merged with context metadata) */
  metadata: Record<string, unknown>;
  /** Reference to the DOM element */
  elementRef: RefObject<Element | null>;
  /** Whether this intent opts out of context features */
  optOut: boolean;
  /** Event type (click, hover, view) */
  eventType: IntentEventType;
  /** Action config if this should appear in context menu */
  action?: Partial<AcAction>;
}

/**
 * Registered context in the store.
 *
 * Created when Ac.Context mounts.
 */
export interface RegisteredContext {
  /** Unique ID for this context */
  id: string;
  /** Optional name (maps to data-ac-context attribute) */
  name?: string;
  /** Metadata for this context */
  metadata: Record<string, unknown>;
  /** Explicit actions defined on this context */
  actions: AcAction[];
  /** Reference to the DOM element */
  elementRef: RefObject<Element | null>;
  /** Parent context ID (for hierarchy) */
  parentId: string | null;
  /** Depth in context tree (0 = root) */
  depth: number;
}

// ============================================================================
// Store Types
// ============================================================================

/**
 * Intent store state and actions (Zustand).
 */
export interface IntentStoreState {
  /** Map of contextId -> registered context */
  contexts: Map<string, RegisteredContext>;
  /** Map of intentId -> registered intent */
  intents: Map<string, RegisteredIntent>;
}

export interface IntentStoreActions {
  // Context registration
  registerContext: (context: RegisteredContext) => void;
  unregisterContext: (contextId: string) => void;
  updateContext: (
    contextId: string,
    updates: Partial<RegisteredContext>,
  ) => void;

  // Intent registration
  registerIntent: (intent: RegisteredIntent) => void;
  unregisterIntent: (intentId: string) => void;

  // Queries
  /** Get all actions for an element (walks up context tree, sorted by priority) */
  getActionsForElement: (element: Element) => AcAction[];
  /** Get merged metadata for an element */
  getMetadataForElement: (element: Element) => Record<string, unknown>;
  /** Find nearest context for an element */
  findContextForElement: (element: Element) => RegisteredContext | null;
  /** Find parent context for a given element */
  findParentContext: (
    element: Element | null,
    excludeId?: string,
  ) => RegisteredContext | null;
}

export type IntentStore = IntentStoreState & IntentStoreActions;

// ============================================================================
// Component Prop Types
// ============================================================================

/**
 * Props for Ac.Context component.
 */
export interface AcContextProps {
  /** Metadata to provide to nested components */
  metadata: Record<string, unknown>;
  /** Optional context name (sets data-ac-context attribute) */
  name?: string;
  /** Explicit actions for this context's menu */
  actions?: AcAction[];
  /** Disable anyclick in this context */
  disabled?: boolean;
  /** Whether to render as a wrapper div or use Slot pattern */
  asChild?: boolean;
  /** Children to render */
  children: ReactNode;
  /** Optional className for wrapper element */
  className?: string;
}

/**
 * Props for Ac.Intent component.
 */
export interface AcIntentProps {
  /** The intent identifier to track */
  intent: string;
  /** Event type to track (default: "click") */
  on?: "click" | "hover" | "both";
  /** Additional properties to include with tracking */
  metadata?: Record<string, unknown>;
  /**
   * Whether to register with context for menu actions.
   * When false, events still pass through but consumers ignore this intent.
   * @default true
   */
  context?: boolean;
  /** Action config when shown in context menu */
  action?: Partial<AcAction>;
  /** Disable tracking */
  disabled?: boolean;
  /** Single child element */
  children: React.ReactElement;
}

/**
 * Props for Ac.View component.
 */
export interface AcViewProps {
  /** Intent to fire when element becomes visible */
  intent: string;
  /** IntersectionObserver threshold (0-1, default: 0.5) */
  threshold?: number;
  /** Fire only once per mount (default: true) */
  once?: boolean;
  /** Minimum time visible in ms before firing */
  minVisibleTime?: number;
  /** Additional properties to include with tracking */
  metadata?: Record<string, unknown>;
  /**
   * Whether to register with context for menu actions.
   * @default true
   */
  context?: boolean;
  /** Disable tracking */
  disabled?: boolean;
  /** Single child element */
  children: React.ReactElement;
}
