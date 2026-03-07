# Decouple `@ewjdev/anyclick-react` Styling and Ship Default Style Providers

## Summary

Refactor `@ewjdev/anyclick-react` into a headless-by-default UI package that renders Anyclick behavior and structure without importing Tailwind or bundling a styling framework. Move styling into a formal adapter layer, then ship three companion packages for the default styling systems:

- `@ewjdev/anyclick-react-tailwind`
- `@ewjdev/anyclick-react-shadcn`
- `@ewjdev/anyclick-react-mui`

This will be a major-version change for `@ewjdev/anyclick-react`. The current implicit Tailwind import in [`packages/anyclick-react/src/index.ts`](/Users/ericjohnson/Desktop/projects/anyclick/packages/anyclick-react/src/index.ts) is removed, and the current mixed styling model in [`packages/anyclick-react/src/styles.ts`](/Users/ericjohnson/Desktop/projects/anyclick/packages/anyclick-react/src/styles.ts), [`packages/anyclick-react/src/ContextMenu.tsx`](/Users/ericjohnson/Desktop/projects/anyclick/packages/anyclick-react/src/ContextMenu.tsx), [`packages/anyclick-react/src/ScreenshotPreview.tsx`](/Users/ericjohnson/Desktop/projects/anyclick/packages/anyclick-react/src/ScreenshotPreview.tsx), and [`packages/anyclick-react/src/ui/button.tsx`](/Users/ericjohnson/Desktop/projects/anyclick/packages/anyclick-react/src/ui/button.tsx) is replaced by a slot-based styling contract plus optional component overrides.

## Context Summary

Current coupling points:

- `@ewjdev/anyclick-react` auto-imports Tailwind CSS from package entry.
- The package uses a hybrid of:
  - inline style maps for menu/screenshot surfaces
  - Tailwind-prefixed utility classes for buttons, inputs, icons, and some layout
  - CSS variables from `tokens.css`
- Existing public styling hooks are too narrow:
  - `menuClassName`
  - `menuStyle`
  - `AnyclickTheme.menuClassName`
  - `AnyclickTheme.menuStyle`
- Styling inheritance today is merged through provider theme logic, not a reusable styling system.

Target outcome:

- Consumers can style Anyclick using the same mechanism as the host app.
- Tailwind, shadcn-style, and MUI defaults are first-class and shipped by us.
- Core runtime no longer depends on Tailwind or any other UI framework.

## Architecture Decisions and Rationale

- `@ewjdev/anyclick-react` becomes headless and framework-agnostic for styling.
Reason: this removes hard coupling, avoids shipping unwanted CSS, and gives a clean base for all style systems.

- Styling defaults ship as companion packages, not subpath exports inside the core package.
Reason: MUI brings heavy peer dependencies, and companion packages keep dependency graphs clean and predictable.

- The new styling contract is slot-based with optional component overrides.
Reason: Tailwind and shadcn work well with class-slot recipes, while MUI needs actual component wrappers. A contract that supports both avoids maintaining multiple incompatible rendering paths.

- Shadcn support ships in two layers.
Reason: you chose “both.”
  - Default shadcn-style class/token adapter for plain DOM rendering.
  - Optional consumer-supplied component overrides for teams that want to inject local shadcn/ui components.

- This is a major-version migration now, not a transitional minor.
Reason: you chose “major now,” so we should not preserve implicit Tailwind as the default path.

- Existing `menuClassName` and `menuStyle` remain as deprecated compatibility shims for one major cycle.
Reason: even in a major, this materially reduces migration pain and lets us map old props onto the new slot model without blocking the cleaner architecture.

## Public API and Interface Changes

### Core package: `@ewjdev/anyclick-react`

Add:

