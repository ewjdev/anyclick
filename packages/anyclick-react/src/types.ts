/**
 * Type definitions for @ewjdev/anyclick-react.
 *
 * Contains all public interfaces, types, and utility functions
 * for configuring anyclick providers, menus, and themes.
 *
 * @module types
 * @since 1.0.0
 */
import type { CSSProperties, ReactNode } from "react";
import type {
  AnyclickAdapter,
  AnyclickPayload,
  AnyclickTriggerEvent,
  AnyclickType,
  ScreenshotConfig,
  ScreenshotData,
} from "@ewjdev/anyclick-core";
import { CompactModeConfig } from "./InspectDialog/InspectSimple";
import type { QuickChatConfig } from "./QuickChat/types";

// ============================================================================
// Theme Configuration
// ============================================================================

/**
 * Theme configuration for AnyclickProvider.
 *
 * Supports nested theming with inheritance - child providers automatically
 * inherit and can override parent theme settings.
 *
 * @example
 * ```tsx
 * const theme: AnyclickTheme = {
 *   menuStyle: { backgroundColor: "#1a1a1a" },
 *   highlightConfig: {
 *     colors: { targetColor: "#ef4444" },
 *   },
 * };
 *
 * <AnyclickProvider adapter={adapter} theme={theme}>
 *   <App />
 * </AnyclickProvider>
 * ```
 *
 * @since 1.0.0
 */
export interface AnyclickTheme {
  /** Whether anyclick functionality is disabled in this theme */
  disabled?: boolean;
  /**
   * Enable fun mode (go-kart cursor) within this scoped provider.
   * When true/configured, a FunModeBridge can hand off the track to the pointer.
   */
  funMode?: boolean | FunModeThemeConfig;
  /** Configuration for element highlighting */
  highlightConfig?: HighlightConfig;
  /** Custom class name for the context menu */
  menuClassName?: string;
  /** Custom styles for the context menu */
  menuStyle?: CSSProperties;
  /** Configuration for screenshot capture */
  screenshotConfig?: ScreenshotConfig;
}

/**
 * Optional fun mode configuration (forwarded to pointer fun mode).
 *
 * @since 1.3.0
 */
export interface FunModeThemeConfig {
  /** Optional acceleration override */
  acceleration?: number;
  /** Whether fun mode is enabled (default: true) */
  enabled?: boolean;
  /** Optional max speed override for this provider */
  maxSpeed?: number;
}

// ============================================================================
// Menu Configuration
// ============================================================================

/**
 * Menu positioning modes for the context menu.
 *
 * - `static` - Menu stays at exact click position (may go off-screen)
 * - `inView` - Menu adjusts position to stay fully visible in viewport
 * - `dynamic` - User can drag the menu to reposition it
 *
 * @since 1.1.0
 */
export type MenuPositionMode = "dynamic" | "inView" | "static";

/**
 * Menu item displayed in the Anyclick context menu.
 *
 * @example
 * ```tsx
 * const menuItems: ContextMenuItem[] = [
 *   {
 *     type: "bug",
 *     label: "Report Bug",
 *     icon: <BugIcon />,
 *     showComment: true,
 *   },
 *   {
 *     type: "feature",
 *     label: "Request Feature",
 *     showComment: true,
 *     requiredRoles: ["admin", "developer"],
 *   },
 * ];
 * ```
 *
 * @since 1.0.0
 */
export interface ContextMenuItem {
  /** Optional badge to render next to the label */
  badge?: FeedbackMenuBadge;
  /** Child menu items (creates a submenu) */
  children?: ContextMenuItem[];
  /** Optional icon */
  icon?: ReactNode;
  /**
   * Stable unique id for React keys and deduplication.
   * If not provided, one will be auto-generated from type + label.
   */
  id?: string;
  /** Display label */
  label: string;
  /**
   * Optional click handler for custom behavior.
   * Return `false` (or a Promise resolving to false) to skip the default submission flow.
   */
  onClick?: (context: {
    closeMenu: () => void;
    containerElement: Element | null;
    targetElement: Element | null;
  }) => boolean | Promise<boolean | void> | void;
  /**
   * Priority for sorting menu items (1-10, where 10 = highest priority).
   * Items are sorted by priority descending. Default: 5.
   */
  priority?: number;
  /** Optional role(s) required to see this menu item */
  requiredRoles?: string[];
  /** Whether to show a comment input for this type */
  showComment?: boolean;
  /** Optional status to signal availability (e.g., coming soon) */
  status?: FeedbackMenuStatus;
  /** Feedback type for this option (use unique identifier for parent items with children) */
  type: AnyclickType;
}

