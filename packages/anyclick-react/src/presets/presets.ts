import { CSSProperties } from "react";
import { openInspectDialog } from "@ewjdev/anyclick-devtools";
import type { ContextMenuItem } from "../types";
import { CreatePresetMenuOptions, PresetConfig, PresetRole } from "./types";

/**
 * Default preset configurations for each role.
 *
 * These are the base configurations that {@link createPresetMenu} uses.
 * You can use them directly if you don't need any customization.
 *
 * @since 1.2.0
 */
const presetDefaults: Record<PresetRole, PresetConfig> = {
  chrome: {
    description:
      "Chrome-like context menu with core browser actions and native styling.",
    label: "Chrome",
    menuItems: [
      {
        label: "Reload page",
        onClick: ({ closeMenu }) => {
          closeMenu();
          if (typeof window !== "undefined") {
            window.location.reload();
          }
          return false;
        },
        showComment: false,
        type: "reload_page",
      },
      {
        label: "Print…",
        onClick: ({ closeMenu }) => {
          closeMenu();
          if (typeof window !== "undefined") {
            window.print();
          }
          return false;
        },
        showComment: false,
        type: "print_page",
      },
      {
        label: 'Search "Google"',
        onClick: ({ closeMenu }) => {
          closeMenu();
          if (typeof window === "undefined") return false;
          const selection = window.getSelection()?.toString().trim();
          const query = selection && selection.length > 0 ? selection : "";
          const url = query
            ? `https://www.google.com/search?q=${encodeURIComponent(query)}`
            : "https://www.google.com";
          window.open(url, "_blank", "noopener,noreferrer");
          return false;
        },
        showComment: false,
        type: "search_google",
      },
      {
        label: "Ask t3.chat",
        onClick: ({ closeMenu }) => {
          closeMenu();
          if (typeof window === "undefined") return false;
          const selection = window.getSelection()?.toString().trim();
          const query = selection && selection.length > 0 ? selection : "";
          const url = query
            ? `https://t3.chat/?q=${encodeURIComponent(query)}`
            : "https://t3.chat";
          window.open(url, "_blank", "noopener,noreferrer");
          return false;
        },
        showComment: false,
        type: "ask_t3chat",
      },
      {
        label: "Share…",
        onClick: async ({ closeMenu }) => {
          closeMenu();
          if (typeof window === "undefined") return false;
          const shareData = {
            text: document.title,
            title: document.title,
            url: window.location.href,
          };
          try {
            if (navigator.share) {
              await navigator.share(shareData);
            } else if (navigator.clipboard?.writeText) {
              await navigator.clipboard.writeText(window.location.href);
            }
          } catch {
            // Silently ignore share/clipboard errors to match native feel
          }
          return false;
        },
        showComment: false,
        type: "share_page",
      },
      {
        label: "Inspect",
        onClick: ({ closeMenu, targetElement }) => {
          closeMenu();
          if (targetElement) {
            openInspectDialog(targetElement);
          }
          return false;
        },
        showComment: false,
        type: "inspect",
      },
    ],
    role: "chrome",
    screenshotConfig: {
      enabled: false,
    },
    theme: {
      highlightConfig: {
        enabled: false,
      },
      menuStyle: {
        "--anyclick-menu-accent": "#8ab4f8",
        "--anyclick-menu-accent-text": "#0b1117",
        "--anyclick-menu-bg": "#202124",
        "--anyclick-menu-border": "#3c4043",
        "--anyclick-menu-cancel-bg": "#2f3135",
        "--anyclick-menu-cancel-text": "#9aa0a6",
        "--anyclick-menu-hover": "#2f3135",
        "--anyclick-menu-input-bg": "#2f3135",
        "--anyclick-menu-input-border": "#3c4043",
        "--anyclick-menu-text": "#e8eaed",
        "--anyclick-menu-text-muted": "#9aa0a6",
        backgroundColor: "#202124",
        border: "1px solid #3c4043",
        borderRadius: 6,
        boxShadow: "0 8px 18px rgba(0, 0, 0, 0.4)",
        color: "#e8eaed",
        fontFamily:
          'Roboto, "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: 14,
        letterSpacing: 0,
        minWidth: 240,
        padding: 0,
      } as CSSProperties,
    },
  },
  designer: {
    description: "Visual QA with contrast and motion cues.",
    label: "Designer",
    menuItems: [
      { label: "Visual bug", showComment: true, type: "visual_bug" },
      { label: "Accessibility", showComment: true, type: "accessibility" },
      { label: "Copy / tone", showComment: true, type: "copy_tone" },
      {
        badge: { label: "Coming soon", tone: "info" },
        label: "Motion glitch",
        showComment: true,
        status: "comingSoon",
        type: "motion_glitch",
      },
    ],
    metadata: {
      capture: {
        colorContrast: true,
        prefersReducedMotion: true,
      },
    },
    role: "designer",
    screenshotConfig: {
      enabled: true,
      padding: 32,
      quality: 0.75,
      showPreview: true,
    },
    theme: {
      highlightConfig: {
        colors: {
          containerColor: "#22d3ee",
          targetColor: "#a855f7",
        },
      },
    },
  },
  developer: {
    description: "Debug-ready menu with diagnostics placeholders.",
    label: "Developer",
    menuItems: [
      { label: "Bug", showComment: true, type: "bug" },
      { label: "Refactor request", showComment: true, type: "refactor" },
      {
        children: [
          {
            badge: { label: "Coming soon", tone: "info" },
            label: "Console snapshot",
            showComment: false,
            status: "comingSoon",
            type: "console_snapshot",
          },
          {
            badge: { label: "Coming soon", tone: "info" },
            label: "Network trace",
            showComment: false,
            status: "comingSoon",
            type: "network_trace",
          },
          {
            label: "Copy CSS selector",
            showComment: false,
            type: "copy_selector",
          },
        ],
        label: "Diagnostics",
        type: "diagnostics",
      },
    ],
    metadata: {
      capture: {
        console: "errors",
        network: "errors",
        reduxState: "opt-in",
      },
    },
    role: "developer",
    screenshotConfig: {
      enabled: true,
      padding: 20,
      quality: 0.7,
      showPreview: true,
    },
    theme: {
      highlightConfig: {
        colors: {
          containerColor: "#0ea5e9",
          targetColor: "#22c55e",
        },
      },
    },
  },
  pm: {
    description: "Idea-first menu with quick impact sizing.",
    label: "PM",
    menuItems: [
      { label: "Feature idea", showComment: true, type: "feature" },
      { label: "UX papercut", showComment: true, type: "ux_papercut" },
      { label: "Customer quote", showComment: true, type: "success_story" },
      {
        badge: { label: "Coming soon", tone: "neutral" },
        label: "Impact / priority",
        showComment: true,
        status: "comingSoon",
        type: "impact_sizing",
      },
    ],
    metadata: {
      capture: {
        audience: "pm",
        sentiment: true,
      },
    },
    role: "pm",
    screenshotConfig: {
      enabled: true,
      padding: 16,
      quality: 0.65,
      showPreview: true,
    },
  },
  qa: {
    description: "Defect-first menu tuned for repros and logs.",
    label: "QA",
    menuItems: [
      { label: "Bug / defect", showComment: true, type: "bug" },
      { label: "UX papercut", showComment: true, type: "ux_papercut" },
      { label: "Repro steps", showComment: true, type: "repro_steps" },
      {
        badge: { label: "Coming soon", tone: "info" },
        label: "Performance trace",
        showComment: true,
        status: "comingSoon",
        type: "perf_trace",
      },
      {
        badge: { label: "Coming soon", tone: "info" },
        label: "Video capture",
        showComment: false,
        status: "comingSoon",
        type: "video_capture",
      },
    ],
    metadata: {
      capture: {
        console: "errors",
        domSnapshot: true,
        network: "errors",
      },
    },
    role: "qa",
    screenshotConfig: {
      enabled: true,
      padding: 24,
      quality: 0.7,
      showPreview: true,
    },
  },
};

