---
name: anyclick-jira-adapter
overview: Extract a focused Jira adapter package for Anyclick using the existing Jira integration decisions, and wire it so feedback can go to Jira (and optionally other adapters) from the Anyclick web app.
todos:
  - id: analyze-existing-jira-code
    content: Review `packages/anyclick-jira/other-jira-integration` to lock in auth, env, and ADF decisions to be reused in the adapter.
    status: completed
  - id: shape-anyclick-jira-package
    content: Create or adjust `packages/anyclick-jira` structure (src files, package.json, tsconfig) to mirror the GitHub adapter pattern.
    status: completed
    dependencies:
      - analyze-existing-jira-code
  - id: implement-jira-adapter
    content: Implement `JiraAdapter` (issue creation, attachments, error handling) and supporting types/utils using the existing Jira decisions.
    status: completed
    dependencies:
      - shape-anyclick-jira-package
  - id: implement-formatters
    content: Implement Anyclick-specific Jira summary and description formatters that output ADF, reusing helper patterns from the existing integration.
    status: completed
    dependencies:
      - implement-jira-adapter
  - id: wire-into-feedback-route
    content: Update the Next.js feedback API route to optionally submit feedback to Jira in addition to GitHub, based on env configuration.
    status: completed
    dependencies:
      - implement-jira-adapter
      - implement-formatters
  - id: clean-up-legacy-jira-code
    content: Remove or relocate the `other-jira-integration` folder once the new adapter is fully wired and tested.
    status: completed
    dependencies:
      - wire-into-feedback-route
  - id: update-docs-and-readme
    content: Add README and docs entries describing Jira adapter setup and examples, including multi-adapter (GitHub + Jira) usage.
    status: completed
    dependencies:
      - wire-into-feedback-route
---

## Anyclick Jira Adapter: Extraction & Integration Plan

### 1. Analyze and Extract Core Jira Decisions

