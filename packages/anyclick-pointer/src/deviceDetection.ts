/**
 * Device detection utilities for cross-platform pointer support
 *
 * Helps distinguish between:
 * - Mobile: Touch-only devices (phones) - hide custom pointer
 * - Tablet: Touch + optional mouse/stylus - show pointer for mouse/stylus only
 * - Desktop: Mouse/pointer devices - show pointer
 */

/**
 * Cached device detection results (computed once per session)
 */
let cachedHasTouchSupport: boolean | null = null;
let cachedHasFinePointer: boolean | null = null;
let cachedIsMobile: boolean | null = null;

/**
 * Check if the device has touch support
 */
export function hasTouchSupport(): boolean {
  if (typeof window === "undefined") return false;

  if (cachedHasTouchSupport === null) {
    cachedHasTouchSupport =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - msMaxTouchPoints is IE-specific
      navigator.msMaxTouchPoints > 0;
  }

  return cachedHasTouchSupport;
}

/**
 * Check if the device has a fine pointer (mouse, stylus, trackpad)
 * This is more reliable than touch detection for determining pointer precision
 */
export function hasFinePointer(): boolean {
  if (typeof window === "undefined") return true; // Assume desktop in SSR

  if (cachedHasFinePointer === null) {
    cachedHasFinePointer = window.matchMedia("(pointer: fine)").matches;
  }

  return cachedHasFinePointer;
}

/**
 * Check if the device is likely a mobile phone (small screen + touch)
 * Uses screen size heuristics
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  if (cachedIsMobile === null) {
    // Check screen size (mobile phones typically have screens < 768px width)
    const isSmallScreen = window.innerWidth < 768;

    // Check if it's a touch device without fine pointer
    const isTouchOnly = hasTouchSupport() && !hasFinePointer();

    // Also check user agent for additional confidence
    const mobileUserAgent =
      /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    // Consider it mobile if it's touch-only OR (small screen AND mobile user agent)
    cachedIsMobile = isTouchOnly || (isSmallScreen && mobileUserAgent);
  }

  return cachedIsMobile;
}

/**
 * Check if the device is likely a tablet (larger screen + touch, may have mouse/stylus)
 */
export function isTabletDevice(): boolean {
  if (typeof window === "undefined") return false;

  // Tablet: has touch, larger screen, may or may not have fine pointer
  const hasTouch = hasTouchSupport();
  const isLargerScreen = window.innerWidth >= 768;
  const isTabletUserAgent = /iPad|Android/i.test(navigator.userAgent);

  return hasTouch && isLargerScreen && isTabletUserAgent && !isMobileDevice();
}

/**
 * Check if the device is a desktop (no touch or has fine pointer)
 */
export function isDesktopDevice(): boolean {
  if (typeof window === "undefined") return true; // Assume desktop in SSR

  return !hasTouchSupport() || hasFinePointer();
}

/**
 * Determine if the custom pointer should be shown
 *
 * Returns true for:
 * - Desktop devices (always show)
 * - Tablet devices with fine pointer capability (show for mouse/stylus)
 *
 * Returns false for:
 * - Mobile phones (touch-only)
 * - Tablet devices without fine pointer (pure touch tablets)
 */
export function shouldShowPointer(): boolean {
  if (typeof window === "undefined") return true; // Assume desktop in SSR

  const deviceType = getDeviceType();
  const hasTouch = hasTouchSupport();
  const hasFine = hasFinePointer();

  let result: boolean;

  // Mobile phones: never show custom pointer
  if (isMobileDevice()) {
    result = false;
  } else if (!hasTouch) {
    // Desktop: always show
    result = true;
  } else {
    // Tablet or hybrid device: only show if it has fine pointer capability
    result = hasFine;
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[Anyclick:DeviceDetection] shouldShowPointer", {
      result,
      deviceType,
      hasTouchSupport: hasTouch,
      hasFinePointer: hasFine,
    });
  }

  return result;
}

/**
 * Track whether the last interaction was from touch
 * Used to distinguish between touch-emulated mouse events and real mouse events
 */
let lastInteractionWasTouch = false;
let touchInteractionTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Mark that a touch interaction just occurred
 * This is used to filter out touch-emulated mouse events
 */
export function markTouchInteraction(): void {
  lastInteractionWasTouch = true;

  // Clear the flag after a short delay
  // Mouse events from touch typically fire within 300-500ms
  if (touchInteractionTimeout) {
    clearTimeout(touchInteractionTimeout);
  }
  touchInteractionTimeout = setTimeout(() => {
    lastInteractionWasTouch = false;
    touchInteractionTimeout = null;
  }, 500);
}

/**
 * Check if the last interaction was from touch
 * Used to filter out touch-emulated mouse events
 */
export function wasLastInteractionTouch(): boolean {
  return lastInteractionWasTouch;
}

/**
 * Clear the touch interaction flag
 */
export function clearTouchInteraction(): void {
  lastInteractionWasTouch = false;
  if (touchInteractionTimeout) {
    clearTimeout(touchInteractionTimeout);
    touchInteractionTimeout = null;
  }
}

/**
 * Reset all cached device detection values
 * Useful for testing or when device capabilities change (e.g., orientation change)
 */
export function resetDeviceDetectionCache(): void {
  cachedHasTouchSupport = null;
  cachedHasFinePointer = null;
  cachedIsMobile = null;
}

/**
 * Get device type as a string for debugging
 */
export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (isMobileDevice()) return "mobile";
  if (isTabletDevice()) return "tablet";
  return "desktop";
}
