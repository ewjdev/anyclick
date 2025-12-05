import type { AnyclickPayload, ScreenshotData } from "@ewjdev/anyclick-core";
import type {
  AdfDocument,
  JiraAdapterOptions,
  JiraFieldMeta,
  JiraIssueResult,
  JiraIssueTypeMeta,
  JiraProjectMeta,
  NormalizedJiraField,
} from "./types";
import { defaultIssueTypeMapping, feedbackTypeLabels } from "./types";
import { defaultFormatDescription, defaultFormatSummary } from "./formatters";

// Fields to skip when returning normalized fields (handled separately)
const SKIP_FIELDS = [
  "summary",
  "description",
  "issuetype",
  "project",
  "reporter",
  "attachment",
];

/**
 * Jira adapter for server-side usage
 * Creates Jira issues from feedback payloads
 */
export class JiraAdapter {
  private jiraUrl: string;
  private email: string;
  private apiToken: string;
  private projectKey: string;
  private defaultIssueType: string;
  private issueTypeMapping: Record<string, string>;
  private defaultLabels: string[];
  private formatSummary: (payload: AnyclickPayload) => string;
  private formatDescription: (payload: AnyclickPayload) => AdfDocument;
  private customFields: Record<string, any>;
  private defaultFieldValues: Record<string, any>;

  constructor(options: JiraAdapterOptions) {
    // Validate and normalize Jira URL
    if (!options.jiraUrl.endsWith(".atlassian.net")) {
      throw new Error(
        `Invalid Jira URL: ${options.jiraUrl}. Must be a Jira Cloud URL (*.atlassian.net)`,
      );
    }

    this.jiraUrl = options.jiraUrl.replace(/\/$/, ""); // Remove trailing slash
    this.email = options.email;
    this.apiToken = options.apiToken;
    this.projectKey = options.projectKey;
    this.defaultIssueType = options.defaultIssueType ?? "Task";
    this.issueTypeMapping = options.issueTypeMapping ?? defaultIssueTypeMapping;
    this.defaultLabels = options.defaultLabels ?? [];
    this.formatSummary = options.formatSummary ?? defaultFormatSummary;
    this.formatDescription = options.formatDescription ??
      defaultFormatDescription;
    this.customFields = options.customFields ?? {};
    this.defaultFieldValues = options.defaultFieldValues ?? {};
  }

