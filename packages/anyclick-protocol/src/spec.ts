/**
 * ANYCLICK PROTOCOL SPECIFICATION (v0.2)
 * --------------------------------------
 * This file defines the *full canonical protocol schema* for Anyclick:
 *
 * 1. How user interactions are captured
 * 2. How intent is represented
 * 3. How context (UI, navigation, visual snapshots) is represented
 * 4. How follow-up operations and results are described
 * 5. How source-code mapping is encoded
 *
 * This file is meant for:
 *  - Developers implementing Anyclick in apps (React, Vue, DOM)
 *  - PMs who want to understand what "intent" means and how Anyclick interprets UI
 *  - Designers who need to understand how UI structure becomes structured events
 *  - Business stakeholders who want to understand how data flows through the system
 *
 * Every interface below contains high-level semantic documentation so the spec
 * is readable even without deep technical knowledge.
 */

export type AnyclickVersion = "anyclick:0.2";

/**
 * InteractionEvent: The core data record of Anyclick.
 *
 * ANYCLICK EVENT = USER ACTION + MEANING + CONTEXT
 *
 * Example:
 *   "User clicked the checkout button on /cart and selected next-day delivery"
 *
 * In simple terms:
 *   - kind            → what type of event this is
 *   - intent          → what the user *meant* to do
 *   - target          → what they interacted with
 *   - operation       → what the system did as a result
 *   - navigation      → where they were before/after
 *   - source          → where in the code this element lives
 */
export interface InteractionEvent {
  /** Unique record identifier */
  id: string;

  /** Protocol version, useful when storing events over long periods */
  version: AnyclickVersion;

  /** interaction (user), system (background), result (outcomes) */
  kind: EventKind;

  /** When the event occurred */
  timestamp: string;

  /** Who performed the action */
  actor: ActorReference;

  /** The UI element or virtual action that was interacted with */
  target: TargetReference;

  /** The semantic meaning inferred or declared for this action */
  intent: Intent;

  /** Optional structured system-level action triggered by this interaction */
  operation?: Operation;

  /** Page navigation details (from → to) */
  navigation?: NavigationContext;

  /** Snapshot of UI state at the moment (forms, toggles, visibility) */
  state?: StateSnapshot;

  /** Optional screenshots for QA/replay/debugging */
  visual?: VisualPayload;

  /** Hierarchical context of the clicked element (DOM tree) */
  hierarchy?: HierarchyEntry[];

  /** System metadata about where this UI element originated in source code */
  source?: SourceReference;

  /** Optional result object (success, failure, diff, output) */
  result?: ResultPayload;

  /** Optional workflow correlation ID (multi-step flows) */
  flowId?: string;

  /** When part of a sequence, the ordinal step index */
  stepIndex?: number;

  /** Related events (e.g. followups, retries) */
  correlatesWith?: string[];

  /** Tenant or organizational context */
  tenantId?: string;

  /** Deployment origin */
  origin?: OriginInfo;

  /** Free-form metadata extension */
  metadata?: Record<string, any>;
}

export type EventKind = "interaction" | "system" | "result";

/**
 * Who initiated the event:
 * - human: a real user
 * - agent: an AI agent or automation system
 * - system: background processes (auto-save, visual scan)
 */
export interface ActorReference {
  type: ActorType;
  sessionId?: string;
  userId?: string;
  agentId?: string;
  roles?: string[];
}
export type ActorType = "human" | "agent" | "system";

/**
 * The object of interaction:
 * - dom: real DOM element
 * - virtual: conceptual action ("Create Task", "Start Checkout")
 * - native: mobile native control
 */
export type TargetReference = DomTarget | VirtualTarget | NativeTarget;

export interface DomTarget {
  kind: "dom";
  tag: string; // e.g., "button"
  role?: string | null; // ARIA role
  selector: string; // computed CSS path
  id?: string; // element id
  classes?: string[];
  attributes?: Record<string, string>;
  dataset?: Record<string, string>;
  aria?: Record<string, string>;
  boundingBox?: BoundingBox;
}

export interface VirtualTarget {
  kind: "virtual";
  namespace: string; // e.g., "app"
  id: string; // unique virtual action id
  label?: string;
}

export interface NativeTarget {
  kind: "native";
  platform: string; // ios, android, desktop
  id: string;
  label?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * INTENT = WHAT THE USER MEANT TO DO
 *
 * Examples:
 *   ui.click
 *   domain.cart.add
 *   domain.appointment.slot.select
 *   domain.clinical.note.save
 *
 * Intents can be:
 *  - Declared (via data-ac-intent)
 *  - Inferred (via heuristics)
 *  - Derived (via context or page-level scopes)
 */
export interface Intent {
  type: string;
  confidence: number; // 0–1 confidence score
  inferredFrom?: (
    | "developer"
    | "component"
    | "role"
    | "dataset"
    | "heuristic"
  )[];
  parameters?: Record<string, any>;
}

/**
 * OPERATIONS = WHAT THE SYSTEM PERFORMS
 *
 * Often derived from high-level intent. Examples:
 *
 *   Cart.add → data.create (CartItem)
 *   Appointment.cancel → data.update (Appointment)
 *   Memory.savePreference → memory.remember
 */
export interface Operation {
  domain: OperationDomain;
  kind: OperationKind;

