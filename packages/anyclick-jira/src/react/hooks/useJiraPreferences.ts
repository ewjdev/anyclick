"use client";

import { useCallback, useState } from "react";
import type { JiraCredentials, JiraPreferences } from "../types";

const STORAGE_KEY = "anyclick-jira-preferences";

function getStoredPreferences(): JiraPreferences {
  if (typeof window === "undefined") {
    return { fieldDefaults: {}, displayValueDefaults: {} };
  }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("[JiraPreferences] Failed to read preferences:", error);
  }
  return { fieldDefaults: {}, displayValueDefaults: {} };
}

function savePreferences(preferences: JiraPreferences): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error("[JiraPreferences] Failed to save preferences:", error);
  }
}

export function useJiraPreferences() {
  const [preferences, setPreferences] = useState<JiraPreferences>(() =>
    getStoredPreferences()
  );

  const updatePreferences = useCallback(
    (updates: Partial<JiraPreferences>) => {
      setPreferences((prev) => {
        const updated = { ...prev, ...updates };
        savePreferences(updated);
        return updated;
      });
    },
    [],
  );

  const saveCredentials = useCallback(
    (credentials: JiraCredentials) => {
      updatePreferences({ credentials });
    },
    [updatePreferences],
  );

  const saveFieldDefaults = useCallback(
    (
      issueType: string,
      fields: Record<string, unknown>,
      displayValues: Record<string, string>,
    ) => {
      setPreferences((prev) => {
        const updated: JiraPreferences = {
          ...prev,
          fieldDefaults: {
            ...prev.fieldDefaults,
            [issueType]: fields,
          },
          displayValueDefaults: {
            ...prev.displayValueDefaults,
            [issueType]: displayValues,
          },
          lastIssueType: issueType,
        };
        savePreferences(updated);
        return updated;
      });
    },
    [],
  );

  const getFieldDefaults = useCallback(
    (
      issueType: string,
    ): {
      fields: Record<string, unknown>;
      displayValues: Record<string, string>;
    } => ({
      fields: preferences.fieldDefaults[issueType] || {},
      displayValues: preferences.displayValueDefaults[issueType] || {},
    }),
    [preferences.displayValueDefaults, preferences.fieldDefaults],
  );

  return {
    preferences,
    updatePreferences,
    saveCredentials,
    saveFieldDefaults,
    getFieldDefaults,
    hasCredentials: !!preferences.credentials,
  };
}
