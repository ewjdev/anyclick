import fs from "fs-extra";
import JiraClient from "jira-client";
import path from "node:path";
import open from "open";
import prompts from "prompts";
import { mergeConfigWithState, readConfig } from "../config/sharedConfig.js";
import { getRepoRoot } from "../source/repo.js";
import { delay } from "../utils/delay.js";
import { saveEnvToDotenvFile } from "../utils/env.js";
import { log } from "../utils/log.js";
import { customFieldIds } from "./cmd.js";

import {
  CreateIssueInteractiveOptions,
  FieldMeta,
  IssueLite,
  JiraAddCommentBody,
  JiraEnv,
  JiraIssueDescription,
  JiraIssueDescriptionContent,
  JiraIssueObjectForCPProjects,
  TeamSuggestion,
  ValidationResult,
} from "./types.js";
import { getJiraFetchOptions, getJiraUrl } from "./utils.js";

export const DEFAULT_JIRA_URL = "https://kareodev.atlassian.net";

export function getJiraUrlFromHost(host: string) {
  return `https://${host}.atlassian.net`;
}

export function getHostFromJiraUrl(url: string) {
  return url.replace(/^https?:\/\/(.*)\.atlassian\.net$/i, "$1");
}

const TOKEN_URL = "https://id.atlassian.com/manage-profile/security/api-tokens";

export async function resolveJiraEnv(
  overrides?: Partial<JiraEnv>
): Promise<JiraEnv | undefined> {
  const envJiraUrl = overrides?.jiraUrl || process.env.JIRA_URL;
  const email =
    overrides?.email || process.env.JIRA_EMAIL || process.env.JIRA_USER_EMAIL;
  const apiToken =
    overrides?.apiToken || process.env.JIRA_API_TOKEN || process.env.JIRA_TOKEN;

  // Load defaults from config file
  let defaultProject = overrides?.defaultProject;
  let defaultEpic = overrides?.defaultEpic;
  let defaultTeam = overrides?.defaultTeam;

  if (!defaultProject || !defaultEpic || !defaultTeam) {
    try {
      const { data: config } = await readConfig();
      if (!defaultProject) defaultProject = config.jiraDefaults?.defaultProject;
      if (!defaultEpic) defaultEpic = config.jiraDefaults?.defaultEpic;
      if (!defaultTeam) defaultTeam = config.jiraDefaults?.defaultTeam;
    } catch {
      // If config can't be loaded, continue without defaults
      log.error("Failed to load config. Continuing without defaults.");
      process.exit(1);
    }
  }

  if (envJiraUrl && email && apiToken) {
    return {
      jiraUrl: envJiraUrl,
      email,
      apiToken,
      defaultProject,
      defaultEpic,
      defaultTeam,
    };
  }
  return undefined;
}

export async function promptForJiraEnv(
  defaults?: Partial<JiraEnv>,
  validate: boolean = true
): Promise<JiraEnv> {
  log.info("We need your Jira credentials to proceed.");
  // Load defaults from config
  let configDefaults: {
    defaultProject?: string;
    defaultEpic?: string;
    defaultTeam?: string;
  } = {};
  try {
    const { data: config } = await readConfig();
    configDefaults = config.jiraDefaults || {};
  } catch {
    // If config can't be loaded, continue without defaults
    log.error("Failed to load config. Continuing without defaults.");
  }

  const initialJiraUrl =
    defaults?.jiraUrl || process.env.JIRA_URL || DEFAULT_JIRA_URL;
  const answers = await prompts(
    [
      {
        type: "text",
        name: "jiraUrl",
        message: `Jira host (full URL, e.g. ${DEFAULT_JIRA_URL})`,
        initial: initialJiraUrl,
        validate: (v: string) =>
          v && /^https?:\/\//i.test(v) ? true : "Enter a full https URL",
      },
      {
        type: "text",
        name: "email",
        message: "Jira email",
        initial:
          defaults?.email ||
          process.env.JIRA_EMAIL ||
          process.env.JIRA_USER_EMAIL ||
          "",
        validate: (v: string) =>
          v && v.includes("@") ? true : "Enter a valid email",
      },
      {
        type: "text",
        name: "defaultProject",
        message: "Default Project (optional, e.g. CP, CLIN)",
        initial:
          defaults?.defaultProject || configDefaults.defaultProject || "",
      },
      {
        type: "text",
        name: "defaultEpic",
        message: "Default Epic (optional, e.g. ABC-123)",
        initial: defaults?.defaultEpic || configDefaults.defaultEpic || "",
      },
      {
        type: "text",
        name: "defaultTeam",
        message: "Default Team (optional, used to search for team in Jira)",
        initial: defaults?.defaultTeam || configDefaults.defaultTeam || "",
      },
    ],
    {
      onCancel: () => {
        log.error("Jira setup cancelled");
        process.exit(1);
      },
    }
  );

  log.info("If you don't have an API token, create one here:");
  await delay(1000);
  await open(TOKEN_URL);
  const { apiToken } = await prompts([
    {
      type: "password",
      name: "apiToken",
      message: "Jira API token",
      hint: "Copy your API token from the browser window",
      initial: defaults?.apiToken || process.env.JIRA_API_TOKEN || "",
      validate: (v: string) => (v && v.length > 0 ? true : "Token is required"),
    },
  ]);
  const { jiraUrl, email, defaultProject, defaultEpic, defaultTeam } =
    answers || {};

  const config: JiraEnv = {
    jiraUrl,
    email,
    apiToken,
    defaultProject: defaultProject || undefined,
    defaultEpic: defaultEpic || undefined,
    defaultTeam: defaultTeam || undefined,
  } as JiraEnv;

  if (validate) {
    try {
      const client = await createJiraClient(config);
      const me = await client.getCurrentUser();
      log.success(`✓ Authenticated as ${me.displayName || me.accountId}`);
    } catch (err) {
      log.error("✗ Failed to authenticate with provided credentials");
      log.debug(`err: ${JSON.stringify(err, null, 2)}`);
      process.exit(1);
    }
  }
  return config;
}

