"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { JiraIssueType, JiraPreferences } from "../../types";
import { getIssueTypeIcon } from "../Icons";
import { colors } from "../../utils/styles";

interface TypeSelectionStepProps {
  issueTypes: JiraIssueType[];
  preferences: JiraPreferences;
  onSelect: (type: JiraIssueType) => void;
}

export function TypeSelectionStep({
  issueTypes,
  preferences,
  onSelect,
}: TypeSelectionStepProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sortedIssueTypes = [...issueTypes].sort((a, b) => {
    if (a.name === preferences.lastIssueType) return -1;
    if (b.name === preferences.lastIssueType) return 1;
    return 0;
  });

  return (
    <div style={{ padding: "24px" }}>
      <h3
        style={{
          fontSize: "20px",
          fontWeight: 600,
          marginBottom: "8px",
          color: colors.primary,
        }}
      >
        What would you like to report?
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: colors.gray500,
          marginBottom: "24px",
        }}
      >
        Choose the type of issue
      </p>

      {issueTypes.length === 0
        ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px",
              color: colors.gray500,
            }}
          >
            <p>No issue types available</p>
          </div>
        )
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sortedIssueTypes.map((type) => {
              const isLastUsed = type.name === preferences.lastIssueType;
              const isHovered = hoveredId === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => onSelect(type)}
                  onMouseEnter={() => setHoveredId(type.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "12px",
                    border: `1px solid ${
                      isLastUsed
                        ? colors.accent
                        : isHovered
                        ? "rgba(13, 110, 124, 0.5)"
                        : colors.gray200
                    }`,
                    backgroundColor: isLastUsed
                      ? colors.background
                      : isHovered
                      ? colors.background
                      : colors.white,
                    transition: "all 0.2s",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px",
                        borderRadius: "8px",
                        backgroundColor: isLastUsed
                          ? colors.accentLighter
                          : isHovered
                          ? colors.accentLight
                          : colors.gray100,
                        color: isLastUsed
                          ? colors.accent
                          : isHovered
                          ? colors.accent
                          : colors.gray600,
                        transition: "all 0.2s",
                      }}
                    >
                      {getIssueTypeIcon(type.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 500,
                          color: colors.primary,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {type.name}
                        {isLastUsed && (
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "normal",
                              backgroundColor: colors.accentLighter,
                              color: colors.accent,
                              padding: "2px 8px",
                              borderRadius: "9999px",
                            }}
                          >
                            Recent
                          </span>
                        )}
                      </div>
                      {type.description && (
                        <div
                          style={{
                            fontSize: "14px",
                            color: colors.gray500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {type.description}
                        </div>
                      )}
                    </div>
                    <ChevronRight
                      style={{
                        width: "20px",
                        height: "20px",
                        color: isHovered ? colors.accent : colors.gray400,
                        flexShrink: 0,
                        transition: "color 0.2s",
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
    </div>
  );
}
