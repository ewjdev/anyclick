# CustomPointer Performance Optimization Plan

## Overview

Optimize the `CustomPointer` component in `packages/anyclick-pointer/src/CustomPointer.tsx` to achieve custom pointer theming without losing performance. The goal is to eliminate lag and minimize overhead while maintaining full theming capabilities.

## Current Implementation Analysis

### File Locations

- Main component: `packages/anyclick-pointer/src/CustomPointer.tsx`
- Animations: `packages/anyclick-pointer/src/animations.ts`
- Types: `packages/anyclick-pointer/src/types.ts`
- Provider: `packages/anyclick-pointer/src/PointerProvider.tsx`

### Current Bottlenecks Identified

| Issue | Impact | Frequency |

|-------|--------|-----------|

| React state for position updates | High | ~60/sec |

| Multiple `motion.div` components | Medium | Every render |

| Framer Motion spring calculations | Medium | ~60/sec |

| Nested `AnimatePresence` | Low | On interaction |

| Inline styles recalculation | Low | Every render |

| `left`/`top` positioning | Medium | ~60/sec |

### Why These Are Problems

1. **React State for Position**: Every `setState()` call triggers React reconciliation, diff calculation, and potential re-render of child components. At 60fps, this means 60 full React cycles per second just for cursor position.

2. **Multiple motion.div**: Each Framer Motion component maintains its own animation state, variant resolution, and style calculation pipeline.

3. **`left`/`top` vs `transform`**: CSS `left`/`top` properties trigger layout recalculation, while `transform` is GPU-accelerated and only triggers compositing.

---

## Optimization Phases

### Phase 1: Bypass React for Position Updates (Highest Impact)

**Goal**: Eliminate React re-renders for mouse position changes

**Expected improvement**: ~90% reduction in re-renders during mouse movement

#### Tasks

- [ ] 1.1 Create a ref to store the pointer DOM element
- [ ] 1.2 Update position directly via `element.style.transform = translate3d(x, y, 0)`
- [ ] 1.3 Remove position from React state, keep only interaction state
- [ ] 1.4 Store position in a ref for any code that needs to read it

#### Code Strategy

```tsx
// Before (causes re-renders)
const [state, setState] = useState<PointerState>({
  position: { x: -100, y: -100 },
  // ...
});
setState(prev => ({ ...prev, position: { x, y } }));

// After (direct DOM manipulation)
const pointerRef = useRef<HTMLDivElement>(null);
const positionRef = useRef({ x: -100, y: -100 });

// In mousemove handler:
positionRef.current = { x: event.clientX, y: event.clientY };
if (pointerRef.current) {
  pointerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}
```

---

### Phase 2: CSS-First Animation Strategy

**Goal**: Move animations to CSS where possible for better performance

#### Tasks

- [ ] 2.1 Define CSS `@keyframes` for ripple effect
- [ ] 2.2 Use CSS `transition` for interaction state changes (scale, opacity)
- [ ] 2.3 Use CSS custom properties for dynamic theming values
- [ ] 2.4 Keep Framer Motion only for complex enter/exit if needed

#### CSS Variables Strategy

```tsx
// Set variables via JS
element.style.setProperty('--pointer-scale', '1');
element.style.setProperty('--circle-opacity', '0');

// CSS handles transitions
.pointer-icon {
  transform: scale(var(--pointer-scale));
  transition: transform 0.15s ease-out;
}

.pointer-circle {
  opacity: var(--circle-opacity);
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}
```

#### Ripple Keyframes

```css
@keyframes ripple {
  0% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}
```

---

### Phase 3: DOM Structure Optimization

**Goal**: Reduce DOM nodes and enable GPU compositing

#### Tasks

- [ ] 3.1 Use CSS `::before` pseudo-element for the circle
- [ ] 3.2 Use CSS `::after` pseudo-element for ripple effect
- [ ] 3.3 Add `will-change: transform` to root pointer element
- [ ] 3.4 Add `contain: layout style paint` for isolation
- [ ] 3.5 Reduce from 4+ DOM nodes to 1-2 nodes

