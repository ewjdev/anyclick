"use client";

import { useMemo } from "react";
import { Settings, X } from "lucide-react";
import { useJiraFeedbackController } from "./hooks/useJiraFeedbackController";
import type { JiraFeedbackMenuProps } from "./types";
import { LoadingStep } from "./components/steps/LoadingStep";
import { ErrorStep } from "./components/steps/ErrorStep";
import { ConfigureStep } from "./components/steps/ConfigureStep";
import { TypeSelectionStep } from "./components/steps/TypeSelectionStep";
import { SummaryStep } from "./components/steps/SummaryStep";
import { DescriptionStep } from "./components/steps/DescriptionStep";
import { RequiredFieldsStep } from "./components/steps/RequiredFieldsStep";
import { ReviewStep } from "./components/steps/ReviewStep";
import { SubmittingStep } from "./components/steps/SubmittingStep";
import { SuccessStep } from "./components/steps/SuccessStep";
import { colors } from "./utils/styles";

export function JiraFeedbackMenu(props: JiraFeedbackMenuProps) {
  const { state, handlers, helpers } = useJiraFeedbackController(props);
  const {
    step,
    issueTypes,
    selectedType,
    formData,
    displayValues,
    errors,
    loadError,
    isClosing,
    showOptionalFields,
    currentFieldIndex,
    animationClass,
    getCurrentStepNumber,
    getTotalSteps,
    requiredFields,
    optionalFields,
    createdIssueUrl,
    preferences,
    credentialForm,
    credentialErrors,
    showApiToken,
    backendConfigured,
    hasCredentials,
  } = state;

  const {
    animateToStep,
    handleTypeSelect,
    handleFieldChange,
    handleRequiredNext,
    handleRequiredBack,
    handleReviewBack,
    handleSubmit,
    handleSaveCredentials,
    handleReconfigure,
    handleClose,
    setShowOptionalFields,
    setCredentialForm,
    setShowApiToken,
    setErrors,
    setFormData,
    setStep,
    setCurrentFieldIndex,
  } = handlers;

  const { getRequestHeaders } = helpers;
  const requestHeaders = useMemo(
    () => getRequestHeaders(),
    [getRequestHeaders],
  );

  const progressWidth = useMemo(() => {
    const total = getTotalSteps();
    if (!total) return 0;
    return (getCurrentStepNumber() / total) * 100;
  }, [getCurrentStepNumber, getTotalSteps]);

  const showProgress = ["summary", "description", "required-fields", "review"]
    .includes(step);

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          zIndex: 9999,
          transition: "opacity 0.2s",
          opacity: isClosing ? 0 : 1,
        }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          inset: 0,
          backgroundColor: colors.white,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          transition: "transform 0.2s ease-out",
          transform: isClosing ? "translateX(100%)" : "translateX(0)",
          // Responsive: on larger screens, position on right side
          ...(typeof window !== "undefined" && window.innerWidth >= 640
            ? {
              top: 0,
              bottom: 0,
              left: "auto",
              right: 0,
              width: "450px",
              borderLeft: `1px solid ${colors.gray200}`,
            }
            : {}),
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${colors.gray100}`,
            backgroundColor: colors.white,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                backgroundColor: colors.primary,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                style={{ width: "20px", height: "20px", color: colors.white }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </div>
            <div>
              <span
                style={{
                  fontWeight: 500,
                  color: colors.primary,
                  fontSize: "16px",
                }}
              >
                Report Issue
              </span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {(hasCredentials || backendConfigured === false) &&
              step !== "configure" &&
              step !== "loading" && (
              <button
                onClick={handleReconfigure}
                style={{
                  padding: "8px",
                  background: "none",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                title="Configure Jira credentials"
              >
                <Settings
                  style={{
                    width: "20px",
                    height: "20px",
                    color: colors.primary,
                  }}
                />
              </button>
            )}
            <button
              onClick={handleClose}
              style={{
                padding: "8px",
                background: "none",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
            >
              <X
                style={{
                  width: "20px",
                  height: "20px",
                  color: colors.gray500,
                }}
              />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div style={{ height: "4px", backgroundColor: colors.gray100 }}>
            <div
              style={{
                height: "100%",
                backgroundColor: colors.accent,
                transition: "width 0.3s ease-out",
                width: `${progressWidth}%`,
              }}
            />
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {step === "loading" && <LoadingStep />}

          {step === "configure" && (
            <ConfigureStep
              credentialForm={credentialForm}
              credentialErrors={credentialErrors}
              showApiToken={showApiToken}
              onToggleApiToken={() => setShowApiToken((prev) => !prev)}
              onChange={(updates) =>
                setCredentialForm((prev) => ({ ...prev, ...updates }))}
              onSave={handleSaveCredentials}
              onCancel={handleClose}
            />
          )}

          {step === "error" && loadError && (
            <ErrorStep
              loadError={loadError}
              preferences={preferences}
              onReconfigure={handleReconfigure}
              onClose={handleClose}
            />
          )}

          {step === "type-selection" && (
            <TypeSelectionStep
              issueTypes={issueTypes}
              preferences={preferences}
              onSelect={handleTypeSelect}
            />
          )}

          {step === "summary" && selectedType && (
            <SummaryStep
              selectedType={selectedType}
              summary={(formData.summary as string) || ""}
              error={errors.summary}
              animationClass={animationClass}
              targetElement={props.targetElement}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, summary: value }));
                if (errors.summary) setErrors({});
              }}
              onNext={() => {
                if (
                  !formData.summary ||
                  !(formData.summary as string).trim()
                ) {
                  setErrors({ summary: "Please enter a summary" });
                  return;
                }
                animateToStep("description", "forward");
              }}
              onBack={() => animateToStep("type-selection", "backward")}
            />
          )}

          {step === "description" && selectedType && (
            <DescriptionStep
              selectedType={selectedType}
              description={(formData.description as string) || ""}
              animationClass={animationClass}
              hasRequiredFields={requiredFields.length > 0}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, description: value }))}
              onNext={() => {
                if (requiredFields.length > 0) {
                  setCurrentFieldIndex(0);
                  animateToStep("required-fields", "forward");
                } else {
                  animateToStep("review", "forward");
                }
              }}
              onBack={() => animateToStep("summary", "backward")}
            />
          )}

          {step === "required-fields" && requiredFields.length > 0 && (
            <RequiredFieldsStep
              requiredFields={requiredFields}
              currentFieldIndex={currentFieldIndex}
              animationClass={animationClass}
              formData={formData}
              displayValues={displayValues}
              errors={errors}
              requestHeaders={requestHeaders}
              onChangeField={handleFieldChange}
              onNext={handleRequiredNext}
              onBack={handleRequiredBack}
            />
          )}

          {step === "review" && selectedType && (
            <ReviewStep
              requiredFields={requiredFields}
              optionalFields={optionalFields}
              formData={formData}
              displayValues={displayValues}
              errors={errors}
              animationClass={animationClass}
              showOptionalFields={showOptionalFields}
              requestHeaders={requestHeaders}
              onToggleOptional={() => setShowOptionalFields((prev) => !prev)}
              onEditSummary={() => animateToStep("summary", "backward")}
              onEditDescription={() => animateToStep("description", "backward")}
              onEditRequiredField={(index) => {
                setCurrentFieldIndex(index);
                animateToStep("required-fields", "backward");
              }}
              onChangeField={handleFieldChange}
              onBack={handleReviewBack}
              onSubmit={handleSubmit}
            />
          )}

          {step === "submitting" && <SubmittingStep />}
          {step === "success" && (
            <SuccessStep
              createdIssueUrl={createdIssueUrl}
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    </>
  );
}
