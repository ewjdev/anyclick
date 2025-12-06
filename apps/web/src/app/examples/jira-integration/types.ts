import type { NormalizedJiraField } from "@ewjdev/anyclick-jira";

export interface JiraIssueType {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
}

export interface AutocompleteOption {
  id: string;
  name: string;
  value?: string;
}

export interface JiraSubmitResult {
  url?: string;
}

export interface JiraFeedbackMenuProps {
  targetElement: Element | null;
  containerElement: Element | null;
  position: { x: number; y: number };
  onClose: () => void;
  onSubmit: (
    type: string,
    comment: string,
    customFields: Record<string, any>,
    credentials?: JiraCredentials,
  ) => Promise<JiraSubmitResult | void>;
}

export interface JiraCredentials {
  jiraUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export interface JiraPreferences {
  credentials?: JiraCredentials;
  fieldDefaults: Record<string, Record<string, any>>;
  displayValueDefaults: Record<string, Record<string, string>>;
  lastIssueType?: string;
}

export type StepState =
  | "loading"
  | "configure"
  | "type-selection"
  | "summary"
  | "description"
  | "required-fields"
  | "review"
  | "submitting"
  | "success"
  | "error";

export type FieldErrorMap = Record<string, string>;

export interface AnimationState {
  isAnimating: boolean;
  animationDirection: "forward" | "backward";
}

export interface FieldChangeHandler {
  (key: string, value: any, display?: string): void;
}

export interface FieldValidationContext {
  formData: Record<string, any>;
  fields: NormalizedJiraField[];
  conditionallyRequiredFields: Set<string>;
}
