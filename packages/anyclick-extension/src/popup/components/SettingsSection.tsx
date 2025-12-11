import React, { useState } from "react";
import { Button, Input, Label, Switch, Tooltip } from "./ui";

export type EndpointStatus =
  | { state: "idle"; message?: string; hint?: string }
  | { state: "loading"; message?: string; hint?: string }
  | { state: "success"; message?: string; hint?: string }
  | { state: "error"; message?: string; hint?: string };

interface SettingsSectionProps {
  endpoint: string;
  token: string;
  customMenuOverride: boolean;
  onEndpointChange: (value: string) => void;
  onTokenChange: (value: string) => void;
  onCustomMenuOverrideChange: (value: boolean) => void;
  onTestEndpoint: () => void;
  endpointStatus: EndpointStatus;
  disabled?: boolean;
}

export function SettingsSection({
  endpoint,
  token,
  customMenuOverride,
  onEndpointChange,
  onTokenChange,
  onCustomMenuOverrideChange,
  onTestEndpoint,
  endpointStatus,
  disabled,
}: SettingsSectionProps) {
  const [showToken, setShowToken] = useState(false);

  const endpointStatusColor =
    endpointStatus.state === "success"
      ? "ac:text-green-400"
      : endpointStatus.state === "error"
        ? "ac:text-destructive"
        : "ac:text-text-muted";

  return (
    <div className="ac:space-y-4">
      <div className="ac:space-y-2">
        <div className="ac:flex ac:items-center ac:gap-2">
          <Label htmlFor="endpoint">Capture Endpoint</Label>
          <Tooltip
            content={
              <div className="ac:space-y-1 w-[200px]">
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
        <div className="ac:flex ac:items-center ac:gap-2">
          <Input
            id="endpoint"
            type="url"
            placeholder="https://your-api.com/feedback"
            value={endpoint}
            onChange={(e) => onEndpointChange(e.target.value)}
            disabled={disabled}
            className="ac:flex-1"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onTestEndpoint}
            disabled={
              disabled || endpointStatus.state === "loading" || !endpoint.trim()
            }
          >
            {endpointStatus.state === "loading" ? "Testing..." : "Test"}
          </Button>
        </div>
        {endpointStatus.state !== "idle" && (
          <div
            className={`ac:flex ac:items-start ac:gap-2 ac:text-xs ${endpointStatusColor}`}
          >
            {endpointStatus.state === "success" ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ac:mt-0.5"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : endpointStatus.state === "loading" ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ac:mt-0.5 ac:animate-spin"
              >
                <circle cx="12" cy="12" r="10" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ac:mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            )}
            <div className="ac:space-y-0.5">
              <p className="ac:leading-relaxed">
                {endpointStatus.message ||
                  (endpointStatus.state === "success"
                    ? "Endpoint responded successfully."
                    : endpointStatus.state === "error"
                      ? "Unable to reach endpoint."
                      : "Testing endpoint...")}
              </p>
              {endpointStatus.hint && (
                <p className="ac:text-[11px] ac:text-text-muted ac:leading-relaxed">
                  {endpointStatus.hint}
                </p>
              )}
            </div>
          </div>
        )}
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
        <div className="ac:flex ac:gap-2">
          <Input
            id="token"
            type={showToken ? "text" : "password"}
            placeholder="Bearer token..."
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
            disabled={disabled}
            className="ac:flex-1"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowToken((prev) => !prev)}
            disabled={disabled}
            aria-pressed={showToken}
          >
            {showToken ? "Hide" : "Show"}
          </Button>
        </div>
        <p className="ac:text-xs ac:text-text-muted">
          Authentication token for your API endpoint
        </p>
      </div>
    </div>
  );
}
