# AnyClick release contract

Read this reference before preparing or cutting a release. Inspect the named
files live because their contents may change; these notes preserve the
relationships and failure modes that are easy to miss.

## Sources of truth

| Concern                                             | Source                                                     |
| --------------------------------------------------- | ---------------------------------------------------------- |
| Publishable packages, versions, and internal ranges | `packages/*/package.json`                                  |
| Bump intent and user-facing changelog input         | `.changeset/*.md`                                          |
| Linked packages and ignored workspaces              | `.changeset/config.json`                                   |
| Generated package release notes                     | `packages/*/CHANGELOG.md`                                  |
| Build, type, lint, formatting, and web checks       | `.github/workflows/ci.yml`                                 |
| Version PR and npm publication                      | `.github/workflows/release.yml`                            |
| Public release timeline                             | `apps/web/src/data/releases.json`                          |
| Post-publish timeline updater                       | `scripts/update-releases-json.mjs`                         |
| Feature documentation                               | affected package README/JSDoc and `apps/web` docs/examples |
| Published fact                                      | npm registry plus Git tags                                 |

Use repository scripts and workflow definitions as the command source of truth
instead of copying their command lines into release notes or the skill.

## Automation shape

The Release workflow runs on pushes to `main` and uses `changesets/action`.

- When unconsumed changesets exist, it creates or updates the release PR titled
  `chore: release packages` using the repository's version script.
- Merging that version PR causes the next `main` run to publish through the
  repository's release script.
- After a successful publish, the workflow runs
  `scripts/update-releases-json.mjs` and pushes a release-timeline update when
  needed.

This makes the release PR the review gate. Running the version or publish
scripts independently creates a competing path and is reserved for deliberate
recovery.

## Package rules

- `.changeset/config.json` currently links the `@ewjdev/anyclick-*` family,
  updates internal dependencies at patch level, and ignores `web-app` and
  `@ewjdev/anyclick-protocol`.
- Linked-package behavior can change and is not equivalent to "always bump
  every package." Use Changesets status to calculate the actual plan.
- The web app is documentation/deployment surface, not an npm release target.
- The extension manifest has its own version field. Change it only when an
  extension release is in scope and verify the extension's distribution path
  separately.
- New public packages need publish metadata, build output, registry access, and
  Changesets participation reviewed before they enter a release.

## Documentation gate

For each candidate, locate how a new consumer would discover and use it. A
complete path usually includes:

1. Package README guidance near the affected API.
2. Accurate exported types and JSDoc.
3. A web docs page or executable example for visual, interactive, or
   integration behavior.
4. A changeset written as release-note copy rather than implementation notes.
5. Migration steps and before/after usage for breaking changes.

The release-timeline updater derives entries from generated changelogs, but its
fallback details and highlights are generic. Curate the matching
`apps/web/src/data/releases.json` entry once the version is known so the public
site names the actual capabilities. Ensure only the newest release remains in
the `today` era and keep `currentVersion` and `lastUpdated` consistent.

## SemVer review questions

For every public change, answer:

- Can existing consumer code compile and behave as before without edits?
- Is a public export, option, event, package, or supported behavior being added?
- Are defaults, side effects, DOM structure, CSS hooks, wire formats, or runtime
  requirements changing incompatibly?
- Does a downstream AnyClick package expose or rely on the changed contract?
- Does the changeset name every directly affected package and explain migration
  where required?

Use the highest required bump for each package, then let Changesets calculate
linked and dependency-driven releases.

## Final evidence

Capture all of the following before declaring success:

- final release PR URL, merge commit, and green checks at its last head;
- successful Release workflow tied to the resulting `main` commit;
- `npm view` readback for each expected `package@version` and dist-tag;
- matching Git tags;
- the release entry on `main` and the live web surface;
- a clean release workspace and a list of work intentionally deferred.

If any source disagrees, report the release as incomplete and identify the
authoritative mismatch.
