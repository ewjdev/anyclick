"use client";

import { AlertCircle, Key } from "lucide-react";
import type { JiraPreferences } from "../../types";
import { colors } from "../../utils/styles";

interface ErrorStepProps {
  loadError: string | null;
  preferences: JiraPreferences;
  onReconfigure: () => void;
  onClose: () => void;
}

export function ErrorStep({
  loadError,
  preferences,
  onReconfigure,
  onClose,
}: ErrorStepProps) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            backgroundColor: colors.red100,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <AlertCircle
            style={{ width: "40px", height: "40px", color: colors.red600 }}
          />
        </div>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: colors.red900,
            marginBottom: "8px",
          }}
        >
          Configuration Error
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: colors.gray600,
            marginBottom: "16px",
          }}
        >
          {loadError}
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <button
            onClick={onReconfigure}
            style={{
              padding: "8px 16px",
              backgroundColor: colors.primary,
              color: colors.white,
              borderRadius: "8px",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Key style={{ width: "16px", height: "16px" }} />
            {preferences.credentials ? "Update Credentials" : "Configure Jira"}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              backgroundColor: colors.gray100,
              color: colors.gray700,
              borderRadius: "8px",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
