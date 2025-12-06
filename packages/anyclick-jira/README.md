# @ewjdev/anyclick-jira

Jira adapter for Anyclick - submit UI feedback directly to Jira issues.

## Installation

```bash
npm install @ewjdev/anyclick-jira
# or
yarn add @ewjdev/anyclick-jira
# or
pnpm add @ewjdev/anyclick-jira
```

## Features

- 🎯 Create Jira issues from UI feedback
- 📸 Automatic screenshot attachment upload
- 🎨 Rich Atlassian Document Format (ADF) descriptions
- 🏷️ Automatic label management based on feedback type
- 🔧 Customizable issue type mapping
- ✅ Configuration validation
- 🔒 Jira Cloud support with API token authentication

## Quick Start

### Server-Side Setup (Next.js API Route)

```typescript
// app/api/feedback/route.ts
import { createJiraAdapter } from "@ewjdev/anyclick-jira/server";
import type { AnyclickPayload } from "@ewjdev/anyclick-core";

export async function POST(req: Request) {
  const payload: AnyclickPayload = await req.json();

  const jira = createJiraAdapter({
    jiraUrl: process.env.JIRA_URL!, // e.g., https://company.atlassian.net
    email: process.env.JIRA_EMAIL!,
    apiToken: process.env.JIRA_API_TOKEN!,
    projectKey: process.env.JIRA_PROJECT_KEY!, // e.g., "PROJ"
  });

  const issue = await jira.createIssue(payload);

  return Response.json({
    success: true,
    issueKey: issue.key,
    url: issue.url,
  });
}
```

### Environment Variables

Create a `.env.local` file in your Next.js app:

```bash
JIRA_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token-here
JIRA_PROJECT_KEY=PROJ
```

### Getting Your Jira API Token

1. Go to [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "Anyclick Feedback")
4. Copy the token and add it to your `.env.local` file

## Configuration Options

```typescript
interface JiraAdapterOptions {
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
}
```

## Advanced Usage

### Custom Issue Type Mapping

Map feedback types to specific Jira issue types:

```typescript
const jira = createJiraAdapter({
  jiraUrl: process.env.JIRA_URL!,
  email: process.env.JIRA_EMAIL!,
  apiToken: process.env.JIRA_API_TOKEN!,
  projectKey: "PROJ",
  issueTypeMapping: {
    issue: "Bug",
    feature: "Story",
    like: "Task",
  },
});
```

### Custom Labels

Add default labels to all issues:

```typescript
const jira = createJiraAdapter({
  jiraUrl: process.env.JIRA_URL!,
  email: process.env.JIRA_EMAIL!,
  apiToken: process.env.JIRA_API_TOKEN!,
  projectKey: "PROJ",
  defaultLabels: ["ui-feedback", "from-anyclick"],
});
```

### Custom Fields

Include custom fields in issue creation:

```typescript
const jira = createJiraAdapter({
  jiraUrl: process.env.JIRA_URL!,
  email: process.env.JIRA_EMAIL!,
  apiToken: process.env.JIRA_API_TOKEN!,
  projectKey: "PROJ",
  customFields: {
    // Epic link
    customfield_10008: "PROJ-123",
    // Team
    customfield_16300: { id: "12345" },
  },
});
```

### Custom Formatters

Customize how feedback is formatted:

```typescript
import { defaultFormatSummary, defaultFormatDescription } from "@ewjdev/anyclick-jira/server";

const jira = createJiraAdapter({
  jiraUrl: process.env.JIRA_URL!,
  email: process.env.JIRA_EMAIL!,
  apiToken: process.env.JIRA_API_TOKEN!,
  projectKey: "PROJ",
  formatSummary: (payload) => {
    // Custom summary logic
    return `[Feedback] ${payload.element.selector}`;
  },
  formatDescription: (payload) => {
    // Start with default and customize
    const base = defaultFormatDescription(payload);
    // Add custom content...
    return base;
  },
});
```

## Multi-Adapter Setup (GitHub + Jira)

Submit feedback to both GitHub and Jira:

```typescript
// app/api/feedback/route.ts
import { createGitHubAdapter } from "@ewjdev/anyclick-github/server";
import { createJiraAdapter } from "@ewjdev/anyclick-jira/server";
import type { AnyclickPayload } from "@ewjdev/anyclick-core";

export async function POST(req: Request) {
  const payload: AnyclickPayload = await req.json();
  const results = [];

  // Submit to GitHub
  if (process.env.GITHUB_TOKEN) {
    try {
      const github = createGitHubAdapter({
        token: process.env.GITHUB_TOKEN,
        owner: "your-org",
        repo: "your-repo",
      });
      const issue = await github.createIssue(payload);
      results.push({ adapter: "GitHub", success: true, url: issue.htmlUrl });
    } catch (error) {
      results.push({ adapter: "GitHub", success: false, error: String(error) });
    }
  }

  // Submit to Jira
  if (process.env.JIRA_URL) {
    try {
      const jira = createJiraAdapter({
        jiraUrl: process.env.JIRA_URL,
        email: process.env.JIRA_EMAIL!,
        apiToken: process.env.JIRA_API_TOKEN!,
        projectKey: process.env.JIRA_PROJECT_KEY!,
      });
      const issue = await jira.createIssue(payload);
      results.push({ adapter: "Jira", success: true, url: issue.url });
    } catch (error) {
      results.push({ adapter: "Jira", success: false, error: String(error) });
    }
  }

  const hasSuccess = results.some((r) => r.success);
  return Response.json({
    success: hasSuccess,
    results,
  });
}
```

## Configuration Validation

Validate your Jira configuration:

```typescript
const jira = createJiraAdapter({
  jiraUrl: process.env.JIRA_URL!,
  email: process.env.JIRA_EMAIL!,
  apiToken: process.env.JIRA_API_TOKEN!,
  projectKey: "PROJ",
});

const isValid = await jira.validateConfiguration();
if (!isValid) {
  console.error("Jira configuration is invalid");
}
```

## Troubleshooting

### Authentication Errors

If you get 401 errors:
- Verify your email and API token are correct
- Make sure the API token hasn't expired
- Check that you're using the correct Jira URL

### Permission Errors

If you get 403 errors:
- Ensure your user has permission to create issues in the project
- Verify the project key is correct
- Check that the issue type exists in your project

### Invalid Issue Type

If you get validation errors about issue types:
- Check that the issue type name matches exactly (case-sensitive)
- Verify the issue type is available in your project
- Use `issueTypeMapping` to map feedback types to valid issue types

## Requirements

- Node.js >= 18.18.0
- Jira Cloud instance
- Valid Jira API token with issue creation permissions

## License

MIT

## Links

- [Documentation](https://anyclick.ewj.dev/docs/adapters)
- [GitHub Repository](https://github.com/ewjdev/anyclick)
- [Report Issues](https://github.com/ewjdev/anyclick/issues)

