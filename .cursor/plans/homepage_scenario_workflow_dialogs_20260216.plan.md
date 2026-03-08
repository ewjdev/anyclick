# Homepage Scenario Workflow Dialogs

## Summary
Implement a shared workflow-drawer system on the homepage immersive workstreams so each scenario has exactly 3 right-click actions, and each action opens a relevant multi-step workflow dialog.

Locked choices:
- GitHub submission is real only for software "Report this bug" GitHub path.
- All other workflow submissions are demo-only.
- Keep software code editor visual, but keep menu actions fixed.
- Use heuristic AI-style title generation (no model call).

## Assumptions and Defaults
1. Use right-side panel UI for all workflows.
2. Every workflow shows Anyclick context: target selector, container selector, container screenshot, page URL/title.
3. Screenshot failures are non-blocking and show fallback.
4. GitHub failures/non-configured state offer "Complete as demo" fallback.
5. Changes remain in `apps/web` only (no `packages/*` API changes).

## Public API / Interface / Type Changes
1. Add `POST /api/feedback/github` at `apps/web/src/app/api/feedback/github/route.ts`.
2. Endpoint body is `AnyclickPayload`; supports:
   - `metadata.github.title` as preferred GitHub issue title.
   - `metadata.routing.adapter = "github"`.
3. Internal immersive changes:
   - Remove menu definitions from theme ownership.
   - Add workflow types under `apps/web/src/components/immersive-workstream/workflows/types.ts`.

## Workflow Catalog
- Software Development
  - Report this bug: Ticket system -> Issue details -> Review & submit (GitHub real, Jira demo)
  - Send to Cursor: Fix scope -> Prompt & constraints -> Review (demo)
  - Copy selector: Selector format -> Copy bundle (demo)
- E-commerce & Logistics
  - Item missing: Incident details -> Resolution path -> Confirm (demo)
  - Shipping issue: Shipment details -> Customer impact -> Confirm (demo)
  - Escalate order: Escalation target -> Priority/SLA -> Confirm (demo)
- Healthcare
  - Check-in issue: Issue type -> Patient context -> Confirm (demo)
  - Vital alert: Vital entry -> Clinical action -> Confirm (demo)
  - Flag urgent: Urgency classification -> Notification route -> Confirm (demo)
- Social Media
  - Save asset: Destination -> Metadata/tags -> Confirm (demo)
  - Flag content: Policy category -> Enforcement action -> Confirm (demo)
  - Quick reply: Draft reply -> Tone/approval -> Confirm (demo)

## Architecture Decisions
1. Use `ContextMenuItem.onClick` for all 12 actions; bypass default submit flow.
2. Build shared workflow launcher + drawer; action definitions live in registry.
3. Keep software editor visible and add fixed-workflow indicator.
4. Capture context with Anyclick core utilities:
   - `buildElementContext`
   - `captureScreenshot(..., "container")`
5. Isolate GitHub submit via dedicated `/api/feedback/github` endpoint.

## Implementation Steps
1. Add workflow foundation files:
   - `workflows/types.ts`
   - `workflows/registry.ts`
   - `workflows/titleHeuristics.ts`
   - `workflows/contextCapture.ts`
2. Add shared launcher + UI:
   - `workflows/WorkflowDrawer.tsx`
   - `workflows/useWorkflowLauncher.tsx`
   - `workflows/WorkflowFlowRenderer.tsx`
3. Integrate sections:
   - `sections/SoftwareDevelopmentSection.tsx`
   - `sections/DefaultWorkstreamSection.tsx`
   - `sections/HealthcareSection.tsx`
4. Lock software editor behavior and copy:
   - `cards/SoftwareEditorCard.tsx`
   - `softwareCode.ts`
5. Move menu ownership out of theme model:
   - `types.ts`
   - `themes.tsx`
6. Add GitHub-only endpoint:
   - `app/api/feedback/github/route.ts`
7. Wire software GitHub submit path in workflow renderer.

## Validation
1. Each scenario shows exactly 3 right-click menu items.
2. All 12 actions open relevant dialogs with multi-step forms.
3. Context panel shows selector/container selector/screenshot or fallback.
4. Software bug flow first step has Jira + GitHub choices.
5. GitHub title prefilled heuristically; editable/regeneratable.
6. GitHub submit succeeds when configured.
7. GitHub failure offers demo completion.
8. All non-software flows complete without backend dependency.
9. Escape/close behavior works and body scroll restores.
10. Run `yarn --cwd /Users/ericjohnson/Desktop/projects/anyclick/apps/web lint`.
