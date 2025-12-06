export type JiraEnv = {
  jiraUrl: string;
  email: string;
  apiToken: string;
  defaultProject?: string;
  defaultEpic?: string;
  defaultTeam?: string;
};

export type CreateIssueInteractiveOptions = {
  project?: string;
  summary?: string;
  description?: string;
  issueType?: string; // default Task
  extraFields?: Record<string, any>;
  force?: boolean; // when true, do not prompt; require required inputs
  env?: JiraEnv;
};
export type IssueLite = {
  key: string;
  summary: string;
  status?: string;
  priority?: string;
};
export type FieldMeta = {
  required?: boolean;
  name?: string;
  schema?: { type?: string; items?: string; custom?: string };
  allowedValues?: any[];
};
export type TeamSuggestion = { id: string; name: string };
export type ValidationResult = {
  ok: boolean;
  checks: Array<{
    id: string;
    ok: boolean;
    message: string;
    fixable?: boolean;
  }>;
};

export type JiraIssueDescriptionContent = {
  type:
    | "text"
    | "paragraph"
    | "listItem"
    | "bulletList"
    | "heading"
    | "inlineCard";
  text: string;
  marks?: { type: "strong" | "em" | "strike" | "underline" | "code" | "link" };
  attrs?: {
    url?: string;
  };
  content?: Array<JiraIssueDescriptionContent>;
};

export type JiraIssueDescription = {
  type: string;
  version: number;
  content: JiraIssueDescriptionContent[];
};

export type JiraIssueObjectForCPProjects = {
  id: string;
  key: string;
  summary: string;
  status: string;
  priority: string;
  fields: {
    summary: string;
    description: string | JiraIssueDescription;
  };
};

export type JiraAddCommentBody = {
  body: {
    type: "doc";
    version: number;
    content: {
      type: "paragraph";
      content: { type: "text"; text: string }[];
    }[];
  };
  visibility: {
    identifier: string | "Administrators";
    type: "group" | "role";
    value: "Administrators";
  };
};

export type GetJiraTeamDataParams = {
  teamName?: string;
  meta?: Record<string, any>;
  env?: JiraEnv;
};