/**
 * Creates a preset menu configuration for a specific role.
 *
 * Returns a complete configuration that can be spread into AnyclickProvider props.
 * Coming-soon items are included by default but shown as disabled.
 *
 * @param role - The preset role to create a menu for
 * @param options - Optional customization options
 * @returns A complete preset configuration
 * @throws {Error} If an unknown role is specified
 *
 * @example
 * ```tsx
 * // Basic usage
 * const qaPreset = createPresetMenu("qa");
 *
 * // With customization
 * const devPreset = createPresetMenu("developer", {
 *   includeComingSoon: false,
 *   overrides: {
 *     screenshotConfig: { quality: 0.9 },
 *   },
 * });
 *
 * <AnyclickProvider
 *   adapter={adapter}
 *   menuItems={qaPreset.menuItems}
 *   screenshotConfig={qaPreset.screenshotConfig}
 *   theme={qaPreset.theme}
 * >
 *   <App />
 * </AnyclickProvider>
 * ```
 *
 * @since 1.2.0
 */
export function createPresetMenu(
  role: PresetRole,
  options: CreatePresetMenuOptions = {},
): PresetConfig {
  const preset = presetDefaults[role];
  if (!preset) {
    throw new Error(`Unknown preset role: ${role}`);
  }

  const includeComingSoon = options.includeComingSoon ?? true;
  const menuItems = (options.overrides?.menuItems ?? preset.menuItems).filter(
    (item) => (includeComingSoon ? true : item.status !== "comingSoon"),
  );

  // Shallow-clone menu items so consumers can mutate safely
  const clonedMenuItems: ContextMenuItem[] = menuItems.map((item) => ({
    ...item,
    children: item.children
      ? item.children.map((child) => ({ ...child }))
      : undefined,
  }));

  return {
    description: preset.description,
    label: preset.label,
    menuItems: clonedMenuItems,
    metadata: {
      ...preset.metadata,
      ...options.overrides?.metadata,
    },
    role: preset.role,
    screenshotConfig: {
      ...preset.screenshotConfig,
      ...options.overrides?.screenshotConfig,
    },
    theme: {
      ...preset.theme,
      ...options.overrides?.theme,
    },
  };
}

