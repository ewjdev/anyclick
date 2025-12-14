# Workstream Theming Upgrade

- Audit existing workstream component structure (`apps/web/src/components/WorkstreamShowcase.tsx`) to map each lane and role config; note where theme variables are applied (menuStyle, trackColor, role card styling, scroll controls, recessed track shadow).
- Define per-workstream visual themes (colors, backgrounds, style, subtle animations) aligned to domain:
- Software Dev: neon terminal grid, cool violet/green accents, scanline shimmer.
- E-commerce: warm warehouse/amber, subtle moving gradient for logistics flow.
- Healthcare Front Desk: calm teal/emerald, soft pulse animation, gentle glass.
- Medical Billing: navy/blue with ledger lines, faint parallax dots.
- Social Media: vibrant pink/purple with bokeh/particle twinkle.
- Browser Automation: orange/yellow circuit motif, slight tilt/hover lift.
- Apply themed containers per lane:
- Recessed track backgrounds updated with domain-specific gradients/textures and inset shadows.
- Lane header typography/accents per theme; scroll buttons tinted to lane accent.
- Apply themed role cards per lane:
- Card backgrounds, borders, glows, and hover transforms tailored to lane theme.
- Pointer colors/icons kept per role but harmonized with lane accent where needed.
- MenuStyle tweaks to reflect lane palette (bg, border, text, hover, accent) without overlap.
- Add light, non-intrusive animations per lane (e.g., `animate-[shimmer...]`, `animate-[pulse...]`, or keyframes scoped inside the component) and ensure reduced-motion respects prefers-reduced-motion.
- Verify layout/responsiveness: horizontal scroll gutters, buttons visibility, contrast and readability; keep backgrounds performant (no heavy images).

## Files to update

- `apps/web/src/components/WorkstreamShowcase.tsx` (lane + role theming, animations)
- `apps/web/src/app/page.tsx` (ensure section uses updated showcase; no major logic changes expected)

## Todos

- Theme each workstream lane
- Theme role cards and menus per workstream
- Add subtle animations per theme with reduced-motion fallbacks
- Verify layout/accessibility/contrast