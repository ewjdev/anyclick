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
      return this.searchTeams(query, fieldKey);
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
   * Uses multiple strategies to find epics
   */
  async searchEpics(
    query: string,
  ): Promise<Array<{ id: string; name: string; value?: string }>> {
    const trimmedQuery = query.trim();
    console.log(`[JiraAdapter] Searching epics with query: "${trimmedQuery}"`);

    // Strategy 1: Use issue picker API (most reliable for linking)
    const pickerResults = await this.searchEpicsWithPicker(trimmedQuery);
    if (pickerResults.length > 0) {
      return pickerResults;
    }

    // Strategy 2: Direct JQL search with multiple approaches
    const jqlResults = await this.searchEpicsWithJQL(trimmedQuery);
    if (jqlResults.length > 0) {
      return jqlResults;
    }

    // Strategy 3: If query looks like a key, try direct issue fetch
    if (trimmedQuery && /^[A-Z]+-\d+$/i.test(trimmedQuery)) {
      const directResult = await this.getIssueByKey(trimmedQuery.toUpperCase());
      if (directResult) {
        return [directResult];
      }
    }

    console.log("[JiraAdapter] No epics found with any strategy");
    return [];
  }

  /**
   * Search for epics using the issue picker API
   */
  private async searchEpicsWithPicker(
    query: string,
  ): Promise<Array<{ id: string; name: string; value?: string }>> {
    // The issue picker is designed for finding issues to link
    const params = new URLSearchParams({
      currentProjectId: this.projectKey,
      showSubTasks: "false",
      showSubTaskParent: "false",
    });

    if (query) {
      params.set("query", query);
    }

    // Add current JQL to filter to epics in this project
    params.set(
      "currentJQL",
      `project = "${this.projectKey}" AND issuetype = Epic ORDER BY updated DESC`,
    );

    const path = `/rest/api/3/issue/picker?${params.toString()}`;
    console.log("[JiraAdapter] Searching epics with picker API");

    const response = await this.fetchJira(path);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `[JiraAdapter] Issue picker failed: ${response.status} - ${errorText}`,
      );
      return [];
    }

    const data = (await response.json()) as {
      sections?: Array<{
        id: string;
        label: string;
        issues?: Array<{
          key: string;
          keyHtml?: string;
          summary?: string;
          summaryText?: string;
        }>;
      }>;
    };

    const allIssues: Array<{ id: string; name: string; value?: string }> = [];

    // Collect issues from all sections
    for (const section of data.sections || []) {
      for (const issue of section.issues || []) {
        const summary = issue.summaryText || issue.summary || "Untitled";
        allIssues.push({
          id: issue.key,
          name: `${issue.key}: ${summary}`,
          value: issue.key,
        });
      }
    }

    console.log(`[JiraAdapter] Picker found ${allIssues.length} issues`);
    return allIssues;
  }

  /**
   * Search for epics using JQL
   */
  private async searchEpicsWithJQL(
    query: string,
  ): Promise<Array<{ id: string; name: string; value?: string }>> {
    // Try different JQL queries
    const queries: string[] = [];

    // Base query for epics in this project
    const baseJQL = `project = "${this.projectKey}" AND issuetype = Epic`;

    if (query) {
      // Check if it's an issue key pattern
      const isFullKey = /^[A-Z]+-\d+$/i.test(query);
      const isPartialKey = /^\d+$/.test(query);
      const hasProjectPrefix = query.toUpperCase().startsWith(this.projectKey);

      if (isFullKey) {
        // Search by exact key
        queries.push(`key = "${query.toUpperCase()}"`);
        // Also search in project epics that match this key
        queries.push(`${baseJQL} AND key = "${query.toUpperCase()}"`);
      } else if (isPartialKey) {
        // Search by key number
        queries.push(`key = "${this.projectKey}-${query}"`);
      } else if (hasProjectPrefix) {
        // Might be a partial key like "CP-101"
        queries.push(`key ~ "${query.toUpperCase()}*"`);
        queries.push(`${baseJQL} AND key ~ "${query.toUpperCase()}*"`);
      }

      // Text search in summary (works for all cases)
      queries.push(`${baseJQL} AND summary ~ "${query}" ORDER BY updated DESC`);
      // Broader text search
      queries.push(`${baseJQL} AND text ~ "${query}" ORDER BY updated DESC`);
    } else {
      // No query - just get recent epics
      queries.push(`${baseJQL} ORDER BY updated DESC`);
    }

    // Try each query until we get results
    for (const jql of queries) {
      console.log(`[JiraAdapter] Trying JQL: ${jql}`);

      const path = `/rest/api/3/search?jql=${
        encodeURIComponent(jql)
      }&maxResults=20&fields=summary,key,issuetype`;

      const response = await this.fetchJira(path);

      if (response.ok) {
        const data = (await response.json()) as {
          issues?: Array<{
            id: string;
            key: string;
            fields?: { summary?: string; issuetype?: { name: string } };
          }>;
        };
        const issues = data.issues || [];

        if (issues.length > 0) {
          console.log(`[JiraAdapter] JQL found ${issues.length} issues`);
          return issues.map((issue) => ({
            id: issue.key,
            name: `${issue.key}: ${issue.fields?.summary || "Untitled"}`,
            value: issue.key,
          }));
        }
      } else {
        const errorText = await response.text().catch(() => "");
        console.log(
          `[JiraAdapter] JQL query failed: ${response.status} - ${
            errorText.substring(0, 100)
          }`,
        );
      }
    }

    return [];
  }

  /**
   * Get a single issue by key
   */
  private async getIssueByKey(
    key: string,
  ): Promise<{ id: string; name: string; value?: string } | null> {
    console.log(`[JiraAdapter] Fetching issue by key: ${key}`);

    const path = `/rest/api/3/issue/${key}?fields=summary,issuetype`;
    const response = await this.fetchJira(path);

    if (!response.ok) {
      console.log(`[JiraAdapter] Issue ${key} not found`);
      return null;
    }

    const data = (await response.json()) as {
      key: string;
      fields?: { summary?: string; issuetype?: { name: string } };
    };

    console.log(`[JiraAdapter] Found issue: ${data.key}`);
    return {
      id: data.key,
      name: `${data.key}: ${data.fields?.summary || "Untitled"}`,
      value: data.key,
    };
  }

  /**
   * Search for Teams using various Jira APIs
   * Teams in Jira can be: custom select fields, groups, or Atlassian Teams
   */
  async searchTeams(
    query: string,
    fieldKey?: string,
  ): Promise<Array<{ id: string; name: string; value?: string }>> {
    console.log(
      `[JiraAdapter] Searching teams with query: "${query}", fieldKey: ${fieldKey}`,
    );

    // If we have a field key, try to get options from the field's allowed values
    if (fieldKey) {
      const fieldOptions = await this.getFieldAllowedValues(fieldKey, query);
      if (fieldOptions.length > 0) {
        console.log(
          "[JiraAdapter] Found team options from field:",
          fieldOptions.length,
        );
        return fieldOptions;
      }
    }

    // Try JQL autocomplete with "Team" field name
    const jqlPath =
      `/rest/api/3/jql/autocompletedata/suggestions?fieldName=Team&fieldValue=${
        encodeURIComponent(query || "")
      }`;

    console.log("[JiraAdapter] Trying JQL autocomplete for Team");
    const jqlResponse = await this.fetchJira(jqlPath);

    if (jqlResponse.ok) {
      const jqlData = (await jqlResponse.json()) as { results?: any[] };
      const results = jqlData.results || [];

      if (results.length > 0) {
        console.log(
          "[JiraAdapter] Found teams from JQL autocomplete:",
          results.length,
        );
        return results.map((r: any) => ({
          id: String(r.value || r.id || r.displayName || ""),
          name: String(r.displayName || r.text || r.value || ""),
          value: r.value,
        }));
      }
    }

    // Try the groups picker API as fallback
    const groupsPath = `/rest/api/3/groups/picker?query=${
      encodeURIComponent(query || "")
    }&maxResults=20`;

    console.log("[JiraAdapter] Trying groups picker");
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

    console.log("[JiraAdapter] No team results found");
    return [];
  }

  /**
   * Get allowed values for a field by querying the create metadata
   * This works for custom select fields like Team
   */
  async getFieldAllowedValues(
    fieldKey: string,
    query?: string,
  ): Promise<Array<{ id: string; name: string; value?: string }>> {
    try {
      // First, try to get the field's autocomplete URL from the create meta
      // We need to find which issue type has this field to get the autocomplete URL
      const issueTypesPath =
        `/rest/api/3/issue/createmeta/${this.projectKey}/issuetypes`;
      const issueTypesResponse = await this.fetchJira(issueTypesPath);

      if (!issueTypesResponse.ok) {
        console.error(
          "[JiraAdapter] Failed to get issue types for field values",
        );
        return [];
      }

      const issueTypesData = (await issueTypesResponse.json()) as {
        values?: Array<{ id: string; name: string }>;
      };
      const issueTypes = issueTypesData.values || [];

      // Try the first issue type to get field metadata
      if (issueTypes.length > 0) {
        const fieldsPath =
          `/rest/api/3/issue/createmeta/${this.projectKey}/issuetypes/${
            issueTypes[0].id
          }`;
        const fieldsResponse = await this.fetchJira(fieldsPath);

        if (fieldsResponse.ok) {
          const fieldsData = (await fieldsResponse.json()) as {
            values?: Array<{
              fieldId: string;
              allowedValues?: Array<
                { id: string; value?: string; name?: string }
              >;
              autoCompleteUrl?: string;
            }>;
          };
          const fields = fieldsData.values || [];

          // Find our field
          const field = fields.find((f) => f.fieldId === fieldKey);

          if (field?.allowedValues && field.allowedValues.length > 0) {
            console.log(
              `[JiraAdapter] Found ${field.allowedValues.length} allowed values for ${fieldKey}`,
            );
            // Filter by query if provided
            let values = field.allowedValues;
            if (query) {
              const lowerQuery = query.toLowerCase();
              values = values.filter(
                (v) =>
                  v.name?.toLowerCase().includes(lowerQuery) ||
                  v.value?.toLowerCase().includes(lowerQuery),
              );
            }
            return values.map((v) => ({
              id: String(v.id),
              name: v.name || v.value || String(v.id),
              value: String(v.id),
            }));
          }

          // If field has autoCompleteUrl, use it
          if (field?.autoCompleteUrl) {
            console.log(
              `[JiraAdapter] Using autocomplete URL for ${fieldKey}:`,
              field.autoCompleteUrl,
            );
            return this.searchWithAutocompleteUrl(
              field.autoCompleteUrl,
              query || "",
            );
          }
        }
      }
    } catch (error) {
      console.error("[JiraAdapter] Error getting field allowed values:", error);
    }

    return [];
  }

  /**
   * Search using a field's autocomplete URL
   */
  async searchWithAutocompleteUrl(
    autoCompleteUrl: string,
    query: string,
  ): Promise<Array<{ id: string; name: string; value?: string }>> {
    // The autoCompleteUrl might be a full URL or a path
    // It might have a placeholder for the query
    let url = autoCompleteUrl;
    if (url.includes("{query}")) {
      url = url.replace("{query}", encodeURIComponent(query));
    } else if (url.includes("?")) {
      url += `&query=${encodeURIComponent(query)}`;
    } else {
      url += `?query=${encodeURIComponent(query)}`;
    }

    // Ensure it's a path, not a full URL
    if (url.startsWith("http")) {
      const urlObj = new URL(url);
      url = urlObj.pathname + urlObj.search;
    }

    console.log("[JiraAdapter] Searching with autocomplete URL:", url);

    const response = await this.fetchJira(url);

    if (!response.ok) {
      console.error(
        `[JiraAdapter] Autocomplete URL search failed: ${response.status}`,
      );
      return [];
    }

    const data = (await response.json()) as any;

    // Handle various response formats
    const results = data.results || data.values || data.suggestions || data ||
      [];

    if (Array.isArray(results)) {
      return results.map((r: any) => ({
        id: String(r.id || r.value || r.key || ""),
        name: String(
          r.displayName || r.name || r.label || r.text || r.value || "",
        ),
        value: String(r.id || r.value || r.key || ""),
      }));
    }

    return [];
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
