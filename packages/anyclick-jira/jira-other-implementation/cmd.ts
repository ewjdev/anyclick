import { Command } from "commander";
import { saveEnvToDotenvFile } from "../utils/env.js";
import { log } from "../utils/log.js";
import {
  ensureJiraEnv,
  findCurrentSprintIssues,
  findMyOpenIssues,
  interactiveCreateBacklogTask,
  promptForJiraEnv,
  saveJiraDefaultsToConfig,
} from "./jira.js";
import { validateJiraTicket } from "./validate.js";

// use these custom field ids to bypass prompts for these fields
// eg {jira create} -f {fieldKey}={value}
export const customFieldIds = {
  epicLink: "customfield_10008",
  team: "customfield_16300",
  isDeployment: "customfield_19382",
  sprint: "customfield_10007",
  allocationCategory: "customfield_18994",
};

function jiraInit(program: Command) {
  const jira = program
    .command("jira")
    .description(
      "Jira utilities: setup creds, list my tasks, current sprint, and create backlog task"
    );

  jira
    .command("setup")
    .description(
      "Configure Jira environment variables and validate credentials"
    )
    .action(async () => {
      try {
        const env = await promptForJiraEnv();
        const dotenvPath = await saveEnvToDotenvFile({
          JIRA_URL: env.jiraUrl || "",
          JIRA_EMAIL: env.email || "",
          JIRA_API_TOKEN: env.apiToken || "",
        });
        log.success("✓ Saved credentials to .env");
        log.info(dotenvPath);

        // Save Jira defaults to config if provided
        if (env.defaultProject || env.defaultEpic || env.defaultTeam) {
          await saveJiraDefaultsToConfig({
            defaultProject: env.defaultProject,
            defaultEpic: env.defaultEpic,
            defaultTeam: env.defaultTeam,
          });
          log.success("✓ Saved Jira defaults to config");
        }

        log.info(
          "Ensure your shell loads .env or export env vars before using jira commands."
        );
      } catch (error) {
        log.error("✗ Setup failed");
        // eslint-disable-next-line no-console
        console.error(error);
        process.exitCode = 1;
      }
    });

  jira
    .command("my")
    .description("List issues assigned to the current user")
    .option("--json", "Output JSON", false)
    .action(async (options: { json?: boolean }) => {
      try {
        const env = await ensureJiraEnv();
        const issues = await findMyOpenIssues(env);
        if (options.json) {
          // eslint-disable-next-line no-console
          console.log(JSON.stringify(issues, null, 2));
        } else {
          if (issues.length === 0) {
            log.warn("No open issues assigned to you.");
            return;
          }
          for (const i of issues) {
            log.info(
              `${i.key}  —  ${i.summary}  [${i.status || ""}${
                i.priority ? ", " + i.priority : ""
              }]`
            );
          }
        }
      } catch (error) {
        log.error("✗ Failed to fetch my issues");
        // eslint-disable-next-line no-console
        log.debug(error);
        process.exit(1);
      }
    });

  jira
    .command("sprint")
    .description("List issues in the current open sprint for a project")
    .requiredOption("-p, --project <key>", "Project key, e.g. CP, CLIN", "CP")
    .option("--json", "Output JSON", false)
    .action(async (options: { project: string; json?: boolean }) => {
      try {
        const env = await ensureJiraEnv();
        const issues = await findCurrentSprintIssues(options.project, env);
        if (options.json) {
          // eslint-disable-next-line no-console
          console.log(JSON.stringify(issues, null, 2));
        } else {
          if (issues.length === 0) {
            log.warn("No issues found in current sprint.");
            return;
          }
          for (const i of issues) {
            log.info(
              `${i.key}  —  ${i.summary}  [${i.status || ""}${
                i.priority ? ", " + i.priority : ""
              }]`
            );
          }
        }
      } catch (error) {
        log.error("✗ Failed to fetch current sprint issues");
        // eslint-disable-next-line no-console
        console.error(error);
        process.exitCode = 1;
      }
    });

  jira
    .command("create")
    .description("Create a backlog task in a project")
    .option(
      "-p, --project <key>",
      "Project key, e.g. CP, CLIN (uses default from config if not provided)"
    )
    .option("-s, --summary <text>", "Issue summary")
    .option("-d, --description <text>", "Issue description")
    .option("-t, --type <name>", "Issue type name (Task, Story, Bug)", "Task")
    .option(
      "--force",
      "Do not prompt for input; require all needed args",
      false
    )
    .option(
      "-f, --field <key=value...>",
      "Additional fields (e.g. customfield_12345=Yes, priority.name=P3)"
    )
    .action(
      async (options: {
        project?: string;
        summary?: string;
        description?: string;
        type?: string;
        field?: string[];
        force?: boolean;
      }) => {
        let jiraTicketPayload;
        try {
          // Parse --field key=value pairs into nested fields
          const extraFields: Record<string, any> = {};
          (options.field || []).forEach((pair: string) => {
            const idx = pair.indexOf("=");
            if (idx <= 0) return;
            const key = pair.slice(0, idx).trim();
            const val = pair.slice(idx + 1).trim();
            const parts = key.split(".");
            let cursor: any = extraFields;
            for (let i = 0; i < parts.length; i += 1) {
              const p = parts[i];
              if (i === parts.length - 1) {
                cursor[p] =
                  val === "true" ? true : val === "false" ? false : val;
              } else {
                cursor[p] = cursor[p] || {};
                cursor = cursor[p];
              }
            }
          });

          jiraTicketPayload = {
            project: options?.project,
            summary: options?.summary,
            description: options?.description,
            issueType: options?.type || "Task",
            extraFields,
            force: Boolean(options?.force),
          };
          const created = await interactiveCreateBacklogTask(jiraTicketPayload);
        } catch (error: any) {
          log.error("✗ Failed to create issue");
          log.error(`error: ${error?.message?.trim?.() || String(error)}`);
          log.error(
            `jiraTicketPayload: ${JSON.stringify(jiraTicketPayload, null, 2)}`
          );
          process.exit(1);
        }
      }
    );

  jira
    .command("validate")
    .argument("[issueKey]")
    .description(
      "Validate a Jira ticket for development readiness. Optionally autofix AC from Zephyr."
    )
    .option("--json", "Output JSON", false)
    .option(
      "--autofix",
      "Append Acceptance Criteria from Zephyr when AC missing",
      false
    )
    .action(
      async (
        issueKeyArg: string | undefined,
        options: { json?: boolean; autofix?: boolean }
      ) => {
        try {
          await validateJiraTicket(issueKeyArg, options);
        } catch (error) {
          log.error("✗ Error search for issue or validation failed");
          log.debug(`error validating jira ticket: ${error?.message || error}`);
          process.exit(1);
        }
      }
    );
}

export default jiraInit;
