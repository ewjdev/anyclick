"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import MousePointerIcon from "./MousePointerIcon";
import {
  clearTouchInteraction,
  getDeviceType,
  markTouchInteraction,
  shouldShowPointer,
  wasLastInteractionTouch,
} from "./deviceDetection";
import type {
  CustomPointerProps,
  PointerConfig,
  PointerInteractionState,
  PointerTheme,
} from "./types";
import {
  defaultPointerConfig,
  defaultPointerTheme,
  defaultPointerThemeColors,
  defaultPointerThemeSizes,
} from "./types";

/**
 * CSS style IDs
 */
const CURSOR_HIDE_STYLE_ID = "anyclick-pointer-cursor-hide";
const RIPPLE_KEYFRAMES_STYLE_ID = "anyclick-pointer-ripple-keyframes";

/**
 * Fully merged theme with required values
 */
interface MergedTheme {
  colors: Required<NonNullable<PointerTheme["colors"]>>;
  sizes: Required<NonNullable<PointerTheme["sizes"]>>;
  pointerIcon: PointerTheme["pointerIcon"];
  circleElement: PointerTheme["circleElement"];
}

/**
 * Merge theme with defaults
 */
function mergeTheme(theme?: PointerTheme): MergedTheme {
  return {
    colors: {
      pointerColor:
        theme?.colors?.pointerColor ?? defaultPointerThemeColors.pointerColor,
      circleColor:
        theme?.colors?.circleColor ?? defaultPointerThemeColors.circleColor,
      circleBorderColor:
        theme?.colors?.circleBorderColor ??
        defaultPointerThemeColors.circleBorderColor,
    },
    sizes: {
      pointerSize:
        theme?.sizes?.pointerSize ?? defaultPointerThemeSizes.pointerSize,
      circleSize:
        theme?.sizes?.circleSize ?? defaultPointerThemeSizes.circleSize,
      circleBorderWidth:
        theme?.sizes?.circleBorderWidth ??
        defaultPointerThemeSizes.circleBorderWidth,
    },
    pointerIcon: theme?.pointerIcon ?? defaultPointerTheme.pointerIcon,
    circleElement: theme?.circleElement ?? defaultPointerTheme.circleElement,
  };
}

/**
 * Merge config with defaults
 */
function mergeConfig(config?: PointerConfig): Required<PointerConfig> {
  return {
    ...defaultPointerConfig,
    ...config,
    offset: config?.offset ?? defaultPointerConfig.offset,
    funConfig: {
      ...defaultPointerConfig.funConfig,
      ...config?.funConfig,
      getTrackElement:
        config?.funConfig?.getTrackElement ??
        defaultPointerConfig.funConfig.getTrackElement,
      getObstacles:
        config?.funConfig?.getObstacles ??
        defaultPointerConfig.funConfig.getObstacles,
    },
  };
}

/**
 * CustomPointer component - renders the custom cursor visualization
 *
 * Simple implementation that uses direct DOM manipulation for position
 * to avoid React re-renders on every mouse move.
 */
