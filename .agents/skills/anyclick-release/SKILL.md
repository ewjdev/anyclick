---
name: anyclick-release
description: Prepare or cut an AnyClick package release when asked to release, publish, version, or create the release PR. Reconciles merged features with documentation and Changesets, validates SemVer and linked-package effects, and verifies the published npm artifacts and website release record. Do not use for an ordinary feature PR that only needs its own changeset.
---

# AnyClick Release

Cut a release that tells one coherent truth across shipped code, package
versions, changelogs, npm, and the documentation website.

## Choose the boundary

Classify the request before mutating anything:

- **Audit** is read-only: report what is eligible, missing, and likely to be
  versioned.
- **Prepare** makes the release candidate ready and stops with the Changesets
  release PR green.
- **Cut** completes the publish and post-release verification. Proceed through
  the release-PR merge only when the user explicitly asks to release, cut, or
  publish the version. Treat an ambiguous "get the release ready" as Prepare.

Release from current `origin/main`, not from a feature branch. If the user does
not name the included features, define the candidate as the unconsumed
changesets already merged to `main` and say so. Open feature PRs are outside the
candidate until merged.

Before changing release files or triggering publication, read
[references/release-contract.md](references/release-contract.md). It contains
the repository-specific package, automation, and documentation invariants.

## Build the candidate ledger

Start with evidence from Git, GitHub, Changesets, and npm:

1. Fetch the remote and inspect the clean worktree, `origin/main`, recent
   package tags, open release PRs, and the latest Release workflow runs.
2. Inventory every unconsumed `.changeset/*.md` file other than the Changesets
   README. Map each entry to its merged implementation PR or commit.
3. Compare the latest published package versions in npm with package manifests
   and tags. Registry state is authoritative for what has already shipped.
4. Produce a ledger with feature/fix, affected package, changeset bump,
   documentation, validation, and merge status. Account for every candidate
   changeset before proceeding.

If external mutation is in scope, verify the active GitHub identity first.
Local npm authentication is unnecessary for the normal action-driven release;
verify it only if an explicitly authorized recovery requires manual publish.

## Enforce feature completeness

A user-visible feature is release-ready only when all applicable surfaces are
complete:

- implementation and public exports;
- relevant tests or an observable regression procedure;
- package README and JSDoc/API guidance;
- a working `apps/web` documentation page or example when users need one to
  adopt or understand the behavior;
- a user-facing changeset summary;
- migration guidance for every breaking change.

Fix gaps before versioning. Documentation must explain the shipped API and a
credible usage path; a changelog sentence alone is not feature documentation.
Keep docs-only maintenance out of package bumps unless it changes published
package content and a release is intentional.

## Validate SemVer through Changesets

Classify each package independently:

- **major** for a public breaking change or required consumer migration;
- **minor** for backward-compatible public capability;
- **patch** for backward-compatible fixes and internal improvements.

Check transitive consumers when a package API or dependency range changes.
Then run Changesets status and inspect its calculated release plan. The status
output and `.changeset/config.json` decide linked-package propagation; never
guess the final package set or hand-edit versions to force alignment.

Correct the source changesets when the plan is wrong. Let the Changesets action
generate package versions, internal dependency updates, and changelog sections.

## Prepare the release PR

1. Land every authorized candidate change, its docs, and its changeset on
   `main`; leave unrelated or unfinished work out.
2. Wait for the Release workflow to create or update `chore: release packages`.
   Reuse that PR instead of creating a competing version PR.
3. Review the generated package versions, changelogs, dependency ranges, and
   consumed changesets against the ledger.
4. Once the version is concrete, ensure the release PR contains a curated entry
   in `apps/web/src/data/releases.json`: accurate packages and type, a useful
   summary, substantive details, adoption-oriented highlights, `currentVersion`,
   and `lastUpdated`. Replace generic generated copy.
5. Run the repository's current CI commands and require every PR check to pass
   at the final head SHA. Exercise changed user-facing examples when build-only
   validation cannot prove the behavior.

Preparation is complete only when the release PR is mergeable, green, and its
code, docs, versions, changelogs, and release-page entry describe the same
candidate.

## Cut and verify

For an explicitly requested Cut:

1. Re-read the release PR head and confirm the approved candidate has not
   changed, then merge it.
2. Wait for the exact resulting `main` Release workflow to finish. The normal
   path is the repository's Changesets action; do not also run a local publish.
3. Verify every expected public package and version directly in npm, including
   the intended dist-tag. Verify the corresponding Git tags.
4. Verify `apps/web/src/data/releases.json` on `main` and the deployed roadmap
   or release surface. Confirm its features and documentation match what npm
   contains.
5. Confirm the release PR is merged, no expected package is missing, and the
   release workspace is clean.

Publication is complete only when GitHub automation, npm, tags, and the live
documentation surface agree. A successful workflow without registry readback
is not enough.

## Handle partial failure

Treat npm versions as immutable. On a partial publish, inventory registry state
package by package and inspect the Changesets action output before acting.
Resume only through a supported idempotent path; otherwise repair forward with
a new valid version and an explicit explanation. Use `yarn release` manually
only for an explicitly authorized recovery after verifying npm identity and the
exact unpublished package set.

## Report the release

Return the release version, published packages, included features/fixes,
documentation delivered, release PR and workflow evidence, npm and tag
readback, live docs verification, and any intentionally deferred work.
