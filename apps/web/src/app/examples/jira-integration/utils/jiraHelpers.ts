import React from "react";
import { Bug, FileText, Settings, Sparkles } from "lucide-react";
import type { NormalizedJiraField } from "@ewjdev/anyclick-jira";
import { issueTypeIcons } from "../components/Icons";

const errorPatterns: Array<{ pattern: RegExp | string; message: string }> = [
  {
    pattern: /401|unauthorized|authentication/i,
    message: "Authentication failed. Please check your email and API token.",
  },
  {
    pattern: /403|forbidden|permission/i,
    message: "Access denied. Please check your permissions for this project.",
  },
  {
    pattern: /404|not found/i,
    message: "Project not found. Please verify your Jira URL and project key.",
  },
  {
    pattern: /429|rate limit/i,
    message: "Too many requests. Please wait a moment and try again.",
  },
  {
    pattern: /500|internal server/i,
    message: "Jira server error. Please try again later.",
  },
  {
    pattern: /502|503|504|bad gateway|unavailable/i,
    message: "Jira is temporarily unavailable. Please try again later.",
  },
  {
    pattern: /network|fetch|connection|ECONNREFUSED/i,
    message:
      "Unable to connect to Jira. Please check your internet connection.",
  },
  { pattern: /timeout/i, message: "Request timed out. Please try again." },
  {
    pattern: /invalid.*url/i,
    message: "Invalid Jira URL. Please check your configuration.",
  },
  {
    pattern: /project.*key/i,
    message: "Invalid project key. Please check your configuration.",
  },
];

export function sanitizeErrorMessage(rawError: string): string {
  console.error("[JiraMenu] Raw error:", rawError);
  for (const { pattern, message } of errorPatterns) {
    if (
      typeof pattern === "string"
        ? rawError.includes(pattern)
        : pattern.test(rawError)
    ) {
      return message;
    }
  }
  return "Unable to connect to Jira. Please check your credentials and try again.";
}

export function generateContextDescription(
  targetElement: Element | null,
  containerElement: Element | null,
): string {
  if (typeof window === "undefined") return "";

  const tag = targetElement?.tagName.toLowerCase() || "element";
  const testId = targetElement?.getAttribute("data-testid");
  const id = targetElement?.id;
  const classes = targetElement?.className
    ? `.${targetElement.className.split(" ").slice(0, 3).join(".")}`
    : "";
  const page = window.location.pathname;
  const url = window.location.href;

  const selectorParts = [tag];
  if (testId) selectorParts.push(`[data-testid="${testId}"]`);
  else if (id) selectorParts.push(`#${id}`);
  else if (classes) selectorParts.push(classes);

  return `**Element:** \`${selectorParts.join("")}\`
**Page:** ${page}
**URL:** ${url}

**Issue Description:**
`;
}

export function extractPrimitiveValue(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object") {
    if (value.id !== undefined && typeof value.id !== "object") {
      return String(value.id);
    }
    if (value.value !== undefined && typeof value.value !== "object") {
      return String(value.value);
    }
    if (value.name !== undefined && typeof value.name !== "object") {
      return String(value.name);
    }
    if (value.key !== undefined && typeof value.key !== "object") {
      return String(value.key);
    }
    if (value.accountId !== undefined) return String(value.accountId);
    if (Array.isArray(value) && value.length === 1) {
      return extractPrimitiveValue(value[0]);
    }

    for (const key of Object.keys(value)) {
      const candidate = value[key];
      if (typeof candidate === "string" || typeof candidate === "number") {
        console.warn(
          `[extractPrimitiveValue] Using fallback key "${key}" for value:`,
          value,
        );
        return String(candidate);
      }
    }

    console.error(
      "[extractPrimitiveValue] Could not extract primitive from:",
      value,
    );
    return "";
  }

  return String(value);
}

export function parseJiraErrorForMissingFields(errorMessage: string): string[] {
  const missingFields: string[] = [];
  const valuePattern = /Please enter a value for the (.+?) fields?/gi;
  let match = valuePattern.exec(errorMessage);

  while (match) {
    const fieldsPart = match[1];
    const fieldNames = fieldsPart.split(/\s+and\s+/i);
    for (const name of fieldNames) {
      const subNames = name.split(/,\s*/);
      for (const subName of subNames) {
        const trimmed = subName.trim();
        if (trimmed) missingFields.push(trimmed);
      }
    }
    match = valuePattern.exec(errorMessage);
  }

  const requiredPattern = /['"]?([^'"]+)['"]?\s+is required/gi;
  match = requiredPattern.exec(errorMessage);
  while (match) {
    const fieldName = match[1].trim();
    if (fieldName && !missingFields.includes(fieldName)) {
      missingFields.push(fieldName);
    }
    match = requiredPattern.exec(errorMessage);
  }

  try {
    const jsonMatch = errorMessage.match(/\{[\s\S]*"errors"[\s\S]*\}/);
    if (jsonMatch) {
      const errorJson = JSON.parse(jsonMatch[0]);
      if (errorJson.errors && typeof errorJson.errors === "object") {
        for (const fieldKey of Object.keys(errorJson.errors)) {
          if (!missingFields.includes(fieldKey)) {
            missingFields.push(fieldKey);
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return missingFields;
}

export function findFieldKeysByNames(
  fields: NormalizedJiraField[],
  names: string[],
): Set<string> {
  const matchedKeys = new Set<string>();
  for (const name of names) {
    const lowerName = name.toLowerCase();
    for (const field of fields) {
      if (field.name.toLowerCase() === lowerName) {
        matchedKeys.add(field.key);
        continue;
      }
      if (field.name.toLowerCase().includes(lowerName)) {
        matchedKeys.add(field.key);
        continue;
      }
      if (lowerName.includes(field.name.toLowerCase())) {
        matchedKeys.add(field.key);
      }
    }
  }
  return matchedKeys;
}

export function getDisplayValue(
  field: NormalizedJiraField,
  value: any,
  displayValues: Record<string, string>,
): string {
  if (!value) return "Not set";
  if (displayValues[field.key]) return displayValues[field.key];

  if (field.options) {
    const option = field.options.find((option) =>
      option.id === value || option.value === value
    );
    if (option) return option.label;
  }

  return String(value);
}
