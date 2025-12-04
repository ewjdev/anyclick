import type {
  AnyclickAdapter,
  AnyclickPayload,
  AnyclickTriggerEvent,
  AnyclickType,
  ScreenshotConfig,
  ScreenshotData,
} from "@ewjdev/anyclick-core";
import type { ReactNode, CSSProperties } from "react";

/**
 * Theme configuration for AnyclickProvider
 * Supports nested theming with inheritance
 */
export interface AnyclickTheme {
  /** Custom styles for the context menu */
  menuStyle?: CSSProperties;
  /** Custom class name for the context menu */
  menuClassName?: string;
  /** Configuration for element highlighting */
  highlightConfig?: HighlightConfig;
  /** Configuration for screenshot capture */
  screenshotConfig?: ScreenshotConfig;
  /** Whether anyclick functionality is disabled in this theme */
  disabled?: boolean;
  /**
   * Enable fun mode (go-kart cursor) within this scoped provider.
   * When true/configured, a FunModeBridge can hand off the track to the pointer.
   */
  funMode?: boolean | FunModeThemeConfig;
}

/**
 * Optional fun mode configuration (forwarded to pointer fun mode)
 */
export interface FunModeThemeConfig {
  /** Whether fun mode is enabled (default: true) */
  enabled?: boolean;
  /** Optional max speed override for this provider */
  maxSpeed?: number;
  /** Optional acceleration override */
  acceleration?: number;
}

/**
 * Menu positioning modes
 * - static: Menu stays at exact click position (may go off-screen)
 * - inView: Menu adjusts position to stay fully visible in viewport
 * - dynamic: User can drag the menu to reposition it
 */
export type MenuPositionMode = "static" | "inView" | "dynamic";

/**
 * Configuration for highlight colors
 */
export interface HighlightColors {
  /** Color for the target element highlight (default: #3b82f6 - blue) */
  targetColor?: string;
  /** Color for the container element highlight (default: #8b5cf6 - purple) */
  containerColor?: string;
  /** Opacity for the target shadow (default: 0.25) */
  targetShadowOpacity?: number;
  /** Opacity for the container shadow (default: 0.1) */
  containerShadowOpacity?: number;
}

/**
 * Configuration for highlight behavior
 */
export interface HighlightConfig {
  /** Whether to show highlights (default: true) */
  enabled?: boolean;
  /** Custom colors for highlights */
  colors?: HighlightColors;
  /** CSS selectors to identify container elements */
  containerSelectors?: string[];
  /** Minimum number of children for an element to be considered a container (default: 2) */
  minChildrenForContainer?: number;
}

/**
 * Menu item displayed in the Anyclick context menu
 */
export interface AnyclickMenuItem {
  /** Feedback type for this option (use unique identifier for parent items with children) */
  type: AnyclickType;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Whether to show a comment input for this type */
  showComment?: boolean;
  /** Optional role(s) required to see this menu item */
  requiredRoles?: string[];
  /** Child menu items (creates a submenu) */
  children?: AnyclickMenuItem[];
}

/**
 * User context for role-based menu filtering
 */
export interface AnyclickUserContext {
  /** User's role(s) */
  roles?: string[];
  /** User ID */
  id?: string;
  /** User email */
  email?: string;
}

/**
 * Filter menu items based on user context
 */
export function filterMenuItemsByRole(
  items: AnyclickMenuItem[],
  userContext?: AnyclickUserContext,
): AnyclickMenuItem[] {
  if (!userContext) {
    // If no user context, only show items without required roles
    return items.filter(
      (item) => !item.requiredRoles || item.requiredRoles.length === 0,
    );
  }

  const userRoles = userContext.roles ?? [];

  return items.filter((item) => {
    // If no required roles, show to everyone
    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return true;
    }
    // Check if user has any of the required roles
    return item.requiredRoles.some((role) => userRoles.includes(role));
  });
}

/**
 * Props for the AnyclickProvider component
 */
