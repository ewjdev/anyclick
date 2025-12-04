# release

This command walks through releasing a new version of the anyclick monorepo packages. It guides AI through a systematic release preparation and execution process.

## Overview

The release process ensures:

- All changes are properly documented
- Examples and documentation are updated
- Appropriate version bumps are selected
- Changesets are created correctly
- Everything builds and validates before release

## Prerequisites

Before starting, ensure:

- All changes are committed (or staged) in git
- Working directory is clean or changes are intentional
- You're on the correct branch (typically `main` or a release branch)
- Dependencies are installed (`yarn install`)

## Step-by-Step Release Process

### Step 1: Analyze Changes

**1.1 Get Git Status**

- Run `git status` to see current branch and uncommitted changes
- Run `git log --oneline -20` to see recent commits
- Identify the base branch/commit to compare against (usually `main` or `origin/main`)

**1.2 Analyze Modified Files**

- Run `git diff <base-branch> --name-only` to list all changed files
- Categorize changes by:
  - Package affected (`packages/anyclick-*`)
  - Type of change (features, fixes, docs, refactors, etc.)
  - Breaking vs non-breaking changes

**1.3 Identify Affected Packages**
For each changed file, determine which package(s) it belongs to:

- `packages/anyclick-core/**` → `@ewjdev/anyclick-core`
- `packages/anyclick-react/**` → `@ewjdev/anyclick-react`
- `packages/anyclick-pointer/**` → `@ewjdev/anyclick-pointer`
- `packages/anyclick-github/**` → `@ewjdev/anyclick-github`
- `packages/anyclick-cursor/**` → `@ewjdev/anyclick-cursor`
- `packages/anyclick-cursor-local/**` → `@ewjdev/anyclick-cursor-local`

Note: Packages are linked in `.changeset/config.json`, so versioning one may affect others.

**1.4 Determine Version Bump Types**
For each affected package, analyze changes to determine bump type:

- **Major** (`major`): Breaking changes (API changes, removed exports, incompatible behavior)
- **Minor** (`minor`): New features (new exports, new functionality, backwards compatible additions)
- **Patch** (`patch`): Bug fixes, internal improvements, documentation-only changes

### Step 2: Verify Documentation

**2.1 Check README Files**

- Verify `README.md` in root and each affected package is up-to-date
- Check that new features/exports are documented
- Ensure examples reflect current API
- Look for outdated information

**2.2 Check Package Documentation**
For each affected package:

- Read `packages/<package-name>/README.md`
- Verify API documentation matches code changes
- Check that examples are current and working
- Ensure all exported types/functions are documented

**2.3 Verify Examples**

- Check `apps/web/**` for example usage
- Verify examples use current API patterns
- Ensure examples compile and work with changes
- Update examples if API has changed

**2.4 Documentation Gaps**
If documentation is missing or outdated:

- **STOP** and update documentation first
- Create/update README files
- Add JSDoc comments to new exports
- Update examples to match changes
- Commit documentation updates before proceeding

### Step 3: Review CHANGELOG Files

**3.1 Check Existing CHANGELOGs**

- Read `packages/<package-name>/CHANGELOG.md` for each affected package
- Understand the current version and recent changes
- Note the format and style used

**3.2 Prepare Changelog Entries**
For each affected package, prepare changelog entries:

- Use clear, user-facing language
- Group by change type (Major Changes, Minor Changes, Patch Changes)
- Reference relevant commits or PRs
- Explain impact and migration if breaking

**Note**: Changesets will auto-generate changelog entries, but reviewing helps ensure accuracy.

### Step 4: Check for Existing Changesets

**4.1 List Existing Changesets**

- Run `ls -la .changeset/` to see existing changeset files
- Review any existing changesets to understand what's already staged

**4.2 Evaluate Existing Changesets**

- Check if existing changesets cover current changes
- Determine if new changesets are needed
- Consider if existing changesets need updates

### Step 5: Create Changesets

**5.1 Interactive Changeset Creation**
Run `yarn changeset` and for each affected package:

1. **Select Packages**: Choose all packages affected by the changes
2. **Choose Version Bump**: Select appropriate bump type (major/minor/patch)
3. **Write Summary**: Provide clear, descriptive summary:
   - What changed
   - Why it changed (if relevant)
   - Impact on users
   - Migration steps (if breaking)

**5.2 Changeset Summary Guidelines**