export async function createJiraClient(env?: JiraEnv) {
  const resolved = env || (await resolveJiraEnv());
  if (!resolved) {
    log.debug(`creating Jira client with env: ${JSON.stringify(env, null, 2)}`);
    throw new Error("Jira environment not configured");
  }
  let client: JiraClient;
  let clientConfig;
  try {
    log.debug(`resolved.jiraUrl: ${resolved.jiraUrl}`);
    const host = resolved.jiraUrl.replace(/^https?:\/\//i, "");
    if (!host.endsWith(".atlassian.net")) {
      throw new Error(`Invalid Jira URL: ${host}`);
    }
    clientConfig = {
      protocol: "https",
      host,
      username: resolved.email,
      password: resolved.apiToken,
      apiVersion: "3",
      strictSSL: true,
    };
    client = new JiraClient(clientConfig);
  } catch (err) {
    log.debug(`clientConfig: ${JSON.stringify(clientConfig, null, 2)}`);
    log.error(`Failed to create Jira client: ${JSON.stringify(err, null, 2)}`);
  }
  return client;
}

// Fetch full issue details (fields commonly needed by validators)
export async function fetchIssueDetails(issueKey: string, env?: JiraEnv) {
  const client = await createJiraClient(env);
  // jira-client findIssue returns full fields; filtering by fields is optional
  const issue = await (client as any).findIssue(issueKey);
  return issue as any;
}

function getPlanTextFromDescription(description: JiraIssueDescription): string {
  log.debug(`description: ${JSON.stringify(description, null, 2)}`);
  function getTextFromContent(content: JiraIssueDescriptionContent[]): string {
    return content
      .map((c) => {
        if (c.type !== "text" && c.content) {
          return getTextFromContent(c.content);
        }
        return c.text;
      })
      .join("\n");
  }
  return getTextFromContent(description.content);
}

// Detect if the issue description already contains an "Acceptance Criteria" section
export function issueHasAcceptanceSection(
  planTextDescription: string | JiraIssueDescription
): boolean {
  if (typeof planTextDescription !== "string") {
    planTextDescription = getPlanTextFromDescription(planTextDescription);
  }
  try {
    if (!planTextDescription) return false;
    // Plain text fallback
    if (typeof planTextDescription === "string") {
      return /\bacceptance\s+criteria\b/i.test(planTextDescription);
    }
  } catch (e) {
    log.error(`Error checking acceptance criteria: ${planTextDescription}`);
    log.error(e);
  }
  return false;
}

function makeHeadingNode(text: string, level: number = 2) {
  return {
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  };
}

function makeBulletList(items: string[]) {
  return {
    type: "bulletList",
    content: items.map((t) => ({
      type: "listItem",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: t }],
        },
      ],
    })),
  };
}