/**
 * Lists all available preset configurations.
 *
 * Returns cloned copies of all presets so they can be safely modified.
 * Useful for displaying available options or building custom preset selectors.
 *
 * @returns Array of all preset configurations
 *
 * @example
 * ```tsx
 * const presets = listPresets();
 *
 * function PresetSelector({ onSelect }) {
 *   return (
 *     <select onChange={(e) => onSelect(e.target.value)}>
 *       {presets.map((preset) => (
 *         <option key={preset.role} value={preset.role}>
 *           {preset.label} - {preset.description}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 *
 * @since 1.2.0
 */
export function listPresets(): PresetConfig[] {
  return Object.values(presetDefaults).map((preset) => ({
    ...preset,
    menuItems: preset.menuItems.map((item) => ({
      ...item,
      children: item.children
        ? item.children.map((child) => ({ ...child }))
        : undefined,
    })),
  }));
}

export { presetDefaults };

/**
 * Creates a menu item for sending selected text or a query to t3.chat.
 *
 * Can be added to any custom menu configuration. Uses the current text
 * selection if available, otherwise opens t3.chat without a pre-filled query.
 *
 * @param options - Optional customization for the menu item
 * @returns A ContextMenuItem configured for t3.chat
 *
 * @example
 * ```tsx
 * import { createT3ChatMenuItem } from "@ewjdev/anyclick-react";
 *
 * const menuItems = [
 *   { label: "Bug", type: "bug", showComment: true },
 *   createT3ChatMenuItem(),
 * ];
 * ```
 *
 * @since 1.5.0
 */
