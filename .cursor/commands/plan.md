# plan command

Use this to spin up a structured plan from a user concept before writing code.

## Purpose
- Confirm scope and intent with the user before assuming.
- Capture a lightweight, actionable plan in `.cursor/plans/*.plan.md`.
- Ensure repo is in a clean, ready state (branch, deps) before execution.

## Quickstart Steps
1) Baseline repo state
   - `git status`; note dirty files.
   - If dirty, suggest a commit message; if on `main`, propose a new branch and commit there (do not revert).
   - If clean and on `main`, create a feature branch: `git checkout -b feat/<short-slug>`.
   - Install deps if not already: `yarn install`.
2) Understand the ask
   - Restate the user’s concept in 1–3 lines.
   - Ask clarifying questions (must do before assuming) about goal, scope, constraints, timeline, and success criteria.
   - Confirm any existing artifacts (docs, tickets, designs, APIs) to reuse.
3) Shape the plan
   - Identify deliverables and acceptance criteria.
   - Break into milestones/tasks sized for atomic commits (functionality + tests/checks + docs).
   - Call out risks, unknowns, dependencies, and mitigations.
   - Define verification per task (tests, lint/build, manual steps).
4) Write the plan file
   - Create/update `.cursor/plans/<slug>.plan.md` using the template below.
   - Fill in metadata (title, tags, optional roadmap flag) and sections.
5) Review with user
   - Summarize the plan and open questions.
   - Confirm the plan matches the request; revise if needed.

## Plan file template (`.cursor/plans/<slug>.plan.md`)
```
---
title: <Concise name>
summary: <1–2 sentence overview>
tags: [plan]
roadmap: <true|false>   # set true only if it should feed roadmap
---

## Goal
<What success looks like; include acceptance criteria.>

## Scope
- In scope: ...
- Out of scope: ...

## Requirements / Constraints
- Functional: ...
- Non-functional: ...
- Tech constraints / integrations: ...

## Milestones & Tasks
- M1: <name>
  - [ ] Task 1 (verification: <lint/build/test/manual>)
  - [ ] Task 2 ...
- M2: ...

## Dependencies / Risks
- Dependencies: ...
- Risks & mitigations: ...
- Open questions: ...

## Verification Plan
- Lint/build/type-check to run: ...
- Targeted tests/manual checks: ...
```

## Notes & Tips
- Keep tasks small enough for atomic commits (functionality + checks + docs).
- Prefer reusing existing patterns and configs from the repo.
- If blocked, document the blocker and a mitigation before proceeding.