/**
 * Visual badge for menu items.
 *
 * @example
 * ```tsx
 * const badge: FeedbackMenuBadge = {
 *   label: "New",
 *   tone: "success",
 * };
 * ```
 *
 * @since 1.2.0
 */
export interface FeedbackMenuBadge {
  /** Text shown inside the badge */
  label: string;
  /** Optional tone to drive styling */
  tone?: "info" | "neutral" | "success" | "warning";
}

/**
 * Status of a menu item used for presets.
 *
 * - `available` - Item is fully functional
 * - `comingSoon` - Item is visible but disabled
 *
 * @since 1.2.0
 */
export type FeedbackMenuStatus = "available" | "comingSoon";

// ============================================================================
// Highlight Configuration
// ============================================================================

/**
 * Configuration for highlight colors.
 *
 * @example
 * ```tsx
 * const colors: HighlightColors = {
 *   targetColor: "#ef4444",      // Red for target
 *   containerColor: "#3b82f6",   // Blue for container
 *   targetShadowOpacity: 0.3,
 *   containerShadowOpacity: 0.15,
 * };
 * ```
 *
 * @since 1.0.0
 */
export interface HighlightColors {
  /** Color for the container element highlight (default: #8b5cf6 - purple) */
  containerColor?: string;
  /** Opacity for the container shadow (default: 0.1) */
  containerShadowOpacity?: number;
  /** Color for the target element highlight (default: #3b82f6 - blue) */
  targetColor?: string;
  /** Opacity for the target shadow (default: 0.25) */
  targetShadowOpacity?: number;
}

/**
 * Configuration for highlight behavior.
 *
 * @example
 * ```tsx
 * const highlightConfig: HighlightConfig = {
 *   enabled: true,
 *   colors: { targetColor: "#ef4444" },
 *   containerSelectors: [".card", ".modal", "[data-container]"],
 *   minChildrenForContainer: 3,
 * };
 * ```
 *
 * @since 1.0.0
 */
export interface HighlightConfig {
  /** Custom colors for highlights */
  colors?: HighlightColors;
  /** CSS selectors to identify container elements */
  containerSelectors?: string[];
  /** Whether to show highlights (default: true) */
  enabled?: boolean;
  /** Minimum number of children for an element to be considered a container (default: 2) */
  minChildrenForContainer?: number;
}

// ============================================================================
// User Context
// ============================================================================

/**
 * User context for role-based menu filtering.
 *
 * @example
 * ```tsx
 * const userContext: AnyclickUserContext = {
 *   id: "user-123",
 *   email: "user@example.com",
 *   roles: ["admin", "developer"],
 * };
 *
 * const visibleItems = filterMenuItemsByRole(allMenuItems, userContext);
 * ```
 *
 * @since 1.2.0
 */
export interface AnyclickUserContext {
  /** User email */
  email?: string;
  /** User ID */
  id?: string;
  /** User's role(s) */
  roles?: string[];
}

/**
 * Filters menu items based on user context and required roles.
 *
 * Items without required roles are shown to everyone.
 * Items with required roles are only shown to users who have at least one matching role.
 *
 * @param items - Menu items to filter
 * @param userContext - Optional user context with roles
 * @returns Filtered menu items visible to the user
 *
 * @example
 * ```tsx
 * const allItems: ContextMenuItem[] = [
 *   { type: "bug", label: "Report Bug" },
 *   { type: "admin", label: "Admin Panel", requiredRoles: ["admin"] },
 * ];
 *
 * const userContext = { roles: ["user"] };
 * const visibleItems = filterMenuItemsByRole(allItems, userContext);
 * // => [{ type: "bug", label: "Report Bug" }]
 * ```
 *
 * @since 1.2.0
 */