function CustomPointerImpl({
  theme,
  config,
  enabled = true,
  onInteractionChange,
}: CustomPointerProps) {
  if (process.env.NODE_ENV === "development") {
    console.count("CustomPointer RENDER");
  }
  const mergedTheme = useMemo(() => mergeTheme(theme), [theme]);
  const mergedConfig = useMemo(() => mergeConfig(config), [config]);

  // Ref for direct DOM manipulation (no re-renders for position)
  const pointerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);

  // Track if pointer should be shown based on device type
  const [shouldRender, setShouldRender] = useState(true);

  const rippleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisibleRef = useRef(false);
  const interactionStateRef = useRef<PointerInteractionState>("normal");
  const rightClickActiveRef = useRef(false);
  const rippleActiveRef = useRef(false);
  const onInteractionChangeRef = useRef(onInteractionChange);

  const rafIdRef = useRef<number | null>(null);
  const latestMousePosRef = useRef<{ x: number; y: number } | null>(null);

  const { colors, sizes } = mergedTheme;
  const { zIndex, offset } = mergedConfig;

  // Direct DOM position update (no React re-render)
  const updatePosition = useCallback(
    (x: number, y: number) => {
      if (pointerRef.current) {
        const finalX = x + offset[0];
        const finalY = y + offset[1];
        pointerRef.current.style.transform = `translate3d(${finalX}px, ${finalY}px, 0)`;
      }
    },
    [offset],
  );

  useEffect(() => {
    onInteractionChangeRef.current = onInteractionChange;
  }, [onInteractionChange]);

  const setVisible = useCallback((visible: boolean) => {
    if (!pointerRef.current) return;
    pointerRef.current.style.opacity = visible ? "1" : "0";
  }, []);

  const showRipple = useCallback(() => {
    const el = rippleRef.current;
    if (!el) return;

    // display + restart animation (so it can retrigger if it was hidden)
    el.style.display = "block";
    el.style.animation = "none";
    // Force reflow to restart animation reliably
    void el.offsetHeight;
    el.style.animation = "anyclick-ripple 0.5s ease-out forwards";
  }, []);

  const hideRipple = useCallback(() => {
    const el = rippleRef.current;
    if (!el) return;
    el.style.display = "none";
    el.style.animation = "";
  }, []);

  const applyVisualState = useCallback(
    (state: PointerInteractionState) => {
      const iconEl = iconRef.current;
      const circleEl = circleRef.current;
      if (!iconEl || !circleEl) return;

      const isRightClick = state === "rightClick";
      const isPressing = state === "pressing";

      iconEl.style.transform = `scale(${isRightClick ? 0 : isPressing ? 0.9 : 1}) rotate(${isRightClick ? "-15deg" : "0deg"})`;
      iconEl.style.opacity = isRightClick ? "0" : "1";

      circleEl.style.transform = `scale(${isRightClick ? 1 : isPressing ? 0.6 : 0})`;
      circleEl.style.opacity = isRightClick ? "1" : isPressing ? "0.6" : "0";

      // Match previous behavior: ripple only renders while visually in rightClick
      if (isRightClick && rippleActiveRef.current) {
        showRipple();
      } else {
        hideRipple();
      }
    },
    [hideRipple, showRipple],
  );

  const setInteractionState = useCallback(
    (next: PointerInteractionState) => {
      if (interactionStateRef.current === next) return;
      interactionStateRef.current = next;
      onInteractionChangeRef.current?.(next);
      applyVisualState(next);
    },
    [applyVisualState],
  );

  // Detect device type on mount and update shouldRender
  useEffect(() => {
    const checkDevice = () => {
      const should = shouldShowPointer();
      setShouldRender(should);

      if (process.env.NODE_ENV === "development") {
        console.log("[CustomPointer] Device detection:", {
          deviceType: getDeviceType(),
          shouldShowPointer: should,
        });
      }
    };

    checkDevice();

    // Re-check on resize (device orientation change might affect detection)
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Inject ripple keyframes once (avoid <style> in render)
  useEffect(() => {
    let styleEl = document.getElementById(
      RIPPLE_KEYFRAMES_STYLE_ID,
    ) as HTMLStyleElement | null;

    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = RIPPLE_KEYFRAMES_STYLE_ID;
      styleEl.textContent = `
        @keyframes anyclick-ripple {
          0% {
            transform: scale(0.8);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, []);

  // Apply initial visuals once mounted (no React state needed)
  useEffect(() => {
    applyVisualState(interactionStateRef.current);
    // If ripple element exists, ensure it starts hidden
    hideRipple();
  }, [applyVisualState, hideRipple]);

  // Set up event listeners
  useEffect(() => {
    // Don't attach listeners if disabled or device shouldn't show pointer
    if (!enabled || !shouldRender) {
      // TEMPORARILY DISABLED: Make sure to remove cursor hide style if it exists
      // if (mergedConfig.hideDefaultCursor) {
      //   document.getElementById(CURSOR_HIDE_STYLE_ID)?.remove();
      // }
      // Always clean up cursor hiding for debugging
      document.getElementById(CURSOR_HIDE_STYLE_ID)?.remove();
      return;
    }

    // Track touch events to filter out touch-emulated mouse events
    const handleTouchStart = () => {
      markTouchInteraction();
    };

    const handleTouchEnd = () => {
      // Keep the touch flag for a bit to catch emulated mouse events
      // The markTouchInteraction function handles the timeout internally
    };

    const handleMouseMove = (event: MouseEvent) => {
      // Ignore touch-emulated mouse events
      // These fire shortly after touch events on mobile/tablet
      if (wasLastInteractionTouch()) {
        return;
      }

      latestMousePosRef.current = { x: event.clientX, y: event.clientY };
      if (rafIdRef.current === null) {
        rafIdRef.current = window.requestAnimationFrame(() => {
          rafIdRef.current = null;
          const pos = latestMousePosRef.current;
          if (!pos) return;
          updatePosition(pos.x, pos.y);
        });
      }

      // Only update DOM if visibility changed
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setVisible(true);
        // TEMPORARILY DISABLED: Update cursor hiding when pointer becomes visible
        // if (mergedConfig.hideDefaultCursor) {
        //   const styleElement = document.getElementById(
        //     CURSOR_HIDE_STYLE_ID,
        //   ) as HTMLStyleElement | null;
        //   if (!styleElement) {
        //     const newStyleElement = document.createElement("style");
        //     newStyleElement.id = CURSOR_HIDE_STYLE_ID;
        //     document.head.appendChild(newStyleElement);
        //     newStyleElement.textContent = "* { cursor: none !important; }";
        //   } else {
        //     styleElement.textContent = "* { cursor: none !important; }";
        //   }
        // }
      }

      // When in rightClick state, check if cursor is over a menu
      // Show pointer icon over menus, circle elsewhere
      if (rightClickActiveRef.current) {
        const target = event.target;
        const isOverMenu =
          target instanceof Element && target.closest('[role="menu"]') !== null;
        setInteractionState(isOverMenu ? "normal" : "rightClick");
      }
    };

    const handleMouseLeave = () => {
      isVisibleRef.current = false;
      setVisible(false);
      // TEMPORARILY DISABLED: Remove cursor hiding when mouse leaves document
      // if (mergedConfig.hideDefaultCursor) {
      //   document.getElementById(CURSOR_HIDE_STYLE_ID)?.remove();
      // }
      // Clear touch interaction flag on mouse leave
      clearTouchInteraction();
    };

    const handleContextMenu = (event: MouseEvent) => {
      // Ignore if this contextmenu was triggered by touch (long-press)
      // Touch-triggered contextmenu events are handled by FeedbackClient
      if (wasLastInteractionTouch()) {
        return;
      }

      // Skip if the event was already prevented (handled by FeedbackClient)
      if (event.defaultPrevented) {
        return;
      }

      // Only handle actual mouse right-clicks (button === 2)
      if (event.button !== 2) {
        return;
      }

      rightClickActiveRef.current = true;
      rippleActiveRef.current = true;
      setInteractionState("rightClick");

      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }
      rippleTimeoutRef.current = setTimeout(() => {
        rippleActiveRef.current = false;
        hideRipple();
      }, 600);
    };

    const handleClick = () => {
      // Ignore click if it was from touch
      if (wasLastInteractionTouch()) {
        return;
      }

      if (rightClickActiveRef.current) {
        rightClickActiveRef.current = false;
        setInteractionState("normal");
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      // Ignore touch-emulated mouse events
      if (wasLastInteractionTouch()) {
        return;
      }

      if (
        event.button === 0 &&
        !rightClickActiveRef.current &&
        interactionStateRef.current === "normal"
      ) {
        setInteractionState("pressing");
      }
    };

    const handleMouseUp = () => {
      // Ignore touch-emulated mouse events
      if (wasLastInteractionTouch()) {
        return;
      }

      if (
        !rightClickActiveRef.current &&
        interactionStateRef.current === "pressing"
      ) {
        setInteractionState("normal");
      }
    };

    // Add touch event listeners to track touch interactions
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Add mouse event listeners
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClick);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    // TEMPORARILY DISABLED: Initial cursor hiding state
    // Initial cursor hiding state - only apply if pointer is already visible
    // (For nested providers, cursor hiding will be applied when mouse enters their area)
    // if (mergedConfig.hideDefaultCursor && isVisibleRef.current) {
    //   let styleElement = document.getElementById(
    //     CURSOR_HIDE_STYLE_ID,
    //   ) as HTMLStyleElement | null;

    //   if (!styleElement) {
    //     styleElement = document.createElement("style");
    //     styleElement.id = CURSOR_HIDE_STYLE_ID;
    //     document.head.appendChild(styleElement);
    //   }

    //   styleElement.textContent = "* { cursor: none !important; }";
    // } else if (!mergedConfig.hideDefaultCursor) {
    //   // Remove cursor hiding if config doesn't require it
    //   document.getElementById(CURSOR_HIDE_STYLE_ID)?.remove();
    // }

    // Clean up any existing cursor hiding styles for debugging
    document.getElementById(CURSOR_HIDE_STYLE_ID)?.remove();

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener(
        "mouseleave",
        handleMouseLeave,
      );
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }

      // Always remove cursor hiding on cleanup
      document.getElementById(CURSOR_HIDE_STYLE_ID)?.remove();

      // Clear touch interaction state on cleanup
      clearTouchInteraction();
    };
  }, [
    enabled,
    shouldRender,
    updatePosition,
    mergedConfig.hideDefaultCursor,
    hideRipple,
    setInteractionState,
    setVisible,
  ]);

  // Don't render if not enabled, visibility is never, or device shouldn't show pointer
  if (!enabled || !shouldRender || mergedConfig.visibility === "never") {
    return null;
  }

  const { pointerIcon, circleElement } = mergedTheme;

  return (
    <div
      ref={pointerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex,
        pointerEvents: "none",
        transform: "translate3d(-100px, -100px, 0)",
        opacity: 0,
        transition: "opacity 0.15s ease-out",
        willChange: "transform, opacity",
      }}
    >
      {/* Pointer Icon */}
      <div
        ref={iconRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          color: colors.pointerColor,
          filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15))",
          transform: "scale(1) rotate(0deg)",
          opacity: 1,
          transition: "transform 0.15s ease-out, opacity 0.15s ease-out",
          transformOrigin: "top left",
          willChange: "transform, opacity",
        }}
      >
        {pointerIcon}
        <MousePointerIcon
          size={sizes.pointerSize}
          strokeWidth={2}
          fill="white"
          stroke={colors.pointerColor}
          style={{
            display: pointerIcon ? "none" : "block",
          }}
        />
      </div>

      {/* Circle (Touch Indicator) */}
      <div
        ref={circleRef}
        style={{
          position: "absolute",
          top: -(sizes.circleSize / 2) + 2,
          left: -(sizes.circleSize / 2) + 2,
          width: sizes.circleSize,
          height: sizes.circleSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "scale(0)",
          opacity: 0,
          transition: "transform 0.15s ease-out, opacity 0.15s ease-out",
          willChange: "transform, opacity",
        }}
      >
        {circleElement ?? (
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              backgroundColor: colors.circleColor,
              border: `${sizes.circleBorderWidth}px solid ${colors.circleBorderColor}`,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
          />
        )}
      </div>

      {/* Ripple Effect */}
      <div
        ref={rippleRef}
        style={{
          display: "none",
          position: "absolute",
          top: -(sizes.circleSize / 2) + 2,
          left: -(sizes.circleSize / 2) + 2,
          width: sizes.circleSize,
          height: sizes.circleSize,
          borderRadius: "50%",
          border: `${sizes.circleBorderWidth}px solid ${colors.circleBorderColor}`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export const CustomPointer = React.memo(CustomPointerImpl);
CustomPointer.displayName = "CustomPointer";

export default CustomPointer;