- Use present tense: "Add support for X" not "Added support for X"
- Be specific: "Fix memory leak in screenshot capture" not "Fix bug"
- Include context: "Add `onSubmit` prop to FeedbackMenuItem for custom submission handling"
- Link to issues: Reference GitHub issues/PRs when relevant

**5.3 Review Created Changesets**

- Read the generated `.changeset/*.md` files
- Verify packages and versions are correct
- Ensure summaries are clear and accurate
- Edit files directly if needed

### Step 6: Verify Build and Tests

**6.1 Build All Packages**

- Run `yarn build` to ensure all packages build successfully
- Fix any build errors before proceeding
- Verify TypeScript compilation passes

**6.2 Type Check**

- Ensure no TypeScript errors exist
- Check that type definitions are correct
- Verify exports are properly typed

**6.3 Lint Check**

- Run `yarn format` to ensure code is formatted
- Fix any linting issues

### Step 7: Version Packages

**7.1 Preview Version Changes**

- Run `yarn version-packages` to see what versions will be created
- Review the version bumps for each package
- Verify linked packages are versioned together correctly

**7.2 Review Generated Changelogs**
After versioning, check the updated `CHANGELOG.md` files:

- Verify entries are formatted correctly
- Ensure all changes are included
- Check that versions are correct
- Review for accuracy and completeness

**7.3 Commit Version Changes**

- Review `git status` to see what changed
- Commit the version and changelog updates:
  ```bash
  git add .
  git commit -m "chore: version packages"
  ```

### Step 8: Final Release Checks

**8.1 Verify Package.json Versions**

- Check `package.json` files for updated versions
- Verify dependency versions are updated correctly
- Ensure peer dependencies are compatible

**8.2 Review All Changes**

- Run `git diff` to review all changes
- Ensure nothing unexpected is included
- Verify all changesets are consumed

**8.3 Build One More Time**

- Run `yarn build` to ensure everything still builds
- Verify dist files are generated correctly
- Check that all packages are ready for publish

### Step 9: Publish Release

**9.1 Dry Run (Optional but Recommended)**

- Review what will be published
- Check npm registry permissions
- Verify package names and scopes

**9.2 Publish Packages**

- Run `yarn release` which executes:
  - `turbo run build` - Builds all packages
  - `changeset publish` - Publishes to npm

**9.3 Verify Publication**

- Check npm registry for published packages
- Verify versions match expectations
- Confirm all packages published successfully

### Step 10: Post-Release

**10.1 Create Release Tag (if needed)**

- Tag the release: `git tag v<version>` or `git tag <package>@<version>`
- Push tags: `git push --tags`

**10.2 Update Documentation**

- Update main README if needed
- Update website/docs if applicable
- Announce release if appropriate

**10.3 Clean Up**

- Remove consumed changeset files (they're auto-removed)
- Verify git status is clean
- Push commits if not already pushed

## AI Assistant Guidelines

When executing this release process, the AI should:

1. **Be Systematic**: Follow each step in order, don't skip ahead
2. **Verify Everything**: Check each step before proceeding
3. **Ask for Confirmation**: Before publishing, confirm with user
4. **Document Decisions**: Note any deviations or special cases
5. **Handle Errors Gracefully**: If something fails, explain why and suggest fixes
6. **Provide Context**: Show relevant git diffs, file contents, and outputs
7. **Be Thorough**: Don't assume - verify documentation, examples, and builds

## Common Issues and Solutions

**Issue**: Changeset asks for packages but none are listed

- **Solution**: Ensure you're in the monorepo root and packages are properly configured

**Issue**: Version bump seems wrong

- **Solution**: Review the changes carefully, consider if it's truly breaking/minor/patch

**Issue**: Build fails after versioning

- **Solution**: Check for version mismatches in dependencies, update as needed

**Issue**: Changelog format looks wrong

- **Solution**: Review `.changeset/config.json` and existing changelogs for format

**Issue**: Package not publishing

- **Solution**: Check npm permissions, verify `publishConfig` in package.json, check registry

## Quick Reference Commands

```bash
# Check status
git status
git log --oneline -20

# See changes
git diff <base-branch> --name-only
git diff <base-branch>

# Create changeset
yarn changeset

# Version packages
yarn version-packages

# Build
yarn build

# Format code
yarn format

# Publish
yarn release
```

## Notes

- This is a monorepo using Changesets for versioning
- Packages are linked: `@ewjdev/anyclick-*` packages version together
- The `web` app is ignored from versioning (see `.changeset/config.json`)
- Releases typically happen from the `main` branch
- GitHub Actions handles automated releases when changesets are merged to main
