/**
 * QuickChat component - Lightweight AI chat in the context menu.
 *
 * Provides a minimal chat interface that auto-focuses when opened,
 * streams AI responses, and offers quick actions.
 *
 * @module QuickChat/QuickChat
 * @since 2.0.0
 */
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Copy,
  ExternalLink,
  Pin,
  PinOff,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { quickChatKeyframes, quickChatStyles } from "./styles";
import type { QuickChatProps } from "./types";
import { useQuickChat } from "./useQuickChat";

const PINNED_STATE_KEY = "anyclick-quick-chat-pinned";

/**
 * Get pinned state from session storage.
 */
function getStoredPinnedState(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(PINNED_STATE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Set pinned state in session storage.
 */
function setStoredPinnedState(pinned: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (pinned) {
      sessionStorage.setItem(PINNED_STATE_KEY, "true");
    } else {
      sessionStorage.removeItem(PINNED_STATE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Injects keyframe animations into the document.
 */
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = quickChatKeyframes;
  document.head.appendChild(style);
  stylesInjected = true;
}

/**
 * Loading dots component.
 */
const LoadingDots = React.memo(function LoadingDots() {
  return (
    <div style={quickChatStyles.loadingDots}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            ...quickChatStyles.loadingDot,
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </div>
  );
});

/**
 * QuickChat component.
 */
export function QuickChat({
  visible,
  targetElement,
  containerElement,
  onClose,
  onPin,
  isPinned: isPinnedProp = false,
  config,
  style,
  className,
  initialInput,
  onInitialInputConsumed,
}: QuickChatProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<string | null>(
    null,
  );

  // Use stored pinned state or prop
  const [localPinned, setLocalPinned] = useState(() => getStoredPinnedState());
  const isPinned = isPinnedProp || localPinned;

  // Sync pinned state with session storage
  const handlePinToggle = useCallback(() => {
    const newPinned = !isPinned;
    setLocalPinned(newPinned);
    setStoredPinnedState(newPinned);
    onPin?.(newPinned);
  }, [isPinned, onPin]);

  // Handle close - if pinned, just unpin; otherwise close
  const handleClose = useCallback(() => {
    if (isPinned) {
      setLocalPinned(false);
      setStoredPinnedState(false);
      onPin?.(false);
    }
    onClose();
  }, [isPinned, onPin, onClose]);

  const {
    input,
    messages,
    isLoadingSuggestions,
    isSending,
    isStreaming,
    suggestedPrompts,
    contextChunks,
    error,
    setInput,
    toggleChunk,
    toggleAllChunks,
    selectSuggestion,
    sendMessage,
    clearMessages,
    config: mergedConfig,
  } = useQuickChat(targetElement, containerElement, config);

  // Inject styles on mount
  useEffect(() => {
    injectStyles();
  }, []);

  // Auto-focus input when visible
  useEffect(() => {
    if (visible && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Handle initial input from type-to-chat
  useEffect(() => {
    if (initialInput && visible) {
      setInput(initialInput);
      onInitialInputConsumed?.();
      // Focus and place cursor at end
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(
          initialInput.length,
          initialInput.length,
        );
      }
    }
  }, [initialInput, visible, setInput, onInitialInputConsumed]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      // Auto-resize textarea
      const target = e.target;
      target.style.height = "auto";
      target.style.height = `${Math.min(target.scrollHeight, 80)}px`;
    },
    [setInput],
  );

  // Handle key down
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [sendMessage, onClose],
  );

  // Handle send click
  const handleSend = useCallback(() => {
    sendMessage();
  }, [sendMessage]);

  // Handle send to t3.chat
  const handleSendToT3Chat = useCallback(() => {
    if (typeof window === "undefined") return;
    const query = input.trim();
    const baseUrl = mergedConfig.t3chat?.baseUrl ?? "https://t3.chat";
    const url = query
      ? `${baseUrl}/?q=${encodeURIComponent(query)}`
      : baseUrl;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [input, mergedConfig.t3chat?.baseUrl]);

  // Handle copy to clipboard
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // Compute included context count
  const includedCount = useMemo(
    () => contextChunks.filter((c) => c.included).length,
    [contextChunks],
  );

  if (!visible) return null;

  // Use different styles based on pinned state
  const containerStyles = isPinned
    ? {
        ...quickChatStyles.pinnedContainer,
        animation: "slideInFromRight 0.25s ease-out",
        ...style,
      }
    : {
        ...quickChatStyles.container,
        animation: "fadeIn 0.15s ease-out",
        ...style,
      };

  return (
    <div className={className} style={containerStyles}>
      {/* Header with context badge */}
      <div
        style={{
          ...quickChatStyles.header,
          padding: isPinned ? "12px 12px 8px 12px" : "6px 8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {!isPinned && (
            <button
              type="button"
              onClick={onClose}
              style={{
                ...quickChatStyles.iconButton,
                marginLeft: "-4px",
              }}
              title="Back to menu"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {/* Context badge */}
          {mergedConfig.showRedactionUI && contextChunks.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowContext(!showContext)}
                style={{
                  ...quickChatStyles.contextBadge,
                  ...(showContext ? quickChatStyles.contextBadgeActive : {}),
                }}
                title="Edit context"
              >
                <span>
                  {includedCount}/{contextChunks.length}
                </span>
                {showContext ? (
                  <ChevronUp size={10} />
                ) : (
                  <ChevronDown size={10} />
                )}
              </button>
              {/* All/None toggles when dropdown is open */}
              {showContext && (
                <div style={{ display: "flex", gap: "2px" }}>
                  <button
                    type="button"
                    onClick={() => toggleAllChunks(true)}
                    style={quickChatStyles.contextToggleSmall}
                    title="Include all"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAllChunks(false)}
                    style={quickChatStyles.contextToggleSmall}
                    title="Exclude all"
                  >
                    None
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <div style={quickChatStyles.headerActions}>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearMessages}
              style={quickChatStyles.iconButton}
              title="Clear chat"
            >
              <RefreshCw size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={handlePinToggle}
            style={{
              ...quickChatStyles.iconButton,
              ...(isPinned ? quickChatStyles.iconButtonActive : {}),
            }}
            title={isPinned ? "Unpin (closes with menu)" : "Pin (stays open)"}
          >
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
          <button
            type="button"
            onClick={handleClose}
            style={quickChatStyles.iconButton}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Context dropdown - compact list */}
      {showContext && contextChunks.length > 0 && (
        <div style={quickChatStyles.contextDropdown}>
          {contextChunks.map((chunk) => (
            <label
              key={chunk.id}
              style={{
                ...quickChatStyles.contextChunkCompact,
                ...(chunk.included ? {} : quickChatStyles.contextChunkExcluded),
              }}
            >
              <input
                type="checkbox"
                checked={chunk.included}
                onChange={() => toggleChunk(chunk.id)}
                style={quickChatStyles.contextCheckbox}
              />
              <span style={quickChatStyles.contextLabel}>{chunk.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* Suggested prompts */}
      {mergedConfig.showSuggestions &&
        messages.length === 0 &&
        suggestedPrompts.length > 0 && (
          <div style={quickChatStyles.suggestionsContainer}>
            {isLoadingSuggestions ? (
              <LoadingDots />
            ) : (
              suggestedPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => selectSuggestion(prompt)}
                  onMouseEnter={() => setHoveredSuggestion(prompt.id)}
                  onMouseLeave={() => setHoveredSuggestion(null)}
                  style={{
                    ...quickChatStyles.suggestionChip,
                    ...(hoveredSuggestion === prompt.id
                      ? quickChatStyles.suggestionChipHover
                      : {}),
                  }}
                >
                  {prompt.text}
                </button>
              ))
            )}
          </div>
        )}

      {/* Messages area */}
      <div
        style={
          isPinned
            ? quickChatStyles.pinnedMessagesArea
            : quickChatStyles.messagesArea
        }
      >
        {error && (
          <div style={quickChatStyles.errorContainer}>
            <AlertCircle size={20} style={quickChatStyles.errorIcon} />
            <span style={quickChatStyles.errorText}>{error}</span>
            <button
              type="button"
              onClick={() => sendMessage()}
              style={quickChatStyles.errorRetry}
            >
              <RefreshCw size={10} />
              Retry
            </button>
          </div>
        )}
        {messages.length > 0 &&
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...quickChatStyles.message,
                animation: "fadeIn 0.2s ease-out",
              }}
            >
              <div
                style={
                  message.role === "user"
                    ? quickChatStyles.messageUser
                    : quickChatStyles.messageAssistant
                }
              >
                {message.content}
                {message.isStreaming && (
                  <span style={quickChatStyles.streamingIndicator} />
                )}
                {message.role === "assistant" &&
                  !message.isStreaming &&
                  message.content.endsWith("...") && (
                    <span style={quickChatStyles.truncated}>(truncated)</span>
                  )}
              </div>
              {message.role === "assistant" &&
                !message.isStreaming &&
                message.content && (
                  <div style={quickChatStyles.messageActions}>
                    <button
                      type="button"
                      onClick={() => handleCopy(message.content)}
                      style={quickChatStyles.actionButton}
                    >
                      <Copy size={10} />
                      Copy
                    </button>
                    {message.actions?.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={action.onClick}
                        style={quickChatStyles.actionButton}
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={quickChatStyles.inputContainer}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder={mergedConfig.placeholder}
          disabled={isSending}
          rows={1}
          style={{
            ...quickChatStyles.input,
            ...(inputFocused ? quickChatStyles.inputFocused : {}),
          }}
        />
        <div style={{ display: "flex", gap: "4px" }}>
          {/* t3.chat button */}
          {mergedConfig.t3chat?.enabled !== false && (
            <button
              type="button"
              onClick={handleSendToT3Chat}
              disabled={!input.trim()}
              title={mergedConfig.t3chat?.label ?? "Ask t3.chat"}
              style={{
                ...quickChatStyles.sendButton,
                backgroundColor: "#7c3aed",
                ...(!input.trim() ? quickChatStyles.sendButtonDisabled : {}),
              }}
            >
              <ExternalLink size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            style={{
              ...quickChatStyles.sendButton,
              ...(isSending || !input.trim()
                ? quickChatStyles.sendButtonDisabled
                : {}),
            }}
          >
            {isSending ? (
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  border: "2px solid transparent",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
