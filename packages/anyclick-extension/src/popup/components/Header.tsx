import React from "react";
import { Badge, Switch } from "./ui";

// Format relative time
const formatRelativeTime = (dateStr: string) => {
  if (!dateStr) return "None";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
};

interface HeaderProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  disabled?: boolean;
  statusAsMessage: string;
  lastCapture: string;
  logoSrc?: string;
}

export function Header({
  enabled,
  onEnabledChange,
  disabled,
  statusAsMessage,
  lastCapture,
  logoSrc,
}: HeaderProps) {
  const switchId = "anyclick-master-toggle";

  return (
    <div className="ac:flex ac:items-center ac:justify-between ac:p-2 ac:border-b ac:border-border">
      <div className="ac:flex ac:items-center ac:gap-1">
        {logoSrc ? (
          <div className="ac:w-8 ac:h-8 ac:rounded-lg ac:bg-surface ac:overflow-hidden ac:flex ac:items-center ac:justify-center">
            <a
              href="https://anyclick.dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={logoSrc}
                alt="Anyclick logo"
                className="ac:w-6 ac:h-6"
              />
            </a>
          </div>
        ) : (
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
        )}
        <div className="ac:space-y-0.5">
          <div className="ac:flex ac:items-center ac:gap-2">
            <h1 className="ac:text-base ac:font-semibold ac:text-text">
              <a
                href="https://anyclick.dev"
                target="_blank"
                rel="noopener noreferrer"
              >
                Anyclick
              </a>
            </h1>
            <Badge variant={enabled ? "success" : "default"}>
              {enabled ? "On" : "Off"}
            </Badge>
            <Badge
              variant={statusAsMessage === "success" ? "success" : "default"}
            >
              {statusAsMessage}
            </Badge>
          </div>
        </div>
      </div>
      <div className="ac:flex ac:flex-col ac:leading-tight">
        <span className="ac:text-xs ac:text-text-muted">Last capture</span>
        <span className="ac:text-sm ac:text-text">
          {formatRelativeTime(lastCapture)}
        </span>
      </div>
      <label
        htmlFor={switchId}
        className="ac:flex ac:items-center ac:gap-2 ac:text-xs ac:text-text-muted"
      >
        <span className="ac:hidden sm:ac:inline">Master toggle</span>
        <Switch
          id={switchId}
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={disabled}
        />
      </label>
    </div>
  );
}
