---
name: Move JiraFeedbackMenu to Package
overview: Move the JiraFeedbackMenu component and its dependencies from the web app examples to the `@ewjdev/anyclick-jira` package, converting Tailwind styles to inline CSS and making the API endpoint configurable via props and/or a provider.
todos:
  - id: package-setup
    content: Update package.json with new exports, peer dependencies, and lucide-react dependency
    status: completed
  - id: create-context
    content: Create JiraFeedbackContext.tsx with provider and configurable API endpoint
    status: completed
  - id: convert-types
    content: Move and adapt types.ts to the package
    status: completed
  - id: convert-utils
    content: Move jiraHelpers.ts with cn() replacement utility
    status: completed
  - id: convert-hooks
    content: Move useJiraFeedbackController.ts and useJiraPreferences.ts, update fetch URLs to use config
    status: completed
  - id: convert-components
    content: Move all step components, converting Tailwind classes to inline styles
    status: completed
  - id: convert-inputs
    content: Move AutocompleteInput.tsx, FieldInput.tsx, Icons.tsx with inline styles
    status: completed
  - id: convert-main
    content: Move JiraFeedbackMenu.tsx with inline styles and context integration
    status: completed
  - id: create-export
    content: Create react.ts entry file exporting JiraFeedbackMenu, JiraFeedbackProvider, and types
    status: completed
  - id: update-build
    content: Update tsup config and tsconfig.json for React/JSX support
    status: completed
  - id: update-example
    content: Update apps/web example to import from @ewjdev/anyclick-jira/react
    status: completed
---

# Move JiraFeedbackMenu to anyclick-jira Package

## Overview

Move all Jira feedback menu files from `apps/web/src/app/examples/jira-integration/` to `packages/anyclick-jira/src/react/`, converting Tailwind to inline styles and adding configurable API endpoints.

## Files to Move and Transform

### Source Files (from `apps/web/src/app/examples/jira-integration/`)

- `JiraFeedbackMenu.tsx` - Main component
- `types.ts` - TypeScript types
- `hooks/useJiraFeedbackController.ts` - Controller hook
- `hooks/useJiraPreferences.ts` - Preferences hook
- `utils/jiraHelpers.ts` - Utility functions
- `components/` - All step components and inputs

### Target Location

`packages/anyclick-jira/src/react/`

## Key Changes

### 1. Package Configuration (`packages/anyclick-jira/package.json`)

Add new export entry and dependencies:

```json
{
  "exports": {
    "./react": {
      "types": "./dist/react.d.ts",
      "require": "./dist/react.js",
      "import": "./dist/react.mjs"
    }
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "dependencies": {
    "lucide-react": "^0.460.0"
  }
}
```

### 2. API Endpoint Configuration

Create a context provider (`JiraFeedbackContext.tsx`) and update props:

```typescript
interface JiraFeedbackConfig {
  apiEndpoint?: string; // defaults to "/api/ac/jira"
}

const JiraFeedbackContext = createContext<JiraFeedbackConfig>({});

export function JiraFeedbackProvider({ config, children }) { ... }

// Props accept optional override
interface JiraFeedbackMenuProps {
  // ... existing props
  apiEndpoint?: string; // overrides provider config
}
```

### 3. Style Conversion

Convert all Tailwind classes to inline styles using a style object pattern:

```typescript
// Before
<div className="p-4 bg-white rounded-xl border border-gray-200">

// After
<div style={styles.container}>

const styles = {
  container: {
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb'
  }
}
```

### 4. cn() Utility Replacement

Replace `cn()` from `@/lib/utils` with a simple inline merge or remove conditional class logic:

```typescript
// Create local utility
function mergeStyles(...styles: (CSSProperties | undefined)[]): CSSProperties {
  return Object.assign({}, ...styles.filter(Boolean));
}
```

## Updated Example (apps/web)

After the move, update `apps/web/src/app/examples/jira-integration/page.tsx`:

```typescript
import { JiraFeedbackMenu } from "@ewjdev/anyclick-jira/react";
// OR with provider:
import { JiraFeedbackMenu, JiraFeedbackProvider } from "@ewjdev/anyclick-jira/react";
```

The example page will become a simple demo that imports from the package.

## Build Configuration

Update `packages/anyclick-jira/tsconfig.json` for JSX support and add `react.ts` to the tsup build config.