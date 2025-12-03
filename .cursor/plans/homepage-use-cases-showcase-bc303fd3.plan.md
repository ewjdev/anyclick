<!-- bc303fd3-d2a0-475e-97b5-a8e24b91574a 909414e5-c38e-48f2-a8fe-860baeaf5f38 -->
# Homepage Use Cases Showcase

Add a new "Use Cases" section to [apps/web/src/app/page.tsx](apps/web/src/app/page.tsx) that showcases different user personas and their specific use cases. The section will be inserted between the Hero and features sections.

## Implementation Plan

### 1. Add Use Cases Section Structure

Add a new section right after the get started and view example buttons

- Section header: "Built for every role"
- Subtitle explaining the different personas
- Grid layout for persona cards (2 columns on desktop, 1 on mobile)

### 2. Create Persona Cards

Each persona card will include:

- Persona icon (from lucide-react)
- Persona title and role
- Use case description
- Feature list with status indicators:
- ✅ Green checkmark for currently supported features
- 🚧 "Coming Soon" badge for roadmap items

### 3. Persona Details

**QA Engineer**

- Icon: `TestTube` or `CheckCircle`
- Use case: Bug bash partner
- Current features:
- ✅ Right-click feedback capture
- ✅ Screenshot capture
- ✅ GitHub Issues integration
- Roadmap: None (all features supported)

**Developer**

- Icon: `Code2` or `Terminal`
- Use case: PR review, AI human in the loop
- Current features:
- ✅ Cursor AI agent integration (local & cloud)
- ✅ GitHub Issues integration
- ✅ Context-aware DOM capture
- Roadmap: None (all features supported)

**Product Manager**

- Icon: `Target` or `BarChart`
- Use case: Capture feature set, record workflow
- Current features:
- ✅ Feature feedback type
- ✅ Screenshot capture
- ✅ Comment support
- Roadmap:
- 🚧 Workflow recording (sequence of user actions/clicks)

**Customer/End User**

- Icon: `Users` or `MessageCircle`
- Use case: Easy feedback, automatically collect errors & click behavior
- Current features:
- ✅ Right-click feedback (easy to use)
- ✅ Screenshot capture
- ✅ Comment support
- Roadmap:
- 🚧 Automatic error collection (catch unhandled errors)
- 🚧 Click behavior tracking (analytics on user clicks)

**UX Designer**

- Icon: `Palette` or `PenTool`
- Use case: Custom pointer set, easy management of custom menus on elements
- Current features:
- ✅ Custom menu items
- ✅ Role-based menu filtering
- ✅ Custom menu styling (menuStyle, menuClassName)
- Roadmap:
- 🚧 Custom cursor/pointer customization
- 🚧 Element-specific menu configuration (different menus per element selector)

**Designer**

- Icon: `Eye` or `Ruler`
- Use case: Catch small visual bugs
- Current features:
- ✅ Screenshot capture (element, container, viewport)
- ✅ Full DOM context
- ✅ Sensitive data masking
- Roadmap:
- 🚧 Visual diff/comparison tools (optional enhancement)

### 4. Visual Design

- Use gradient backgrounds for each persona card (matching their icon color)
- Add hover effects (scale, border color change)
- Include "Coming Soon" badges with subtle styling (gray/amber)
- Use checkmark icons for supported features
- Ensure responsive design (grid collapses on mobile)

### 5. Roadmap Documentation

Create a roadmap section at the bottom of the Use Cases section that:

- Lists all roadmap items mentioned
- Links to GitHub Issues or a roadmap page (if exists)
- Uses a subtle call-to-action to request features

## Files to Modify

1. [apps/web/src/app/page.tsx](apps/web/src/app/page.tsx)

- Add new Use Cases section
- Import additional icons from lucide-react
- Add persona card components

## Roadmap Items Summary

Features to add to roadmap:

1. **Workflow Recording** - Record sequence of user actions/clicks for Product Managers
2. **Automatic Error Collection** - Catch and report unhandled JavaScript errors automatically
3. **Click Behavior Tracking** - Analytics on user click patterns and behavior
4. **Custom Cursor/Pointer** - Allow UX designers to customize cursor appearance
5. **Element-Specific Menus** - Configure different menu items for different element selectors
6. **Visual Diff/Comparison** - Tools for designers to compare screenshots (optional)

## Implementation Notes

- Keep the existing Features section unchanged
- The Use Cases section should complement, not replace, the Features section
- Use consistent styling with the rest of the homepage
- Ensure all icons are imported from lucide-react
- Make roadmap items visually distinct but not overwhelming
- Consider adding links to examples or docs for each persona's use case

### To-dos

- [ ] Add new Use Cases section structure to page.tsx with header and grid layout
- [ ] Create persona card components for QA, Dev, Prod, Customer, UX, and Design with icons and descriptions
- [ ] Add feature lists with checkmarks for supported features and Coming Soon badges for roadmap items
- [ ] Add roadmap summary section at bottom of Use Cases with all planned features
- [ ] Apply consistent styling, hover effects, and ensure responsive design