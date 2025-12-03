"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createFeedbackClient } from "@ewjdev/anyclick-core";
import type {
  FeedbackClient,
  FeedbackType,
  ScreenshotData,
} from "@ewjdev/anyclick-core";
import { FeedbackContext } from "./context";
import { ContextMenu } from "./ContextMenu";
import { findContainerParent } from "./highlight";
import type {
  FeedbackContextValue,
  FeedbackMenuItem,
  FeedbackProviderProps,
} from "./types";

/**
 * Default menu items
 */
const defaultMenuItems: FeedbackMenuItem[] = [
  { type: "issue", label: "Report an issue", showComment: true },
  { type: "feature", label: "Request a feature", showComment: true },
  { type: "like", label: "I like this!", showComment: false },
];

/**
 * FeedbackProvider component - wraps your app to enable feedback capture
 */
export function FeedbackProvider({
  adapter,
  children,
  targetFilter,
  menuItems = defaultMenuItems,
  maxInnerTextLength,
  maxOuterHTMLLength,
  maxAncestors,
  cooldownMs,
  stripAttributes,
  metadata,
  onSubmitSuccess,
  onSubmitError,
  menuStyle,
  menuClassName,
  disabled = false,
  highlightConfig,
  screenshotConfig,
}: FeedbackProviderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [containerElement, setContainerElement] = useState<Element | null>(
    null,
  );

  const clientRef = useRef<FeedbackClient | null>(null);

  // Create/update the feedback client
  useEffect(() => {
    const client = createFeedbackClient({
      adapter,
      targetFilter,
      maxInnerTextLength,
      maxOuterHTMLLength,
      maxAncestors,
      cooldownMs,
      stripAttributes,
    });

    // Set up callbacks
    client.onSubmitSuccess = onSubmitSuccess;
    client.onSubmitError = onSubmitError;

    // Set up context menu handler
    client.onContextMenu = (event, element) => {
      setTargetElement(element);
      // Find container element for screenshot capture
      const container = findContainerParent(element, highlightConfig);
      setContainerElement(container);
      setMenuPosition({ x: event.clientX, y: event.clientY });
      setMenuVisible(true);
    };

    clientRef.current = client;

    // Attach event listeners if not disabled
    if (!disabled) {
      client.attach();
    }

    return () => {
      client.detach();
    };
  }, [
    adapter,
    targetFilter,
    maxInnerTextLength,
    maxOuterHTMLLength,
    maxAncestors,
    cooldownMs,
    stripAttributes,
    onSubmitSuccess,
    onSubmitError,
    disabled,
    highlightConfig,
  ]);

  // Submit feedback with optional screenshots
  const submitFeedback = useCallback(
    async (
      element: Element,
      type: FeedbackType,
      comment?: string,
      screenshots?: ScreenshotData,
    ) => {
      const client = clientRef.current;
      if (!client) return;

      setIsSubmitting(true);
      try {
        await client.submitFeedback(element, type, {
          comment,
          metadata,
          screenshots,
        });
      } finally {
        setIsSubmitting(false);
        setMenuVisible(false);
        setTargetElement(null);
        setContainerElement(null);
      }
    },
    [metadata],
  );

  // Open menu programmatically
  const openMenu = useCallback(
    (element: Element, position: { x: number; y: number }) => {
      setTargetElement(element);
      const container = findContainerParent(element, highlightConfig);
      setContainerElement(container);
      setMenuPosition(position);
      setMenuVisible(true);
    },
    [highlightConfig],
  );

  // Close menu
  const closeMenu = useCallback(() => {
    setMenuVisible(false);
    setTargetElement(null);
    setContainerElement(null);
  }, []);

  // Handle menu selection
  const handleMenuSelect = useCallback(
    (type: FeedbackType, comment?: string, screenshots?: ScreenshotData) => {
      if (targetElement) {
        submitFeedback(targetElement, type, comment, screenshots);
      }
    },
    [targetElement, submitFeedback],
  );

  // Context value
  const contextValue: FeedbackContextValue = useMemo(
    () => ({
      isEnabled: !disabled,
      isSubmitting,
      submitFeedback,
      openMenu,
      closeMenu,
    }),
    [disabled, isSubmitting, submitFeedback, openMenu, closeMenu],
  );

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      <ContextMenu
        visible={menuVisible && !disabled}
        position={menuPosition}
        targetElement={targetElement}
        containerElement={containerElement}
        items={menuItems}
        onSelect={handleMenuSelect}
        onClose={closeMenu}
        isSubmitting={isSubmitting}
        style={menuStyle}
        className={menuClassName}
        highlightConfig={highlightConfig}
        screenshotConfig={screenshotConfig}
      />
    </FeedbackContext.Provider>
  );
}
