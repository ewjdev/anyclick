/**
 * @ewjdev/anyclick-protocol
 *
 * Canonical protocol specification for Anyclick interaction events.
 *
 * This package provides TypeScript types and domain-specific intent enums
 * for capturing and representing user interactions with semantic meaning.
 *
 * @packageDocumentation
 */

// ============================================================================
// Protocol Version
// ============================================================================

export type { AnyclickVersion } from "./spec";

// ============================================================================
// Core Event Types
// ============================================================================

/**
 * The core data record of Anyclick.
 * Represents a user interaction with full context, intent, and metadata.
 */
export type { InteractionEvent, EventKind } from "./spec";

// ============================================================================
// Actor Types
// ============================================================================

/**
 * Who initiated the event (human, agent, or system).
 */
export type { ActorReference, ActorType } from "./spec";

// ============================================================================
// Target Types
// ============================================================================

/**
 * The UI element or virtual action that was interacted with.
 * Supports DOM elements, virtual actions, and native mobile controls.
 */
export type {
  TargetReference,
  DomTarget,
  VirtualTarget,
  NativeTarget,
  BoundingBox,
} from "./spec";

// ============================================================================
// Intent Types
// ============================================================================

/**
 * The semantic meaning inferred or declared for an action.
 * Intent turns raw clicks into meaningful business events.
 */
export type { Intent } from "./spec";

// ============================================================================
// Operation Types
// ============================================================================

/**
 * Structured system-level actions triggered by interactions.
 * Operations describe what the system performs (e.g., data.create, data.update).
 */
export type {
  Operation,
  OperationDomain,
  OperationKind,
  BaseOperationKind,
  OperationStatus,
  TemporalScope,
  OperationApproval,
} from "./spec";

// ============================================================================
// Context Types
// ============================================================================

/**
 * Navigation context - how the user moved between screens.
 */
export type { NavigationContext } from "./spec";

/**
 * State snapshot - lightweight representation of UI/component state.
 */
export type { StateSnapshot } from "./spec";

/**
 * Visual payload - contextual screenshots for QA/replay/debugging.
 */
export type { VisualPayload, ScreenshotPayload } from "./spec";

/**
 * Hierarchy - DOM ancestry with semantic hints.
 */
export type { HierarchyEntry } from "./spec";

// ============================================================================
// Source Mapping
// ============================================================================

/**
 * Maps UI interactions back to source code.
 * Used for autofix workflows, "Open in editor" devtools flows, and debugging.
 */
export type {
  SourceReference,
  SourceLocation,
  SourceOpenRequest,
} from "./spec";

// ============================================================================
// Result & Origin Types
// ============================================================================

/**
 * Result payload - the outcome of a system operation.
 */
export type { ResultPayload } from "./spec";

/**
 * Origin info - metadata about how/where the event was captured.
 */
export type { OriginInfo } from "./spec";

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard functions for runtime type checking.
 */
export {
  isDomTarget,
  isVirtualTarget,
  isNativeTarget,
  isInteractionEvent,
  isResultEvent,
} from "./spec";

// ============================================================================
// Domain-Specific Intents
// ============================================================================

/**
 * Domain-specific intent enums for common business domains:
 * - EHR (Electronic Health Records)
 * - Store (E-commerce)
 * - Service Quote (Contract/Service-based businesses)
 * - Insurance (Marketing & Quoting)
 * - Artwork (Online art sales)
 */
export * from "./intents";
