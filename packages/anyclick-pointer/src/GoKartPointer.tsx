"use client";

import { motion } from "motion/react";
import { MousePointer2 } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CustomPointerProps,
  GoKartState,
  PointerConfig,
  PointerTheme,
} from "./types";
import {
  defaultPointerConfig,
  defaultPointerTheme,
  defaultPointerThemeColors,
  defaultPointerThemeSizes,
} from "./types";

/**
 * Merge theme with defaults
 */
function mergeTheme(theme?: PointerTheme) {
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
 * Merge config with defaults (includes fun mode)
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

const KEYBOARD_MAP: Record<string, "forward" | "back" | "left" | "right"> = {
  ArrowUp: "forward",
  w: "forward",
  W: "forward",
  ArrowDown: "back",
  s: "back",
  S: "back",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
};

/**
 * GoKartPointer renders the cursor as a small go-kart with keyboard controls.
 * It clamps movement to the provided track element and bounces off walls/obstacles.
 */
export function GoKartPointer({
  theme,
  config,
  enabled = true,
  onInteractionChange,
}: CustomPointerProps) {
  const mergedTheme = useMemo(() => mergeTheme(theme), [theme]);
  const mergedConfig = useMemo(() => mergeConfig(config), [config]);
  const funConfig = mergedConfig.funConfig ?? defaultPointerConfig.funConfig;

  const [state, setState] = useState<GoKartState>(() => ({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    angle: 0,
  }));
  const [isReady, setIsReady] = useState(false);
  const [isAccelerating, setIsAccelerating] = useState(false);

  const pointerRef = useRef<HTMLDivElement>(null);
  const keyState = useRef<
    Record<"forward" | "back" | "left" | "right", boolean>
  >({
    forward: false,
    back: false,
    left: false,
    right: false,
  });
  const trackRectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const size = mergedTheme.sizes.pointerSize;
  const halfSize = size / 2 + 4; // small buffer for collisions

  const updateTrackRect = useCallback(() => {
    const trackEl = funConfig.getTrackElement?.();
    if (trackEl) {
      trackRectRef.current = trackEl.getBoundingClientRect();
    } else {
      trackRectRef.current = null;
    }
  }, [funConfig]);

  // Initialize position at center of track
  useEffect(() => {
    updateTrackRect();
    const rect = trackRectRef.current;
    if (rect) {
      setState((prev) => ({
        ...prev,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        },
      }));
      setIsReady(true);
    }
  }, [updateTrackRect]);

  // Keyboard handling
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const mapped = KEYBOARD_MAP[event.key];
      if (mapped) {
        keyState.current[mapped] = true;
        if (mapped === "forward" || mapped === "back") {
          onInteractionChange?.("pressing");
          setIsAccelerating(true);
        }
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const mapped = KEYBOARD_MAP[event.key];
      if (mapped) {
        keyState.current[mapped] = false;
        const stillAccelerating =
          keyState.current.forward || keyState.current.back;
        if (!stillAccelerating) {
          onInteractionChange?.("normal");
          setIsAccelerating(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled, onInteractionChange]);

  // Track resize
  useEffect(() => {
    if (!enabled) return;
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateTrackRect())
        : null;
    const trackEl = funConfig.getTrackElement?.();
    if (trackEl && resizeObserver) {
      resizeObserver.observe(trackEl);
    }
    window.addEventListener("resize", updateTrackRect);
    return () => {
      window.removeEventListener("resize", updateTrackRect);
      resizeObserver?.disconnect();
    };
  }, [enabled, funConfig, updateTrackRect]);

  // Motion loop
  useEffect(() => {
    if (!enabled) return;
    const loop = (time: number) => {
      const last = lastTimeRef.current ?? time;
      const dt = Math.min((time - last) / 1000, 0.05); // cap delta to avoid spikes
      lastTimeRef.current = time;

      setState((prev) => {
        const { position, velocity, angle } = prev;
        if (!trackRectRef.current) {
          return prev;
        }

        // Update heading based on input
        let nextAngle = angle;
        const turnSpeed = 3.4; // radians per second
        if (keyState.current.left) {
          nextAngle -= turnSpeed * dt;
        }
        if (keyState.current.right) {
          nextAngle += turnSpeed * dt;
        }

        // Apply acceleration/braking
        let nextVel = { ...velocity };
        const accel =
          funConfig.acceleration ??
          defaultPointerConfig.funConfig.acceleration ??
          0;
        const maxSpeed =
          funConfig.maxSpeed ?? defaultPointerConfig.funConfig.maxSpeed ?? 0;
        const heading = {
          x: Math.cos(nextAngle),
          y: Math.sin(nextAngle),
        };
        if (keyState.current.forward) {
          nextVel.x += heading.x * accel * dt;
          nextVel.y += heading.y * accel * dt;
        }
        if (keyState.current.back) {
          nextVel.x -= heading.x * (accel * 0.6) * dt;
          nextVel.y -= heading.y * (accel * 0.6) * dt;
        }

        // Apply friction
        const friction =
          funConfig.friction ?? defaultPointerConfig.funConfig.friction ?? 0.82;
        const frictionFactor = Math.pow(friction, dt * 60);
        nextVel.x *= frictionFactor;
        nextVel.y *= frictionFactor;

        // Clamp speed
        const speed = Math.hypot(nextVel.x, nextVel.y);
        if (speed > maxSpeed) {
          const scale = maxSpeed / speed;
          nextVel.x *= scale;
          nextVel.y *= scale;
        }

        // Integrate position
        let nextX = position.x + nextVel.x * dt;
        let nextY = position.y + nextVel.y * dt;

        const rect = trackRectRef.current;
        const minX = rect.left + halfSize;
        const maxX = rect.right - halfSize;
        const minY = rect.top + halfSize;
        const maxY = rect.bottom - halfSize;
        const bounce =
          funConfig.bounceDamping ??
          defaultPointerConfig.funConfig.bounceDamping ??
          0;

        // Wall collisions
        if (nextX < minX) {
          nextX = minX;
          nextVel.x = -nextVel.x * bounce;
        } else if (nextX > maxX) {
          nextX = maxX;
          nextVel.x = -nextVel.x * bounce;
        }
        if (nextY < minY) {
          nextY = minY;
          nextVel.y = -nextVel.y * bounce;
        } else if (nextY > maxY) {
          nextY = maxY;
          nextVel.y = -nextVel.y * bounce;
        }

        // Obstacle collisions (simple AABB vs circle)
        const obstacles = funConfig.getObstacles?.() ?? [];
        for (const ob of obstacles) {
          const nearestX = Math.max(ob.left, Math.min(nextX, ob.right));
          const nearestY = Math.max(ob.top, Math.min(nextY, ob.bottom));
          const distX = nextX - nearestX;
          const distY = nextY - nearestY;
          const distSq = distX * distX + distY * distY;
          const radius = halfSize;
          if (distSq < radius * radius) {
            // Resolve along smallest axis
            if (Math.abs(distX) > Math.abs(distY)) {
              nextX = distX > 0 ? ob.right + radius : ob.left - radius;
              nextVel.x = -nextVel.x * bounce;
            } else {
              nextY = distY > 0 ? ob.bottom + radius : ob.top - radius;
              nextVel.y = -nextVel.y * bounce;
            }
          }
        }

        // Derive facing angle from velocity if moving; otherwise keep heading
        const nextSpeed = Math.hypot(nextVel.x, nextVel.y);
        const displayAngle =
          nextSpeed > 30 ? Math.atan2(nextVel.y, nextVel.x) : nextAngle;

        return {
          position: { x: nextX, y: nextY },
          velocity: nextVel,
          angle: displayAngle,
        };
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    };
  }, [enabled, funConfig]);

  // Hide browser cursor if requested
  useEffect(() => {
    if (!enabled || !mergedConfig.hideDefaultCursor) return;
    const styleId = "anyclick-pointer-cursor-hide";
    let styleElement = document.getElementById(
      styleId,
    ) as HTMLStyleElement | null;
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = "* { cursor: none !important; }";
    return () => {
      document.getElementById(styleId)?.remove();
    };
  }, [enabled, mergedConfig.hideDefaultCursor]);

  if (!enabled || mergedConfig.visibility === "never") {
    return null;
  }

  const { colors } = mergedTheme;
  const { zIndex, offset } = mergedConfig;
  const { position, angle } = state;
  const finalX = position.x + offset[0];
  const finalY = position.y + offset[1];
  const { pointerIcon, sizes } = mergedTheme;

  return (
    <motion.div
      ref={pointerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex,
        pointerEvents: "none",
        opacity: isReady ? 1 : 0,
      }}
      animate={{
        x: finalX,
        y: finalY,
        rotate: (angle * 180) / Math.PI,
        scale: isAccelerating ? 1.05 : 1,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.6 }}
    >
      <div
        style={{
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.pointerColor,
          filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15))",
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
    </motion.div>
  );
}

export default GoKartPointer;
