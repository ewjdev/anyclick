import React from "react";
import { Input, Label, Switch } from "./ui";

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
        <Label htmlFor="endpoint">Capture Endpoint</Label>
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
        <Label htmlFor="token">Auth Token</Label>
        <Input
          id="token"
          type="password"
          placeholder="Bearer token..."
          value={token}
          onChange={(e) => onTokenChange(e.target.value)}
          disabled={disabled}
        />
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
