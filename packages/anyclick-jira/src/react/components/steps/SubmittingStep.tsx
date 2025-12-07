"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { colors, spinnerKeyframes } from "../../utils/styles";

export function SubmittingStep() {
  useEffect(() => {
    // Inject spinner keyframes
    const styleId = "jira-feedback-spinner-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = spinnerKeyframes;
      document.head.appendChild(style);
    }
  }, []);

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
        <Loader2
          style={{
            width: "48px",
            height: "48px",
            color: colors.accent,
            animation: "jira-feedback-spin 1s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 500,
            color: colors.primary,
            marginBottom: "8px",
          }}
        >
          Submitting...
        </h3>
        <p style={{ fontSize: "14px", color: colors.gray500 }}>
          Creating your issue
        </p>
      </div>
    </div>
  );
}