export function createT3ChatMenuItem(
  options: {
    /** Custom label for the menu item */
    label?: string;
    /** Base URL for t3.chat */
    baseUrl?: string;
  } = {},
): ContextMenuItem {
  const { label = "Ask t3.chat", baseUrl = "https://t3.chat" } = options;

  return {
    label,
    onClick: ({ closeMenu }) => {
      closeMenu();
      if (typeof window === "undefined") return false;
      const selection = window.getSelection()?.toString().trim();
      const query = selection && selection.length > 0 ? selection : "";
      const url = query
        ? `${baseUrl}/?q=${encodeURIComponent(query)}`
        : baseUrl;
      window.open(url, "_blank", "noopener,noreferrer");
      return false;
    },
    showComment: false,
    type: "ask_t3chat",
  };
}

/**
 * Gets the currently selected text on the page.
 *
 * Useful for checking if text is selected before showing certain menu items.
 *
 * @returns The selected text, or empty string if nothing is selected
 *
 * @example
 * ```tsx
 * const selection = getSelectedText();
 * if (selection) {
 *   console.log("Selected:", selection);
 * }
 * ```
 *
 * @since 1.5.0
 */
export function getSelectedText(): string {
  if (typeof window === "undefined") return "";
  return window.getSelection()?.toString().trim() ?? "";
}

/**
 * Checks if there is currently any text selected on the page.
 *
 * @returns true if text is selected
 *
 * @since 1.5.0
 */
export function hasTextSelection(): boolean {
  return getSelectedText().length > 0;
}

/**
 * Detects if an element is or contains an image that can be uploaded.
 *
 * Checks for:
 * - `<img>` elements
 * - `<picture>` elements
 * - `<canvas>` elements
 * - `<svg>` elements
 * - CSS background images
 *
 * @param element - The element to check
 * @returns Object with isImage flag and optional image source
 *
 * @since 1.5.0
 */
