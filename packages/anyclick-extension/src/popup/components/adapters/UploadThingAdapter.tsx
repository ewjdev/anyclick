import React from "react";
import { Input, Label } from "../ui";
import { AdapterCard } from "./AdapterCard";

const UploadIcon = () => (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

interface UploadThingAdapterProps {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  onEnabledChange: (value: boolean) => void;
  onEndpointChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  disabled?: boolean;
}

export function UploadThingAdapter({
  enabled,
  endpoint,
  apiKey,
  onEnabledChange,
  onEndpointChange,
  onApiKeyChange,
  disabled,
}: UploadThingAdapterProps) {
  return (
    <AdapterCard
      id="uploadthing"
      name="UploadThing"
      description="Upload images & screenshots"
      icon={<UploadIcon />}
      enabled={enabled}
      onEnabledChange={onEnabledChange}
      disabled={disabled}
    >
      <div className="ac:space-y-2">
        <Label htmlFor="ut-endpoint">Endpoint URL</Label>
        <Input
          id="ut-endpoint"
          type="url"
          placeholder="https://your-app.com/api/uploadthing"
          value={endpoint}
          onChange={(e) => onEndpointChange(e.target.value)}
          disabled={disabled || !enabled}
        />
      </div>

      <div className="ac:space-y-2">
        <Label htmlFor="ut-key">API Key</Label>
        <Input
          id="ut-key"
          type="password"
          placeholder="sk_live_..."
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          disabled={disabled || !enabled}
        />
        <p className="ac:text-xs ac:text-text-muted">
          Your UploadThing secret key
        </p>
      </div>
    </AdapterCard>
  );
}