export interface AnyclickProviderProps {
  /** The adapter to use for submitting feedback */
  adapter: AnyclickAdapter;
  /** Child components */
  children: ReactNode;
  /**
   * Filter function to determine if feedback should be captured for a target element
   * Return true to allow feedback, false to ignore
   * Accepts both MouseEvent (right-click) and TouchEvent (press-and-hold)
   */
  targetFilter?: (event: AnyclickTriggerEvent, target: Element) => boolean;
  /** Custom menu items (defaults to Issue, Feature, Like) */
  menuItems?: AnyclickMenuItem[];
  /** Maximum length for innerText capture */
  maxInnerTextLength?: number;
  /** Maximum length for outerHTML capture */
  maxOuterHTMLLength?: number;
  /** Maximum number of ancestors to capture */
  maxAncestors?: number;
  /** Cooldown in milliseconds between submissions (rate limiting) */
  cooldownMs?: number;
  /** Attributes to strip from outerHTML for privacy */
  stripAttributes?: string[];
  /** Additional metadata to include with every submission */
  metadata?: Record<string, unknown>;
  /** Callback after successful submission */
  onSubmitSuccess?: (payload: AnyclickPayload) => void;
  /** Callback after failed submission */
  onSubmitError?: (error: Error, payload: AnyclickPayload) => void;
  /** Custom styles for the context menu */
  menuStyle?: CSSProperties;
  /** Custom class name for the context menu */
  menuClassName?: string;
  /** Whether the provider is disabled */
  disabled?: boolean;
  /** Configuration for element highlighting */
  highlightConfig?: HighlightConfig;
  /** Configuration for screenshot capture */
  screenshotConfig?: ScreenshotConfig;
  /**
   * Whether to scope this provider to its children only.
   * When true, events will only be captured for elements within this provider's subtree.
   * When false (default), events are captured for the entire document.
   */
  scoped?: boolean;
  /**
   * Theme configuration for this provider.
   * Themes are inherited from parent providers and merged (child overrides parent).
   * Set to null or { disabled: true } to disable anyclick in this subtree.
   */
  theme?: AnyclickTheme | null;
  /** Duration in ms to hold touch before triggering context menu (default: 500) */
  touchHoldDurationMs?: number;
  /** Maximum movement in px before touch hold is cancelled (default: 10) */
  touchMoveThreshold?: number;
  /** Menu positioning mode (default: 'inView') */
  menuPositionMode?: MenuPositionMode;
}

/**
 * @deprecated Use AnyclickProviderProps instead
 */
export type FeedbackProviderProps = AnyclickProviderProps;

/**
 * Context value exposed by AnyclickProvider
 */
export interface AnyclickContextValue {
  /** Whether feedback is currently enabled */
  isEnabled: boolean;
  /** Whether a submission is in progress */
  isSubmitting: boolean;
  /** Submit feedback for a specific element */
  submitFeedback: (
    element: Element,
    type: AnyclickType,
    comment?: string,
  ) => Promise<void>;
  /** Open the feedback menu programmatically */
  openMenu: (element: Element, position: { x: number; y: number }) => void;
  /** Close the feedback menu */
  closeMenu: () => void;
  /** The current merged theme (inherited from ancestors) */
  theme: AnyclickTheme;
  /** Whether this provider is scoped */
  scoped: boolean;
  /** The provider's unique ID */
  providerId: string;
}

/**
 * Props for the context menu component
 */
export interface ContextMenuProps {
  /** Whether the menu is visible */
  visible: boolean;
  /** Position of the menu */
  position: { x: number; y: number };
  /** Target element for anyclick */
  targetElement: Element | null;
  /** Container element found by highlight logic */
  containerElement: Element | null;
  /** Menu items to display */
  items: AnyclickMenuItem[];
  /** Callback when an item is selected */
  onSelect: (
    type: AnyclickType,
    comment?: string,
    screenshots?: ScreenshotData,
  ) => void;
  /** Callback when menu is closed */
  onClose: () => void;
  /** Whether submission is in progress */
  isSubmitting: boolean;
  /** Custom styles */
  style?: CSSProperties;
  /** Custom class name */
  className?: string;
  /** Configuration for element highlighting */
  highlightConfig?: HighlightConfig;
  /** Configuration for screenshot capture */
  screenshotConfig?: ScreenshotConfig;
  /** Menu positioning mode (default: 'inView') */
  positionMode?: MenuPositionMode;
  /** Header content */
  header?: ReactNode;
  /** Footer content */
  footer?: ReactNode;
}

/**
 * Props for the screenshot preview component
 */
export interface ScreenshotPreviewProps {
  /** Captured screenshot data */
  screenshots: ScreenshotData | null;
  /** Whether screenshots are loading */
  isLoading: boolean;
  /** Callback when user confirms screenshots */
  onConfirm: (screenshots: ScreenshotData) => void;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Callback when user wants to retake screenshots */
  onRetake: () => void;
  /** Whether submission is in progress */
  isSubmitting: boolean;
}
