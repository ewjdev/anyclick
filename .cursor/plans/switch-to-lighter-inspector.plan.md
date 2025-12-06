## Goal

Optimize the mobile experience by using a lighter-weight inspector (`InspectSimple`) in the web app instead of the heavy devtools inspector, while ensuring the Chrome preset continues to work seamlessly.

## Scope

- **In scope**: 
- Rename `InspectDialog.tsx` to `InspectSimple.tsx` in `anyclick-react` package
- Update `InspectDialogManager` to use `InspectSimple`
- Update package exports in `anyclick-react/src/index.ts`
- Update web app to use `InspectDialogManager` from `@ewjdev/anyclick-react` instead of `@ewjdev/anyclick-devtools`
- **Out of scope**: 
- Changes to the devtools inspector itself
- Changes to other presets beyond Chrome (they will continue to work)

## Requirements / Constraints

- **Functional**: 
- Chrome preset "Inspect" menu item must continue to work
- Inspector must display element information (selector, contents, HTML, screenshot)
- Mobile-friendly lightweight implementation
- **Non-functional**: 
- Maintain backward compatibility where possible
- Keep API surface consistent
- **Tech constraints**: 
- Event-based system (`openInspectDialog`) remains unchanged
- `InspectDialogManager` continues to listen for `INSPECT_DIALOG_EVENT`

## Milestones & Tasks

- M1: Rename and refactor component
- M2: Update manager to use InspectSimple
- M3: Update package exports
- M4: Update web app

## Dependencies / Risks

- **Dependencies**: 
- All tasks depend on previous milestone completion
- Web app update depends on package exports being correct
- **Risks & mitigations**: 
- Breaking changes if exports aren't updated correctly → Mitigation: Verify all exports in `index.ts`
- Type errors if component props don't match → Mitigation: Ensure `InspectSimple` has same props interface as `InspectDialog`
- Web app might have other dependencies on devtools inspector → Mitigation: Check for other imports of `@ewjdev/anyclick-devtools` in web app
- **Open questions**: 
- Should we keep `InspectDialog` as an alias export for backward compatibility? (Probably not needed since this is internal refactor)

## Verification Plan (In Browser)

- **Lint/build/type-check**: 
- Run `yarn build` in `packages/anyclick-react` to verify package builds
- Run `yarn build` in `apps/web` to verify web app builds
- Run TypeScript type checking
- **Targeted tests/manual checks**: 
- Test Chrome preset "Inspect" menu item opens inspector on mobile with no latency
- Verify inspector displays correctly on mobile viewport
- Verify all inspector actions work (copy selector, copy HTML, save screenshot, open in IDE (cursor))