  resourceType?: string;
  resourceId?: string;

  endpoint?: string;

  temporalScope?: TemporalScope;

  status?: OperationStatus;
  startedAt?: string;
  completedAt?: string;

  approval?: OperationApproval;

  expectedEffects?: string[];
}

export type OperationDomain = "data" | "memory" | "ai" | "custom";

export type BaseOperationKind =
  | "create"
  | "update"
  | "mutate"
  | "delete"
  | "remember"
  | "forget";

export type OperationKind = BaseOperationKind | string;

export type OperationStatus =
  | "pending"
  | "approved"
  | "executing"
  | "succeeded"
  | "failed"
  | "canceled";

export type TemporalScope =
  | "ephemeral"
  | "session"
  | "user"
  | "tenant"
  | "global";

export interface OperationApproval {
  required: boolean;
  approvedByUserId?: string;
  approvedAt?: string;
  reason?: string;
}

/**
 * NAVIGATION — how the user moved between screens during the event
 */
export interface NavigationContext {
  from?: string;
  to?: string;
  method?: "push" | "replace" | "pop" | "none";
  statusCode?: number;
}

/**
 * STATE SNAPSHOT — a lightweight representation of UI/component state
 * Only non-sensitive data should be included.
 */
export interface StateSnapshot {
  formValues?: Record<string, any>;
  componentState?: Record<string, any>;
  toggles?: Record<string, boolean>;
  visible?: boolean;
  disabled?: boolean;
}

/**
 * VISUAL PAYLOAD — contextual screenshots
 * Useful for QA, designers, bug reports, AI agents, and future replay engines.
 */
export interface VisualPayload {
  element?: ScreenshotPayload;
  viewport?: ScreenshotPayload;
  ancestor?: ScreenshotPayload;
}
export interface ScreenshotPayload {
  data: string; // base64 image
  mimeType?: string;
  width?: number;
  height?: number;
}

/**
 * HIERARCHY — DOM ancestry with semantic hints
 * Useful for analytics, debugging, test regeneration, and AI-based reasoning.
 */
export interface HierarchyEntry {
  depth: number;
  tag: string;
  role?: string | null;
  attributes?: Record<string, string>;
  dataset?: Record<string, string>;
  aria?: Record<string, string>;
  componentSemanticId?: string;
}

/**
 * SOURCE — maps UI interactions back to source code
 * This is used heavily in:
 *  - Autofix workflows
 *  - "Open in editor" devtools flows
 *  - Component lineage and debugging tools
 */
export interface SourceReference {
  framework?: string;
  componentName?: string;
  componentSemanticId?: string;
  filePath?: string;
  lineNumber?: number;
  columnNumber?: number;
  handlerName?: string;
}

/**
 * RESULT — the outcome of a system operation
 * Used for:
 *   - AI autofix loops
 *   - Visual regression
 *   - Error reporting
 *   - Validation/testing
 */
export interface ResultPayload {
  status: "success" | "failure" | "partial";
  summary?: string;
  diffScore?: number;
  diffDetails?: Record<string, any>;
  output?: any;
  error?: {
    code?: string;
    message?: string;
    details?: any;
  };
}

/**
 * ORIGIN — metadata about how/where the event was captured
 */
export interface OriginInfo {
  mode?: "self-hosted" | "cloud" | "hybrid";
  instanceId?: string;
  environment?: string; // dev/staging/prod
}

/**
 * SOURCE OPENER — used for devtools "Open in Cursor/VSCode"
 */
export interface SourceLocation {
  filePath: string;
  line?: number;
  column?: number;
}

export interface SourceOpenRequest {
  fromUrl: string;
  selector?: string;
  componentName?: string;
  source: SourceLocation;
}

/*******************************************
 * TYPE GUARDS — optional convenience helpers
 *******************************************/

export function isDomTarget(t: TargetReference): t is DomTarget {
  return t.kind === "dom";
}
export function isVirtualTarget(t: TargetReference): t is VirtualTarget {
  return t.kind === "virtual";
}
export function isNativeTarget(t: TargetReference): t is NativeTarget {
  return t.kind === "native";
}

export function isInteractionEvent(e: InteractionEvent): boolean {
  return e.kind === "interaction";
}
export function isResultEvent(e: InteractionEvent): boolean {
  return e.kind === "result";
}
