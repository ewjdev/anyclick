---
name: FeaturesSection Interactive Cards
overview: Refactor FeaturesSection component to add interactive left-click expansion and right-click context menus with unique actions for each feature card, including a special context-aware card with expandable context types and notification system for actions.
todos:
  - id: "1"
    content: Refactor FeaturesSection to client component with state management for expanded cards
    status: pending
  - id: "2"
    content: Implement left-click expansion/collapse functionality for all cards
    status: pending
  - id: "3"
    content: Create notification/toast system component with success/warning/error/info types
    status: pending
  - id: "4"
    content: Implement special context-aware card with expandable context types (current element, parent, copy selector)
    status: pending
  - id: "5"
    content: Add scoped AnyclickProvider to each card with unique right-click menu items
    status: pending
  - id: "6"
    content: Implement right-click menu actions (navigation and delayed notifications) for each card
    status: pending
  - id: "7"
    content: Add expanded content sections with animations and visual indicators
    status: pending
  - id: "8"
    content: Add copy-to-clipboard functionality for selector copying in context-aware card
    status: pending
---

# FeaturesSection Interactive Cards Refactor

## Overview

Transform the static feature cards into interactive components with:

- Left-click: Expand inline to show more information
- Right-click: Show unique context menu with card-specific actions
- Special handling for "Context-Aware Capture" card with expandable context types
- Notification system for action feedback

## Implementation Details

### 1. Component Structure Refactor

**File**: `apps/web/src/components/FeaturesSection.tsx`

- Convert to client component (`"use client"`)
- Add state management for expanded cards (`useState<Set<string>>`)
- Wrap each card with scoped `AnyclickProvider` for right-click menus
- Add left-click handlers to toggle expansion
- Create expanded content sections for each card

### 2. Context-Aware Card Special Implementation

**Card**: "Context-Aware Capture" (Feature 1)

**Left-click behavior**:

- Expand to show context type options:
- Current Element (with visual indicator)
- Parent Element (with visual indicator)
- Copy Selector (button to copy CSS selector)
- Each option should be interactive and show visual feedback

**Right-click menu items**:

- "Capture Page Screenshot" → Shows success notification after 1-2s
- "Save Reference to Element" → Shows success notification after 1-2s

### 3. Unique Actions Per Card

**Visual Capture** (Feature 2):

- Left-click: Expand to show screenshot examples/preview
- Right-click menu:
- "Take Screenshot Now" → Navigate to examples page or show success notification
- "View Gallery" → Navigate to gallery or show info notification

**Code Source Integration** (Feature 3):

- Left-click: Expand to show GitHub integration details
- Right-click menu:
- "Create GitHub Issue" → Navigate to GitHub integration example
- "View Integration Docs" → Navigate to docs page

**AI Agent** (Feature 4):

- Left-click: Expand to show AI agent capabilities
- Right-click menu:
- "Launch AI Agent" → Show warning notification (feature coming soon)
- "View Agent Docs" → Navigate to docs

**Framework Agnostic** (Feature 5):

- Left-click: Expand to show framework examples
- Right-click menu:
- "View React Example" → Navigate to React example page
- "View Integration Guide" → Navigate to integration docs

**Zero Config** (Feature 6):

- Left-click: Expand to show setup steps
- Right-click menu:
- "Try Demo" → Navigate to demo page
- "Get Started" → Navigate to getting started page

### 4. Notification System

**New file**: `apps/web/src/components/Toast.tsx` or integrate into FeaturesSection

Create a simple toast notification component with:

- Types: `success`, `warning`, `error`, `info`
- Auto-dismiss after 3-4 seconds
- Position: bottom-right or top-right
- Smooth animations (fade in/out)
- Support for delayed notifications (1-2 seconds as specified)

### 5. Scoped AnyclickProvider Integration

Each card needs its own scoped `AnyclickProvider` with:

- Unique `menuItems` array per card
- `onClick` handlers that trigger notifications or navigation
- Prevent default context menu behavior on cards
- Custom menu styling to match card theme colors

### 6. Expanded Content Design

- Smooth height transition animations
- Additional details, examples, or interactive elements
- Visual indicators for context types (for context-aware card)
- Copy-to-clipboard functionality for selectors

## Technical Considerations

- Use `useState` for managing expanded state
- Use `useCallback` for event handlers to prevent re-renders
- Implement proper TypeScript types for card configurations
- Ensure accessibility (keyboard navigation, ARIA labels)
- Handle edge cases (clicking outside to collapse, preventing menu on left-click)
- Use Tailwind classes for styling and animations
- Leverage existing `AnyclickProvider` from `@ewjdev/anyclick-react`

## File Changes

1. **Modify**: `apps/web/src/components/FeaturesSection.tsx`

- Add state management
- Add left/right click handlers
- Add expanded content sections
- Integrate scoped AnyclickProvider per card
- Add notification triggers

2. **Create** (optional): `apps/web/src/components/Toast.tsx`

- Simple toast notification component
- Or use inline notification state within FeaturesSection

3. **Create** (optional): `apps/web/src/components/FeatureCard.tsx`

- Extract card logic into reusable component
- Handle expansion, menu, and notifications

## Navigation Targets

- GitHub integration: `/examples/github-integration` or `/examples/jira-integration`
- Docs: `/docs` or `/docs/react`
- Examples: `/examples` or specific example pages
- Getting started: `/getting-started` or homepage

## Notification Messages Examples

- Success: "Screenshot captured successfully", "Element reference saved"
- Warning: "Feature coming soon", "This action requires setup"
- Error: "Failed to capture screenshot", "Unable to save reference"
- Info: "Navigating to documentation...", "Opening example..."