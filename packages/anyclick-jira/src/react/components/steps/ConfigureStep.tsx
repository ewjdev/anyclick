"use client";

import { AlertCircle, ChevronRight, Eye, EyeOff, Key } from "lucide-react";
import type { FieldErrorMap, JiraCredentials } from "../../types";
import { colors } from "../../utils/styles";

interface ConfigureStepProps {
  credentialForm: JiraCredentials;
  credentialErrors: FieldErrorMap;
  showApiToken: boolean;
  onChange: (updates: Partial<JiraCredentials>) => void;
  onToggleApiToken: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ConfigureStep({
  credentialForm,
  credentialErrors,
  showApiToken,
  onChange,
  onToggleApiToken,
  onSave,
  onCancel,
}: ConfigureStepProps) {
  const isUpdating = Boolean(
    credentialForm.jiraUrl || credentialForm.email || credentialForm.apiToken,
  );

  const inputStyle = (hasError: boolean) => ({
    width: "100%",
    padding: "12px 16px",
    border: `1px solid ${hasError ? colors.red500 : colors.gray200}`,
    borderRadius: "12px",
    outline: "none",
    fontSize: "16px",
    color: colors.gray900,
    backgroundColor: colors.white,
    boxSizing: "border-box" as const,
  });

  return (
    <div style={{ padding: "24px", overflowY: "auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            padding: "8px",
            borderRadius: "8px",
            backgroundColor: colors.amber100,
            color: colors.amber600,
          }}
        >
          <Key style={{ width: "20px", height: "20px" }} />
        </div>
        <div>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: colors.primary,
            }}
          >
            {isUpdating ? "Update Credentials" : "Connect to Jira"}
          </h3>
          <p style={{ fontSize: "14px", color: colors.gray600 }}>
            {isUpdating
              ? "Update your Jira credentials below"
              : "Enter your Jira credentials to get started"}
          </p>
        </div>
      </div>

      <div
        style={{
          padding: "16px",
          backgroundColor: "#fffbeb",
          border: `1px solid ${colors.amber200}`,
          borderRadius: "12px",
          marginBottom: "24px",
        }}
      >
        <p style={{ fontSize: "14px", color: colors.amber800 }}>
          <strong>Note:</strong>{" "}
          Your credentials are stored in this browser session only and are not
          saved to any server.
        </p>
      </div>

      <div
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        data-form-type="other"
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: colors.gray700,
              marginBottom: "4px",
            }}
          >
            Jira URL
            <span style={{ color: colors.red500, marginLeft: "4px" }}>*</span>
          </label>
          <input
            type="url"
            name="jira-instance-url"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            value={credentialForm.jiraUrl}
            onChange={(e) => onChange({ jiraUrl: e.target.value })}
            placeholder="https://your-company.atlassian.net"
            style={inputStyle(!!credentialErrors.jiraUrl)}
          />
          {credentialErrors.jiraUrl && (
            <p
              style={{
                fontSize: "12px",
                color: colors.red500,
                marginTop: "4px",
              }}
            >
              {credentialErrors.jiraUrl}
            </p>
          )}
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: colors.gray700,
              marginBottom: "4px",
            }}
          >
            Email
            <span style={{ color: colors.red500, marginLeft: "4px" }}>*</span>
          </label>
          <input
            type="text"
            name="jira-account-email"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            value={credentialForm.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="your-email@company.com"
            style={inputStyle(!!credentialErrors.email)}
          />
          {credentialErrors.email && (
            <p
              style={{
                fontSize: "12px",
                color: colors.red500,
                marginTop: "4px",
              }}
            >
              {credentialErrors.email}
            </p>
          )}
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: colors.gray700,
              marginBottom: "4px",
            }}
          >
            API Token
            <span style={{ color: colors.red500, marginLeft: "4px" }}>*</span>
          </label>
          <p
            style={{
              fontSize: "12px",
              color: colors.gray500,
              marginBottom: "8px",
            }}
          >
            <a
              href="https://id.atlassian.com/manage-profile/security/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: colors.accent, textDecoration: "none" }}
            >
              Create an API token
            </a>{" "}
            in your Atlassian account settings
          </p>
          <div style={{ position: "relative" }}>
            <input
              type={showApiToken ? "text" : "password"}
              name="jira-api-token"
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              value={credentialForm.apiToken}
              onChange={(e) => onChange({ apiToken: e.target.value })}
              placeholder="Enter your API token"
              style={{
                ...inputStyle(!!credentialErrors.apiToken),
                paddingRight: "48px",
              }}
            />
            <button
              type="button"
              onClick={onToggleApiToken}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: colors.gray400,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              {showApiToken
                ? <EyeOff style={{ width: "20px", height: "20px" }} />
                : <Eye style={{ width: "20px", height: "20px" }} />}
            </button>
          </div>
          {credentialErrors.apiToken && (
            <p
              style={{
                fontSize: "12px",
                color: colors.red500,
                marginTop: "4px",
              }}
            >
              {credentialErrors.apiToken}
            </p>
          )}
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: colors.gray700,
              marginBottom: "4px",
            }}
          >
            Project Key
            <span style={{ color: colors.red500, marginLeft: "4px" }}>*</span>
          </label>
          <p
            style={{
              fontSize: "12px",
              color: colors.gray500,
              marginBottom: "8px",
            }}
          >
            The key of your Jira project (e.g., PROJ, DEV, SUPPORT)
          </p>
          <input
            type="text"
            name="jira-project-key"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            value={credentialForm.projectKey}
            onChange={(e) =>
              onChange({ projectKey: e.target.value.toUpperCase() })}
            placeholder="PROJ"
            style={{
              ...inputStyle(!!credentialErrors.projectKey),
              textTransform: "uppercase",
            }}
          />
          {credentialErrors.projectKey && (
            <p
              style={{
                fontSize: "12px",
                color: colors.red500,
                marginTop: "4px",
              }}
            >
              {credentialErrors.projectKey}
            </p>
          )}
        </div>

        {credentialErrors.submit && (
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
                {credentialErrors.submit}
              </p>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "12px 16px",
            border: `1px solid ${colors.gray300}`,
            borderRadius: "12px",
            fontWeight: 500,
            color: colors.gray700,
            backgroundColor: "transparent",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
        >
          Cancel
        </button>
        <button
          onClick={onSave}
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {isUpdating ? "Update & Connect" : "Connect"}
          <ChevronRight style={{ width: "16px", height: "16px" }} />
        </button>
      </div>
    </div>
  );
}
