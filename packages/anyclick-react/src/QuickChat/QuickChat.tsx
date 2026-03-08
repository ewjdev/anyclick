/**
 * QuickChat component - Lightweight AI chat in the context menu.
 *
 * Provides a minimal chat interface that auto-focuses when opened,
 * streams AI responses using ai-sdk-ui, and offers quick actions.
 * Chat history persists for 24h via zustand store.
 *
 * @module QuickChat/QuickChat
 * @since 3.1.0
 */
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { buildAnyclickPayload } from "@ewjdev/anyclick-core";
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
import {
  AnyclickButton,
  AnyclickIconButton,
  AnyclickSurface,
  AnyclickTextarea,
  resolveSlotProps,
  useAnyclickStyle,
} from "../styling";
import { quickChatKeyframes } from "./styles";
import type { QuickChatProps } from "./types";
import { useQuickChat } from "./useQuickChat";

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
  const { tokens } = useAnyclickStyle();
  return (
    <div style={{ display: "flex", gap: tokens.spacingXs }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            animation: "pulse 0.8s ease-in-out infinite",
            animationDelay: `${i * 0.16}s`,
            backgroundColor: tokens.accent,
            borderRadius: tokens.radiusFull,
            height: "6px",
            width: "6px",
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
  const adapter = useAnyclickStyle();
  const { tokens } = adapter;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<string | null>(
    null,
  );

  const {
    input,
    messages,
    isLoadingSuggestions,
    isSending,
    isStreaming,
    debugInfo,
    rateLimitNotice,
    suggestedPrompts,
    contextChunks,
    error,
    isPinned: storePinned,
    setInput,
    toggleChunk,
    toggleAllChunks,
    selectSuggestion,
    sendMessage,
    clearMessages,
    setIsPinned,
    clearRateLimitNotice,
    config: mergedConfig,
  } = useQuickChat(targetElement, containerElement, config);

  // Use prop or store pinned state
  const isPinned = isPinnedProp || storePinned;

  // Sync pinned state with store
  const handlePinToggle = useCallback(() => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    onPin?.(newPinned);
  }, [isPinned, setIsPinned, onPin]);

  // Handle close - if pinned, just unpin; otherwise close
  const handleClose = useCallback(() => {
    if (isPinned) {
      setIsPinned(false);
      onPin?.(false);
    }
    onClose();
  }, [isPinned, setIsPinned, onPin, onClose]);

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
    const url = query ? `${baseUrl}/?q=${encodeURIComponent(query)}` : baseUrl;
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

  const [rateLimitExpanded, setRateLimitExpanded] = useState(false);
  const [reportStatus, setReportStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // If a new rate-limit notice appears, reset report UI
  useEffect(() => {
    if (rateLimitNotice) {
      setReportStatus("idle");
      setReportUrl(null);
      setReportError(null);
      setRateLimitExpanded(false);
    }
  }, [rateLimitNotice]);

  const handleReportIssue = useCallback(async () => {
    if (!rateLimitNotice) return;
    if (!targetElement) {
      setReportStatus("error");
      setReportError("No target element available to report.");
      return;
    }

    setReportStatus("sending");
    setReportError(null);

    try {
      const payload = buildAnyclickPayload(targetElement, "issue", {
        comment: `QuickChat: ${rateLimitNotice.message}`,
        metadata: {
          source: "quickchat",
          kind: "rate_limit",
          endpoint: rateLimitNotice.endpoint ?? mergedConfig.endpoint,
          retryAt: rateLimitNotice.retryAt,
          retryAfterSeconds: rateLimitNotice.retryAfterSeconds,
          requestId: rateLimitNotice.requestId,
          debugInfo: debugInfo ?? undefined,
          raw: rateLimitNotice.raw ?? undefined,
        },
      });

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        results?: Array<{ adapter: string; url?: string }>;
        partialFailures?: Array<{ adapter: string; error?: string }>;
        error?: string;
      } | null;

      if (!res.ok || !json?.success) {
        const msg =
          json?.error ||
          (res.status
            ? `Failed to create issue (${res.status}).`
            : "Failed to create issue.");
        throw new Error(msg);
      }

      const firstUrl = json.results?.find(
        (r) => typeof r.url === "string",
      )?.url;
      setReportUrl(firstUrl ?? null);
      setReportStatus("sent");
    } catch (e) {
      setReportStatus("error");
      setReportError(e instanceof Error ? e.message : String(e));
    }
  }, [rateLimitNotice, targetElement, mergedConfig.endpoint, debugInfo]);

  if (!visible) return null;

  // Use different styles based on pinned state
  const containerStyles = isPinned
    ? {
        animation: "slideInFromRight 0.25s ease-out",
        borderLeft: `1px solid ${tokens.border}`,
        bottom: 0,
        boxShadow: "-4px 0 24px rgba(15, 23, 42, 0.16)",
        position: "fixed" as const,
        right: 0,
        top: 0,
        width: "340px",
        zIndex: tokens.zIndexPinned,
        ...style,
      }
    : {
        animation: "fadeIn 0.15s ease-out",
        maxHeight: "360px",
        ...style,
      };

  const headerProps = resolveSlotProps(adapter, "quickChat.header");
  const messageListProps = resolveSlotProps(adapter, "quickChat.messageList", {
    expanded: isPinned,
  });
  const inputSlotProps = resolveSlotProps(adapter, "quickChat.input");

  return (
    <AnyclickSurface
      className={className}
      slotName="quickChat.surface"
      slotState={{ expanded: isPinned }}
      style={containerStyles}
    >
      {/* Header with context badge */}
      <div
        {...headerProps.attrs}
        className={headerProps.className}
        style={{
          ...headerProps.style,
          padding: isPinned ? "12px 12px 8px 12px" : "6px 8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {!isPinned && (
            <AnyclickIconButton
              onClick={onClose}
              slotName="quickChat.submit"
              style={{ marginLeft: "-4px" }}
              title="Back to menu"
            >
              <ChevronLeft size={16} />
            </AnyclickIconButton>
          )}
          {/* Context badge */}
          {mergedConfig.showRedactionUI && contextChunks.length > 0 && (
            <>
              <AnyclickButton
                onClick={() => setShowContext(!showContext)}
                slotName="shared.button"
                slotState={{
                  selected: showContext,
                  size: "sm",
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
              </AnyclickButton>
              {/* All/None toggles when dropdown is open */}
              {showContext && (
                <div style={{ display: "flex", gap: "2px" }}>
                  <AnyclickButton
                    onClick={() => toggleAllChunks(true)}
                    slotName="shared.button"
                    slotState={{ size: "sm" }}
                    title="Include all"
                  >
                    All
                  </AnyclickButton>
                  <AnyclickButton
                    onClick={() => toggleAllChunks(false)}
                    slotName="shared.button"
                    slotState={{ size: "sm" }}
                    title="Exclude all"
                  >
                    None
                  </AnyclickButton>
                </div>
              )}
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {messages.length > 0 && (
            <AnyclickIconButton
              onClick={clearMessages}
              slotName="quickChat.submit"
              title="Clear chat"
            >
              <RefreshCw size={14} />
            </AnyclickIconButton>
          )}
          <AnyclickIconButton
            onClick={handlePinToggle}
            slotName="quickChat.submit"
            slotState={{ selected: isPinned }}
            title={isPinned ? "Unpin (closes with menu)" : "Pin (stays open)"}
          >
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </AnyclickIconButton>
          <AnyclickIconButton
            onClick={handleClose}
            slotName="quickChat.submit"
            title="Close"
          >
            <X size={14} />
          </AnyclickIconButton>
        </div>
      </div>

      {/* Context dropdown - compact list */}
      {showContext && contextChunks.length > 0 && (
        <div
          style={{
            backgroundColor: tokens.surfaceMuted,
            borderRadius: tokens.radiusSm,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            margin: "0 8px 6px 8px",
            maxHeight: "96px",
            overflowY: "auto",
            padding: "6px 8px",
          }}
        >
          {contextChunks.map((chunk) => (
            <label
              key={chunk.id}
              style={{
                alignItems: "center",
                color: chunk.included ? tokens.text : tokens.textMuted,
                display: "flex",
                gap: "6px",
                opacity: chunk.included ? 1 : 0.65,
              }}
            >
              <input
                type="checkbox"
                checked={chunk.included}
                onChange={() => toggleChunk(chunk.id)}
              />
              <span>{chunk.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* Suggested prompts */}
      {mergedConfig.showSuggestions &&
        messages.length === 0 &&
        suggestedPrompts.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              overflowX: "auto",
              padding: "6px 8px",
            }}
          >
            {isLoadingSuggestions ? (
              <LoadingDots />
            ) : (
              suggestedPrompts.map((prompt) => (
                <AnyclickButton
                  key={prompt.id}
                  onClick={() => selectSuggestion(prompt)}
                  onMouseEnter={() => setHoveredSuggestion(prompt.id)}
                  onMouseLeave={() => setHoveredSuggestion(null)}
                  slotName="shared.button"
                  slotState={{
                    hovered: hoveredSuggestion === prompt.id,
                    size: "sm",
                  }}
                  style={{
                    justifyContent: "flex-start",
                    whiteSpace: "nowrap",
                  }}
                >
                  {prompt.text}
                </AnyclickButton>
              ))
            )}
          </div>
        )}

      {/* Messages area */}
      <div
        {...messageListProps.attrs}
        className={messageListProps.className}
        style={messageListProps.style}
      >
        {/* Keep generic errors visible, but rate-limit uses a sticky banner below */}
        {error && !rateLimitNotice && (
          <div
            style={{
              alignItems: "center",
              backgroundColor: tokens.dangerMuted,
              border: `1px solid ${tokens.danger}`,
              borderRadius: tokens.radiusSm,
              color: tokens.danger,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "12px",
            }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
            <AnyclickButton
              onClick={() => sendMessage()}
              slotName="quickChat.submit"
              slotState={{ tone: "danger", size: "sm" }}
            >
              <RefreshCw size={10} />
              Retry
            </AnyclickButton>
          </div>
        )}
        {debugInfo && (
          <div
            style={{
              backgroundColor: "#0f172a",
              color: "#e2e8f0",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "8px",
              margin: "0 0 8px",
              fontSize: "12px",
              lineHeight: 1.4,
              wordBreak: "break-word",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <span>
                Last request: {debugInfo.status}{" "}
                {debugInfo.ok ? "(ok)" : "(error)"}
              </span>
              <span style={{ opacity: 0.7 }}>
                {new Date(debugInfo.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {debugInfo.error && (
              <div style={{ color: "#f87171", marginTop: "4px" }}>
                Error: {debugInfo.error}
              </div>
            )}
            {debugInfo.contentPreview && (
              <div style={{ marginTop: "4px" }}>
                Content: {debugInfo.contentPreview}
              </div>
            )}
            <div style={{ marginTop: "4px", opacity: 0.8 }}>
              Raw: {debugInfo.rawTextPreview || "(empty)"}
            </div>
          </div>
        )}
        {messages.length > 0 &&
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                animation: "fadeIn 0.2s ease-out",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div
                style={{
                  alignSelf:
                    message.role === "user" ? "flex-end" : "flex-start",
                  backgroundColor:
                    message.role === "user" ? tokens.accent : tokens.surfaceMuted,
                  borderRadius:
                    message.role === "user"
                      ? "12px 12px 4px 12px"
                      : "12px 12px 12px 4px",
                  color:
                    message.role === "user" ? tokens.accentText : tokens.text,
                  lineHeight: 1.4,
                  maxWidth: message.role === "user" ? "85%" : "100%",
                  padding:
                    message.role === "user" ? "6px 10px" : "8px 10px",
                  wordBreak: "break-word",
                }}
              >
                {message.content}
                {message.isStreaming && (
                  <span
                    style={{
                      animation: "blink 1s infinite",
                      backgroundColor: tokens.accent,
                      borderRadius: "1px",
                      display: "inline-block",
                      height: "14px",
                      marginLeft: "4px",
                      width: "4px",
                    }}
                  />
                )}
                {message.role === "assistant" &&
                  !message.isStreaming &&
                  message.content.endsWith("...") && (
                    <span style={{ marginLeft: "4px", opacity: 0.7 }}>
                      (truncated)
                    </span>
                  )}
              </div>
              {message.role === "assistant" &&
                !message.isStreaming &&
                message.content && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    <AnyclickButton
                      onClick={() => handleCopy(message.content)}
                      slotName="shared.button"
                      slotState={{ size: "sm" }}
                    >
                      <Copy size={10} />
                      Copy
                    </AnyclickButton>
                    {message.actions?.map((action) => (
                      <AnyclickButton
                        key={action.id}
                        onClick={action.onClick}
                        slotName="shared.button"
                        slotState={{ size: "sm" }}
                      >
                        {action.icon}
                        {action.label}
                      </AnyclickButton>
                    ))}
                  </div>
                )}
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticky bottom notice for rate limiting */}
      {rateLimitNotice && (
        <div
          style={{
            borderTop: "1px solid rgba(148, 163, 184, 0.25)",
            background:
              "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.96))",
            color: "#e2e8f0",
            padding: "8px 10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={16} style={{ color: "#fbbf24" }} />
              <span style={{ fontSize: "13px", lineHeight: 1.2 }}>
                {rateLimitNotice.message}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                onClick={() => setRateLimitExpanded((v) => !v)}
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.25)",
                  background: "rgba(30, 41, 59, 0.6)",
                  color: "#e2e8f0",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {rateLimitExpanded ? "Hide" : "Details"}
              </button>

              <button
                type="button"
                onClick={handleReportIssue}
                disabled={reportStatus === "sending" || reportStatus === "sent"}
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.25)",
                  background:
                    reportStatus === "sent"
                      ? "rgba(34, 197, 94, 0.22)"
                      : "rgba(30, 41, 59, 0.6)",
                  color: "#e2e8f0",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  cursor:
                    reportStatus === "sending" || reportStatus === "sent"
                      ? "not-allowed"
                      : "pointer",
                  opacity: reportStatus === "sending" ? 0.7 : 1,
                }}
                title="Create a GitHub issue via /api/feedback"
              >
                {reportStatus === "sending"
                  ? "Reporting..."
                  : reportStatus === "sent"
                    ? "Reported"
                    : "Report"}
              </button>

              <button
                type="button"
                onClick={() => {
                  clearRateLimitNotice();
                  setRateLimitExpanded(false);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "rgba(226, 232, 240, 0.8)",
                  padding: "4px",
                  cursor: "pointer",
                }}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {reportUrl && (
            <div style={{ marginTop: "6px", fontSize: "12px" }}>
              Created:{" "}
              <a
                href={reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#93c5fd" }}
              >
                Open issue
              </a>
            </div>
          )}
          {reportError && (
            <div
              style={{ marginTop: "6px", fontSize: "12px", color: "#fca5a5" }}
            >
              {reportError}
            </div>
          )}

          {rateLimitExpanded && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                lineHeight: 1.4,
                backgroundColor: "rgba(2, 6, 23, 0.55)",
                border: "1px solid rgba(148, 163, 184, 0.25)",
                borderRadius: "8px",
                padding: "8px",
                wordBreak: "break-word",
              }}
            >
              <div style={{ opacity: 0.85 }}>
                Status: {rateLimitNotice.status}
                {rateLimitNotice.requestId
                  ? ` • Request: ${rateLimitNotice.requestId}`
                  : ""}
              </div>
              {rateLimitNotice.endpoint && (
                <div style={{ opacity: 0.75, marginTop: "4px" }}>
                  Endpoint: {rateLimitNotice.endpoint}
                </div>
              )}
              {rateLimitNotice.retryAt && (
                <div style={{ opacity: 0.75, marginTop: "4px" }}>
                  RetryAt: {new Date(rateLimitNotice.retryAt).toLocaleString()}
                </div>
              )}
              {rateLimitNotice.raw && (
                <div style={{ marginTop: "6px", opacity: 0.85 }}>
                  Raw: {rateLimitNotice.raw}
                </div>
              )}
              {debugInfo && (
                <div style={{ marginTop: "6px", opacity: 0.85 }}>
                  Debug: {debugInfo.rawTextPreview || "(empty)"}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Input area */}
      <div
        style={{
          borderTop: `1px solid ${tokens.border}`,
          display: "flex",
          gap: "8px",
          padding: "8px",
        }}
      >
        <AnyclickTextarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder={mergedConfig.placeholder}
          disabled={isSending}
          rows={1}
          slotName="quickChat.input"
          slotState={{ active: inputFocused, disabled: isSending }}
          style={{
            ...inputSlotProps.style,
            flex: 1,
            minHeight: "40px",
          }}
        />
        <div style={{ display: "flex", gap: "4px" }}>
          {/* t3.chat button */}
          {mergedConfig.t3chat?.enabled !== false && (
            <AnyclickIconButton
              onClick={handleSendToT3Chat}
              disabled={!input.trim()}
              title={mergedConfig.t3chat?.label ?? "Ask t3.chat"}
              slotName="quickChat.submit"
              slotState={{ disabled: !input.trim(), tone: "accent" }}
            >
              <ExternalLink size={14} />
            </AnyclickIconButton>
          )}
          <AnyclickIconButton
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            slotName="quickChat.submit"
            slotState={{
              disabled: isSending || !input.trim(),
              loading: isSending,
              tone: "accent",
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
          </AnyclickIconButton>
        </div>
      </div>
    </AnyclickSurface>
  );
}
