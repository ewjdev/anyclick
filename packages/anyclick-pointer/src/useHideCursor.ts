"use client";

import { useEffect } from "react";

/**
 * Style element ID for cursor hiding
 */
const CURSOR_HIDE_STYLE_ID = "anyclick-pointer-cursor-hide";

/**
 * Hook to hide the default browser cursor
 *
 * @param enabled - Whether to hide the cursor (default: true)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useHideCursor(true);
 *   return <div>Cursor is hidden</div>;
 * }
 * ```
 */
export function useHideCursor(enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) {
      // Remove the style element if it exists
      document.getElementById(CURSOR_HIDE_STYLE_ID)?.remove();
      return;
    }

    // Check if style element already exists
    let styleElement = document.getElementById(
      CURSOR_HIDE_STYLE_ID,
    ) as HTMLStyleElement | null;

    if (!styleElement) {
      // Create and inject the style element
      styleElement = document.createElement("style");
      styleElement.id = CURSOR_HIDE_STYLE_ID;
      document.head.appendChild(styleElement);
    }

    // Set the cursor hiding CSS
    styleElement.textContent = "* { cursor: none !important; }";

    // Cleanup: remove the style element when component unmounts or enabled becomes false
    return () => {
      document.getElementById(CURSOR_HIDE_STYLE_ID)?.remove();
    };
  }, [enabled]);
}
