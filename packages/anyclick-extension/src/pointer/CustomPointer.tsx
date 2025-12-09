"use client";

import React, { useEffect, useRef, useState } from "react";

const CURSOR_HIDE_STYLE_ID = "anyclick-pointer-cursor-hide";
const POINTER_COLOR = "#3b82f6"; // brand blue
const POINTER_SIZE = 24;
const CIRCLE_SIZE = 44;

export interface SimplePointerProps {
  enabled?: boolean;
}

type InteractionState = "normal" | "pressing" | "rightClick";

/**
 * Custom pointer with click animations.
 * - Shows brand-colored arrow cursor
 * - Scales down slightly on left-click press
 * - Shows circle on right-click
 */
export function CustomPointer({ enabled = true }: SimplePointerProps) {
  const pointerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [interaction, setInteraction] = useState<InteractionState>("normal");
  const [showRipple, setShowRipple] = useState(false);

  const isVisibleRef = useRef(false);
  const interactionRef = useRef<InteractionState>("normal");
  const latestPositionRef = useRef({ x: -100, y: -100 });
  const rafIdRef = useRef<number | null>(null);
  const rippleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  console.log("[Anyclick][pointer] CustomPointer RENDER", {
    enabled,
    isVisible,
    interaction,
  });

  useEffect(() => {
    if (!enabled) {
      console.log("[Anyclick][pointer] DISABLED - cleaning up");
      document.getElementById(CURSOR_HIDE_STYLE_ID)?.remove();
      return;
    }

    console.log("[Anyclick][pointer] ENABLED - setting up");

    // Hide native cursor
    let cursorStyle = document.getElementById(
      CURSOR_HIDE_STYLE_ID,
    ) as HTMLStyleElement | null;
    if (!cursorStyle) {
      cursorStyle = document.createElement("style");
      cursorStyle.id = CURSOR_HIDE_STYLE_ID;
      cursorStyle.textContent = "* { cursor: none !important; }";
      document.head.appendChild(cursorStyle);
      console.log("[Anyclick][pointer] Injected cursor:none style");
    }

    // DOM inspection after React render
    setTimeout(() => {
      const host = document.getElementById("anyclick-pointer-root");
      const pointer = pointerRef.current;
      console.log("[Anyclick][pointer] DOM INSPECTION", {
        hostExists: !!host,
        hostInDOM: host
          ? document.body.contains(host) ||
            document.documentElement.contains(host)
          : false,
        hostParent: host?.parentElement?.tagName,
        pointerExists: !!pointer,
        pointerBoundingRect: pointer?.getBoundingClientRect(),
      });
    }, 100);

    // Position update
    const applyPosition = () => {
      const pointer = pointerRef.current;
      if (!pointer) return;
      const { x, y } = latestPositionRef.current;
      pointer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const scheduleFrame = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        applyPosition();
      });
    };

    // Pointer move handler
    let moveCount = 0;
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;

      moveCount++;
      const { clientX, clientY } = event;
      latestPositionRef.current = { x: clientX, y: clientY };

      if (moveCount <= 3) {
        console.log(`[Anyclick][pointer] MOVE #${moveCount}`, {
          x: clientX,
          y: clientY,
        });
      }

      if (!isVisibleRef.current) {
        console.log("[Anyclick][pointer] First move - setting VISIBLE");
        isVisibleRef.current = true;
        setIsVisible(true);
      }

      // Reset right-click state on move (user dismissed context menu)
      if (interactionRef.current === "rightClick") {
        interactionRef.current = "normal";
        setInteraction("normal");
      }

      scheduleFrame();
    };

    // Pointer down - start press animation
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;

      if (event.button === 0 && interactionRef.current === "normal") {
        console.log("[Anyclick][pointer] LEFT CLICK DOWN - pressing");
        interactionRef.current = "pressing";
        setInteraction("pressing");
      }
    };

    // Pointer up - end press animation
    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;

      if (interactionRef.current === "pressing") {
        console.log("[Anyclick][pointer] LEFT CLICK UP - normal");
        interactionRef.current = "normal";
        setInteraction("normal");
      }
    };

    // Context menu - right-click animation
    const handleContextMenu = (event: MouseEvent) => {
      if (event.button !== 2) return;

      console.log("[Anyclick][pointer] RIGHT CLICK - showing circle");
      interactionRef.current = "rightClick";
      setInteraction("rightClick");
      setShowRipple(true);

      // Clear any existing ripple timeout
      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }
      rippleTimeoutRef.current = setTimeout(() => {
        setShowRipple(false);
      }, 600);
    };

    // Click - reset from right-click state
    const handleClick = () => {
      if (interactionRef.current === "rightClick") {
        console.log("[Anyclick][pointer] CLICK - resetting from rightClick");
        interactionRef.current = "normal";
        setInteraction("normal");
      }
    };

    console.log("[Anyclick][pointer] Attaching event listeners");
    document.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    document.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });
    document.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClick);

    return () => {
      console.log("[Anyclick][pointer] CLEANUP");
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClick);
      document.getElementById(CURSOR_HIDE_STYLE_ID)?.remove();

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  const isRightClick = interaction === "rightClick";
  const isPressing = interaction === "pressing";

  return (
    <div
      ref={pointerRef}
      data-anyclick-pointer="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 2147483647,
        pointerEvents: "none",
        transform: "translate3d(-100px, -100px, 0)",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.1s",
      }}
    >
      {/* Arrow pointer - hides on right-click, scales on press */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          color: POINTER_COLOR,
          filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))",
          transform: `scale(${isRightClick ? 0 : isPressing ? 0.85 : 1}) rotate(${isRightClick ? "-15deg" : "0deg"})`,
          opacity: isRightClick ? 0 : 1,
          transition: "transform 0.12s ease-out, opacity 0.12s ease-out",
          transformOrigin: "top left",
        }}
      >
        {/* Classic cursor arrow shape */}
        <svg
          width={POINTER_SIZE}
          height={POINTER_SIZE}
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        >
          <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z" />
        </svg>
      </div>

      {/* Right-click circle - shows on right-click, slight scale on press */}
      <div
        style={{
          position: "absolute",
          top: -(CIRCLE_SIZE / 2) + 2,
          left: -(CIRCLE_SIZE / 2) + 2,
          width: CIRCLE_SIZE,
          height: CIRCLE_SIZE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${isRightClick ? 1 : isPressing ? 0.5 : 0})`,
          opacity: isRightClick ? 1 : isPressing ? 0.5 : 0,
          transition: "transform 0.12s ease-out, opacity 0.12s ease-out",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundColor: "rgba(59, 130, 246, 0.4)",
            border: "2px solid rgba(59, 130, 246, 0.7)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          }}
        />
      </div>

      {/* Ripple effect on right-click */}
      {showRipple && isRightClick && (
        <div
          style={{
            position: "absolute",
            top: -(CIRCLE_SIZE / 2) + 2,
            left: -(CIRCLE_SIZE / 2) + 2,
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: "50%",
            border: "2px solid rgba(59, 130, 246, 0.7)",
            pointerEvents: "none",
            animation: "anyclick-ripple 0.5s ease-out forwards",
          }}
        />
      )}

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
