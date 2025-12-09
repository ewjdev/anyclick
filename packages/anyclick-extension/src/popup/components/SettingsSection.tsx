import React from "react";
import { Input, Label, Switch, Tooltip } from "./ui";

interface SettingsSectionProps {
  endpoint: string;
  token: string;
  customMenuOverride: boolean;
  onEndpointChange: (value: string) => void;
  onTokenChange: (value: string) => void;
  onCustomMenuOverrideChange: (value: boolean) => void;
  disabled?: boolean;
}

export function SettingsSection({
  endpoint,
  token,
  customMenuOverride,
  onEndpointChange,
  onTokenChange,
  onCustomMenuOverrideChange,
  disabled,
}: SettingsSectionProps) {
  return (
    <div className="ac:space-y-4">
      <div className="ac:space-y-2">
        <div className="ac:flex ac:items-center ac:gap-2">
          <Label htmlFor="endpoint">Capture Endpoint</Label>
          <Tooltip
            content={
              <div className="ac:space-y-1">
                <p>
                  The API endpoint where captured feedback will be sent. This
                  should be a POST endpoint that accepts JSON payloads.
                </p>
                <a
                  href="https://github.com/ewjdev/anyclick#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ac:text-accent ac:hover:ac:text-accent-muted ac:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View setup docs →
                </a>
              </div>
            }
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ac:text-text-muted ac:hover:ac:text-text"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </Tooltip>
        </div>
        <Input
          id="endpoint"
          type="url"
          placeholder="https://your-api.com/feedback"
          value={endpoint}
          onChange={(e) => onEndpointChange(e.target.value)}
          disabled={disabled}
        />
        <p className="ac:text-xs ac:text-text-muted">
          Where captured feedback is sent
        </p>
      </div>

      <div className="ac:space-y-2">
        <div className="ac:flex ac:items-center ac:gap-2">
          <Label htmlFor="token">Auth Token</Label>
          <Tooltip
            content={
              <div className="ac:space-y-1">
                <p>
                  Bearer token for authenticating requests to your capture
                  endpoint. Include "Bearer " prefix if your API requires it.
                </p>
                <a
                  href="https://github.com/ewjdev/anyclick#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ac:text-accent ac:hover:ac:text-accent-muted ac:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View setup docs →
                </a>
              </div>
            }
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ac:text-text-muted ac:hover:ac:text-text"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </Tooltip>
        </div>
        <Input
          id="token"
          type="password"
          placeholder="Bearer token..."
          value={token}
          onChange={(e) => onTokenChange(e.target.value)}
          disabled={disabled}
        />
        <p className="ac:text-xs ac:text-text-muted">
          Authentication token for your API endpoint
        </p>
      </div>

      <div className="ac:flex ac:items-center ac:justify-between ac:py-2">
        <div className="ac:space-y-0.5">
          <Label>Override Native Menu</Label>
          <p className="ac:text-xs ac:text-text-muted">
            Replace browser's right-click menu
          </p>
        </div>
        <Switch
          checked={customMenuOverride}
          onCheckedChange={onCustomMenuOverrideChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
