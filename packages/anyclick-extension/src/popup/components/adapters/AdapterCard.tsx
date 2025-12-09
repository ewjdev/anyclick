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
  id,
  name,
  description,
  icon,
  enabled,
  onEnabledChange,
  disabled,
  children,
}: AdapterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const contentId = `${id}-settings`;

  return (
    <Card className="ac:overflow-hidden">
      <div className="ac:p-3 ac:flex ac:items-center ac:justify-between ac:gap-3">
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
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
            disabled={disabled}
            id={`${id}-toggle`}
          />
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="ac:flex ac:items-center ac:gap-1 ac:text-xs ac:text-text-muted hover:ac:text-text ac:transition-colors disabled:ac:opacity-50"
            aria-expanded={expanded}
            aria-controls={contentId}
            disabled={disabled}
          >
            <span>{expanded ? "Hide" : "Settings"}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`ac:transition-transform ${
                expanded ? "ac:rotate-180" : ""
              }`}
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>
      {expanded && (
        <div
          id={contentId}
          className="ac:px-3 ac:pb-3 ac:pt-0 ac:border-t ac:border-border"
        >
          <div className="ac:pt-3 ac:space-y-3">{children}</div>
        </div>
      )}
    </Card>
  );
}
