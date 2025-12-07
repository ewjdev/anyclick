"use client";

import type { JiraIssueType } from "../../types";
import { colors } from "../../utils/styles";

interface DescriptionStepProps {
  selectedType: JiraIssueType;
  description: string;
  animationClass: string;
  hasRequiredFields: boolean;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DescriptionStep({
  selectedType,
  description,
  animationClass,
  hasRequiredFields,
  onChange,
  onNext,
  onBack,
}: DescriptionStepProps) {
  // Convert Tailwind animation class to inline style
  const getAnimationStyle = () => {
    if (animationClass.includes("opacity-0")) {
      return {
        opacity: 0,
        transform: animationClass.includes("-translate-x")
          ? "translateX(-16px)"
          : "translateX(16px)",
      };
    }
    return { opacity: 1, transform: "translateX(0)" };
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "all 0.2s ease-out",
        ...getAnimationStyle(),
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        <div style={{ maxWidth: "384px", margin: "0 auto" }}>
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 500,
                color: colors.primary,
                marginBottom: "8px",
              }}
            >
              Add some details
            </h3>
            <p style={{ fontSize: "14px", color: colors.gray500 }}>
              Optional - describe what happened
            </p>
          </div>

          <textarea
            value={description}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Steps to reproduce, expected behavior, or any additional context..."
            rows={6}
            autoFocus
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "16px",
              border: `1px solid ${colors.gray200}`,
              borderRadius: "12px",
              outline: "none",
              resize: "none",
              color: colors.gray900,
              backgroundColor: colors.white,
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          padding: "16px 24px",
          borderTop: `1px solid ${colors.gray100}`,
          backgroundColor: colors.white,
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: "12px 16px",
            color: colors.gray500,
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "color 0.2s",
          }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          style={{
            flex: 1,
            padding: "12px 16px",
            backgroundColor: colors.primary,
            color: colors.white,
            borderRadius: "12px",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
        >
          {hasRequiredFields ? "Continue" : "Review"}
        </button>
      </div>
    </div>
  );
}