- **Inspect existing Jira integration**: Use the files in [`packages/anyclick-jira/other-jira-integration`](packages/anyclick-jira/other-jira-integration) (`jira.ts`, `types.ts`, `utils.ts`, `validate.ts`, `cmd.ts`) to identify:
- Good instructions and cli to get environment setup easily (link to token creation, parse any jira url for base url)
- **Auth model and env vars** (`JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, defaults) and how Jira Cloud is addressed.
- **Issue creation behavior** (project key usage, default issue type, ADF description format, custom fields like epic/team, label patterns).
- **Helper logic** that’s still relevant for a non-interactive adapter (URL building, fetch options, ADF helpers).
- **Decide scope for adapter**: Only carry over the non-interactive, request/response logic into the adapter (auth, request building, ADF description, optional labels/custom fields), and drop CLI/interactive flows and Zephyr-specific validation from the adapter package.

### 2. Define `@ewjdev/anyclick-jira` Package Shape

- **Create minimal package structure** under [`packages/anyclick-jira`](packages/anyclick-jira) that mirrors the GitHub adapter layout:
- `src/jiraAdapter.ts`: core Jira adapter class.
- `src/formatters.ts`: map `AnyclickPayload` into Jira summary & ADF description.
- `src/types.ts`: adapter options and result types, based on the existing `JiraEnv` and related types.
- `src/server.ts`: server-side entry point exporting `createJiraAdapter`.
- `src/index.ts`: (if needed) browser-side exports or re-exports, consistent with how `@ewjdev/anyclick-github` structures `index.ts`/`server.ts`.
- **Align package metadata**: Create or update `packages/anyclick-jira/package.json` and `tsconfig.json` to follow the patterns in `anyclick-github` (build targets, types, `main/module/exports` fields, dependency declarations for Jira HTTP calls).

### 3. Implement `JiraAdapter` Class

- **Adapter options and types** in `src/types.ts`:
- `JiraAdapterOptions` with fields derived from `JiraEnv` and create-issue helpers: `jiraUrl`, `email`, `apiToken`, `projectKey`, optional `issueType`, default labels, optional mapping from Anyclick type → Jira issue type, and an optional `extraFields`/`customFields` map.
- `JiraIssueResult` type exposing `key`, `id`, and a `url` that points to the browse page.
- **HTTP and auth helpers** in `src/jiraAdapter.ts` or a small `src/utils.ts`:
- Reuse the `getJiraUrl`/`getJiraFetchOptions` pattern from `other-jira-integration/utils.ts`, simplified to:
- Take `jiraUrl` from options instead of prompting or reading external config.
- Always use Jira Cloud v3 REST paths (`/rest/api/3/issue`, attachments endpoint, etc.).
- **Core method `createIssue(payload: AnyclickPayload)`**:
- Derive project key and issue type from adapter options and Anyclick type mapping.
- Use the new formatters to build Jira-compatible summary and ADF description.
- POST to `/rest/api/3/issue` using the helper for auth headers and URL.
- If screenshots are present on `payload.screenshots`, call Jira’s attachments API for the created issue (multiparts or base64 depending on the existing decisions) and, if appropriate, append attachment references in the description or leave them as plain attachments.
- Return a `JiraIssueResult` with `key`, `id`, and `url` built similarly to `openIssueInBrowser` from `jira.ts`.
- **Error handling and validation**:
- Mirror the existing error messaging style from `other-jira-integration` (helpful messages for auth/URL issues) but without interactive prompts.
- Optionally add a `validateConfiguration()` method similar to `GitHubAdapter.validateConfiguration` that verifies credentials with a lightweight Jira API call.

### 4. Implement Anyclick-Specific Formatters

- **Summary formatter** in `src/formatters.ts`:
- Base it on the semantics used in the existing Jira code and the GitHub `defaultFormatTitle` (e.g., prefix by type: `[Bug]`, `[Feature]`, include element id/tag and page title), but tuned for Jira summary length constraints.
- **Description formatter**:
- Use the ADF helpers from `createBacklogTask` in `jira.ts` as a starting point, then:
- Include feedback type, comment, page context (URL, title, viewport), and element context (selector, tag, classes) from `AnyclickPayload`.
- Represent this as an Atlassian Document Format tree rather than markdown.
- Keep this pure (no network calls or env access) so it’s easy to test and override.
- **Export formatters in `src/index.ts` or `src/server.ts`** so advanced users can provide custom `formatSummary`/`formatDescription` callbacks in adapter options.

### 5. Wire Adapter into the Web App API Route

- **Update feedback API route** [`apps/web/src/app/api/feedback/route.ts`](apps/web/src/app/api/feedback/route.ts) to support Jira alongside GitHub:
- Import `createJiraAdapter` from `@ewjdev/anyclick-jira/server`.
- Read Jira environment configuration (`JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, and a `JIRA_PROJECT_KEY`, plus optional type mappings if you’ve already defined them) from `process.env`.
- If Jira env vars are present, instantiate a Jira adapter and call `createIssue(payload)` when the base feedback types (`issue`, `feature`, `like`) are submitted.
- Preserve existing GitHub and Cursor behaviors, and if both GitHub and Jira are configured, invoke **both** and aggregate results.
- **Optional composite helper** (if you want a reusable abstraction): add a small `CompositeAdapter` in [`packages/anyclick-adapters/src/utils.ts`](packages/anyclick-adapters/src/utils.ts) that accepts multiple `AnyclickAdapter` instances and fans out `submitAnyclick` calls, but this is not required if you prefer explicit calls in the route handler.

### 6. Clean Up `other-jira-integration` and Expose Public API

- **Move only the needed, non-interactive pieces** from `other-jira-integration` into the new adapter files:
- ADF description helpers.
- URL/auth/fetch helpers for Jira Cloud.
- Types that are still directly relevant to issue creation.
- **Remove or isolate CLI-only and Zephyr-related code**:
- Do not pull `cmd.ts`, `validate.ts`, or env-bootstrapping utilities into the adapter package.
- If you want to preserve them for tooling, move them into a separate internal tool/package later, but keep `anyclick-jira` focused purely on the adapter.
- **Update exports** for the new package:
- In `src/server.ts`, export `JiraAdapter` and a factory `createJiraAdapter(options: JiraAdapterOptions) => JiraAdapter` (mirroring `@ewjdev/anyclick-github/server`).
- In `src/index.ts`, re-export adapter types and, if needed, any browser-safe helpers.

### 7. Documentation and Follow-Up Cleanup

- **Add README for `@ewjdev/anyclick-jira`** in [`packages/anyclick-jira/README.md`](packages/anyclick-jira/README.md):
- How to install and configure env vars.
- Example Next.js API route wiring that submits to Jira (and optionally GitHub).
- Notes on Jira Cloud-only support and any assumptions about custom fields.
- **Update docs site** (e.g., [`apps/web/src/app/docs/adapters/page.tsx`](apps/web/src/app/docs/adapters/page.tsx)) to include a Jira adapter section and example usage alongside the GitHub adapter.
- **Final cleanup**: Once the new adapter is working and referenced everywhere, delete the legacy [`packages/anyclick-jira/other-jira-integration`](packages/anyclick-jira/other-jira-integration) folder so that the package only contains the adapter-focused code.