- `AnyclickStyleAdapter`
- `AnyclickStyleProvider`
- `useAnyclickStyle`
- `AnyclickStyleTokens`
- `AnyclickStyleSlot`
- `AnyclickSlotState`
- `AnyclickSlotProps`
- `AnyclickComponentOverrides`
- `slotClassNames?: Partial<Record<AnyclickStyleSlot, string>>` on `AnyclickProviderProps`
- `slotStyles?: Partial<Record<AnyclickStyleSlot, CSSProperties>>` on `AnyclickProviderProps`
- `components?: Partial<AnyclickComponentOverrides>` on `AnyclickProviderProps`
- `styleAdapter?: AnyclickStyleAdapter` on `AnyclickProviderProps`

Deprecate but keep working in this major:

- `menuClassName`
- `menuStyle`
- `AnyclickTheme.menuClassName`
- `AnyclickTheme.menuStyle`

Remove from core package behavior:

- implicit `import "./styles/tailwind.css"` from package entry
- Tailwind as a required styling dependency for rendering

### New core styling contract

Define a fixed slot taxonomy covering all user-visible surfaces shipped by `@ewjdev/anyclick-react`:

- `menu.overlay`
- `menu.surface`
- `menu.header`
- `menu.headerAction`
- `menu.list`
- `menu.item`
- `menu.itemIcon`
- `menu.itemLabel`
- `menu.itemBadge`
- `menu.submenuIndicator`
- `menu.backButton`
- `menu.dragHandle`
- `comment.section`
- `comment.textarea`
- `comment.primaryAction`
- `comment.secondaryAction`
- `screenshot.surface`
- `screenshot.header`
- `screenshot.tab`
- `screenshot.tabActive`
- `screenshot.preview`
- `screenshot.empty`
- `screenshot.error`
- `screenshot.meta`
- `screenshot.action`
- `quickChat.surface`
- `quickChat.header`
- `quickChat.messageList`
- `quickChat.input`
- `quickChat.submit`
- `inspect.surface`
- `inspect.header`
- `inspect.content`
- `inspect.action`
- `shared.button`
- `shared.input`
- `shared.textarea`
- `shared.badge`

Define slot resolver behavior as:

- input: slot name + semantic state + resolved tokens + consumer overrides
- output: `{ className?, style?, attrs? }`

Define `AnyclickComponentOverrides` for the few places where DOM replacement is required:

- `Surface`
- `Button`
- `IconButton`
- `Input`
- `Textarea`
- `Tabs`
- `Tab`
- `Badge`

Do not make icons part of v1 adapter scope.
Reason: style portability is the primary problem. Icon replacement can be added later if needed.

### Companion packages

#### `@ewjdev/anyclick-react-tailwind`

Exports:

- `createTailwindAnyclickStyleAdapter(options?)`
- `TailwindAnyclickStyleProvider`
- `tailwind.css`

Behavior:

- provides class-slot recipes using Tailwind utilities
- ships the current default visual look, adjusted to match today’s UX closely
- uses package-level CSS only inside the companion package, not core

#### `@ewjdev/anyclick-react-shadcn`

Exports:

- `createShadcnAnyclickStyleAdapter(options?)`
- `ShadcnAnyclickStyleProvider`
- `createShadcnComponentOverrides(overrides)`
- optional `shadcn.css` token bridge

Behavior:

- default adapter renders plain DOM with class recipes aligned to shadcn-style tokens and utility conventions
- optional component override factory accepts consumer components for:
  - `Button`
  - `Input`
  - `Textarea`
  - `Tabs`
  - `Tab`
  - `Badge`
  - `Surface`/`Card`
- no runtime dependency on a generated shadcn package

#### `@ewjdev/anyclick-react-mui`

Exports:

- `createMuiAnyclickStyleAdapter(options?)`
- `MuiAnyclickStyleProvider`

Peer dependencies:

- `@mui/material`
- `@emotion/react`
- `@emotion/styled`

Behavior:

