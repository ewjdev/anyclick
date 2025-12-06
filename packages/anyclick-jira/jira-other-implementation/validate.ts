import prompts from "prompts";
import { log } from "../utils/log.js";
import { ZephyrEnv } from "../zephyr/types.js";
import { handleEnsureEnv } from "../zephyr/utils.js";
import { buildAcceptanceCriteriaFromZephyr } from "../zephyr/zephyr.js";
import {
  addCommentToIssue,
  appendAcceptanceCriteriaToDescription,
  computeJiraTicketValidation,
  ensureJiraEnv,
  fetchIssueDetails,
  issueHasAcceptanceSection,
  openIssueInBrowser,
  searchIssuesBySummary,
  updateIssue,
  updateTitleForSpike,
} from "./jira.js";

export async function validateJiraTicket(
  issueKey: string,
  options: { json?: boolean; autofix?: boolean }
) {
  const env = await ensureJiraEnv();
  if (!issueKey && !options.json) {
    const { mode } = await prompts({
      type: "select",
      name: "mode",
      message: "Provide an issue key or search by summary",
      choices: [
        { title: "Enter issue key (e.g., CP-1234)", value: "key" },
        { title: "Search by summary", value: "search" },
        { title: "Exit", value: "exit" },
      ],
      initial: 0,
    });
    if (mode === "exit") {
      process.exit(0);
    }
    if (mode === "key") {
      const { k } = await prompts(
        {
          type: "text",
          name: "k",
          message: "Issue key",
        },
        {
          onCancel: () => {
            return validateJiraTicket("", options);
          },
        }
      );
      issueKey = String(k || "").trim();
    } else if (mode === "search") {
      const { q } = await prompts(
        {
          type: "text",
          name: "q",
          message: "Search summary contains",
        },
        {
          onCancel: () => {
            return validateJiraTicket("", options);
          },
        }
      );
      const query = String(q || "").trim();
      if (query) {
        const matches = await searchIssuesBySummary(query, env);
        if (matches.length === 0) {
          log.warn("No issues found for that summary.");
        } else {
          matches.unshift({
            key: "back-to-search",
            summary: "Back to search",
          });
          const { sel } = await prompts(
            {
              type: "select",
              name: "sel",
              message: "Select an issue",
              choices: matches.map((m) => ({
                title: `${m.key} — ${m.summary}`,
                value: m.key,
              })),
              initial: 0,
            },
            {
              onCancel: () => {
                return validateJiraTicket("", options);
              },
            }
          );
          if (sel === "back-to-search") {
            return validateJiraTicket("", options);
          }
          issueKey = String(sel || "").trim();
        }
      }
    }
  }

  if (!issueKey) {
    log.debug("Issue key is required");
    throw new Error("Issue key is required");
  }

  let issue: any;
  try {
    issue = await fetchIssueDetails(issueKey, env);
  } catch (e) {
    log.error(`Unable to fetch issue details for ${issueKey}`);
    log.debug(`error: ${e?.message || e}`);
    return validateJiraTicket("", options);
  }

  let zephyrInfo: { hasCases: boolean; acFromZephyr?: string[] } = {
    hasCases: false,
  };
  try {
    // const zEnv = await ensureZephyrEnv();
    const zEnv = (await handleEnsureEnv()) as ZephyrEnv;
    if (!zEnv) {
      log.error("Unable to read Zephyr credentials from environment");
      process.exitCode = 1;
      return;
    }
    const ac = await buildAcceptanceCriteriaFromZephyr(issueKey, zEnv);
    zephyrInfo = { hasCases: ac.length > 0, acFromZephyr: ac };
  } catch (zErr: any) {
    log.debug?.(`Zephyr lookup skipped/failed: ${zErr?.message || zErr}`);
  }

  const result = computeJiraTicketValidation(issue, zephyrInfo);
  log.debug(
    `computeJiraTicketValidation results: ${JSON.stringify(result, null, 2)}`
  );
  // Interactive guidance when both AC and Zephyr are missing
  const hasAC = issueHasAcceptanceSection(issue?.fields?.description);
  const missingACAndZephyr = !hasAC && !(zephyrInfo?.hasCases || false);
  if (missingACAndZephyr && !options.json) {
    const { action } = await prompts(
      {
        type: "select",
        name: "action",
        message:
          "Acceptance Criteria and Zephyr tests are missing. What would you like to do?",
        choices: [
          { title: "Add Acceptance Criteria now", value: "add-ac" },
          {
            title: "Add Questions to clarify scope",
            value: "add-questions",
          },
          {
            title: "Convert to Spike (or add spike label)",
            value: "spike",
          },
          {
            title: "Open jira issue in browser",
            value: "open-issue-in-browser",
          },
          { title: "Back to search", value: "back-to-search" },
          { title: "Exit", value: "exit" },
        ],
        initial: 0,
      },
      {
        onCancel: () => {
          return validateJiraTicket("", options);
        },
      }
    );

    if (action === "exit") {
      process.exit(0);
    }

    if (action === "back-to-search") {
      return validateJiraTicket("", options);
    }

    if (action === "add-ac") {
      const { acText } = await prompts({
        type: "list",
        name: "acText",
        message:
          "Enter acceptance criteria bullets (comma-separated or submit multiple times)",
        separator: ",",
      });
      const items: string[] = (acText || [])
        .map((s: string) => String(s).trim())
        .filter(Boolean);
      if (items.length > 0) {
        await appendAcceptanceCriteriaToDescription(issueKey, items, env);
        log.success("✓ Acceptance Criteria appended to Description");
      } else {
        log.warn("No Acceptance Criteria entered");
      }
    } else if (action === "add-questions") {
      const { qs } = await prompts({
        type: "list",
        name: "qs",
        message:
          "Enter open questions (comma-separated or submit multiple times)",
        separator: ",",
      });
      const lines: string[] = (qs || [])
        .map((s: string) => `- ${String(s).trim()}`)
        .filter(Boolean);
      if (lines.length > 0) {
        await addCommentToIssue(
          issueKey,
          `Open Questions:\n${lines.join("\n")}`
        );
        log.success("✓ Added comment with Open Questions");
      } else {
        log.warn("No questions entered");
      }
    } else if (action === "spike") {
      try {
        // Try changing issue type to Spike; if forbidden, add label instead
        try {
          const result = await updateTitleForSpike(issueKey);
          if (result.success) {
            log.success("✓ Issue type changed to Spike");
          } else {
            log.error(`Failed to update title for spike: ${result.error}`);
          }
          log.success("✓ Issue type changed to Spike");
        } catch {
          const labels = Array.isArray(issue?.fields?.labels)
            ? issue.fields.labels
            : [];
          if (!labels.includes("spike")) labels.push("spike");
          await updateIssue(issueKey, {
            fields: { labels },
          });
          log.success("✓ Added 'spike' label to issue");
        }
      } catch (e) {
        log.warn(`Unable to convert/add label: ${e}`);
        return validateJiraTicket(issueKey, options);
      }
    } else if (action === "open-issue-in-browser") {
      await openIssueInBrowser(issueKey);
      return validateJiraTicket(issueKey, options);
    }
  }

  // Autofix from Zephyr
  if (
    options.autofix &&
    zephyrInfo?.acFromZephyr?.length &&
    !issueHasAcceptanceSection(issue?.fields?.description)
  ) {
    await appendAcceptanceCriteriaToDescription(
      issueKey,
      zephyrInfo.acFromZephyr!,
      env
    );
    log.success("✓ Acceptance Criteria appended from Zephyr");
  }

  if (options.json) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  for (const c of result.checks) {
    const prefix = c.ok ? "✓" : "✗";
    log.info(`${prefix} ${c.id}: ${c.message}`);
  }
  if (result.ok) log.success("✓ Ticket is ready for development");
  else log.debug(`result: ${JSON.stringify(result, null, 2)}`);
}

export default validateJiraTicket;