export function filterMenuItemsByRole(
  items: ContextMenuItem[],
  userContext?: AnyclickUserContext,
): ContextMenuItem[] {
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

// ============================================================================
// Provider Props
// ============================================================================

/**
 * Props for the AnyclickProvider component.
 *
 * @example
 * ```tsx
 * <AnyclickProvider
 *   adapter={myAdapter}
 *   menuItems={customMenuItems}
 *   highlightConfig={{ colors: { targetColor: "#ef4444" } }}
 *   screenshotConfig={{ enabled: true, showPreview: true }}
 *   onSubmitSuccess={(payload) => console.log("Submitted:", payload)}
 * >
 *   <App />
 * </AnyclickProvider>
 * ```
 *
 * @since 1.0.0
 */
export interface AnyclickProviderProps {
  /** The adapter to use for submitting anyclick */
  adapter: AnyclickAdapter;
  /** Child components */
  children: ReactNode;
  /** Cooldown in milliseconds between submissions (rate limiting) */
  cooldownMs?: number;
  /** Whether the provider is disabled */
  disabled?: boolean;
  /**
   * Callback to get dynamic menu items based on the right-clicked element.
   * Called once when the context menu opens. Returned items are merged with menuItems.
   * For child-component registration, use registerDynamicMenuItems from context instead.
   */
  dynamicMenuItems?: (element: Element) => ContextMenuItem[];
  /** Header content */
  header?: ReactNode | null;
  /** Configuration for element highlighting */
  highlightConfig?: HighlightConfig;
  /** Maximum number of ancestors to capture */
  maxAncestors?: number;
  /** Maximum length for innerText capture */
  maxInnerTextLength?: number;
  /** Maximum length for outerHTML capture */
  maxOuterHTMLLength?: number;
  /** Custom class name for the context menu */
  menuClassName?: string;
  /** Custom menu items (defaults to Issue, Feature, Like) */
  menuItems?: ContextMenuItem[];
  /** Menu positioning mode (default: 'inView') */
  menuPositionMode?: MenuPositionMode;
  /** Custom styles for the context menu */
  menuStyle?: CSSProperties;
  /** Additional metadata to include with every submission */
  metadata?: Record<string, unknown>;
  /** Callback after failed submission */
  onSubmitError?: (error: Error, payload: AnyclickPayload) => void;
  /** Callback after successful submission */
  onSubmitSuccess?: (payload: AnyclickPayload) => void;
  /**
   * Configuration for QuickChat AI assistant.
   * Set to enable the lightweight AI chat in the context menu.
   */
  quickChatConfig?: QuickChatConfig;
  /**
   * Whether to scope this provider to its children only.
   * When true, events will only be captured for elements within this provider's subtree.
   * When false (default), events are captured for the entire document.
   */
  scoped?: boolean;
  /** Configuration for screenshot capture */
  screenshotConfig?: ScreenshotConfig;
  /** Attributes to strip from outerHTML for privacy */
  stripAttributes?: string[];
  /**
   * Filter function to determine if anyclick should be captured for a target element.
   * Return true to allow anyclick, false to ignore.
   * Accepts both MouseEvent (right-click) and TouchEvent (press-and-hold).
   */
  targetFilter?: (event: AnyclickTriggerEvent, target: Element) => boolean;
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
  /**
   * User context for role-based menu filtering.
   * When provided, menu items with requiredRoles will be filtered based on user roles.
   */
  userContext?: AnyclickUserContext;
}

// ============================================================================
// Context Value
// ============================================================================

/**
 * Context value exposed by AnyclickProvider.
 *
 * Access via the {@link useAnyclick} hook.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     isEnabled,
 *     isSubmitting,
 *     openMenu,
 *     closeMenu,
 *     submitAnyclick,
 *     theme,
 *   } = useAnyclick();
 *
 *   // ...
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface AnyclickContextValue {
  /** Close the anyclick menu */
  closeMenu: () => void;
  /** Whether anyclick is currently enabled */
  isEnabled: boolean;
  /** Whether a submission is in progress */
  isSubmitting: boolean;
  /** Open the anyclick menu programmatically */
  openMenu: (element: Element, position: { x: number; y: number }) => void;
  /** The provider's unique ID */
  providerId: string;
  /**
   * Register a dynamic menu getter for this provider.
   * Returns an unregister function.
   * Called once per menu open to get context-aware menu items.
   */
  registerDynamicMenuItems: (
    getter: (element: Element) => ContextMenuItem[],
  ) => () => void;
  /** Whether this provider is scoped */
  scoped: boolean;
  /** Submit anyclick for a specific element */
  submitAnyclick: (
    element: Element,
    type: AnyclickType,
    comment?: string,
  ) => Promise<void>;
  /** The current merged theme (inherited from ancestors) */
  theme: AnyclickTheme;
}

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for the ContextMenu component.
 *
 * @since 1.0.0
 */