- uses MUI primitives for surfaces and controls
- maps semantic tokens to `sx` and MUI theme values
- default components:
  - `Paper` for surfaces
  - `Button`/`IconButton`
  - `TextField` or multiline input wrapper
  - `Tabs`/`Tab`
  - `Chip` for badges
  - `CircularProgress` for loading affordances

## Step-by-Step Plan

1. Inventory and freeze the render surface.
- Enumerate every rendered DOM/control surface in `ContextMenu`, `ScreenshotPreview`, `QuickChat`, `InspectSimple`, shared button/input primitives, and provider wrappers.
- Create a slot map document in the repo that ties each rendered node to one slot name and one semantic state model.
- Explicitly mark non-stylable internals out of scope for v1: event plumbing, highlight math, adapter submission flow.

2. Introduce a dedicated styling context in core.
- Add `AnyclickStyleContext`.
- Add `AnyclickStyleProvider`.
- Add merge rules:
  - base unstyled adapter
  - inherited adapter from nearest style provider
  - local `styleAdapter` on `AnyclickProvider`
  - local `slotClassNames`, `slotStyles`, `components`
  - deprecated `menuClassName` and `menuStyle` mapped last onto `menu.surface`
- Keep styling inheritance separate from existing behavioral `theme` inheritance.

3. Define and implement the core slot resolver API.
- Add canonical slot names and state types.
- Add helper utilities:
  - `mergeStyleAdapters`
  - `resolveSlotProps`
  - `composeClassNames`
  - `composeInlineStyles`
- Normalize state shape so all adapters receive consistent state keys:
  - `active`
  - `disabled`
  - `hovered`
  - `pressed`
  - `expanded`
  - `selected`
  - `error`
  - `loading`
  - `tone`
  - `size`

4. Refactor the current React components to consume slot props instead of hardcoded styles/classes.
- Replace direct reads from `menuStyles` for structural rendering with slot resolution.
- Replace Tailwind utility strings inside core components with slot-provided classes.
- Leave the current semantic markup and behavior intact unless required by MUI componentization.
- Keep the DOM structure stable where possible to avoid behavioral regressions.

5. Convert `styles.ts` into semantic token defaults, not UI implementation.
- Retain only neutral semantic defaults needed for an unstyled fallback and behavior-safe layout.
- Move current appearance-specific rules into the Tailwind companion package.
- Remove Tailwind-specific CSS files from core package entry and build outputs.

6. Build the minimal unstyled core fallback.
- Core should still render accessibly if no style provider is present.
- The fallback should be intentionally plain but usable:
  - readable typography
  - visible borders
  - keyboard focus states
  - accessible button/input affordances
- Emit a development warning when no non-fallback style adapter is configured.

7. Build `@ewjdev/anyclick-react-tailwind`.
- Port the current look into slot recipes and CSS owned by the Tailwind adapter package.
- Export both a provider and a raw adapter factory.
- Ensure this package is the documented replacement for current out-of-the-box usage.

8. Build `@ewjdev/anyclick-react-shadcn`.
- Implement class/token adapter first.
- Add optional consumer-component override factory second.
- Define the override interface precisely so a consumer can pass their own local shadcn components without wrapping every slot manually.
- Publish examples showing:
  - class/token only
  - component override mode

9. Build `@ewjdev/anyclick-react-mui`.
- Implement MUI-specific component overrides rather than forcing class recipes.
- Require the consumer app’s existing MUI `ThemeProvider`.
- Expose optional adapter options for:
  - density
  - variant mapping
  - elevation
  - use of `TextField` vs custom multiline field
- Validate portals/z-index interactions against Anyclick’s overlay behavior.

10. Update documentation, examples, and migration materials.
- Replace all docs that imply `@ewjdev/anyclick-react` self-styles via Tailwind.
- Add three first-class setup guides:
  - Tailwind
  - shadcn
  - MUI
- Add a migration guide:
  - old usage
  - new provider/adaptor setup
  - deprecated prop mapping
  - common migration pitfalls

