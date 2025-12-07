---
name: InspectSimple swap
overview: Replace heavy devtools inspector with lightweight InspectSimple across anyclick-react and web app while keeping Chrome preset inspect flow working.
todos:
  - id: rename-component
    content: Rename InspectDialog component/file to InspectSimple with same props
    status: completed
  - id: update-manager
    content: Use InspectSimple inside InspectDialogManager
    status: completed
  - id: export-update
    content: Expose InspectSimple in anyclick-react index exports
    status: completed
  - id: web-app-imports
    content: Point web app to anyclick-react InspectDialogManager
    status: completed
  - id: verify-build
    content: Run builds/type-checks for anyclick-react and apps/web
    status: completed
---

# Replace inspector with InspectSimple

- Update anyclick-react to rename `InspectDialog.tsx` to `InspectSimple.tsx` (keeping the same props/signature) and ensure it stays mobile-friendly and shows selector/content/HTML/screenshot.
- Adjust `InspectDialogManager` to render the new `InspectSimple` while still listening to `INSPECT_DIALOG_EVENT` / `openInspectDialog`.
- Fix package exports in `anyclick-react/src/index.ts` to expose `InspectSimple` (no `InspectDialog` alias per decision).
- In the web app, switch imports to use `InspectDialogManager` from `@ewjdev/anyclick-react` instead of `@ewjdev/anyclick-devtools`; clean up any remaining devtools inspector usage.
- Verify build/type-check for `packages/anyclick-react` and `apps/web`; smoke-check Chrome preset Inspect flow after changes.