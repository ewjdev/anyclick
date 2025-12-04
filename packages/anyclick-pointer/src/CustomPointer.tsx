"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MousePointer2 } from "lucide-react";
import type {
  CustomPointerProps,
  PointerInteractionState,
  PointerTheme,
  PointerConfig,
} from "./types";
import {
  defaultPointerTheme,
  defaultPointerThemeColors,
  defaultPointerThemeSizes,
  defaultPointerConfig,
} from "./types";

/**
 * CSS style IDs
 */
const CURSOR_HIDE_STYLE_ID = "anyclick-pointer-cursor-hide";

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
  };
}

/**
 * CustomPointer component - renders the custom cursor visualization
 *
 * Simple implementation that uses direct DOM manipulation for position
 * to avoid React re-renders on every mouse move.
 */
export function CustomPointer({
  theme,
  config,
  enabled = true,
  onInteractionChange,
}: CustomPointerProps) {
  const mergedTheme = useMemo(() => mergeTheme(theme), [theme]);
  const mergedConfig = useMemo(() => mergeConfig(config), [config]);

  // Ref for direct DOM manipulation (no re-renders for position)
  const pointerRef = useRef<HTMLDivElement>(null);

  // Track visibility and interaction state
  const [isVisible, setIsVisible] = useState(false);
  const [interactionState, setInteractionState] =
    useState<PointerInteractionState>("normal");
  const [showRipple, setShowRipple] = useState(false);

  const rippleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisibleRef = useRef(false);
  const interactionStateRef = useRef<PointerInteractionState>("normal");

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

  // Sync interaction state changes to parent via useEffect
  useEffect(() => {
    onInteractionChange?.(interactionState);
  }, [interactionState, onInteractionChange]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (event: MouseEvent) => {
      updatePosition(event.clientX, event.clientY);

      // Only update state if visibility changed
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }

      // When in rightClick state, check if cursor is over a menu
      // Show pointer icon over menus, circle elsewhere
      if (interactionStateRef.current === "rightClick") {
        const target = event.target as HTMLElement;
        const isOverMenu = target.closest('[role="menu"]') !== null;

        if (isOverMenu) {
          // Temporarily show pointer when over menu
          setInteractionState("normal");
        } else {
          // Keep showing circle when outside menu
          setInteractionState("rightClick");
        }
      }
    };

    const handleMouseLeave = () => {
      isVisibleRef.current = false;
      setIsVisible(false);
    };

    const handleContextMenu = () => {
      interactionStateRef.current = "rightClick";
      setInteractionState("rightClick");
      setShowRipple(true);

      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }
      rippleTimeoutRef.current = setTimeout(() => {
        setShowRipple(false);
      }, 600);
    };

    const handleClick = () => {
      if (interactionStateRef.current === "rightClick") {
        interactionStateRef.current = "normal";
        setInteractionState("normal");
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0 && interactionStateRef.current === "normal") {
        interactionStateRef.current = "pressing";
        setInteractionState("pressing");
      }
    };

    const handleMouseUp = () => {
      if (interactionStateRef.current === "pressing") {
        interactionStateRef.current = "normal";
        setInteractionState("normal");
      }
    };

    // Add event listeners
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClick);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    // Hide default cursor
    if (mergedConfig.hideDefaultCursor) {
      let styleElement = document.getElementById(
        CURSOR_HIDE_STYLE_ID,
      ) as HTMLStyleElement | null;

      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = CURSOR_HIDE_STYLE_ID;
        document.head.appendChild(styleElement);
      }

      styleElement.textContent = "* { cursor: none !important; }";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener(
        "mouseleave",
        handleMouseLeave,
      );
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);

      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }

      if (mergedConfig.hideDefaultCursor) {
        document.getElementById(CURSOR_HIDE_STYLE_ID)?.remove();
      }
    };
  }, [enabled, updatePosition, mergedConfig.hideDefaultCursor]);

  // Don't render if not enabled or visibility is never
  if (!enabled || mergedConfig.visibility === "never") {
    return null;
  }

  const { pointerIcon, circleElement } = mergedTheme;
  const isRightClick = interactionState === "rightClick";
  const isPressing = interactionState === "pressing";

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
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.15s ease-out",
      }}
    >
      {/* Pointer Icon */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          color: colors.pointerColor,
          filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15))",
          transform: `scale(${isRightClick ? 0 : isPressing ? 0.9 : 1}) rotate(${isRightClick ? "-15deg" : "0deg"})`,
          opacity: isRightClick ? 0 : 1,
          transition: "transform 0.15s ease-out, opacity 0.15s ease-out",
          transformOrigin: "top left",
        }}
      >
        {pointerIcon ?? (
          <MousePointer2
            size={sizes.pointerSize}
            strokeWidth={2}
            fill="white"
            stroke={colors.pointerColor}
          />
        )}
      </div>

      {/* Circle (Touch Indicator) */}
      <div
        style={{
          position: "absolute",
          top: -(sizes.circleSize / 2) + 2,
          left: -(sizes.circleSize / 2) + 2,
          width: sizes.circleSize,
          height: sizes.circleSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${isRightClick ? 1 : isPressing ? 0.6 : 0})`,
          opacity: isRightClick ? 1 : isPressing ? 0.6 : 0,
          transition: "transform 0.15s ease-out, opacity 0.15s ease-out",
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
      {showRipple && isRightClick && (
        <div
          style={{
            position: "absolute",
            top: -(sizes.circleSize / 2) + 2,
            left: -(sizes.circleSize / 2) + 2,
            width: sizes.circleSize,
            height: sizes.circleSize,
            borderRadius: "50%",
            border: `${sizes.circleBorderWidth}px solid ${colors.circleBorderColor}`,
            pointerEvents: "none",
            animation: "anyclick-ripple 0.5s ease-out forwards",
          }}
        />
      )}

      {/* Ripple keyframes - inject once */}
      <style>{`
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
      `}</style>
    </div>
  );
}

export default CustomPointer;
