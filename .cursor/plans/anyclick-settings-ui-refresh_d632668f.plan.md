---
name: anyclick-settings-ui-refresh
overview: Refine the Anyclick extension settings UI for clearer control, inline validation, and sharper devx.
todos:
  - id: update-header-toggle
    content: Switch header to single master toggle + status badge
    status: completed
  - id: dirty-save-cta
    content: Style Save CTA for dirty/clean states and keep sticky
    status: completed
  - id: api-validation-inline
    content: Add inline validation UX for endpoint/auth inputs
    status: completed
  - id: status-display-polish
    content: Improve status/last-capture display with icons/colors
    status: completed
  - id: integration-cards
    content: Unify integration cards with single toggle + accordion
    status: completed
---

# Anyclick Settings UI Polish

- Simplify master control: change `Header` to a single labeled master toggle with status badge (no radio lookalike), ensure disabled states propagate.
- Dirty state feedback: keep `isDirty` detection but make the Save CTA visually distinct/enabled only when dirty; keep footer sticky and adjust copy to reflect dirty/saved states.
- Endpoint/Auth inputs: add top labels + helper text, add inline async validation (ping endpoint, show checkmark/exclamation with tips from response), and add token show/hide affordance.
- Status clarity: surface “Last capture” and current status near the header with icon+color chips for success/error/ready; maintain accessibility and contrast.
- Integrations clarity: make each integration a single control surface (card with header + toggle and optional accordion for settings), removing switch+dropdown ambiguity and aligning spacing.