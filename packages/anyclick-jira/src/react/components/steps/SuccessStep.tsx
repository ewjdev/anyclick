"use client";

import { CheckCircle2 } from "lucide-react";
import { colors } from "../../utils/styles";

interface SuccessStepProps {
  createdIssueUrl: string | null;
  onClose: () => void;
}

export function SuccessStep({ createdIssueUrl, onClose }: SuccessStepProps) {
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
            backgroundColor: colors.successLight,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <CheckCircle2
            style={{ width: "40px", height: "40px", color: colors.success }}
          />
        </div>
        <h3
          style={{
            fontSize: "20px",
            fontWeight: 500,
            color: colors.primary,
            marginBottom: "8px",
          }}
        >
          Done!
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: colors.gray500,
            marginBottom: "16px",
          }}
        >
          Your issue has been created
        </p>
        {createdIssueUrl && (
          <a
            href={createdIssueUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: colors.primary,
              color: colors.white,
              borderRadius: "8px",
              fontWeight: 500,
              textDecoration: "none",
              transition: "background-color 0.2s",
            }}
          >
            View Issue
            <svg
              style={{ width: "16px", height: "16px" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
        <button
          onClick={onClose}
          style={{
            marginTop: "16px",
            display: "block",
            margin: "16px auto 0",
            fontSize: "14px",
            color: colors.gray500,
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "color 0.2s",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