// Append an Acceptance Criteria section to Description (ADF). Creates ADF if missing
export async function appendAcceptanceCriteriaToDescription(
  issueKey: string,
  acItems: string[],
  env?: JiraEnv
) {
  if (!acItems || acItems.length === 0) return;
  const client = await createJiraClient(env);
  const issue = await (client as any).findIssue(issueKey);
  const existing = issue?.fields?.description;
  if (issueHasAcceptanceSection(existing)) return; // do not duplicate

  const baseDoc =
    existing && typeof existing === "object" && Array.isArray(existing?.content)
      ? existing
      : {
          type: "doc",
          version: 1,
          content:
            existing && typeof existing === "string" && existing.trim()
              ? [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: String(existing) }],
                  },
                ]
              : [],
        };

  const newContent = [...(baseDoc.content || [])];
  newContent.push(makeHeadingNode("Acceptance Criteria", 2));
  newContent.push(makeBulletList(acItems));

  const updated = { ...baseDoc, content: newContent };
  await client.updateIssue(issueKey, {
    fields: { description: updated },
  });
}

export function computeJiraTicketValidation(
  issue: JiraIssueObjectForCPProjects,
  zephyr?: { hasCases: boolean; acFromZephyr?: string[] }
): ValidationResult {
  const checks: ValidationResult["checks"] = [];

  const summary = String(issue?.fields?.summary || "");
  const words = summary.trim().split(/\s+/).filter(Boolean);
  const titleOk = summary.trim().length >= 12 && words.length >= 3;
  checks.push({
    id: "title-quality",
    ok: titleOk,
    message: titleOk
      ? "Title length and clarity look good"
      : "Title should be at least 12 characters and ~3+ words",
    fixable: false,
  });

  const description = issue?.fields?.description;
  const plainTextDescription =
    typeof description === "string"
      ? description
      : getPlanTextFromDescription(description);
  const hasACInDescription = issueHasAcceptanceSection(description);
  const hasDescription = Boolean(
    description && (typeof description === "string" ? description.trim() : true)
  );
  const acOk = hasACInDescription || (zephyr?.hasCases ?? false);
  checks.push({
    id: "acceptance-criteria",
    ok: acOk,
    message: acOk
      ? hasACInDescription
        ? "Acceptance Criteria present in Description"
        : "Zephyr test cases can serve as Acceptance Criteria"
      : "Acceptance Criteria missing (or no Zephyr tests)",
    fixable: true,
  });

  checks.push({
    id: "description-present",
    ok: hasDescription,
    message: hasDescription
      ? `Description present: ${plainTextDescription.slice(0, 40)}... (${
          plainTextDescription.length
        })`
      : "Description missing or empty",
    fixable: false,
  });

  const ok = checks.every((c) => c.ok);
  return { ok, checks };
}

export async function ensureJiraEnv({
  interactive = true,
}: { interactive?: boolean } = {}) {
  let resolved = await resolveJiraEnv();
  if (!resolved) {
    try {
      const repoRoot = await getRepoRoot(process.cwd());
      const dotenvPath = path.join(repoRoot, ".env");
      const exists = await fs.pathExists(dotenvPath);
      if (exists) {
        const content = await fs.readFile(dotenvPath, "utf8");
        const lines = content?.split(/\r?\n/) || [];
        for (const line of lines) {
          const trimmed = line?.trim() || "";
          if (!trimmed || trimmed?.startsWith("#")) continue;
          const eq = trimmed.indexOf("=");
          if (eq === -1) continue;
          const key = trimmed?.slice(0, eq)?.trim();
          let value = trimmed?.slice(eq + 1)?.trim();
          if (
            (value && value?.startsWith('"') && value?.endsWith('"')) ||
            (value && value?.startsWith("'") && value?.endsWith("'"))
          ) {
            value = value?.slice(1, -1);
          }
          if (!(key in process.env)) {
            process.env[key] = value;
          }
        }
      }
    } catch {}
    resolved = await resolveJiraEnv();
  } else {
    return resolved;
  }
  if (!interactive) {
    throw new Error("Missing Jira env. Set JIRA_EMAIL, and JIRA_API_TOKEN.");
  }
  const promptEnv = await promptForJiraEnv();
  await saveEnvToDotenvFile({
    JIRA_URL: promptEnv.jiraUrl,
    JIRA_EMAIL: promptEnv.email,
    JIRA_API_TOKEN: promptEnv.apiToken,
  });

  await saveJiraDefaultsToConfig({
    defaultProject: promptEnv.defaultProject,
    defaultEpic: promptEnv.defaultEpic,
    defaultTeam: promptEnv.defaultTeam,
  });
  return promptEnv;
}

