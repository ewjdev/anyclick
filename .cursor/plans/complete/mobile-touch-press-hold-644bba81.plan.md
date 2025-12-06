---
name: Mobile and Touch Support for Context Menu
overview: ""
todos: []
---

# Mobile and Touch Support for Context Menu

## Overview

Add press-and-hold gesture detection for mobile and touch devices to trigger the feedback context menu. This will enable users on touch devices to long-press on elements to open the feedback menu, similar to right-click on desktop.

## Current State

- The `FeedbackClient` in [`packages/anyclick-core/src/client.ts`](packages/anyclick-core/src/client.ts) only listens to `contextmenu` events (right-click)
- The `targetFilter` function only accepts `MouseEvent`
- No touch event handling exists currently
- `ContextMenu` uses `pointerdown` for closing, but not for opening

## Implementation Plan

### 1. Update Core Types and Interfaces

**File:** [`packages/anyclick-core/src/types.ts`](packages/anyclick-core/src/types.ts)

- Update `FeedbackClientOptions.targetFilter` to accept both `MouseEvent` and `TouchEvent` (or a union type)
- Add optional `touchHoldDurationMs` configuration option (default: 500ms)
- Add optional `touchMoveThreshold` configuration option (default: 10px) to cancel hold if finger moves too much

### 2. Enhance FeedbackClient with Touch Support

**File:** [`packages/anyclick-core/src/client.ts`](packages/anyclick-core/src/client.ts)

- Add private properties for touch state management:
- `touchStartHandler`, `touchMoveHandler`, `touchEndHandler`, `touchCancelHandler`
- `touchHoldTimer: NodeJS.Timeout | null`
- `touchStartPosition: { x: number; y: number } | null`
- `touchTargetElement: Element | null`
- Update `defaultTargetFilter` to accept both `MouseEvent` and `TouchEvent`
- Implement touch event handlers:
- `touchstart`: Record position and target, start hold timer
- `touchmove`: Cancel hold if movement exceeds threshold
- `touchend`: Clear timer and reset state
- `touchcancel`: Clear timer and reset state
- Add `handleTouchHold` method that triggers context menu after hold duration
- Update `attach()` to add touch event listeners alongside contextmenu
- Update `detach()` to remove touch event listeners
- Update `onContextMenu` callback signature to accept both `MouseEvent` and `TouchEvent` (or a synthetic event type)

### 3. Update FeedbackProvider for Touch Events

**File:** [`packages/anyclick-react/src/FeedbackProvider.tsx`](packages/anyclick-react/src/FeedbackProvider.tsx)

- Update the `onContextMenu` callback to handle both mouse and touch events
- Ensure position calculation works for both event types (`clientX/clientY` for mouse, `touches[0].clientX/clientY` for touch)

### 4. Enhance ContextMenu for Touch Interactions

**File:** [`packages/anyclick-react/src/ContextMenu.tsx`](packages/anyclick-react/src/ContextMenu.tsx)

- Ensure menu positioning works correctly for touch events
- Add visual feedback during press-and-hold (optional: subtle highlight or haptic feedback)
- Ensure menu items are touch-friendly (adequate touch target sizes)
- Prevent default touch behaviors when menu is open

### 5. Add Configuration Options

**File:** [`packages/anyclick-react/src/types.ts`](packages/anyclick-react/src/types.ts)

- Add `touchHoldDurationMs?: number` to `FeedbackProviderProps`
- Add `touchMoveThreshold?: number` to `FeedbackProviderProps`
- Pass these through to `FeedbackClientOptions`

### 6. Prevent Default Behaviors

- Prevent default touch behaviors (scrolling, text selection) during the hold gesture
- Use `event.preventDefault()` strategically to avoid interfering with normal scrolling
- Only prevent default when the hold timer is active and target passes filter

### 7. Edge Cases to Handle

- User moves finger too much during hold → cancel
- User releases before hold duration → cancel
- Multiple simultaneous touches → handle only first touch
- Touch on scrollable element → allow normal scroll if released quickly
- Touch on interactive element (button, link) → respect normal behavior unless held long enough

## Technical Considerations

### Touch Event Flow

1. `touchstart` → Record position, target element, start timer
2. `touchmove` → Check if movement > threshold, cancel if so
3. After `touchHoldDurationMs` → Trigger context menu, prevent default
4. `touchend` or `touchcancel` → Clean up timer and state

### Position Calculation

- Use `touches[0].clientX` and `touches[0].clientY` for touch events
- Fallback to `changedTouches[0] `if `touches` is empty (for touchend)

### Movement Threshold

- Calculate distance using: `Math.sqrt((x2-x1)² + (y2-y1)²)`
- Cancel hold if distance exceeds `touchMoveThreshold`

## Testing Considerations

- Test on actual mobile devices (iOS Safari, Android Chrome)
- Test with different hold durations
- Test movement threshold cancellation
- Test on scrollable containers
- Test on interactive elements (buttons, links)
- Test with multiple simultaneous touches
- Ensure desktop right-click still works

## Configuration Defaults

- `touchHoldDurationMs`: 500ms (standard long-press duration)
- `touchMoveThreshold`: 10px (small movement allowed, prevents accidental cancellation)