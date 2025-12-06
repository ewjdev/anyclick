---
name: Jira Feedback UX Enhancements
overview: Enhance JiraFeedbackMenu with optimistic description pre-fill, persistent form memory via sessionStorage (for both credentials and field preferences), and a seamless fallback for users without backend Jira configuration.
todos:
  - id: preferences-hook
    content: Create useJiraPreferences hook for sessionStorage management (credentials + field defaults)
    status: completed
  - id: context-description
    content: Add generateContextDescription helper and pre-fill description field
    status: completed
  - id: configure-step
    content: Add 'configure' step UI for users without backend Jira config
    status: completed
  - id: api-session-creds
    content: Update API route to accept credentials via x-jira-credentials header
    status: completed
  - id: remember-fields
    content: Save and restore field values per issue type on form load/submit
    status: completed
  - id: auto-select-type
    content: Auto-select last-used issue type with option to change
    status: completed
---

# Jira Feedback UX Enhancements

## Key Files

- `apps/web/src/app/examples/jira-integration/JiraFeedbackMenu.tsx` - Main component changes
- `apps/web/src/app/api/ac/jira/route.ts` - API route to accept session credentials

## 1. Optimistic Description Pre-fill

Pre-populate the description field with rich context when the form loads:

```typescript
const generateContextDescription = (targetElement: Element | null, containerElement: Element | null) => {
  const tag = targetElement?.tagName.toLowerCase() || 'element';
  const testId = targetElement?.getAttribute('data-testid');
  const id = targetElement?.id;
  const page = typeof window !== 'undefined' ? window.location.pathname : '';
  
  return `**Element:** ${tag}${testId ? ` [data-testid="${testId}"]` : ''}${id ? ` #${id}` : ''}
**Page:** ${page}
**URL:** ${window.location.href}

**Issue Description:**
`;
};
```

Apply this in `fetchFieldsForType` when initializing `formData.description`.

## 2. Session Storage for Form Memory

Create a unified storage utility that persists:

- Jira credentials (when user-provided)
- Last-used field values per issue type
```typescript
const STORAGE_KEY = 'anyclick-jira-preferences';

interface JiraPreferences {
  credentials?: {
    jiraUrl: string;
    email: string;
    apiToken: string;
    projectKey: string;
  };
  fieldDefaults: {
    [issueType: string]: Record<string, any>;  // e.g. { "Bug": { priority: "10002" } }
  };
  lastIssueType?: string;
}
```

- **Load on mount:** Read preferences and apply defaults
- **Save on submit:** After successful submission, save the selected values
- **Auto-select last issue type:** Skip type selection if user has a recent preference

## 3. Credentials Fallback UI

When backend is not configured (`/api/ac/jira?action=status` returns `configured: false`):

1. Show a "Configure Jira" step before type selection
2. Fields: Jira URL, Email, API Token, Project Key
3. Store in sessionStorage on save
4. Pass credentials via request headers to the API

API route changes in `route.ts`:

```typescript
// Check for session credentials in headers
const sessionCreds = req.headers.get('x-jira-credentials');
if (sessionCreds) {
  const creds = JSON.parse(sessionCreds);
  // Use these instead of env vars
}
```

## 4. UX Flow Changes

**New step states:**

```typescript
type Step = "loading" | "configure" | "type-selection" | "form" | "submitting" | "success" | "error";
```

**Flow:**

1. Check config status
2. If not configured → show "configure" step (one-time per session)
3. If configured (or after user configures) → type-selection (auto-select if remembered)
4. Form with pre-filled description and remembered field values
5. On success → save preferences to sessionStorage

## Implementation Checklist

1. Add `useJiraPreferences` hook for sessionStorage read/write
2. Add `generateContextDescription` helper
3. Add "configure" step UI with credential form
4. Modify API route to accept header-based credentials
5. Pre-fill description in `fetchFieldsForType`
6. Apply remembered field defaults when loading form
7. Save field values on successful submission
8. Auto-select remembered issue type (with option to change)