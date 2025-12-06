import type { AnyclickPayload } from "@ewjdev/anyclick-core";

/**
 * Atlassian Document Format (ADF) types for Jira descriptions
 */
export interface AdfDocument {
  type: "doc";
  version: 1;
  content: AdfNode[];
}

export interface AdfNode {
  type: string;
  attrs?: Record<string, any>;
  content?: AdfNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
}

/**
 * Field metadata from Jira's createmeta endpoint
 */
export interface JiraFieldMeta {
  required: boolean;
  name: string;
  key: string;
  schema: {
    type: string;
    items?: string;
    custom?: string;
    customId?: number;
    system?: string;
  };
  allowedValues?: JiraAllowedValue[];
  hasDefaultValue?: boolean;
  defaultValue?: any;
  autoCompleteUrl?: string;
}

/**
 * Allowed value option for select fields
 */
export interface JiraAllowedValue {
  id: string;
  value?: string;
  name?: string;
  description?: string;
  iconUrl?: string;
  self?: string;
}

/**
 * Issue type metadata
 */
export interface JiraIssueTypeMeta {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  subtask: boolean;
  fields: Record<string, JiraFieldMeta>;
}

/**
 * Project metadata from createmeta
 */
export interface JiraProjectMeta {
  id: string;
  key: string;
  name: string;
  issuetypes: JiraIssueTypeMeta[];
}

/**
 * Normalized field for client-side rendering
 */
export interface NormalizedJiraField {
  id: string;
  key: string;
  name: string;
  required: boolean;
  type:
    | "text"
    | "textarea"
    | "select"
    | "multiselect"
    | "number"
    | "boolean"
    | "user"
    | "date"
    | "datetime"
    | "array";
  options?: Array<{ id: string; value: string; label: string }>;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  autoCompleteUrl?: string;
  schema?: JiraFieldMeta["schema"];
}

/**
 * Options for the Jira adapter (server-side)
 */
export interface JiraAdapterOptions {
  /** Jira instance URL (e.g., https://company.atlassian.net) */
  jiraUrl: string;
  /** Jira user email */
  email: string;
  /** Jira API token */
  apiToken: string;
  /** Project key (e.g., "PROJ") */
  projectKey: string;
  /** Default issue type (default: "Task") */
  defaultIssueType?: string;
  /** Issue type mapping from AnyclickType to Jira issue types */
  issueTypeMapping?: Record<string, string>;
  /** Default labels to add to issues */
  defaultLabels?: string[];
  /** Custom summary formatter */
  formatSummary?: (payload: AnyclickPayload) => string;
  /** Custom description formatter */
  formatDescription?: (payload: AnyclickPayload) => AdfDocument;
  /** Additional custom fields to include in issue creation */
  customFields?: Record<string, any>;
  /** Default values for fields (by field key) */
  defaultFieldValues?: Record<string, any>;
}

/**
 * Jira issue creation result
 */
export interface JiraIssueResult {
  /** Issue key (e.g., "PROJ-123") */
  key: string;
  /** Issue ID */
  id: string;
  /** Issue URL */
  url: string;
}

/**
 * Feedback type labels for Jira issues
 */
export const feedbackTypeLabels: Record<string, string> = {
  issue: "bug",
  feature: "enhancement",
  like: "feedback",
};

/**
 * Default issue type mapping
 */
export const defaultIssueTypeMapping: Record<string, string> = {
  issue: "Bug",
  feature: "Task",
  like: "Task",
};