export interface ContextMenuProps {
  /** Custom class name */
  className?: string;
  /** Container element found by highlight logic */
  containerElement: Element | null;
  /** Footer content */
  footer?: ReactNode;
  /** Header content */
  header?: ReactNode;
  /** Configuration for element highlighting */
  highlightConfig?: HighlightConfig;
  /** Whether submission is in progress */
  isSubmitting: boolean;
  /** Menu items to display */
  items: ContextMenuItem[];
  /** Callback when menu is closed */
  onClose: () => void;
  /** Callback when an item is selected */
  onSelect: (
    type: AnyclickType,
    comment?: string,
    screenshots?: ScreenshotData,
  ) => void;
  /** Position of the menu */
  position: { x: number; y: number };
  /** Menu positioning mode (default: 'inView') */
  positionMode?: MenuPositionMode;
  /**
   * Configuration for QuickChat AI assistant.
   * When provided, shows the QuickChat interface in the context menu.
   */
  quickChatConfig?: QuickChatConfig;
  /** Configuration for screenshot capture */
  screenshotConfig?: ScreenshotConfig;
  /** Custom styles */
  style?: CSSProperties;
  /** Target element for anyclick */
  targetElement: Element | null;
  /** Whether the menu is visible */
  visible: boolean;
}

/**
 * Props for the ScreenshotPreview component.
 *
 * @since 1.0.0
 */
export interface ScreenshotPreviewProps {
  /** Whether screenshots are loading */
  isLoading: boolean;
  /** Whether submission is in progress */
  isSubmitting: boolean;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Callback when user confirms screenshots */
  onConfirm: (screenshots: ScreenshotData) => void;
  /** Callback when user wants to retake screenshots */
  onRetake: () => void;
  /** Captured screenshot data */
  screenshots: ScreenshotData | null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generates compact styles from a CompactModeConfig.
 *
 * Used internally by InspectDialog to apply compact mode styling.
 *
 * @param config - The compact mode configuration
 * @returns Record of style objects keyed by component name
 * @internal
 */
export function generateCompactStyles(
  config: CompactModeConfig,
): Record<string, React.CSSProperties> {
  return {
    actionButton: {
      fontSize: `${config.fonts.button}px`,
      gap: config.gaps.button,
      padding: config.spacing.buttonPadding,
    },
    actionButtonDanger: {
      fontSize: `${config.fonts.button}px`,
      padding: config.spacing.buttonDangerPadding,
    },
    actionButtonPrimary: {
      fontSize: `${config.fonts.button}px`,
      gap: config.gaps.button,
      padding: config.spacing.buttonPrimaryPadding,
    },
    badge: {
      fontSize: `${config.fonts.badge}px`,
      padding: config.spacing.badgePadding,
    },
    classes: {
      fontSize: `${config.fonts.tag}px`,
    },
    closeButton: {
      height: `${config.sizes.closeButton}px`,
      width: `${config.sizes.closeButton}px`,
    },
    copyButtonSmall: {
      height: `${config.sizes.copyButtonSmall}px`,
      width: `${config.sizes.copyButtonSmall}px`,
    },
    dialog: {
      fontSize: `${config.fonts.base}px`,
      width: `${config.sizes.dialogWidth}px`,
    },
    footer: {
      gap: config.gaps.footer,
      padding: config.spacing.footerPadding,
    },
    header: {
      padding: config.spacing.headerPadding,
    },
    headerTitle: {
      fontSize: `${config.fonts.title}px`,
      gap: config.gaps.headerTitle,
    },
    id: {
      fontSize: `${config.fonts.tag}px`,
    },
    identity: {
      padding: config.spacing.identityPadding,
    },
    pinButtons: {
      gap: config.gaps.pinButtons,
      padding: "1px",
    },
    propertyLabel: {
      fontSize: `${config.fonts.property}px`,
    },
    propertyRow: {
      gap: config.gaps.propertyRow,
      padding: config.spacing.propertyRowPadding,
    },
    propertyValue: {
      fontSize: `${config.fonts.property}px`,
      gap: config.gaps.propertyValue,
    },
    sectionContent: {
      padding: config.spacing.sectionContentPadding,
    },
    sectionHeader: {
      fontSize: `${config.fonts.section}px`,
      padding: config.spacing.sectionHeaderPadding,
    },
    sectionTitle: {
      letterSpacing: config.letterSpacing.sectionTitle,
    },
    selectorCode: {
      fontSize: `${config.fonts.selector}px`,
      padding: config.spacing.selectorCodePadding,
    },
    styleCategory: {
      marginBottom: `${config.sizes.categoryMarginBottom}px`,
    },
    styleCategoryHeader: {
      fontSize: `${config.fonts.property}px`,
      marginBottom: `${config.sizes.styleCategoryHeaderMarginBottom}px`,
    },
    styleRow: {
      fontSize: `${config.fonts.styleRow}px`,
      padding: config.spacing.styleRowPadding,
    },
    styleValue: {
      maxWidth: `${config.sizes.styleValueMaxWidth}px`,
    },
    tag: {
      fontSize: `${config.fonts.tag}px`,
    },
  };
}
