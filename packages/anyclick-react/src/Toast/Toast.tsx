"use client";

/**
 * Toast component for @ewjdev/anyclick-react
 *
 * Individual toast notification with animation support.
 *
 * @module Toast/Toast
 * @since 1.6.0
 */
import React, { useCallback } from "react";
import { X } from "lucide-react";
import { motion } from "motion/react";
import { TOAST_COLORS, closeButtonStyles, toastStyles } from "./styles";
import type { Toast as ToastType } from "./types";

export interface ToastProps {
  /** Toast data */
  toast: ToastType;
  /** Callback when toast is dismissed */
  onDismiss: (id: string) => void;
}

/**
 * Individual toast notification component.
 *
 * Renders a toast with:
 * - Colored background based on type
 * - Message text
 * - Dismiss button
 * - Enter/exit animations
 */
export const Toast = React.memo(function Toast({
  toast,
  onDismiss,
}: ToastProps) {
  const { bg, border, text } = TOAST_COLORS[toast.type];

  const handleDismiss = useCallback(() => {
    onDismiss(toast.id);
  }, [onDismiss, toast.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        ...toastStyles,
        background: bg,
        borderLeft: `3px solid ${border}`,
        color: text,
      }}
      role="alert"
      aria-live="polite"
    >
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        type="button"
        onClick={handleDismiss}
        style={closeButtonStyles}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "0.7";
        }}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
});
