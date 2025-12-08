/**
 * Type definitions for QuickChat component.
 *
 * @module QuickChat/types
 * @since 2.0.0
 */
import type { CSSProperties, ReactNode } from "react";

/**
 * Context payload chunk that can be included or excluded by the user.
 */
export interface ContextChunk {
  /** Unique identifier for the chunk */
  id: string;
  /** Human-readable label for the chunk */
  label: string;
  /** The actual content/data */
  content: string;
  /** Type of context (element, text, error, etc.) */
  type: "element" | "text" | "error" | "navigation" | "custom";
  /** Whether this chunk is included in the payload (default: true) */
  included: boolean;
  /** Size in characters */
  size: number;
}

/**
 * A suggested prompt from the AI pre-pass.
 */
export interface SuggestedPrompt {
  /** Unique identifier */
  id: string;
  /** The prompt text */
  text: string;
  /** Optional category */
  category?: string;
}

/**
 * Quick action available for AI responses.
 */
export interface QuickAction {
  /** Unique identifier */
  id: string;
  /** Label to display */
  label: string;
  /** Icon to display */
  icon?: ReactNode;
  /** Action handler */
  onClick: () => void;
}

/**
 * A single chat message.
 */
export interface ChatMessage {
  /** Unique identifier */
  id: string;
  /** Role of the sender */
  role: "user" | "assistant" | "system";
  /** Message content */
  content: string;
  /** Timestamp */
  timestamp: number;
  /** Whether the message is currently streaming */
  isStreaming?: boolean;
  /** Quick actions available for this message */
  actions?: QuickAction[];
}

/**
 * Configuration for t3.chat integration.
 */
export interface T3ChatIntegrationConfig {
  /** Whether to show the "Send to t3.chat" button */
  enabled?: boolean;
  /** Base URL for t3.chat (default: https://t3.chat) */
  baseUrl?: string;
  /** Label for the button (default: "Ask t3.chat") */
  label?: string;
}

/**
 * Configuration for the QuickChat component.
 */
export interface QuickChatConfig {
  /** API endpoint for chat requests */
  endpoint?: string;
  /** Model to use for the main chat (default: auto) */
  model?: string;
  /** Model to use for pre-pass suggestions (default: gpt-5-nano) */
  prePassModel?: string;
  /** Maximum response length in characters */
  maxResponseLength?: number;
  /** Whether to show context redaction UI */
  showRedactionUI?: boolean;
  /** Whether to show suggested prompts */
  showSuggestions?: boolean;
  /** Custom system prompt */
  systemPrompt?: string;
  /** Placeholder text for input */
  placeholder?: string;
  /** Header title */
  title?: string;
  /** t3.chat integration settings */
  t3chat?: T3ChatIntegrationConfig;
}

/**
 * Props for the QuickChat component.
 */
export interface QuickChatProps {
  /** Whether the chat is visible */
  visible: boolean;
  /** Target element that was right-clicked */
  targetElement: Element | null;
  /** Container element */
  containerElement: Element | null;
  /** Callback when chat is closed */
  onClose: () => void;
  /** Callback when user wants to pin the chat */
  onPin?: (pinned: boolean) => void;
  /** Whether the chat is pinned */
  isPinned?: boolean;
  /** Configuration options */
  config?: QuickChatConfig;
  /** Custom styles */
  style?: CSSProperties;
  /** Custom class name */
  className?: string;
  /** Initial input value (for type-to-chat feature) */
  initialInput?: string;
  /** Callback when initial input has been consumed */
  onInitialInputConsumed?: () => void;
}

/**
 * State for the QuickChat hook.
 */
export interface QuickChatState {
  /** Current input value */
  input: string;
  /** Chat messages */
  messages: ChatMessage[];
  /** Whether we're loading suggestions */
  isLoadingSuggestions: boolean;
  /** Whether we're sending a message */
  isSending: boolean;
  /** Whether we're streaming a response */
  isStreaming: boolean;
  /** Suggested prompts from pre-pass */
  suggestedPrompts: SuggestedPrompt[];
  /** Context chunks with redaction state */
  contextChunks: ContextChunk[];
  /** Error message if any */
  error: string | null;
}

/**
 * Default t3.chat configuration values.
 */
export const DEFAULT_T3CHAT_CONFIG: Required<T3ChatIntegrationConfig> = {
  enabled: true,
  baseUrl: "https://t3.chat",
  label: "Ask t3.chat",
};

/**
 * Default configuration values.
 */
export const DEFAULT_QUICK_CHAT_CONFIG: Required<QuickChatConfig> = {
  endpoint: "/api/anyclick/chat",
  model: "gpt-5-mini",
  prePassModel: "gpt-5-nano",
  maxResponseLength: 500,
  showRedactionUI: true,
  showSuggestions: true,
  systemPrompt:
    "You are a helpful assistant that provides quick, concise answers about web elements and UI. Keep responses brief and actionable.",
  placeholder: "Ask about this element...",
  title: "Quick Ask",
  t3chat: DEFAULT_T3CHAT_CONFIG,
};
