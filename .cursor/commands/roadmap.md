# roadmap

## Description
Pre-release roadmap audit and update command. This command ensures that completed roadmap items are properly documented with links to implementation details, and that all roadmap references across the repository are kept in sync.

## When to Use
Run this command before each release to:
- Mark completed roadmap items with links to PRs, commits, or documentation
- Ensure consistency between `docs/roadmap.md`, the roadmap page, home page, docs, and examples
- Identify any discrepancies or outdated roadmap references

## Process

### 1. Review Recent Work
- Review Changelogs in each package
- Check recent git commits (last 30 days or since last release tag) to identify completed features
- Review merged PRs for roadmap-related work
- Look for commit messages, PR titles, and PR descriptions that reference roadmap items
- Identify any features that match roadmap items but weren't explicitly tracked

### 2. Match Completed Work to Roadmap Items
- Compare completed work against items in `docs/roadmap.md`:
  - Short-term items
  - Mid-term items  
  - Later items
- For each match, identify:
  - The specific roadmap item(s) completed
  - Relevant PR links, commit SHAs, or documentation URLs
  - Any related documentation or examples created

### 3. Update `docs/roadmap.md`
- For completed items, mark them with:
  - ✅ Checkmark prefix
  - Link to PR, commit, or relevant documentation in format: `[PR #123](https://github.com/ewjdev/anyclick/pull/123)` or `[commit abc123](https://github.com/ewjdev/anyclick/commit/abc123)`
- Move completed items to a new "Completed" section at the top (if significant) or mark inline
- Example format:
  ```markdown
  - ✅ Notifications package: Toast → Banner → Inline → Indicator, with NotificationContainer mount point. [PR #45](https://github.com/ewjdev/anyclick/pull/45)
  ```

### 4. Update Roadmap Page (`apps/web/src/app/roadmap/page.tsx`)
- Review the `sections` array and ensure it matches `docs/roadmap.md`
- For completed items:
  - Option A: Remove from the roadmap page if they're fully shipped
  - Option B: Add a "Recently Completed" section at the top showing recently completed items with links
  - Option C: Keep in place but add visual indicators (checkmarks, "Completed" badges)
- Ensure all roadmap items from `docs/roadmap.md` are represented (or intentionally excluded)

### 5. Update Home Page (`apps/web/src/app/page.tsx`)
- Check for any roadmap references (e.g., "Coming Soon" badges, feature lists)
- Update "Soon" badges to "Available" or remove them if features are now live
- Ensure feature lists match current capabilities
- Look for mentions of roadmap items in:
  - Use cases section
  - Feature highlights
  - Any "Coming Soon" or roadmap teasers

### 6. Review Documentation Pages (`apps/web/src/app/docs/**/*.tsx`)
- Check all docs pages for roadmap references
- Update any outdated roadmap mentions
- Ensure examples reflect completed features
- Verify that "coming soon" or "planned" features are accurately represented

### 7. Review Examples (`apps/web/src/app/examples/**/*.tsx`)
- Ensure examples showcase completed roadmap features
- Update example descriptions if they reference roadmap items
- Add examples for newly completed features if appropriate

### 8. Consistency Check
- Verify all roadmap references are consistent across:
  - `docs/roadmap.md` (source of truth)
  - `apps/web/src/app/roadmap/page.tsx` (public roadmap page)
  - `apps/web/src/app/page.tsx` (home page)
  - Documentation pages
  - Example pages
- Flag any discrepancies for manual review

### 9. Create Summary
- List all completed items with their links
- List any items that need manual review or clarification
- Note any inconsistencies found and how they were resolved
- Suggest any roadmap items that may need reprioritization based on completed work

## Files to Review/Update
- `docs/roadmap.md` - Primary roadmap definition
- `apps/web/src/app/roadmap/page.tsx` - Public roadmap page component
- `apps/web/src/app/page.tsx` - Home page with feature lists
- `apps/web/src/app/docs/**/*.tsx` - All documentation pages
- `apps/web/src/app/examples/**/*.tsx` - All example pages

## Output Format
After completing the audit, provide:
1. **Completed Items**: List of roadmap items marked as complete with links
2. **Updated Files**: List of files modified with brief description of changes
3. **Consistency Report**: Any discrepancies found and how they were resolved
4. **Recommendations**: Suggestions for roadmap reprioritization or cleanup