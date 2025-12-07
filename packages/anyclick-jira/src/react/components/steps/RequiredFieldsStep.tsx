"use client";

import type { NormalizedJiraField } from "../../../types";
import { FieldInput } from "../FieldInput";
import { colors } from "../../utils/styles";

interface RequiredFieldsStepProps {
  requiredFields: NormalizedJiraField[];
  currentFieldIndex: number;
  animationClass: string;
  formData: Record<string, unknown>;
  displayValues: Record<string, string>;
  errors: Record<string, string>;
  requestHeaders: HeadersInit;
  onChangeField: (key: string, value: unknown, display?: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function RequiredFieldsStep({
  requiredFields,
  currentFieldIndex,
  animationClass,
  formData,
  displayValues,
  errors,
  requestHeaders,
  onChangeField,
  onNext,
  onBack,
}: RequiredFieldsStepProps) {
  const currentField = requiredFields[currentFieldIndex];
  if (!currentField) return null;

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
          <div style={{ marginBottom: "24px" }}>
            <span style={{ fontSize: "12px", color: colors.gray500 }}>
              {currentFieldIndex + 1} of {requiredFields.length} required fields
            </span>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 500,
                color: colors.primary,
                marginBottom: "8px",
              }}
            >
              {currentField.name}
            </h3>
            {currentField.description && (
              <p style={{ fontSize: "14px", color: colors.gray500 }}>
                {currentField.description}
              </p>
            )}
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <FieldInput
              field={currentField}
              value={formData[currentField.key]}
              displayValue={displayValues[currentField.key]}
              hasError={Boolean(errors[currentField.key])}
              requestHeaders={requestHeaders}
              onChange={(value, display) =>
                onChangeField(currentField.key, value, display)}
            />
            {errors[currentField.key] && (
              <p style={{ fontSize: "14px", color: colors.red500 }}>
                {errors[currentField.key]}
              </p>
            )}
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
          {currentFieldIndex < requiredFields.length - 1
            ? "Continue"
            : "Review"}
        </button>
      </div>
    </div>
  );
}
