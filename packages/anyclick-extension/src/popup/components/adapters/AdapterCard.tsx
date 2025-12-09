import React, { useState } from "react";
import { Badge, Card, Switch } from "../ui";

interface AdapterCardProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function AdapterCard({
  name,
  description,
  icon,
  enabled,
  onEnabledChange,
  disabled,
  children,
}: AdapterCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="ac:overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="ac:w-full ac:p-3 ac:flex ac:items-center ac:justify-between ac:text-left hover:ac:bg-surface/50 ac:transition-colors"
        disabled={disabled}
      >
        <div className="ac:flex ac:items-center ac:gap-3">
          <div className="ac:w-8 ac:h-8 ac:rounded-md ac:bg-surface ac:border ac:border-border ac:flex ac:items-center ac:justify-center ac:text-text-muted">
            {icon}
          </div>
          <div>
            <div className="ac:flex ac:items-center ac:gap-2">
              <span className="ac:text-sm ac:font-medium ac:text-text">
                {name}
              </span>
              <Badge variant={enabled ? "success" : "default"}>
                {enabled ? "Active" : "Off"}
              </Badge>
            </div>
            <p className="ac:text-xs ac:text-text-muted">{description}</p>
          </div>
        </div>
        <div className="ac:flex ac:items-center ac:gap-2">
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Switch
              checked={enabled}
              onCheckedChange={onEnabledChange}
              disabled={disabled}
            />
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`ac:text-text-muted ac:transition-transform ${
              expanded ? "ac:rotate-180" : ""
            }`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>
      {expanded && (
        <div className="ac:px-3 ac:pb-3 ac:pt-0 ac:border-t ac:border-border">
          <div className="ac:pt-3 ac:space-y-3">{children}</div>
        </div>
      )}
    </Card>
  );
}
