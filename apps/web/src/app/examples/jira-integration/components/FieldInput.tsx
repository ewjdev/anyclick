import type { NormalizedJiraField } from "@ewjdev/anyclick-jira";
import { AutocompleteInput } from "./AutocompleteInput";

interface FieldInputProps {
  field: NormalizedJiraField;
  value: any;
  displayValue?: string;
  hasError?: boolean;
  requestHeaders?: HeadersInit;
  onChange: (value: any, display?: string) => void;
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
  const baseInputClasses =
    `w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6e7c] text-gray-900 ${
      hasError ? "border-red-500" : "border-gray-200"
    }`;

  if (needsAutocomplete(field)) {
    return (
      <AutocompleteInput
        field={field}
        value={value}
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
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClasses}
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
          value={Array.isArray(value) ? value : []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, (option) =>
              option.value);
            onChange(selected);
          }}
          className={`${baseInputClasses} min-h-[100px]`}
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
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className={`${baseInputClasses} resize-none`}
        />
      );

    case "number":
      return (
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseInputClasses}
        />
      );

    case "boolean":
      return (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={`field-${field.key}`}
            checked={value === true || value === "true"}
            onChange={(e) => onChange(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-[#0d6e7c] focus:ring-[#0d6e7c]"
          />
          <label
            htmlFor={`field-${field.key}`}
            className="text-sm text-gray-700"
          >
            {field.placeholder || "Yes"}
          </label>
        </div>
      );

    case "date":
      return (
        <input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClasses}
        />
      );

    case "datetime":
      return (
        <input
          type="datetime-local"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClasses}
        />
      );

    case "text":
    default:
      return (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseInputClasses}
        />
      );
  }
}