export async function findMyOpenIssues(env: JiraEnv): Promise<IssueLite[]> {
  if (!env) {
    log.error(`Missing Jira env. Set JIRA_EMAIL, and JIRA_API_TOKEN.`);
    throw new Error(`Missing Jira env. Set JIRA_EMAIL, and JIRA_API_TOKEN.`);
  }

  const jql =
    "assignee = currentUser() AND resolution = Unresolved AND status != Done ORDER BY updated DESC";
  const { url, options } = await getJiraFetchOptions("/rest/api/3/search/jql", {
    env,
    body: JSON.stringify({
      jql,
      fields: ["summary", "status", "priority"],
      maxResults: 100,
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const res = await fetch(url, {
    ...options,
  } as any);

  if (!res.ok) {
    throw new Error(`Failed to search issues: ${res.status} ${res.statusText}`);
  }

  const result = (await res.json()) as any;
  return (result.issues || []).map((i: any) => ({
    key: i.key,
    summary: i.fields?.summary,
    status: i.fields?.status?.name,
    priority: i.fields?.priority?.name,
  }));
}

export async function findCurrentSprintIssues(
  projectKey: string,
  env?: JiraEnv
): Promise<IssueLite[]> {
  const jql = `project = ${projectKey} AND sprint in openSprints() AND status != Done ORDER BY updated DESC`;

  const { url, options } = await getJiraFetchOptions("/rest/api/3/search/jql", {
    env,
    body: JSON.stringify({
      jql,
      fields: ["summary", "status", "priority"],
      maxResults: 200,
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const res = await fetch(url, {
    ...options,
  } as any);

  if (!res.ok) {
    throw new Error(`Failed to search issues: ${res.status} ${res.statusText}`);
  }

  const result = (await res.json()) as any;
  return (result.issues || []).map((i: any) => ({
    key: i.key,
    summary: i.fields?.summary,
    status: i.fields?.status?.name,
    priority: i.fields?.priority?.name,
  }));
}

// Search issues by summary substring (optionally scoped to a project)
export async function searchIssuesBySummary(
  summaryQuery: string,
  env?: JiraEnv,
  projectKey?: string,
  maxResults: number = 25
): Promise<IssueLite[]> {
  const e = env || (await resolveJiraEnv());
  if (!e) throw new Error("Jira environment not configured");

  const escaped = summaryQuery.replace(/"/g, '\\"');
  const projectJql =
    projectKey && projectKey.trim().length > 0
      ? `project = ${projectKey} AND `
      : "";
  const jql = `${projectJql}summary ~ "${escaped}" ORDER BY updated DESC`;

  const { url, options } = await getJiraFetchOptions("/rest/api/3/search/jql", {
    env,
    method: "POST",
    body: JSON.stringify({
      jql,
      fields: ["summary", "status", "priority"],
      maxResults,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const res = await fetch(url, {
    ...options,
  } as any);

  if (!res.ok) {
    throw new Error(`Failed to search issues: ${res.status} ${res.statusText}`);
  }

  const result = (await res.json()) as any;
  return (result.issues || []).map((i: any) => ({
    key: i.key,
    summary: i.fields?.summary,
    status: i.fields?.status?.name,
    priority: i.fields?.priority?.name,
  }));
}

export async function createBacklogTask(
  projectKey: string,
  summary: string,
  description?: string,
  env?: JiraEnv,
  issueTypeName: string = "Task",
  extraFields?: Record<string, any>
): Promise<{ key: string }> {
  const client = await createJiraClient(env);
  // Convert plain-text description to Atlassian Document Format (ADF) per REST v3 requirements
  // https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post
  const Description = description
    ? {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: description }],
          },
        ],
      }
    : undefined;

  log.debug("---- Trying to create issue...");
  log.debug(`projectKey: ${projectKey}`);
  log.debug(`summary: ${summary}`);
  log.debug(`Description: ${JSON.stringify(Description, null, 2)}`);
  log.debug(`issueTypeName: {name: ${issueTypeName}}`);
  log.debug(`extraFields: ${JSON.stringify(extraFields, null, 2)}`);

  const created = await client.addNewIssue({
    fields: {
      project: { key: projectKey },
      summary,
      description: Description,
      issuetype: { name: issueTypeName },
      ...(extraFields || {}),
    },
  });
  log.success(`✓ Created Jira ticket: ${created.key}`);
  log.link(`${env?.jiraUrl}/browse/${created.key}`, `Open in browser`);
  return { key: created.key };
}

export async function getCreateIssueMetadata(
  projectKey: string,
  issueTypeName: string,
  env?: JiraEnv
): Promise<Record<string, FieldMeta>> {
  // TODO : update to use the new endpoint that hasnt been deprecated yet
  // https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-createmeta-projectidorkey-issuetypes-get
  const path = `/rest/api/3/issue/createmeta?projectKeys=${encodeURIComponent(
    projectKey
  )}&expand=projects.issuetypes.fields`;
  const { url, options } = await getJiraFetchOptions(path, {
    env,
    method: "GET",
  });
  log.debug(`url: ${url}`);
  log.debug(`options: ${JSON.stringify(options, null, 2)}`);
  const res = await fetch(url, {
    ...options,
  } as any);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch create metadata: ${res.status} ${res.statusText}`
    );
  }
  const data = (await res.json()) as any;
  const project = (data.projects || []).find((p: any) => p.key === projectKey);
  if (!project) return {};
  const it = (project.issuetypes || []).find(
    (t: any) => (t.name || "").toLowerCase() === issueTypeName.toLowerCase()
  );
  if (!it || !it.fields) return {};
  return it.fields as Record<string, FieldMeta>;
}

export async function promptForMissingRequiredFields(
  fieldsMeta: Record<string, FieldMeta>,
  provided: Record<string, any>
): Promise<Record<string, any>> {
  log.debug(`--------------------------------`);
  log.debug(`provided: ${JSON.stringify(provided, null, 2)}`);
  log.debug(`--------------------------------`);
  const result: Record<string, any> = { ...provided };
  const entries = Object.entries(fieldsMeta);
  // Prompt only for required fields that are missing
  // eslint-disable-next-line no-restricted-syntax
  for (const [fieldKey, meta] of entries) {
    if (!meta?.required) continue;
    // if (result[fieldKey] !== undefined) continue;
    // Skip prompting for fields we handle explicitly elsewhere
    const lowerName = (meta.name || "").toLowerCase();
    if (
      lowerName === "summary" ||
      lowerName === "description" ||
      lowerName === "issue type" ||
      fieldKey === "summary" ||
      fieldKey === "description" ||
      fieldKey === "issuetype" ||
      fieldKey === "project"
    ) {
      continue;
    }
    const label = meta.name || fieldKey;
    const type = meta.schema?.type || "string";
    if (Array.isArray(meta.allowedValues) && meta.allowedValues.length > 0) {
      // map choices with id/value/name
      const passedInValue = provided[fieldKey];
      const hasPassedInValue = passedInValue !== undefined;
      const choices = meta.allowedValues.map((v: any) => {
        const name = v.name || v.value;
        return {
          title: `${name} (${v.id})`,
          name: name,
          value: v,
        };
      });
      if (hasPassedInValue) {
        log.debug(
          `Using passed in value for ${fieldKey}: ${provided[fieldKey]}`
        );

        const foundName = choices.find(
          (c) => `${c.name.toLowerCase()}` === passedInValue.toLowerCase()
        );
        const foundValue = choices.find(
          (c) =>
            `${c.value.value.toLowerCase()}` === passedInValue.toLowerCase()
        );
        const foundId = choices.find((c) => c.value.id === passedInValue);
        const found = foundName || foundValue || foundId;
        if (found) {
          log.debug(`found: ${JSON.stringify(found, null, 2)}`);
          result[fieldKey] = { id: found.value.id };
        } else {
          log.warn(
            `No matching value found for ${fieldKey}: ${passedInValue}. using passed in value as id`
          );
          result[fieldKey] = { id: passedInValue };
        }

        continue;
      } else {
        log.debug(`selecting ${label}(${fieldKey})`);
        const { selected } = await prompts({
          type: "select",
          name: "selected",
          message: `${label}(${fieldKey})`,
          choices,
          initial: 0,
        });
        if (selected) {
          const v = selected as any;
          if (v.id !== undefined) result[fieldKey] = { id: v.id };
          else if (v.value !== undefined) result[fieldKey] = { value: v.value };
          else if (v.name !== undefined) result[fieldKey] = { name: v.name };
          else result[fieldKey] = v;
        }
      }

      continue;
    }
    if (type === "boolean") {
      const { bool } = await (prompts as any)({
        type: "toggle",
        name: "bool",
        message: `${label}`,
        initial: false,
        active: "yes",
        inactive: "no",
      });
      result[fieldKey] = Boolean(bool);
      continue;
    }
    // default to text entry
    const { text } = await (prompts as any)({
      type: "text",
      name: "text",
      message: `${label}`,
    });
    result[fieldKey] = text;
  }
  return result;
}

// Centralized interactive creation flow used by both `jira create` and other commands (e.g., edu)
export async function interactiveCreateBacklogTask(
  options: CreateIssueInteractiveOptions
): Promise<{ key: string }> {
  const env = await ensureJiraEnv();
  let project = (options.project || env.defaultProject || "").trim();
  let summary = options.summary?.trim();
  let description = options.description?.trim();
  const issueType = (options.issueType || "Task").trim() || "Task";
  const force = Boolean(options.force);

  // Prompt for project if missing and not forced
  if (!project && !force) {
    const ans = await prompts({
      type: "text",
      name: "project",
      message: "Jira project key (e.g. CP, CLIN):",
      initial: env.defaultProject || "",
      validate: (v: string) => (v && v.trim().length > 0 ? true : "Required"),
    });
    project = (ans?.project || project || "").trim();
  }
  if (!project) throw new Error("Project key is required");

  // Prompt summary/description in interactive mode
  if (!force) {
    if (!summary) {
      const ans = await prompts({
        type: "text",
        name: "summary",
        message: "Issue summary",
        validate: (v: string) =>
          v && v.trim().length > 0 ? true : "Summary is required",
      });
      summary = (ans?.summary || summary || "").trim();
    }
    if (description == null) {
      const ans = await prompts({
        type: "text",
        name: "desc",
        message: "Description (optional)",
        initial: description || "",
      });
      description = (ans?.desc ?? description) || undefined;
    }
  }
  if (!summary) throw new Error("Summary is required");

  // Fetch create metadata for validation and additional prompts
  const meta = await getCreateIssueMetadata(project, issueType, env);

  // Fill required fields interactively where needed
  const providedExtra = { ...(options.extraFields || {}) } as Record<
    string,
    any
  >;
  let extraFieldsFilled: Record<string, any> = {};
  if (force) {
    // Validate that required fields are present when force=true
    const missing: string[] = [];
    for (const [fieldKey, m] of Object.entries(meta)) {
      if (!m?.required) continue;
      const lower = (m?.name || "").toLowerCase();
      if (
        fieldKey === "summary" ||
        fieldKey === "description" ||
        fieldKey === "issuetype" ||
        lower === "summary" ||
        lower === "description" ||
        lower === "issue type"
      )
        continue;
      if (providedExtra[fieldKey] == null) missing.push(m?.name || fieldKey);
    }
    if (missing.length > 0) {
      log.error(
        `Missing required input with force mode: ${missing.join(
          ", "
        )}. Provide via extraFields.`
      );
      return { key: null };
    }
    extraFieldsFilled = providedExtra;
  } else {
    extraFieldsFilled = await promptForMissingRequiredFields(meta, {
      ...providedExtra,
      project,
    });
    // Avoid overriding core fields in create API
    delete extraFieldsFilled.summary;
    delete extraFieldsFilled.description;
    delete extraFieldsFilled.issuetype;
  }

  // Epic link handling (if present in project template)
  const epicFieldKey =
    Object.entries(meta).find(([, m]: [string, any]) =>
      ((m?.name || "") as string).toLowerCase().includes("epic link")
    )?.[0] || customFieldIds.epicLink;
  if (meta[epicFieldKey] && extraFieldsFilled[epicFieldKey] == null && !force) {
    const preEpic = providedExtra[epicFieldKey] || env.defaultEpic;
    if (preEpic != null) {
      const { epicText } = await prompts({
        type: "text",
        name: "epicText",
        message: "Epic Link (issue key, e.g. ABC-123)",
        initial: String(preEpic),
      });
      if (epicText) extraFieldsFilled[epicFieldKey] = String(epicText);
    } else {
      const epics = await findProjectEpics(project, env);
      if (epics.length > 0) {
        const { epic } = await prompts({
          type: "select",
          name: "epic",
          message: "Epic Link",
          choices: epics.map((e) => ({
            title: `${e.key} — ${e.summary} (${e.id})`,
            value: e.key,
          })),
          initial: 0,
        });
        if (epic) extraFieldsFilled[epicFieldKey] = epic;
      }
    }
  }

  // Team field handling (common custom field)
  const teamFieldKey =
    Object.entries(meta).find(
      ([, m]: [string, any]) => (m?.name || "").toLowerCase() === "team"
    )?.[0] || customFieldIds.team;
  log.debug(`teamFieldKey: ${teamFieldKey}`);
  if (meta[teamFieldKey]) {
    const teamFieldName = meta[teamFieldKey]?.name || "Team";
    const preTeam = extraFieldsFilled[teamFieldKey] || env.defaultTeam;
    if (!!preTeam) {
      log.debug(`searching for team: ${preTeam}`);
      const teams = await searchTeams(preTeam, teamFieldName, env);
      log.debug(`teams: ${JSON.stringify(teams, null, 2)}`);
      if (teams.length === 1) {
        extraFieldsFilled[teamFieldKey] = teams[0].id;
      } else {
        const { selected } = await prompts({
          type: "select",
          name: "selected",
          message: "Select Team",
          choices: teams.map((t) => ({
            title: `${t.name} (${t.id})`,
            value: t.id,
          })),
          initial: 0,
        });
        if (selected) log.info(`Selected team: ${selected}`);
        const selValue = selected?.value ?? selected;
        let teamValue: any = selValue;
        if (typeof selValue === "string") {
          const numericSuffix = selValue.match(/(\d+)$/)?.[1];
          if (numericSuffix) teamValue = Number(numericSuffix);
          else if (/^\d+$/.test(selValue)) teamValue = Number(selValue);
        }
        extraFieldsFilled[teamFieldKey] = teamValue;
      }
    } else {
      const { teamQuery } = await prompts({
        type: "text",
        name: "teamQuery",
        message: "Team (type part of team name)",
      });
      if (teamQuery) {
        const teams = await searchTeams(teamQuery, teamFieldName, env);
        if (teams.length > 0) {
          if (teams.length === 1) {
            // if only one team found, use it
            extraFieldsFilled[teamFieldKey] = teams[0].id;
          } else {
            const { selected } = await prompts({
              type: "select",
              name: "selected",
              message: "Select Team",
              choices: teams.map((t) => ({
                title: `${t.name} (${t.id})`,
                value: t.id,
              })),
              initial: 0,
            });
            if (selected) log.info(`Selected team: ${selected}`);
            const selValue = (selected as any).value ?? selected;
            let teamValue: any = selValue;
            if (typeof selValue === "string") {
              const numericSuffix = selValue.match(/(\d+)$/)?.[1];
              if (numericSuffix) teamValue = Number(numericSuffix);
              else if (/^\d+$/.test(selValue)) teamValue = Number(selValue);
            }
            extraFieldsFilled[teamFieldKey] = teamValue;
          }
        } else {
          log.warn("No teams found matching your query.");
        }
      }
    }
  }

  const projectKeyOrId = extraFieldsFilled.project || options.project;
  delete extraFieldsFilled.project;

  log.debug(`extraFieldsFilled: ${JSON.stringify(extraFieldsFilled, null, 2)}`);
  // Create the issue
  return createBacklogTask(
    projectKeyOrId,
    (summary || "").trim() as string,
    description,
    env,
    issueType,
    extraFieldsFilled
  );
}

export async function findProjectEpics(
  projectKey: string,
  env?: JiraEnv
): Promise<Array<{ key: string; id: string; summary: string }>> {
  const jql = `project = ${projectKey} AND issuetype = Epic ORDER BY updated DESC`;
  const { url, options } = await getJiraFetchOptions(`/rest/api/3/search/jql`, {
    env,
    method: "POST",
    body: JSON.stringify({
      jql,
      fields: ["summary"],
      maxResults: 50,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const res = await fetch(url, {
    ...options,
  });

  if (!res.ok) {
    throw new Error(`Failed to search epics: ${res.status} ${res.statusText}`);
  }

  const result = (await res.json()) as any;
  return (result.issues || []).map((i: any) => ({
    key: i.key,
    id: i.id,
    summary: i.fields?.summary || "",
  }));
}

export async function findIssueIdByKey(
  issueKey: string,
  env?: JiraEnv
): Promise<string | undefined> {
  const client = await createJiraClient(env);
  try {
    const issue = await client.findIssue(issueKey);
    return issue?.id;
  } catch {
    return undefined;
  }
}

export async function searchTeams(
  query: string,
  fieldName: string,
  env?: JiraEnv
): Promise<TeamSuggestion[]> {
  let url, options;
  try {
    const path = `/rest/api/3/jql/autocompletedata/suggestions?fieldName=${encodeURIComponent(
      fieldName
    )}&fieldValue=${encodeURIComponent(query)}`;
    let { url, options } = await getJiraFetchOptions(path, {
      env,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const res = await fetch(url, {
      ...options,
    });
    log.debug(`res.ok: ${res.status} ${res.statusText}`);
    if (res.status !== 200) {
      log.error(`Failed to search teams: ${res.status} ${res.statusText}`);
      throw new Error(`${res.status} ${res.statusText}`);
    }
    log.debug(`searchTeams res: ${JSON.stringify(res, null, 2)}`);
    log.debug(`searchTeams url: ${url}`);
    log.debug(`searchTeams options: ${JSON.stringify(options, null, 2)}`);
    const data = (await res.json()) as any;
    const raw = Array.isArray(data?.results) ? data.results : [];
    if (raw.length === 0) {
      throw new Error(`No teams found for team search: ${query}`);
    }

    const suggestions: Array<TeamSuggestion> = raw
      .map((r: any) => {
        const id = String(r?.value ?? r?.id ?? r?.text ?? r?.displayName ?? "");
        const name = String(r?.displayName ?? r?.text ?? r?.value ?? "");
        return { id, name } as TeamSuggestion;
      })
      .filter((s: TeamSuggestion) => Boolean(s.id) && Boolean(s.name));
    return suggestions;
  } catch (error: any) {
    log.error(`error fetching teams ${error?.message || error}`);
    log.debug(`options: ${JSON.stringify(options, null, 2)}`);
    throw new Error(`Failed to search teams: ${error?.message || error}`);
  }
}

export async function saveJiraDefaultsToConfig(defaults: {
  defaultProject?: string;
  defaultEpic?: string;
  defaultTeam?: string;
}) {
  return await mergeConfigWithState((config) => {
    return {
      jiraDefaults: {
        defaultProject:
          defaults.defaultProject || config.jiraDefaults?.defaultProject,
        defaultEpic: defaults.defaultEpic || config.jiraDefaults?.defaultEpic,
        defaultTeam: defaults.defaultTeam || config.jiraDefaults?.defaultTeam,
      },
    };
  });
}

export async function openIssueInBrowser(issueKey: string, env?: JiraEnv) {
  const url = await getJiraUrl(`browse/${issueKey}`, env);
  try {
    await open(url);
    return true;
  } catch (error) {
    log.error(`Failed to import open: ${error}`);
    return false;
  }
}

export async function addCommentToIssue(
  issueKey: string,
  comment: string,
  env?: JiraEnv
) {
  const client = await createJiraClient(env);
  // Convert plain-text comment to ADF to satisfy Jira Cloud v3 requirements
  const lines = String(comment ?? "").split(/\r?\n/);
  let bodyContent = [
    {
      type: "paragraph",
      content: [{ type: "text", text: `${comment}` }],
    },
  ];
  if (lines.length === 0) {
    bodyContent = lines.map((line) => ({
      type: "paragraph",
      content: line
        ? [
            {
              type: "text",
              text: line,
            },
          ]
        : [],
    }));
  }
  const body = {
    body: {
      type: "doc",
      version: 1,
      content: bodyContent,
    },
  } as JiraAddCommentBody;
  try {
    const { url, options } = await getJiraFetchOptions(
      `/rest/api/3/issue/${issueKey}/comment`,
      {
        env,
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    log.debug(`fetching url: ${url}`);
    log.debug(`options: ${JSON.stringify(options, null, 2)}`);
    log.debug(`body: ${JSON.stringify(body, null, 2)}`);
    await fetch(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (error: any) {
    log.error(`Failed to add comment to issue: ${error?.message || error}`);
    throw new Error(
      `Failed to add comment to issue: ${error?.message || error}`
    );
  }
}

export async function updateIssue(
  issueKey: string,
  data: { fields: { issuetype?: { name: string }; labels?: string[] } }
) {
  const client = await createJiraClient();
  await client.updateIssue(issueKey, data);
}

export async function updateTitleForSpike(issueKey: string, newTitle?: string) {
  const client = await createJiraClient();
  const issue = await client.findIssue(issueKey);
  if (!issue) throw new Error(`Issue ${issueKey} not found`);

  try {
    if (newTitle) {
      await client.updateIssue(issueKey, {
        fields: { summary: newTitle },
      });
    } else {
      await client.updateIssue(issueKey, {
        fields: { summary: `SPIKE: ${issue.fields?.summary}` },
      });
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error as Error };
  }
}
