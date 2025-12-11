import React, { useState } from "react";
import { Button, Input, Label, Switch, Textarea } from "../ui";
import { AdapterCard } from "./AdapterCard";

const T3ChatIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M8 10h.01" />
    <path d="M12 10h.01" />
    <path d="M16 10h.01" />
  </svg>
);

interface T3ChatAdapterProps {
  enabled: boolean;
  baseUrl: string;
  autoRefine: boolean;
  systemPrompt: string;
  refineEndpoint: string;
  onEnabledChange: (value: boolean) => void;
  onBaseUrlChange: (value: string) => void;
  onAutoRefineChange: (value: boolean) => void;
  onSystemPromptChange: (value: string) => void;
  onRefineEndpointChange: (value: string) => void;
  onResetSystemPrompt: () => void;
  onTestEndpoint: () => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
  defaultSystemPrompt: string;
}

export function T3ChatAdapter({
  enabled,
  baseUrl,
  autoRefine,
  systemPrompt,
  refineEndpoint,
  onEnabledChange,
  onBaseUrlChange,
  onAutoRefineChange,
  onSystemPromptChange,
  onRefineEndpointChange,
  onResetSystemPrompt,
  onTestEndpoint,
  disabled,
  defaultSystemPrompt,
}: T3ChatAdapterProps) {
  const [testStatus, setTestStatus] = useState<{
    message: string;
    type: "idle" | "loading" | "success" | "error";
  }>({ message: "", type: "idle" });

  const handleTest = async () => {
    setTestStatus({ message: "Testing connection...", type: "loading" });
    try {
      const result = await onTestEndpoint();
      if (result.success) {
        setTestStatus({ message: "Connection successful!", type: "success" });
      } else {
        setTestStatus({
          message: `Failed: ${result.error || "Unknown error"}`,
          type: "error",
        });
      }
    } catch (error) {
      setTestStatus({
        message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
        type: "error",
      });
    }
  };

  const charCount = systemPrompt.length;
  const isOverLimit = charCount > 1000;

  return (
    <AdapterCard
      id="t3chat"
      name="T3.chat"
      description="Send text to AI chat"
      icon={<T3ChatIcon />}
      enabled={enabled}
      onEnabledChange={onEnabledChange}
      disabled={disabled}
    >
      <div className="ac:space-y-2">
        <Label htmlFor="t3chat-url">Base URL</Label>
        <Input
          id="t3chat-url"
          type="url"
          placeholder="https://t3.chat"
          value={baseUrl}
          onChange={(e) => onBaseUrlChange(e.target.value)}
          disabled={disabled || !enabled}
        />
      </div>

      <div className="ac:flex ac:items-center ac:justify-between">
        <div className="ac:space-y-0.5">
          <Label>Auto-Refine Prompts</Label>
          <p className="ac:text-xs ac:text-text-muted">
            Use AI to improve prompts
          </p>
        </div>
        <Switch
          checked={autoRefine}
          onCheckedChange={onAutoRefineChange}
          disabled={disabled || !enabled}
        />
      </div>

      {autoRefine && (
        <>
          <div className="ac:space-y-2">
            <Label htmlFor="t3chat-refine">Refine Endpoint</Label>
            <div className="ac:flex ac:gap-2">
              <Input
                id="t3chat-refine"
                type="url"
                placeholder="http://localhost:3000/api/anyclick/chat"
                value={refineEndpoint}
                onChange={(e) => onRefineEndpointChange(e.target.value)}
                disabled={disabled || !enabled}
                className="ac:flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleTest}
                disabled={disabled || !enabled || testStatus.type === "loading"}
              >
                {testStatus.type === "loading" ? "..." : "Test"}
              </Button>
            </div>
            {testStatus.message && (
              <p
                className={`ac:text-xs ${
                  testStatus.type === "success"
                    ? "ac:text-green-400"
                    : testStatus.type === "error"
                      ? "ac:text-destructive"
                      : "ac:text-text-muted"
                }`}
              >
                {testStatus.message}
              </p>
            )}
          </div>

          <div className="ac:space-y-2">
            <div className="ac:flex ac:items-center ac:justify-between">
              <Label htmlFor="t3chat-prompt">System Prompt</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={onResetSystemPrompt}
                disabled={disabled || !enabled}
                className="ac:h-6 ac:px-2 ac:text-xs"
              >
                Reset
              </Button>
            </div>
            <Textarea
              id="t3chat-prompt"
              rows={3}
              placeholder={
                defaultSystemPrompt || "Enter custom system prompt..."
              }
              value={systemPrompt}
              onChange={(e) => onSystemPromptChange(e.target.value)}
              disabled={disabled || !enabled}
            />
            <p
              className={`ac:text-xs ${
                isOverLimit ? "ac:text-destructive" : "ac:text-text-muted"
              }`}
            >
              {charCount} / 1000
            </p>
          </div>
        </>
      )}
    </AdapterCard>
  );
}
