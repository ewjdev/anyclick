---
name: immersive-workstream-redesign
overview: Transform the Workstream Showcase into a high-end, immersive scrolling journey. Replace horizontal lanes with full-width, parallax-enhanced sections that visually 'take over' the screen to demonstrate role-based contexts.
todos:
  - id: install-motion
    content: Install motion dependency
    status: completed
  - id: create-immersive-component
    content: Create ImmersiveWorkstreamShowcase.tsx using motion hooks
    status: completed
  - id: implement-nav-rail
    content: Implement sticky navigation rail with scroll linking
    status: completed
  - id: build-abstract-cards
    content: Build abstract glass-morphic cards for each theme
    status: completed
  - id: implement-motion-parallax
    content: Implement parallax sections using useScroll/useTransform
    status: completed
  - id: update-homepage
    content: Update homepage to use ImmersiveWorkstreamShowcase
    status: completed
---

# Immersive Workstream Journey Redesign

We will transform the current `WorkstreamShowcase` from a horizontal scrolling list into a vertical sequence of immersive, "takeover" style sections. Each section will represent a workstream with distinct visual identities, parallax depth, and interactive playgrounds.

## Core Design Concepts

- **Vertical "Takeover" Sections:** Each workstream gets a dedicated section (min-height 80vh) that dominates the viewport.
- **Parallax Depth:** Backgrounds, "floating" contextual elements, and the main interactive target will scroll at different speeds.
- **Live Interaction:** The center of each section will be an interactive "playground" where the custom cursor and context menu are active.
- **Minimalist Aesthetic:** Reduced text density, focusing on the *feeling* of the workflow.

## Detailed Implementation Steps

### 1. Setup & New Component

- **Install Dependency:** Add `motion` to `apps/web/package.json`.
- Create `apps/web/src/components/ImmersiveWorkstreamShowcase.tsx`.

### 2. The `WorkstreamSection` Component

- **Layout:** Full-viewport height sections.
- **Motion Parallax Engine:**
    - Use `useScroll` hook to track scroll progress relative to the section ref.
    - Use `useTransform` to map scroll progress to `y` values for background and floating elements.
    - Example: `const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])`.
- **Background Layer:**
    - `motion.div` with absolute positioning.
    - Smoothed transforms for high-end feel.
- **The "Playground" (Centerpiece):**
    - **Abstract Interactive Cards:** Stylized, glass-morphic containers.
    - **Interaction:** Wrapped in `AnyclickProvider` and `PointerProvider`.
    - **Mobile:** Static card view; no scroll-jacking.

### 3. Navigation & Progress

- **Sticky Timeline Rail:**
    - Use `useScroll` to drive the active state of dots/lines on the rail.
    - Click-to-scroll functionality.

### 4. Integration

- Update `apps/web/src/app/page.tsx` to import and use `ImmersiveWorkstreamShowcase`.

### 5. Theme Configuration

- Define enhanced themes with abstract assets.

## Visual Direction per Workstream (Abstract & Premium)

1.  **Software Dev:** Dark abstract grid. Floating code tokens.
2.  **E-commerce:** Warm logistics map contours. Floating cubes.
3.  **Healthcare:** Clean teal waves. Floating crosses/hearts.
4.  **Social Media:** Vibrant fluid gradients. Floating bubbles.

## Files to Modify

- `apps/web/package.json`: Add `motion`.
- Create `apps/web/src/components/ImmersiveWorkstreamShowcase.tsx`.
- Modify `apps/web/src/app/page.tsx`.

## Dependencies

- `motion` (Framer Motion) for all animations.
- Tailwind CSS for styling.
- `lucide-react` for iconography.