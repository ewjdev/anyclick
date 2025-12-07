"use client";

import type { NormalizedJiraField } from "../../types";
import { AutocompleteInput } from "./AutocompleteInput";
import { colors } from "../utils/styles";

interface FieldInputProps {
  field: NormalizedJiraField;
  value: unknown;
  displayValue?: string;
  hasError?: boolean;
  requestHeaders?: HeadersInit;
  onChange: (value: unknown, display?: string) => void;
}

const needsAutocomplete = (field: NormalizedJiraField): boolean => {
  const lowerName = field.name.toLowerCase();
  const lowerKey = field.key?.toLowerCase() || "";
  if (field.autoCompleteUrl) return true;
  if (field.type === "user") return true;
  if (lowerName.includes("epic") || lowerKey.includes("epic")) return true;
  if (lowerName === "team" || lowerName.includes("team")) return true;
  if (!field.options && ["user", "array"].includes(field.type)) return true;
  return false;
};

export function FieldInput({
  field,
  value,
  displayValue = "",
  hasError = false,
  requestHeaders,
  onChange,
}: FieldInputProps) {
  const baseInputStyle = {
    width: "100%",
    padding: "12px 16px",
    border: `1px solid ${hasError ? colors.red500 : colors.gray200}`,
    borderRadius: "12px",
    outline: "none",
    fontSize: "16px",
    color: colors.gray900,
    backgroundColor: colors.white,
    boxSizing: "border-box" as const,
  };

  if (needsAutocomplete(field)) {
    return (
      <AutocompleteInput
        field={field}
        value={value as string}
        displayValue={displayValue}
        onChange={(id, display) => onChange(id, display)}
        onSelect={(id, display) => onChange(id, display)}
        hasError={hasError}
        requestHeaders={requestHeaders}
      />
    );
  }

  switch (field.type) {
    case "select":
      return (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          style={baseInputStyle}
        >
          <option value="">Select {field.name}</option>
          {field.options?.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case "multiselect":
      return (
        <select
          multiple
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={(e) => {
            const selected = Array.from(
              e.target.selectedOptions,
              (option) => option.value,
            );
            onChange(selected);
          }}
          style={{ ...baseInputStyle, minHeight: "100px" }}
        >
          {field.options?.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case "textarea":
      return (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          style={{ ...baseInputStyle, resize: "none" }}
        />
      );

    case "number":
      return (
        <input
          type="number"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={baseInputStyle}
        />
      );

    case "boolean":
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <input
            type="checkbox"
            id={`field-${field.key}`}
            checked={value === true || value === "true"}
            onChange={(e) => onChange(e.target.checked)}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "4px",
              borderColor: colors.gray300,
              accentColor: colors.accent,
            }}
          />
          <label
            htmlFor={`field-${field.key}`}
            style={{
              fontSize: "14px",
              color: colors.gray700,
            }}
          >
            {field.placeholder || "Yes"}
          </label>
        </div>
      );

    case "date":
      return (
        <input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          style={baseInputStyle}
        />
      );

    case "datetime":
      return (
        <input
          type="datetime-local"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          style={baseInputStyle}
        />
      );

    case "text":
    default:
      return (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={baseInputStyle}
        />
      );
  }
}
