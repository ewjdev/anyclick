# roadmap

## Description

Roadmap sync and audit command. This command syncs roadmap items from multiple sources (GitHub issues/PRs, plan files) and ensures consistency across the repository.

## Automated Sync

The roadmap is now automatically synced using the `sync-roadmap.mjs` script. This script:

1. Fetches GitHub issues/PRs with the `roadmap` label and `[Roadmap]` title prefix
2. Parses plan files (`.cursor/plans/*.plan.md`) with `roadmap: true` metadata
3. Merges and deduplicates items
4. Auto-assigns eras based on labels and heuristics
5. Updates `docs/roadmap.md` and `apps/web/src/data/roadmap-items.json`

### Running the Sync Script

```bash
# Full sync
node scripts/sync-roadmap.mjs

# Preview changes without writing files
node scripts/sync-roadmap.mjs --dry-run

# Show detailed output
node scripts/sync-roadmap.mjs --verbose

# Update only JSON file
node scripts/sync-roadmap.mjs --json-only

# Update only markdown file
node scripts/sync-roadmap.mjs --md-only
```

### Environment Variables

- `GITHUB_TOKEN` - GitHub personal access token for API access (required for GitHub sync)

### Configuration

Configuration is stored in `.cursor/config/roadmap.json`:

```json
{
  "github": {
    "owner": "ewjdev",
    "repo": "anyclick",
    "label": "roadmap",
    "titlePrefix": "[Roadmap]",
    "eraLabels": {
      "short-term": ["short-term", "next-up"],
      "mid-term": ["mid-term"],
      "later": ["later", "future"]
    }
  },
  "plans": {
    "directory": ".cursor/plans",
    "metadataKey": "roadmap",
    "metadataValue": true,
    "includeTodos": true
  },
  "eras": {
    "autoAssign": true,
    "defaultEra": "mid-term"
  },
  "output": {
    "markdownPath": "docs/roadmap.md",
    "jsonPath": "apps/web/src/data/roadmap-items.json"
  }
}
```

## Adding Roadmap Items

### Via GitHub Issues/PRs

1. Create an issue or PR
2. Add the `roadmap` label
3. Prefix the title with `[Roadmap]` (e.g., `[Roadmap] Add notifications package`)
4. Add an era label: `short-term`, `mid-term`, or `later`
5. Run the sync script or wait for CI to sync

### Via Plan Files

1. Create or update a plan file in `.cursor/plans/`
2. Add metadata section at the end:
   ```markdown
   Metadata
   - roadmap
   - short-term  (or mid-term, later)
   ```
3. Run the sync script

## When to Use Manual Audit

Run this command before each release to:

- Mark completed roadmap items with links to PRs, commits, or documentation
- Ensure consistency between `docs/roadmap.md`, the roadmap page, home page, docs, and examples
- Identify any discrepancies or outdated roadmap references

## Manual Audit Process

### 1. Run Sync Script

```bash
node scripts/sync-roadmap.mjs --verbose
```

Review the sync report for any issues.

### 2. Review Recent Work

- Review Changelogs in each package
- Check recent git commits (last 30 days or since last release tag) to identify completed features
- Review merged PRs for roadmap-related work
- Identify any features that match roadmap items but weren't explicitly tracked

### 3. Match Completed Work to Roadmap Items

- Compare completed work against items in `docs/roadmap.md`:
  - Short-term items
  - Mid-term items
  - Later items
- For each match, identify:
  - The specific roadmap item(s) completed
  - Relevant PR links, commit SHAs, or documentation URLs

### 4. Update Roadmap Items

For completed items on GitHub:
- Close the issue/PR
- The sync script will mark them as completed

For manual items:
- Update `apps/web/src/data/roadmap-items.json` directly
- Set `status` to `"completed"` or `"closed"`

### 5. Update Home Page (`apps/web/src/app/page.tsx`)

- Check for any roadmap references (e.g., "Coming Soon" badges, feature lists)
- Update "Soon" badges to "Available" or remove them if features are now live
- Ensure feature lists match current capabilities

### 6. Consistency Check

Verify all roadmap references are consistent across:
- `docs/roadmap.md` (auto-generated)
- `apps/web/src/data/roadmap-items.json` (auto-generated)
- `apps/web/src/app/roadmap/page.tsx` (reads from JSON)
- `apps/web/src/app/page.tsx` (home page)
- Documentation pages
- Example pages

## Files

### Auto-Generated (don't edit manually)

- `docs/roadmap.md` - Auto-updated markdown (edit sections outside markers)
- `apps/web/src/data/roadmap-items.json` - Synced roadmap data

### Configuration

- `.cursor/config/roadmap.json` - Sync configuration

### Scripts

- `scripts/sync-roadmap.mjs` - Main sync script
- `scripts/roadmap-utils.mjs` - Helper functions

### CI

- `.github/workflows/roadmap-sync.yml` - Automated sync on push to main

## Output Format

After completing the audit, provide:

1. **Sync Report**: Output from sync script
2. **Completed Items**: List of roadmap items marked as complete
3. **Updated Files**: List of files modified with brief description of changes
4. **Recommendations**: Suggestions for roadmap reprioritization or cleanup