export function detectImageElement(element: Element | null): {
  isImage: boolean;
  src?: string;
  type?: "img" | "picture" | "svg" | "canvas" | "background";
} {
  if (!element) return { isImage: false };

  // Check if element itself is an image
  if (element.tagName === "IMG") {
    const img = element as HTMLImageElement;
    return {
      isImage: true,
      src: img.src || img.currentSrc,
      type: "img",
    };
  }

  // Check if element is a picture element
  if (element.tagName === "PICTURE") {
    const img = element.querySelector("img");
    return {
      isImage: true,
      src: img?.src || img?.currentSrc,
      type: "picture",
    };
  }

  // Check if element is an SVG
  if (element.tagName === "SVG" || element.tagName === "svg") {
    return {
      isImage: true,
      type: "svg",
    };
  }

  // Check if element is a canvas
  if (element.tagName === "CANVAS") {
    return {
      isImage: true,
      type: "canvas",
    };
  }

  // Check for CSS background image
  if (typeof window !== "undefined") {
    const computedStyle = window.getComputedStyle(element);
    const backgroundImage = computedStyle.backgroundImage;

    if (backgroundImage && backgroundImage !== "none") {
      const urlMatch = backgroundImage.match(/url\(["']?(.+?)["']?\)/);
      if (urlMatch) {
        return {
          isImage: true,
          src: urlMatch[1],
          type: "background",
        };
      }
    }
  }

  // Check if any child is an image
  const imgChild = element.querySelector("img");
  if (imgChild) {
    return {
      isImage: true,
      src: imgChild.src || imgChild.currentSrc,
      type: "img",
    };
  }

  return { isImage: false };
}

/**
 * Creates a menu item for uploading images to UploadThing.
 *
 * The menu item will upload the target element if it's an image,
 * or a screenshot of the element otherwise.
 *
 * Requires an UploadThing adapter to be configured. The onClick handler
 * receives the target element and can use detectImageElement to determine
 * if it's an image.
 *
 * @param options - Configuration options
 * @returns A ContextMenuItem configured for UploadThing
 *
 * @example
 * ```tsx
 * import { createUploadThingMenuItem } from "@ewjdev/anyclick-react";
 *
 * const menuItems = [
 *   createUploadThingMenuItem({
 *     endpoint: "/api/uploadthing",
 *     onUploadComplete: (result) => {
 *       console.log("Uploaded:", result.url);
 *     },
 *   }),
 * ];
 * ```
 *
 * @since 1.5.0
 */
export function createUploadThingMenuItem(
  options: {
    /** Custom label for the menu item */
    label?: string;
    /** API endpoint for uploading */
    endpoint?: string;
    /** Callback when upload completes */
    onUploadComplete?: (result: { url?: string; error?: string }) => void;
    /** Callback when upload fails */
    onUploadError?: (error: Error) => void;
  } = {},
): ContextMenuItem {
  const {
    label = "Upload to UploadThing",
    endpoint = "/api/uploadthing",
    onUploadComplete,
    onUploadError,
  } = options;

  return {
    label,
    onClick: async ({ closeMenu, targetElement }) => {
      if (!targetElement) {
        onUploadError?.(new Error("No target element"));
        return false;
      }

      try {
        const imageInfo = detectImageElement(targetElement);

        // If it's an image with a source, fetch and upload it
        if (imageInfo.isImage && imageInfo.src) {
          const response = await fetch(imageInfo.src);
          const blob = await response.blob();

          const formData = new FormData();
          const filename = `image-${Date.now()}.${blob.type.split("/")[1] || "png"}`;
          formData.append("file", blob, filename);

          const uploadResponse = await fetch(endpoint, {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
          }

          const result = await uploadResponse.json();
          onUploadComplete?.(result);
        } else if (imageInfo.isImage && imageInfo.type === "canvas") {
          // Handle canvas elements
          const canvas = targetElement as HTMLCanvasElement;
          const dataUrl = canvas.toDataURL("image/png");
          const response = await fetch(dataUrl);
          const blob = await response.blob();

          const formData = new FormData();
          formData.append("file", blob, `canvas-${Date.now()}.png`);

          const uploadResponse = await fetch(endpoint, {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
          }

          const result = await uploadResponse.json();
          onUploadComplete?.(result);
        } else {
          // For non-image elements, you would need to capture a screenshot
          // This requires the screenshot capture functionality
          onUploadError?.(
            new Error(
              "Element is not an image. Screenshot upload requires anyclick-core.",
            ),
          );
        }
      } catch (error) {
        onUploadError?.(
          error instanceof Error ? error : new Error(String(error)),
        );
      }

      closeMenu();
      return false;
    },
    showComment: false,
    type: "upload_image",
  };
}

/**
 * Creates a menu item for uploading screenshots to UploadThing.
 *
 * This captures a screenshot of the target element and uploads it.
 * Requires the screenshot preview to be enabled for best results.
 *
 * @param options - Configuration options
 * @returns A ContextMenuItem configured for screenshot uploads
 *
 * @example
 * ```tsx
 * import { createUploadScreenshotMenuItem } from "@ewjdev/anyclick-react";
 *
 * const menuItems = [
 *   createUploadScreenshotMenuItem({
 *     endpoint: "/api/uploadthing",
 *     onUploadComplete: (result) => {
 *       navigator.clipboard.writeText(result.url);
 *     },
 *   }),
 * ];
 * ```
 *
 * @since 1.5.0
 */
export function createUploadScreenshotMenuItem(
  options: {
    /** Custom label for the menu item */
    label?: string;
    /** API endpoint for uploading */
    endpoint?: string;
    /** Callback when upload completes */
    onUploadComplete?: (result: { url?: string; error?: string }) => void;
    /** Callback when upload fails */
    onUploadError?: (error: Error) => void;
  } = {},
): ContextMenuItem {
  const {
    label = "Upload Screenshot",
    endpoint = "/api/uploadthing",
    onUploadComplete,
    onUploadError,
  } = options;

  return {
    label,
    badge: { label: "Coming soon", tone: "info" },
    status: "comingSoon",
    onClick: async ({ closeMenu }) => {
      // This would integrate with the screenshot capture flow
      // For now, show as coming soon since it requires deep integration
      // with the screenshot preview component
      onUploadError?.(
        new Error("Screenshot upload will be available in a future release"),
      );
      closeMenu();
      return false;
    },
    showComment: false,
    type: "upload_screenshot",
  };
}