#### Optimized DOM Structure

```
Before:
<motion.div>                    <!-- Container -->
  <motion.div>                  <!-- Pointer icon -->
    <MousePointer2 />
  </motion.div>
  <motion.div>                  <!-- Circle -->
    <div />
  </motion.div>
  <AnimatePresence>
    <motion.div />              <!-- Ripple -->
  </AnimatePresence>
</motion.div>

After:
<div ref={pointerRef}>          <!-- Single container with pseudo-elements -->
  <MousePointer2 />             <!-- Or custom icon -->
  <!-- ::before = circle -->
  <!-- ::after = ripple -->
</div>
```

#### CSS Containment

```css
.custom-pointer {
  contain: layout style paint;
  will-change: transform;
  pointer-events: none;
}
```

---

### Phase 4: Framer Motion Optimization (If Retained)

**Goal**: Minimize Framer Motion footprint if still needed for theming flexibility

#### Tasks

- [ ] 4.1 Use `LazyMotion` with `domAnimation` feature (smaller bundle)
- [ ] 4.2 Replace nested `AnimatePresence` with single instance
- [ ] 4.3 Use `useMotionValue` + `useTransform` for position
- [ ] 4.4 Pre-compute static variants outside component

#### Motion Value Strategy (Alternative to Phase 1)

```tsx
import { useMotionValue, motion } from 'motion/react';

const x = useMotionValue(-100);
const y = useMotionValue(-100);

// In mousemove handler (no React state):
x.set(event.clientX);
y.set(event.clientY);

// In render:
<motion.div style={{ x, y }} />
```

---

### Phase 5: Event Handling Optimization

**Goal**: Reduce event listener overhead

#### Tasks

- [ ] 5.1 Combine related handlers where logical
- [ ] 5.2 Use event delegation where possible
- [ ] 5.3 Ensure all position listeners use `{ passive: true }`
- [ ] 5.4 Consider `pointer` events instead of `mouse` events for touch support

#### Passive Listeners

```tsx
// Already implemented ✓
document.addEventListener("mousemove", handleMouseMove, { passive: true });
```

---

## Implementation Priority

| Priority | Phase | Expected Impact | Complexity |

|----------|-------|-----------------|------------|

| 1 | Phase 1 | ~90% fewer re-renders | Medium |

| 2 | Phase 3 | ~50% less paint work | Medium |

| 3 | Phase 2 | ~30% less JS compute | Low |

| 4 | Phase 4 | Bundle size reduction | Low |

| 5 | Phase 5 | Minor CPU savings | Low |

---

## Success Metrics

### Before Optimization

- [ ] Measure FPS during rapid mouse movement
- [ ] Measure React DevTools re-render count
- [ ] Profile CPU usage in Chrome DevTools
- [ ] Check for paint flashing in Layers panel

### After Optimization

- Target: 60 FPS sustained during mouse movement
- Target: 0 React re-renders for position changes
- Target: < 1ms per frame for pointer updates
- Target: GPU-only compositing (no layout/paint)

---

## Testing Checklist

- [ ] Pointer follows cursor smoothly at 60fps
- [ ] Right-click shows circle with animation
- [ ] Left-click shows pressing state
- [ ] Ripple effect plays on right-click
- [ ] Theme colors apply correctly
- [ ] Custom icons render properly
- [ ] Reduced motion preference respected
- [ ] hideDefaultCursor works correctly
- [ ] Pointer hides when leaving viewport
- [ ] Z-index stacking works correctly

---

## Rollback Plan

If optimizations cause regressions:

1. Phase 1 can be reverted by restoring position to React state
2. Phase 2/3 can be reverted by restoring motion.div elements
3. Keep original implementation in a separate branch for comparison

---

## Notes

- The key insight is separating **high-frequency updates** (position) from **low-frequency updates** (interaction state)
- Position changes ~60 times/second, interaction state changes ~1-2 times/minute
- React is great for interaction state, overkill for position tracking
- CSS handles animations more efficiently than JavaScript when possible