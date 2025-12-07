"use client";

import type { JiraIssueType } from "../../types";
import { colors } from "../../utils/styles";

interface SummaryStepProps {
  selectedType: JiraIssueType;
  summary: string;
  error?: string;
  animationClass: string;
  targetElement: Element | null;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SummaryStep({
  selectedType,
  summary,
  error,
  animationClass,
  targetElement,
  onChange,
  onNext,
  onBack,
}: SummaryStepProps) {
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
              What&apos;s the issue?
            </h3>
            <p style={{ fontSize: "14px", color: colors.gray500 }}>
              A brief title for your {selectedType.name.toLowerCase()}
            </p>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <input
              type="text"
              value={summary}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g., Button not responding on click"
              autoFocus
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "18px",
                border: `1px solid ${error ? colors.red500 : colors.gray200}`,
                borderRadius: "12px",
                outline: "none",
                color: colors.gray900,
                backgroundColor: colors.white,
                boxSizing: "border-box",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") onNext();
              }}
            />
            {error && (
              <p style={{ fontSize: "14px", color: colors.red500 }}>{error}</p>
            )}
          </div>

          <div
            style={{
              marginTop: "24px",
              padding: "12px",
              backgroundColor: colors.background,
              borderRadius: "8px",
            }}
          >
            <p style={{ fontSize: "12px", color: colors.gray600 }}>
              <span style={{ fontWeight: 500 }}>Element:</span>{" "}
              {targetElement?.tagName.toLowerCase() || "page"} on{" "}
              {typeof window !== "undefined" ? window.location.pathname : ""}
            </p>
          </div>
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
          Continue
        </button>
      </div>
    </div>
  );
}
