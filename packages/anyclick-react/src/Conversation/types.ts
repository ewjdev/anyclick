import type { ReactNode } from "react";
import type { UIMessage } from "ai";

export interface ConversationContext {
  id: string;
  label: string;
  revision?: number;
  description?: string;
}

export interface CompletionItem {
  id: string;
  label: string;
  value: string;
  kind: "command" | "mention" | "completion";
  description?: string;
  context?: ConversationContext;
}

export type SuggestionProvider = (request: {
  input: string;
  caret: number;
  context: ConversationContext[];
  signal: AbortSignal;
}) => Promise<CompletionItem[]>;

export interface ConversationResult {
  kind: "explanation" | "draft" | "comparison" | "form" | "receipt";
  title: string;
  text?: string;
  before?: string;
  sources?: { id: string; label: string }[];
  columns?: string[];
  rows?: string[][];
  actionId?: string;
  objectId?: string;
  fields?: { name: string; label: string; value: string; options?: string[] }[];
  executionId?: string;
  status?: string;
  url?: string;
}

export type ConversationMessage = UIMessage<
  { createdAt: number; schemaVersion: 1 },
  { result: ConversationResult; context: ConversationContext[] }
>;

export interface ActionRequest {
  actionId: string;
  objectId: string;
  values: Record<string, string>;
}

export interface ConversationProps {
  conversationId: string;
  endpoint: string;
  historyEndpoint?: string;
  context: ConversationContext[];
  onContextChange: (context: ConversationContext[]) => void;
  commands?: CompletionItem[];
  objects?: ConversationContext[];
  suggestionProvider?: SuggestionProvider;
  actionDispatcher?: (request: ActionRequest) => Promise<void>;
  renderResult?: (result: ConversationResult) => ReactNode;
  initialInput?: string;
  title?: string;
  disabled?: boolean;
  presentation?: "docked" | "floating" | "sheet";
  onClose?: () => void;
}
