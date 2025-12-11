/**
 * Device detection utilities for cross-platform pointer support
 */

let cachedHasTouchSupport: boolean | null = null;
let cachedHasFinePointer: boolean | null = null;
let cachedIsMobile: boolean | null = null;

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

export function hasFinePointer(): boolean {
  if (typeof window === "undefined") return true;

  if (cachedHasFinePointer === null) {
    cachedHasFinePointer = window.matchMedia("(pointer: fine)").matches;
  }

  return cachedHasFinePointer;
}

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  if (cachedIsMobile === null) {
    const isSmallScreen = window.innerWidth < 768;
    const isTouchOnly = hasTouchSupport() && !hasFinePointer();
    const mobileUserAgent =
      /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    cachedIsMobile = isTouchOnly || (isSmallScreen && mobileUserAgent);
  }

  return cachedIsMobile;
}

export function isTabletDevice(): boolean {
  if (typeof window === "undefined") return false;

  const hasTouch = hasTouchSupport();
  const isLargerScreen = window.innerWidth >= 768;
  const isTabletUserAgent = /iPad|Android/i.test(navigator.userAgent);

  return hasTouch && isLargerScreen && isTabletUserAgent && !isMobileDevice();
}

export function isDesktopDevice(): boolean {
  if (typeof window === "undefined") return true;
  return !hasTouchSupport() || hasFinePointer();
}

export function shouldShowPointer(): boolean {
  if (typeof window === "undefined") return true;

  const deviceType = getDeviceType();
  const hasTouch = hasTouchSupport();
  const hasFine = hasFinePointer();

  let result: boolean;

  if (isMobileDevice()) {
    result = false;
  } else if (!hasTouch) {
    result = true;
  } else {
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

let lastInteractionWasTouch = false;
let touchInteractionTimeout: ReturnType<typeof setTimeout> | null = null;

export function markTouchInteraction(): void {
  lastInteractionWasTouch = true;

  if (touchInteractionTimeout) {
    clearTimeout(touchInteractionTimeout);
  }
  touchInteractionTimeout = setTimeout(() => {
    lastInteractionWasTouch = false;
    touchInteractionTimeout = null;
  }, 500);
}

export function wasLastInteractionTouch(): boolean {
  return lastInteractionWasTouch;
}

export function clearTouchInteraction(): void {
  lastInteractionWasTouch = false;
  if (touchInteractionTimeout) {
    clearTimeout(touchInteractionTimeout);
    touchInteractionTimeout = null;
  }
}

export function resetDeviceDetectionCache(): void {
  cachedHasTouchSupport = null;
  cachedHasFinePointer = null;
  cachedIsMobile = null;
}

export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (isMobileDevice()) return "mobile";
  if (isTabletDevice()) return "tablet";
  return "desktop";
}
