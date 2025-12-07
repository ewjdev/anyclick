"use client";

import { useState } from "react";
import type { NormalizedJiraField } from "../../../types";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { FieldInput } from "../FieldInput";
import { getDisplayValue } from "../../utils/jiraHelpers";
import { colors } from "../../utils/styles";

interface ReviewStepProps {
  requiredFields: NormalizedJiraField[];
  optionalFields: NormalizedJiraField[];
  formData: Record<string, unknown>;
  displayValues: Record<string, string>;
  errors: Record<string, string>;
  animationClass: string;
  showOptionalFields: boolean;
  requestHeaders: HeadersInit;
  onToggleOptional: () => void;
  onEditSummary: () => void;
  onEditDescription: () => void;
  onEditRequiredField: (index: number) => void;
  onChangeField: (key: string, value: unknown, display?: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function ReviewStep({
  requiredFields,
  optionalFields,
  formData,
  displayValues,
  errors,
  animationClass,
  showOptionalFields,
  requestHeaders,
  onToggleOptional,
  onEditSummary,
  onEditDescription,
  onEditRequiredField,
  onChangeField,
  onBack,
  onSubmit,
}: ReviewStepProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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

  const cardStyle = (id: string) => ({
    padding: "16px",
    backgroundColor: hoveredItem === id
      ? colors.accentLight
      : colors.background,
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  });

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
        <div style={{ marginBottom: "24px" }}>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: colors.primary,
              marginBottom: "8px",
            }}
          >
            Review your issue
          </h3>
          <p style={{ fontSize: "14px", color: colors.gray500 }}>
            Make sure everything looks correct
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={cardStyle("summary")}
            onClick={onEditSummary}
            onMouseEnter={() => setHoveredItem("summary")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    color: colors.gray500,
                    marginBottom: "4px",
                  }}
                >
                  Summary
                </p>
                <p style={{ color: colors.primary, fontWeight: 500 }}>
                  {formData.summary as string}
                </p>
              </div>
              <ChevronRight
                style={{
                  width: "16px",
                  height: "16px",
                  color: colors.gray400,
                }}
              />
            </div>
          </div>

          {formData.description && (
            <div
              style={cardStyle("description")}
              onClick={onEditDescription}
              onMouseEnter={() => setHoveredItem("description")}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "12px",
                      color: colors.gray500,
                      marginBottom: "4px",
                    }}
                  >
                    Description
                  </p>
                  <p
                    style={{
                      color: colors.gray700,
                      fontSize: "14px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formData.description as string}
                  </p>
                </div>
                <ChevronRight
                  style={{
                    width: "16px",
                    height: "16px",
                    color: colors.gray400,
                    flexShrink: 0,
                    marginLeft: "8px",
                  }}
                />
              </div>
            </div>
          )}

          {requiredFields.map((field, index) => (
            <div
              key={field.key}
              style={cardStyle(field.key)}
              onClick={() => onEditRequiredField(index)}
              onMouseEnter={() => setHoveredItem(field.key)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: colors.gray500,
                      marginBottom: "4px",
                    }}
                  >
                    {field.name}
                  </p>
                  <p style={{ color: colors.gray700, fontSize: "14px" }}>
                    {getDisplayValue(field, formData[field.key], displayValues)}
                  </p>
                </div>
                <ChevronRight
                  style={{
                    width: "16px",
                    height: "16px",
                    color: colors.gray400,
                  }}
                />
              </div>
            </div>
          ))}

          {optionalFields.length > 0 && (
            <div
              style={{
                paddingTop: "16px",
                borderTop: `1px solid ${colors.gray200}`,
              }}
            >
              <button
                type="button"
                onClick={onToggleOptional}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  borderRadius: "12px",
                  backgroundColor: colors.gray50,
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: colors.gray600,
                    }}
                  >
                    More options
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: colors.gray500,
                      backgroundColor: colors.gray200,
                      padding: "2px 8px",
                      borderRadius: "9999px",
                    }}
                  >
                    {optionalFields.length}
                  </span>
                </div>
                {showOptionalFields
                  ? (
                    <ChevronUp
                      style={{
                        width: "20px",
                        height: "20px",
                        color: colors.gray500,
                      }}
                    />
                  )
                  : (
                    <ChevronDown
                      style={{
                        width: "20px",
                        height: "20px",
                        color: colors.gray500,
                      }}
                    />
                  )}
              </button>

              {showOptionalFields && (
                <div
                  style={{
                    marginTop: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {optionalFields.map((field) => (
                    <div key={field.key}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: colors.gray700,
                          marginBottom: "4px",
                        }}
                      >
                        {field.name}
                      </label>
                      <FieldInput
                        field={field}
                        value={formData[field.key]}
                        displayValue={displayValues[field.key]}
                        requestHeaders={requestHeaders}
                        onChange={(value, display) =>
                          onChangeField(field.key, value, display)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {errors.submit && (
            <div
              style={{
                padding: "16px",
                backgroundColor: colors.errorLight,
                border: `1px solid ${colors.red200}`,
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <AlertCircle
                  style={{
                    width: "20px",
                    height: "20px",
                    color: colors.red600,
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                />
                <p style={{ fontSize: "14px", color: colors.red700 }}>
                  {errors.submit}
                </p>
              </div>
            </div>
          )}
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
          onClick={onSubmit}
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
          Submit
        </button>
      </div>
    </div>
  );
}
