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
import { cn } from "@/lib/utils";

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
  const requestHeaders = useMemo(() => getRequestHeaders(), [
    getRequestHeaders,
  ]);

  const progressWidth = useMemo(() => {
    const total = getTotalSteps();
    if (!total) return 0;
    return (getCurrentStepNumber() / total) * 100;
  }, [getCurrentStepNumber, getTotalSteps]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-[9999] transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      <div
        className={cn(
          // Core positioning and layout
          "fixed z-[10000] flex flex-col inset-0",
          // Appearance
          "bg-white shadow-2xl",
          // Animation and transition
          "transition-transform duration-200 ease-out",
          // Responsive adjustments
          "sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[450px]",
          // Border styles
          "sm:border-l sm:border-gray-200",
          // Conditional transform
          isClosing ? "translate-x-full sm:translate-x-full" : "translate-x-0",
        )}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0d3b3e] rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
              <span className="font-medium text-[#0d3b3e] text-base">
                Report Issue
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(hasCredentials || backendConfigured === false) &&
              step !== "configure" && step !== "loading" && (
              <button
                onClick={handleReconfigure}
                className="p-2 hover:bg-[#eef3f3] rounded-lg transition-colors"
                title="Configure Jira credentials"
              >
                <Settings className="w-5 h-5 text-[#0d3b3e]" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-[#eef3f3] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#5b6b6b]" />
            </button>
          </div>
        </div>

        {["summary", "description", "required-fields", "review"].includes(
          step,
        ) && (
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-[#0d6e7c] transition-all duration-300 ease-out"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
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
              summary={formData.summary || ""}
              error={errors.summary}
              animationClass={animationClass}
              targetElement={props.targetElement}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, summary: value }));
                if (errors.summary) setErrors({});
              }}
              onNext={() => {
                if (!formData.summary?.trim()) {
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
              description={formData.description || ""}
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
