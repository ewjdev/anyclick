"use client";

// Main component
export { JiraFeedbackMenu } from "./react/JiraFeedbackMenu";

// Context and Provider
export {
  getApiEndpoint,
  type JiraFeedbackConfig,
  JiraFeedbackProvider,
  type JiraFeedbackProviderProps,
  useJiraFeedbackConfig,
} from "./react/JiraFeedbackContext";

// Types
export type {
  AutocompleteOption,
  FieldChangeHandler,
  FieldErrorMap,
  JiraCredentials,
  JiraFeedbackMenuProps,
  JiraIssueType,
  JiraPreferences,
  JiraSubmitResult,
  NormalizedJiraField,
  StepState,
} from "./react/types";

// Hooks (for advanced use cases)
export { useJiraFeedbackController } from "./react/hooks/useJiraFeedbackController";
export { useJiraPreferences } from "./react/hooks/useJiraPreferences";

// Utilities (for advanced customization)
export {
  extractPrimitiveValue,
  findFieldKeysByNames,
  generateContextDescription,
  getDisplayValue,
  mergeStyles,
  parseJiraErrorForMissingFields,
  sanitizeErrorMessage,
} from "./react/utils/jiraHelpers";
