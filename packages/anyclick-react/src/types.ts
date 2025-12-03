import type {
  FeedbackAdapter,
  FeedbackPayload,
  FeedbackType,
  ScreenshotConfig,
  ScreenshotData,
} from "@ewjdev/anyclick-core";
import type { ReactNode, CSSProperties } from "react";

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
 * Menu item displayed in the feedback context menu
 */
export interface FeedbackMenuItem {
  /** Feedback type for this option (use unique identifier for parent items with children) */
  type: FeedbackType;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Whether to show a comment input for this type */
  showComment?: boolean;
  /** Optional role(s) required to see this menu item */
  requiredRoles?: string[];
  /** Child menu items (creates a submenu) */
  children?: FeedbackMenuItem[];
}

/**
 * User context for role-based menu filtering
 */
export interface FeedbackUserContext {
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
  items: FeedbackMenuItem[],
  userContext?: FeedbackUserContext,
): FeedbackMenuItem[] {
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
 * Props for the FeedbackProvider component
 */
export interface FeedbackProviderProps {
  /** The adapter to use for submitting feedback */
  adapter: FeedbackAdapter;
  /** Child components */
  children: ReactNode;
  /**
   * Filter function to determine if feedback should be captured for a target element
   * Return true to allow feedback, false to ignore
   */
  targetFilter?: (event: MouseEvent, target: Element) => boolean;
  /** Custom menu items (defaults to Issue, Feature, Like) */
  menuItems?: FeedbackMenuItem[];
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
  onSubmitSuccess?: (payload: FeedbackPayload) => void;
  /** Callback after failed submission */
  onSubmitError?: (error: Error, payload: FeedbackPayload) => void;
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
}

/**
 * Context value exposed by FeedbackProvider
 */
export interface FeedbackContextValue {
  /** Whether feedback is currently enabled */
  isEnabled: boolean;
  /** Whether a submission is in progress */
  isSubmitting: boolean;
  /** Submit feedback for a specific element */
  submitFeedback: (
    element: Element,
    type: FeedbackType,
    comment?: string,
  ) => Promise<void>;
  /** Open the feedback menu programmatically */
  openMenu: (element: Element, position: { x: number; y: number }) => void;
  /** Close the feedback menu */
  closeMenu: () => void;
}

/**
 * Props for the context menu component
 */
export interface ContextMenuProps {
  /** Whether the menu is visible */
  visible: boolean;
  /** Position of the menu */
  position: { x: number; y: number };
  /** Target element for feedback */
  targetElement: Element | null;
  /** Container element found by highlight logic */
  containerElement: Element | null;
  /** Menu items to display */
  items: FeedbackMenuItem[];
  /** Callback when an item is selected */
  onSelect: (
    type: FeedbackType,
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
