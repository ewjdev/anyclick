import React from "react";
import { Badge, Switch } from "./ui";

interface HeaderProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export function Header({ enabled, onEnabledChange, disabled }: HeaderProps) {
  return (
    <div className="ac:flex ac:items-center ac:justify-between ac:p-4 ac:border-b ac:border-border">
      <div className="ac:flex ac:items-center ac:gap-3">
        <div className="ac:w-8 ac:h-8 ac:rounded-lg ac:bg-accent ac:flex ac:items-center ac:justify-center">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ac:text-accent-foreground"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div>
          <h1 className="ac:text-base ac:font-semibold ac:text-text">
            Anyclick
          </h1>
          <p className="ac:text-xs ac:text-text-muted">
            Capture & submit feedback
          </p>
        </div>
      </div>
      <div className="ac:flex ac:items-center ac:gap-2">
        <Badge variant={enabled ? "success" : "default"}>
          {enabled ? "On" : "Off"}
        </Badge>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