  /**
   * Get the full Jira URL for a given path
   */
  private getUrl(path: string): string {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${this.jiraUrl}/${cleanPath}`;
  }

  /**
   * Get authorization header value (Basic auth)
   */
  private getAuthHeader(): string {
    const credentials = `${this.email}:${this.apiToken}`;
    return `Basic ${Buffer.from(credentials).toString("base64")}`;
  }

  /**
   * Make a fetch request to Jira API with auth
   */
  private async fetchJira(
    path: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const url = this.getUrl(path);
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.getAuthHeader(),
        Accept: "application/json",
        ...options.headers,
      },
    });

    return response;
  }

  /**
   * Determine the issue type for a given feedback type
   */
  private getIssueType(feedbackType: string): string {
    return this.issueTypeMapping[feedbackType] ?? this.defaultIssueType;
  }

  /**
   * Upload a screenshot as an attachment to a Jira issue
   */
  private async uploadAttachment(
    issueKey: string,
    screenshot: { dataUrl: string; name: string },
  ): Promise<void> {
    // Extract base64 content from data URL
    const base64Match = screenshot.dataUrl.match(
      /^data:image\/(\w+);base64,(.+)$/,
    );
    if (!base64Match) {
      console.warn("Invalid screenshot data URL format, skipping attachment");
      return;
    }

    const [, extension, base64Content] = base64Match;
    const buffer = Buffer.from(base64Content, "base64");

    // Create form data for multipart upload
    const formData = new FormData();
    const blob = new Blob([buffer], { type: `image/${extension}` });
    formData.append("file", blob, `${screenshot.name}.${extension}`);

    const response = await this.fetchJira(
      `/rest/api/3/issue/${issueKey}/attachments`,
      {
        method: "POST",
        headers: {
          "X-Atlassian-Token": "no-check", // Required for attachments
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `Failed to upload attachment: ${response.status} ${response.statusText} - ${errorText}`,
      );
      // Don't throw - continue even if attachment upload fails
    }
  }

  /**
   * Upload all screenshots as attachments
   */
  private async uploadScreenshots(
    issueKey: string,
    screenshots: ScreenshotData,
  ): Promise<void> {
    const uploads: Promise<void>[] = [];

    if (screenshots.element) {
      uploads.push(
        this.uploadAttachment(issueKey, {
          dataUrl: screenshots.element.dataUrl,
          name: "element",
        }),
      );
    }

    if (screenshots.container) {
      uploads.push(
        this.uploadAttachment(issueKey, {
          dataUrl: screenshots.container.dataUrl,
          name: "container",
        }),
      );
    }

    if (screenshots.viewport) {
      uploads.push(
        this.uploadAttachment(issueKey, {
          dataUrl: screenshots.viewport.dataUrl,
          name: "viewport",
        }),
      );
    }

    // Upload all in parallel, but don't fail if some uploads fail
    await Promise.allSettled(uploads);
  }

  /**
   * Create a Jira issue from a feedback payload
   */
  async createIssue(payload: AnyclickPayload): Promise<JiraIssueResult> {
    console.log("\n========== JIRA CREATE ISSUE ==========");
    console.log("[JiraAdapter] Payload type:", payload.type);
    console.log(
      "[JiraAdapter] Payload comment:",
      payload.comment?.substring(0, 100),
    );

    const summary = this.formatSummary(payload);
    const description = this.formatDescription(payload);
    const issueType = this.getIssueType(payload.type);

    console.log("[JiraAdapter] Formatted summary:", summary);
    console.log("[JiraAdapter] Issue type:", issueType);
    console.log("[JiraAdapter] Project key:", this.projectKey);

    // Determine labels
    const typeLabel = feedbackTypeLabels[payload.type];
    const labels = [...this.defaultLabels];
    if (typeLabel && !labels.includes(typeLabel)) {
      labels.push(typeLabel);
    }

    // Extract custom fields from payload metadata
    // The JiraFeedbackMenu passes custom fields in payload.metadata
    const metadataFields = payload.metadata || {};
    console.log(
      "[JiraAdapter] Metadata fields from payload:",
      JSON.stringify(metadataFields, null, 2),
    );

    // Build issue fields - merge custom fields from metadata
    const fields: Record<string, any> = {
      project: { key: this.projectKey },
      summary: metadataFields.summary || summary, // Use summary from metadata if provided
      description,
      issuetype: { name: issueType },
      labels,
      ...this.customFields, // Default custom fields from adapter config
    };

    // Merge additional metadata fields (excluding summary which we already handled)
    for (const [key, value] of Object.entries(metadataFields)) {
      if (
        key !== "summary" && value !== undefined && value !== null &&
        value !== ""
      ) {
        fields[key] = value;
        console.log(
          `[JiraAdapter] Adding field ${key}:`,
          JSON.stringify(value),
          `(type: ${typeof value})`,
        );
      }
    }

    console.log("[JiraAdapter] Final fields being sent to Jira:");
    console.log(JSON.stringify(fields, null, 2));

    // Log each field's structure for debugging and validate
    console.log("[JiraAdapter] Field breakdown:");
    for (const [key, value] of Object.entries(fields)) {
      const valueType = typeof value;
      const isObject = valueType === "object" && value !== null;
      const objectKeys = isObject ? Object.keys(value) : [];
      console.log(
        `  - ${key}: type=${valueType}, isObject=${isObject}, keys=${
          objectKeys.join(",")
        }`,
      );

      // Check for common issues
      if (isObject && value.id !== undefined && typeof value.id !== "string") {
        console.warn(
          `[JiraAdapter] WARNING: Field ${key} has non-string id: ${typeof value
            .id}`,
        );
        // Auto-fix: convert to string
        fields[key] = { ...value, id: String(value.id) };
        console.log(
          `[JiraAdapter] Auto-fixed ${key}.id to string: "${fields[key].id}"`,
        );
      }
    }

    // Create the issue
    const response = await this.fetchJira("/rest/api/3/issue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("[JiraAdapter] API Error Response:", errorText);

      let diagnosticMessage = "";

      if (response.status === 400) {
        // Parse the error to provide better diagnostics
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.errors) {
            console.error(
              "[JiraAdapter] Field errors:",
              JSON.stringify(errorJson.errors, null, 2),
            );
            const missingFields = Object.entries(errorJson.errors)
              .map(([field, msg]) => `  - ${field}: ${msg}`)
              .join("\n");
            diagnosticMessage =
              `\nValidation failed. Missing/invalid fields:\n${missingFields}`;
          }
        } catch {
          // If we can't parse, use generic message
        }
        diagnosticMessage += `\n\nCheck that:
  - Project key '${this.projectKey}' exists
  - Issue type '${issueType}' is valid for this project
  - All required fields are provided
  
Fields that were sent:
${Object.keys(fields).map((k) => `  - ${k}`).join("\n")}`;
      } else if (response.status === 401) {
        diagnosticMessage =
          `\nAuthentication failed. Check that JIRA_EMAIL and JIRA_API_TOKEN are correct.`;
      } else if (response.status === 403) {
        diagnosticMessage =
          `\nPermission denied. The API token may not have permission to create issues in project '${this.projectKey}'.`;
      } else if (response.status === 404) {
        diagnosticMessage =
          `\nProject '${this.projectKey}' not found or not accessible.`;
      }

      throw new Error(
        `Jira API error: ${response.status} ${response.statusText} - ${errorText}${diagnosticMessage}`,
      );
    }

    const data = (await response.json()) as {
      id: string;
      key: string;
      self: string;
    };

    console.log("[JiraAdapter] Issue created successfully:", data.key);

    // Upload screenshots as attachments if present
    if (payload.screenshots) {
      try {
        await this.uploadScreenshots(data.key, payload.screenshots);
        console.log("[JiraAdapter] Screenshots uploaded for:", data.key);
      } catch (error) {
        console.error("[JiraAdapter] Failed to upload screenshots:", error);
        // Don't fail the entire operation if screenshots fail
      }
    }

    return {
      id: data.id,
      key: data.key,
      url: `${this.jiraUrl}/browse/${data.key}`,
    };
  }

  /**
   * Get available issue types for the project
   */
  async getIssueTypes(): Promise<
    Array<{ id: string; name: string; description?: string; iconUrl?: string }>
  > {
    const path = `/rest/api/3/issue/createmeta/${this.projectKey}/issuetypes`;
    const response = await this.fetchJira(path);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Failed to fetch issue types: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      issueTypes?: any[];
      values?: any[];
    };
    const issueTypes = data.issueTypes || data.values || [];

    return issueTypes.map((it: any) => ({
      id: it.id,
      name: it.name,
      description: it.description,
      iconUrl: it.iconUrl,
    }));
  }

  /**
   * Get required fields for a specific issue type
   */
  async getCreateFieldsForIssueType(
    issueTypeName: string,
  ): Promise<Record<string, JiraFieldMeta>> {
    console.log("\n========== JIRA GET FIELDS ==========");
    console.log("[JiraAdapter] Getting fields for issue type:", issueTypeName);
    console.log("[JiraAdapter] Project:", this.projectKey);

    // Use the newer endpoint that's not deprecated
    const path = `/rest/api/3/issue/createmeta/${this.projectKey}/issuetypes`;
    const response = await this.fetchJira(path);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Failed to fetch create metadata: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      issueTypes?: any[];
      values?: any[];
    };
    const issueTypes = data.issueTypes || data.values || [];
    console.log(
      "[JiraAdapter] Available issue types:",
      issueTypes.map((it: any) => it.name),
    );

    const issueType = issueTypes.find(
      (it: any) => it.name.toLowerCase() === issueTypeName.toLowerCase(),
    );

    if (!issueType) {
      throw new Error(
        `Issue type '${issueTypeName}' not found in project ${this.projectKey}`,
      );
    }

    console.log("[JiraAdapter] Found issue type ID:", issueType.id);

    // Now fetch the fields for this issue type
    const fieldsPath =
      `/rest/api/3/issue/createmeta/${this.projectKey}/issuetypes/${issueType.id}`;
    const fieldsResponse = await this.fetchJira(fieldsPath);

    if (!fieldsResponse.ok) {
      const errorText = await fieldsResponse.text().catch(() =>
        "Unknown error"
      );
      throw new Error(
        `Failed to fetch fields for issue type: ${fieldsResponse.status} ${fieldsResponse.statusText} - ${errorText}`,
      );
    }

    const fieldsData = (await fieldsResponse.json()) as {
      fields?: any[];
      values?: any[];
    };
    const fields = fieldsData.fields || fieldsData.values || [];

    console.log("[JiraAdapter] Raw fields count:", fields.length);
    console.log(
      "[JiraAdapter] Required fields from API:",
      fields.filter((f: any) => f.required).map((f: any) => ({
        key: f.fieldId || f.key,
        name: f.name,
        type: f.schema?.type,
        hasAllowedValues: !!f.allowedValues?.length,
      })),
    );

    // Convert array to record
    const fieldRecord: Record<string, JiraFieldMeta> = {};
    for (const field of fields) {
      fieldRecord[field.fieldId || field.key] = {
        required: field.required || false,
        name: field.name,
        key: field.fieldId || field.key,
        schema: field.schema || {},
        allowedValues: field.allowedValues,
        hasDefaultValue: field.hasDefaultValue,
        defaultValue: field.defaultValue,
        autoCompleteUrl: field.autoCompleteUrl,
      };
    }

    return fieldRecord;
  }

  /**
   * Normalize field metadata for client-side rendering
   * Converts Jira's complex field schema to a simpler format for UI
   */
  normalizeFieldsForClient(
    fields: Record<string, JiraFieldMeta>,
    options?: {
      includeOptional?: boolean;
      skipFields?: string[];
    },
  ): NormalizedJiraField[] {
    const { includeOptional = false, skipFields = SKIP_FIELDS } = options || {};
    const normalized: NormalizedJiraField[] = [];
    const skippedFields: string[] = [];
    const optionalSkipped: string[] = [];

    console.log("\n========== NORMALIZING FIELDS ==========");
    console.log(
      "[JiraAdapter] Total fields to process:",
      Object.keys(fields).length,
    );
    console.log("[JiraAdapter] Include optional:", includeOptional);

    for (const [fieldKey, meta] of Object.entries(fields)) {
      // Skip fields we handle separately
      if (
        skipFields.includes(fieldKey) ||
        skipFields.includes(meta.name?.toLowerCase())
      ) {
        skippedFields.push(`${fieldKey} (${meta.name})`);
        continue;
      }

      // Skip optional fields unless requested
      if (!meta.required && !includeOptional) {
        optionalSkipped.push(`${fieldKey} (${meta.name})`);
        continue;
      }

      const field = this.normalizeField(fieldKey, meta);
      if (field) {
        normalized.push(field);
      }
    }

    console.log("[JiraAdapter] Skipped (built-in):", skippedFields);
    console.log(
      "[JiraAdapter] Skipped (optional):",
      optionalSkipped.length,
      "fields",
    );
    console.log(
      "[JiraAdapter] Normalized fields:",
      normalized.map((f) => ({
        key: f.key,
        name: f.name,
        required: f.required,
        type: f.type,
        hasOptions: !!f.options?.length,
      })),
    );

    // Sort: required fields first, then alphabetically
    return normalized.sort((a, b) => {
      if (a.required !== b.required) return a.required ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Normalize a single field
   */
  private normalizeField(
    fieldKey: string,
    meta: JiraFieldMeta,
  ): NormalizedJiraField | null {
    const schemaType = meta.schema?.type || "string";
    const customType = meta.schema?.custom;

    // Determine field type based on schema
    let fieldType: NormalizedJiraField["type"] = "text";
    let options: NormalizedJiraField["options"];

    // Check for allowed values (select/dropdown fields)
    if (meta.allowedValues && meta.allowedValues.length > 0) {
      const isMulti = schemaType === "array";
      fieldType = isMulti ? "multiselect" : "select";
      // IMPORTANT: Ensure all IDs are strings for Jira API compatibility
      options = meta.allowedValues.map((av) => ({
        id: String(av.id),
        value: String(av.value || av.name || av.id),
        label: String(av.name || av.value || av.id),
      }));

      console.log(
        `[JiraAdapter] Field ${fieldKey} options (first 3):`,
        options.slice(0, 3),
      );
    } else {
      // Determine type from schema
      switch (schemaType) {
        case "string":
          // Check for custom field types that should be textarea
          if (
            customType?.includes("textarea") ||
            meta.name?.toLowerCase().includes("description") ||
            fieldKey.toLowerCase().includes("description")
          ) {
            fieldType = "textarea";
          } else {
            fieldType = "text";
          }
          break;
        case "number":
          fieldType = "number";
          break;
        case "array":
          // Array without allowed values - likely labels or similar
          fieldType = "array";
          break;
        case "user":
          fieldType = "user";
          break;
        case "date":
          fieldType = "date";
          break;
        case "datetime":
          fieldType = "datetime";
          break;
        case "boolean":
          fieldType = "boolean";
          break;
        default:
          fieldType = "text";
      }
    }

    // Get default value - check our defaults first, then Jira's
    let defaultValue = this.defaultFieldValues[fieldKey];
    if (defaultValue === undefined && meta.hasDefaultValue) {
      defaultValue = meta.defaultValue;
    }

    // Auto-select if there's only one option
    if (options?.length === 1 && defaultValue === undefined) {
      defaultValue = String(options[0].id);
      console.log(
        `[JiraAdapter] Auto-selecting single option for ${fieldKey}:`,
        defaultValue,
      );
    }

    return {
      id: fieldKey,
      key: fieldKey,
      name: meta.name,
      required: meta.required,
      type: fieldType,
      options,
      placeholder: `Enter ${meta.name.toLowerCase()}`,
      description: undefined,
      defaultValue,
      autoCompleteUrl: meta.autoCompleteUrl,
      schema: meta.schema,
    };
  }

  /**
   * Get normalized fields ready for client-side form rendering
   */
  async getFieldsForForm(
    issueTypeName: string,
    options?: { includeOptional?: boolean },
  ): Promise<{
    issueType: string;
    fields: NormalizedJiraField[];
    projectKey: string;
  }> {
    const fields = await this.getCreateFieldsForIssueType(issueTypeName);
    const normalized = this.normalizeFieldsForClient(fields, options);

    return {
      issueType: issueTypeName,
      fields: normalized,
      projectKey: this.projectKey,
    };
  }

  /**
   * Search for autocomplete values (e.g., teams, users, epics)
   * Handles different field types with appropriate Jira APIs
   */
  async searchFieldValues(
    fieldName: string,
    query: string,
    fieldKey?: string,
  ): Promise<Array<{ id: string; name: string; value?: string }>> {
    const lowerName = fieldName.toLowerCase();

    // Handle Epic Link fields - search for Epic issues
    if (
      lowerName.includes("epic") ||
      fieldKey?.toLowerCase().includes("epic")
    ) {
      return this.searchEpics(query);
    }

    // Handle Team fields - use team/group picker
    if (lowerName === "team" || lowerName.includes("team")) {
      return this.searchTeams(query);
    }

    // Handle User fields
    if (lowerName.includes("assignee") || lowerName.includes("reporter")) {
      return this.searchUsers(query);
    }

    // Default: use JQL autocomplete suggestions
    const path = `/rest/api/3/jql/autocompletedata/suggestions?fieldName=${
      encodeURIComponent(fieldName)
    }&fieldValue=${encodeURIComponent(query)}`;

    const response = await this.fetchJira(path);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `Failed to search field values: ${response.status} - ${errorText}`,
      );
      return [];
    }

    const data = (await response.json()) as { results?: any[] };
    const results = data.results || [];

    return results.map((r: any) => ({
      id: String(r.value || r.id || r.displayName || ""),
      name: String(r.displayName || r.text || r.value || ""),
      value: r.value,
    }));
  }

  /**
   * Search for Epic issues in the project
   */
  async searchEpics(
    query: string,
  ): Promise<Array<{ id: string; name: string; value?: string }>> {
    // Build JQL to find epics in the project
    let jql = `project = "${this.projectKey}" AND issuetype = Epic`;
    if (query.trim()) {
      // Search by summary or key
      jql += ` AND (summary ~ "${query}*" OR key = "${query.toUpperCase()}")`;
    }
    jql += " ORDER BY updated DESC";

    const path = `/rest/api/3/search?jql=${
      encodeURIComponent(jql)
    }&maxResults=20&fields=summary,key`;

    console.log("[JiraAdapter] Searching epics with JQL:", jql);

    const response = await this.fetchJira(path);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `Failed to search epics: ${response.status} - ${errorText}`,
      );
      return [];
    }

    const data = (await response.json()) as {
      issues?: Array<{
        id: string;
        key: string;
        fields?: { summary?: string };
      }>;
    };
    const issues = data.issues || [];

    console.log("[JiraAdapter] Found epics:", issues.length);

    return issues.map((issue) => ({
      id: issue.key, // Epic Link uses issue key, not id
      name: `${issue.key}: ${issue.fields?.summary || "Untitled"}`,
      value: issue.key,
    }));
  }

  /**
   * Search for Teams using the groups/picker or team API
   */
  async searchTeams(
    query: string,
  ): Promise<Array<{ id: string; name: string; value?: string }>> {
    // First try the groups picker API
    const groupsPath = `/rest/api/3/groups/picker?query=${
      encodeURIComponent(query)
    }&maxResults=20`;

    console.log("[JiraAdapter] Searching teams/groups with query:", query);

    const groupsResponse = await this.fetchJira(groupsPath);

    if (groupsResponse.ok) {
      const data = (await groupsResponse.json()) as {
        groups?: Array<{ name: string; groupId?: string }>;
      };
      const groups = data.groups || [];

      if (groups.length > 0) {
        console.log("[JiraAdapter] Found groups:", groups.length);
        return groups.map((g) => ({
          id: g.groupId || g.name,
          name: g.name,
          value: g.groupId || g.name,
        }));
      }
    }

    // If groups picker doesn't work, try the team API (for Jira Software teams)
    // This might be available in newer Jira Cloud instances
    const teamsPath = `/rest/api/3/team?query=${
      encodeURIComponent(query)
    }&maxResults=20`;

    const teamsResponse = await this.fetchJira(teamsPath);

    if (teamsResponse.ok) {
      const data = (await teamsResponse.json()) as {
        values?: Array<{ id: string; name: string }>;
        teams?: Array<{ id: string; name: string }>;
      };
      const teams = data.values || data.teams || [];

      if (teams.length > 0) {
        console.log("[JiraAdapter] Found teams:", teams.length);
        return teams.map((t) => ({
          id: String(t.id),
          name: t.name,
          value: String(t.id),
        }));
      }
    }

    // Last resort: try the JQL autocomplete with "Team" field
    console.log("[JiraAdapter] Falling back to JQL autocomplete for Team");
    const jqlPath =
      `/rest/api/3/jql/autocompletedata/suggestions?fieldName=Team&fieldValue=${
        encodeURIComponent(query)
      }`;

    const jqlResponse = await this.fetchJira(jqlPath);

    if (!jqlResponse.ok) {
      console.error(
        `[JiraAdapter] Failed to search teams: ${jqlResponse.status}`,
      );
      return [];
    }

    const jqlData = (await jqlResponse.json()) as { results?: any[] };
    const results = jqlData.results || [];

    return results.map((r: any) => ({
      id: String(r.value || r.id || r.displayName || ""),
      name: String(r.displayName || r.text || r.value || ""),
      value: r.value,
    }));
  }

  /**
   * Search for users (for assignee, reporter, etc.)
   */
  async searchUsers(
    query: string,
  ): Promise<Array<{ id: string; name: string; value?: string }>> {
    const path = `/rest/api/3/user/search?query=${
      encodeURIComponent(query)
    }&maxResults=20`;

    const response = await this.fetchJira(path);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `Failed to search users: ${response.status} - ${errorText}`,
      );
      return [];
    }

    const users = (await response.json()) as Array<{
      accountId: string;
      displayName?: string;
      emailAddress?: string;
    }>;

    return users.map((u) => ({
      id: u.accountId,
      name: u.displayName || u.emailAddress || u.accountId,
      value: u.accountId,
    }));
  }

  /**
   * Format field value for Jira API submission based on field type
   */
  formatFieldValue(
    field: NormalizedJiraField,
    value: any,
  ): any {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    switch (field.type) {
      case "select":
        // Select fields usually need { id: ... } or { value: ... } or { name: ... }
        if (typeof value === "string") {
          // Check if it's an ID in our options
          const option = field.options?.find((o) =>
            o.id === value || o.value === value
          );
          if (option) {
            return { id: option.id };
          }
          // Try as ID directly
          return { id: value };
        }
        return value;

      case "multiselect":
        if (Array.isArray(value)) {
          return value.map((v) => {
            if (typeof v === "string") {
              const option = field.options?.find((o) =>
                o.id === v || o.value === v
              );
              return option ? { id: option.id } : { id: v };
            }
            return v;
          });
        }
        return value;

      case "user":
        if (typeof value === "string") {
          return { accountId: value };
        }
        return value;

      case "number":
        return typeof value === "string" ? parseFloat(value) : value;

      case "boolean":
        return typeof value === "string" ? value === "true" : Boolean(value);

      case "array":
        // Labels and similar - just return as array
        return Array.isArray(value) ? value : [value];

      default:
        return value;
    }
  }

  /**
   * Validate that the adapter is configured correctly
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      // Test authentication by fetching current user
      const response = await this.fetchJira("/rest/api/3/myself");

      if (!response.ok) {
        console.error(
          `Jira authentication failed: ${response.status} ${response.statusText}`,
        );
        return false;
      }

      // Test project access
      const projectResponse = await this.fetchJira(
        `/rest/api/3/project/${this.projectKey}`,
      );

      if (!projectResponse.ok) {
        console.error(
          `Project '${this.projectKey}' not accessible: ${projectResponse.status} ${projectResponse.statusText}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Jira configuration validation failed:", error);
      return false;
    }
  }
}

/**
 * Create a Jira adapter instance
 */
export function createJiraAdapter(
  options: JiraAdapterOptions,
): JiraAdapter {
  return new JiraAdapter(options);
}