11. Release strategy.
- Ship a major for `@ewjdev/anyclick-react`.
- Ship first stable versions of the companion style packages in the same release train.
- Keep deprecated prop shims for one major line, then remove them in the next major after adoption.

## Testing and Validation

### Unit and integration coverage

- `AnyclickProvider` resolves style adapters from provider context, local props, and deprecated shims in the correct precedence order.
- `resolveSlotProps` merges classes and styles deterministically.
- Deprecated `menuClassName` and `menuStyle` still affect `menu.surface`.
- Rendering without a style provider falls back to accessible minimal styling.
- Tailwind adapter applies expected slot classes for default menu, comment form, screenshot preview, quick chat, and inspect surfaces.
- Shadcn class/token adapter renders without consumer component injection.
- Shadcn component override mode correctly uses consumer-supplied components.
- MUI adapter renders with MUI components and respects the host theme.

### Behavioral regression coverage

- Right-click menu open/close behavior unchanged.
- Touch press-and-hold behavior unchanged.
- Keyboard navigation and focus trapping unchanged.
- Screenshot preview flow unchanged.
- QuickChat flow unchanged.
- Nested provider theme inheritance still works for non-styling behavior fields.
- Scoped providers still isolate event handling correctly.

### Visual validation

- Storybook or equivalent component gallery for:
  - unstyled fallback
  - Tailwind default
  - shadcn class/token
  - shadcn component override
  - MUI
- Visual snapshots for:
  - default menu
  - submenu
  - comment form
  - screenshot preview
  - loading/error states
  - quick chat
  - tiny inspect dialog

### Acceptance criteria

- `@ewjdev/anyclick-react` has no Tailwind import and no Tailwind dependency.
- A consumer can style all shipped surfaces without forking core components.
- Tailwind, shadcn, and MUI setup each take one provider/adaptor import plus normal host-app theme setup.
- MUI package does not leak MUI dependencies into users who do not install it.
- Shadcn package works both without and with consumer component injection.

## Risks and Mitigations

- Risk: slot taxonomy misses a surface and forces ad hoc styling later.
Mitigation: complete inventory first and require every rendered node to map to a named slot before refactor starts.

- Risk: MUI component overrides change DOM structure enough to break measurements, focus, or portal behavior.
Mitigation: keep overlay positioning and event logic in core; MUI adapter only swaps leaf/surface primitives, not behavior containers.

- Risk: shadcn is not a true runtime dependency model.
Mitigation: treat shadcn default support as class/token recipes first, then optional consumer component injection.

- Risk: too many override axes create an unmaintainable API.
Mitigation: separate concerns clearly:
  - tokens for design semantics
  - slots for class/style recipes
  - components only for control/surface replacement

- Risk: migration pain for current users.
Mitigation: keep deprecated `menuClassName` and `menuStyle` shims, provide Tailwind adapter that recreates the current experience, and publish a direct migration guide.

## Rollout and Monitoring

1. Land the core style-adapter refactor behind the new public API in the major branch.
2. Land the Tailwind adapter package and migrate first-party examples to it.
3. Land shadcn and MUI packages.
4. Update docs site and README examples to never show bare `AnyclickProvider` without a style provider unless intentionally demonstrating the unstyled fallback.
5. Monitor:
- issue volume for styling regressions
- install/download split between the three companion packages
- reports of missing slots or unstyleable surfaces
- DOM/focus regressions in MUI mode

## Assumptions and Defaults Chosen

- Packaging strategy: companion packages.
- Migration posture: major now.
- Shadcn model: both class/token adapter and optional consumer component overrides.
- Icons remain Lucide-based in v1 of the styling refactor.
- Core continues to own behavior, event handling, focus, and positioning.
- Style adapters own appearance and primitive/component selection.
- Deprecated `menuClassName` and `menuStyle` are retained for one major to ease migration, even though the package is otherwise headless by default.
- No additional styling systems beyond Tailwind, shadcn, and MUI are included in this release.
