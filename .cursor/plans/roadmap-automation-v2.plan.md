# Roadmap Automation Pipeline

## Overview

Create an automated system that syncs roadmap items from multiple sources (GitHub issues/PRs, plan files) to both `docs/roadmap.md` and the roadmap page (`apps/web/src/app/roadmap/page.tsx`), ensuring consistency and reducing manual work.

## Data Sources

### 1. GitHub Issues & PRs

- **Identification**: Items must have BOTH:
        - GitHub label: `roadmap` (or configurable label)
        - Title prefix: `[Roadmap]` (or configurable prefix)
- **Metadata extraction**:
        - Title (without prefix)
        - Description/body
        - Labels for era assignment (`short-term`, `mid-term`, `later`)
        - Status (open/closed)
        - PR/Issue number and URL
        - Assignees
        - Milestones (optional)

### 2. Plan Files (`.cursor/plans/*.plan.md`)

- **Identification**: Plan files with metadata field `roadmap: true`
- **Metadata extraction**:
        - Plan name/title
        - Overview/description
        - Todos (as sub-items)
        - Era assignment from metadata or auto-detect
        - File path for reference

## Era Assignment Logic

Auto-assign eras based on:

1. **Explicit labels/metadata**: `short-term`, `mid-term`, `later` labels take precedence
2. **Milestone dates**: If milestone exists, calculate timeframe
3. **Issue age**: Older issues → "Later", recent → "Short-term"
4. **Priority labels**: `priority:high` → "Short-term", `priority:low` → "Later"
5. **Default**: Unassigned items go to "Mid-term"

## Implementation Components

### 1. Roadmap Sync Script (`scripts/sync-roadmap.mjs`)

**Responsibilities**:

- Fetch GitHub issues/PRs with roadmap label and prefix
- Parse plan files for roadmap metadata
- Merge and deduplicate items
- Assign eras automatically
- Generate structured roadmap data
- Update `docs/roadmap.md` (markdown format)
- Update `apps/web/src/data/roadmap-items.json` (JSON for React page)

**Input**:

- GitHub token (from env or secrets)
- Config file: `.cursor/config/roadmap.json` (optional)

**Output**:

- Updated `docs/roadmap.md`
- Updated `apps/web/src/data/roadmap-items.json`
- Sync report (stdout or file)

### 2. Roadmap Data Structure (`apps/web/src/data/roadmap-items.json`)

```json
{
  "items": [
    {
      "id": "github-123",
      "source": "github",
      "type": "issue",
      "title": "Notifications package",
      "description": "Toast → Banner → Inline → Indicator...",
      "era": "short-term",
      "status": "open",
      "url": "https://github.com/ewjdev/anyclick/issues/123",
      "labels": ["roadmap", "short-term"],
      "assignees": [],
      "updatedAt": "2024-12-05T00:00:00Z"
    },
    {
      "id": "plan-error-handling",
      "source": "plan",
      "type": "plan",
      "title": "Error Handling System",
      "description": "Core error ingestion stack...",
      "era": "mid-term",
      "status": "active",
      "url": ".cursor/plans/error-handling.plan.md",
      "todos": ["task1", "task2"],
      "updatedAt": "2024-12-05T00:00:00Z"
    }
  ],
  "lastSynced": "2024-12-05T00:00:00Z",
  "version": "1.0.0"
}
```

### 3. Update Roadmap Command (`.cursor/commands/roadmap.md`)

**Enhanced Process**:

1. Run `scripts/sync-roadmap.mjs` to fetch latest items
2. Review sync report for new/changed items
3. Manual review step for era assignments (if needed)
4. Update `docs/roadmap.md` with synced items
5. Update roadmap page to consume `roadmap-items.json`
6. Verify consistency across all files
7. Generate summary report

### 4. Roadmap Page Integration (`apps/web/src/app/roadmap/page.tsx`)

**Changes**:

- Import roadmap items from `apps/web/src/data/roadmap-items.json`
- Display items grouped by era (matching `docs/roadmap.md` structure)
- Show source badges (GitHub, Plan)
- Link to GitHub issues/PRs or plan files
- Show status indicators (open/closed, active/completed)
- Filter/search capabilities (optional enhancement)

