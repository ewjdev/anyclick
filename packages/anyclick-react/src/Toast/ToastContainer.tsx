"use client";

/**
 * ToastContainer component for @ewjdev/anyclick-react
 *
 * Renders toasts in a fixed position container using a portal.
 *
 * @module Toast/ToastContainer
 * @since 1.6.0
 */
import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "motion/react";
import { Toast } from "./Toast";
import { POSITION_STYLES, containerStyles } from "./styles";
import { useToastStore } from "./toastStore";
import type { ToastConfig } from "./types";

export interface ToastContainerProps {
  /** Position of the toast container */
  position?: ToastConfig["position"];
}

/**
 * Container component that renders all active toasts.
 *
 * Uses a portal to render toasts at the document body level,
 * ensuring they appear above all other content.
 *
 * @example
 * ```tsx
 * // Typically included automatically by AnyclickProvider
 * <ToastContainer position="bottom-right" />
 * ```
 */
export function ToastContainer({
  position = "bottom-right",
}: ToastContainerProps) {
  const [mounted, setMounted] = useState(false);
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  // Only render after mount to avoid SSR hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDismiss = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast],
  );

  // Don't render on server or if no toasts
  if (!mounted) {
    return null;
  }

  const positionStyle = POSITION_STYLES[position];

  const container = (
    <div
      style={{
        ...containerStyles,
        ...positionStyle,
      }}
      data-anyclick-toast-container
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={handleDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );

  // Render via portal to document body
  return createPortal(container, document.body);
}
