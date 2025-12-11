---
name: Context Menu UX Redesign
overview: Redesign the Anyclick context menu with Vercel/shadcn-inspired aesthetics, dual theme support with manual toggle, and delightful micro-interactions to create a premium, polished user experience.
todos:
  - id: theme-system
    content: Implement CSS custom properties theme system with dark/light palettes
    status: completed
  - id: entrance-animation
    content: Add menu entrance/exit animations with spring timing
    status: completed
  - id: item-interactions
    content: Implement hover lift, active press, and focus ring states for items
    status: completed
  - id: header-redesign
    content: Redesign header with theme toggle, sentence case title, improved close button
    status: completed
  - id: keyboard-nav
    content: Add full keyboard navigation (arrow keys, enter, escape, tab)
    status: completed
  - id: submenu-animation
    content: Add slide transition animations for submenu navigation
    status: completed
  - id: icon-microanimations
    content: Add hover scale and special t3.chat glow animations
    status: completed
  - id: dividers-grouping
    content: Add visual dividers between logical menu item groups
    status: completed
  - id: accessibility
    content: Add ARIA attributes, focus management, and reduced-motion support
    status: completed
  - id: theme-persistence
    content: Store theme preference in chrome.storage and sync across sessions
    status: completed
---

# Context Menu UX Redesign

## Design System

### Color Palette

**Dark theme (default):**

- Background: `#0a0a0a` with subtle `rgba(255,255,255,0.03)` border
- Surface: `#18181b` for hover states
- Text: `#fafafa` primary, `#a1a1aa` secondary
- Accent: `#3b82f6` (blue) for focus/active states
- Backdrop blur: `saturate(180%) blur(20px)`

**Light theme:**

- Background: `#ffffff` with `rgba(0,0,0,0.08)` border
- Surface: `#f4f4f5` for hover states  
- Text: `#18181b` primary, `#71717a` secondary

### Typography

- Font: System font stack (current is good)
- Header: 11px, semibold, 0.5px letter-spacing, sentence case "Anyclick" (not uppercase)
- Items: 13px, medium weight
- Icons: 16px, 1.5px stroke weight

## Animation System

### Menu Entrance

```css
/* Initial state */
opacity: 0;
transform: scale(0.95) translateY(-4px);
/* Animate to */
opacity: 1;
transform: scale(1) translateY(0);
/* Timing: 150ms cubic-bezier(0.16, 1, 0.3, 1) */
```

### Menu Exit

- Quick 100ms fade out (no scale)

### Item Interactions

- Hover: 120ms background fade + subtle translateY(-1px) lift
- Active/press: scale(0.98) + darker background
- Focus ring: 2px offset ring with accent color

### Submenu Transitions

- Slide left/right with 200ms spring animation
- Content cross-fade during transition

### Icon Micro-animations

- Hover: subtle 1.05 scale with 150ms spring
- t3.chat icon: gentle pulse glow on hover

## Component Changes

### File: `packages/anyclick-extension/src/contextMenu.ts`

**Header redesign:**

- Sentence case "Anyclick" with theme toggle icon button
- Close button with hover glow effect
- Subtle bottom border with gradient fade
- Move Header to navigation footer, so quick actions are instant

**Menu items:**

- Icon container with subtle background on hover
- Label with truncation support
- Chevron with animated rotation on submenu hover

**t3.chat special item:**

- Gradient background: `linear-gradient(135deg, #7c3aed, #ec4899)`
- Soft glow shadow on hover
- Animated icon pulse

**Keyboard navigation:**

- Arrow up/down to navigate items
- Arrow right to enter submenu
- Arrow left / backspace to go back
- Enter/Space to select
- Tab for accessibility

**Dividers:**

- Add visual separator before "Send Feedback" group
- 1px line with padding, faded opacity

**Theme toggle:**

- Small sun/moon icon in header
- Stores preference in chrome.storage
- Smooth CSS transition between themes

## Implementation Details

### CSS Variables Approach

Define all colors as CSS custom properties at the container level, toggle via `data-theme="dark|light"` attribute.

### Performance

- Use CSS transforms for all animations (GPU accelerated)
- `will-change` hints for animated properties
- `contain: content` on menu container
- Debounce theme storage writes

### Accessibility

- `role="menu"` and `role="menuitem"` ARIA attributes
- `aria-expanded` for submenu state
- Focus trap within menu
- Visible focus indicators
- Respect `prefers-reduced-motion`

## File Changes Summary

1. **contextMenu.ts** - Complete style overhaul, animation system, theme toggle, keyboard navigation
2. No other files needed - self-contained in content script