### 5. CI Integration (`.github/workflows/roadmap-sync.yml`)

**Trigger**:

- On push to `main` branch
- On PR with `[roadmap]` in title
- Manual workflow dispatch

**Steps**:

1. Checkout repo
2. Setup Node.js
3. Install dependencies
4. Run `scripts/sync-roadmap.mjs`
5. Check for changes to `docs/roadmap.md` or `roadmap-items.json`
6. If changes exist:

            - Commit changes (if on main)
            - Comment on PR (if PR)
            - Create summary comment

## Configuration File (`.cursor/config/roadmap.json`)

```json
{
  "github": {
    "label": "roadmap",
    "titlePrefix": "[Roadmap]",
    "eraLabels": {
      "short-term": ["short-term", "next-up"],
      "mid-term": ["mid-term"],
      "later": ["later", "future"]
    }
  },
  "plans": {
    "metadataKey": "roadmap",
    "metadataValue": true,
    "includeTodos": true
  },
  "eras": {
    "autoAssign": true,
    "defaultEra": "mid-term",
    "rules": [
      {
        "condition": "label:priority:high",
        "era": "short-term"
      },
      {
        "condition": "age:>90days",
        "era": "later"
      }
    ]
  },
  "output": {
    "markdownPath": "docs/roadmap.md",
    "jsonPath": "apps/web/src/data/roadmap-items.json"
  }
}
```

## File Structure

```
scripts/
  sync-roadmap.mjs          # Main sync script
  roadmap-utils.mjs          # Helper functions
.cursor/
  config/
    roadmap.json            # Configuration
  commands/
    roadmap.md              # Updated command docs
.github/
  workflows/
    roadmap-sync.yml        # CI workflow
apps/web/src/
  data/
    roadmap-items.json      # Synced roadmap data
  app/
    roadmap/
      page.tsx              # Updated to use roadmap-items.json
docs/
  roadmap.md                # Auto-updated markdown
```

## Sync Script Features

1. **GitHub API Integration**:

            - Fetch issues with roadmap label
            - Filter by title prefix
            - Extract metadata and labels
            - Handle pagination

2. **Plan File Parsing**:

            - Scan `.cursor/plans/*.plan.md`
            - Parse frontmatter/metadata
            - Extract title, description, todos
            - Link to plan file

3. **Deduplication**:

            - Match items by title similarity
            - Prefer GitHub items over plans (if duplicate)
            - Merge metadata when appropriate

4. **Era Assignment**:

            - Apply rules from config
            - Use labels as primary source
            - Fall back to heuristics
            - Log assignments for review

5. **Markdown Generation**:

            - Format items by era
            - Include links to sources
            - Preserve manual edits (comments, formatting)
            - Generate clean, consistent structure

6. **JSON Generation**:

            - Structured data for React page
            - Include all metadata
            - Sortable/filterable format

## Manual Override Support

- Allow manual edits to `docs/roadmap.md` with special markers:
```markdown
<!-- ROADMAP:AUTO-START -->
<!-- Auto-generated content -->
<!-- ROADMAP:AUTO-END -->
```

- Manual items outside markers preserved
- Sync script only updates auto section

## Error Handling

- GitHub API rate limiting (exponential backoff)
- Missing/invalid plan files (skip with warning)
- Invalid JSON/metadata (log error, continue)
- Merge conflicts (detect and report)

## Testing Strategy

1. **Unit tests**: Era assignment logic, parsing functions
2. **Integration tests**: GitHub API mocking, file I/O
3. **Manual testing**: Run sync script, verify outputs
4. **CI testing**: Test workflow on PR

## Migration Path

1. Create initial `roadmap-items.json` from current `docs/roadmap.md`
2. Update roadmap page to use JSON
3. Deploy sync script
4. Run initial sync
5. Enable CI workflow
6. Monitor and refine

## Success Criteria

- ✅ All roadmap items from GitHub and plans appear in both files
- ✅ Sync runs automatically in CI
- ✅ Manual command provides clear feedback
- ✅ No data loss during sync
- ✅ Era assignments are accurate
- ✅ Links work correctly
- ✅ Page renders correctly with synced data