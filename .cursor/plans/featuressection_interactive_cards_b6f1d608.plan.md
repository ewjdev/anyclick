# FeaturesSection Interactive Cards + Global Submission UX

## Overview

This plan covers two related improvements:

1. **FeaturesSection Enhancement** - Expandable feature cards with animated workflow visualizations that demonstrate what each Anyclick capability does
2. **Global Submission Feedback** - Improve the submission UX across all Anyclick interactions with proper loading states, success/error notifications, and status indicators

---

## Part 1: FeaturesSection Interactive Cards

### Goals

- Each feature card expands on click to show detailed visualization
- Expanded view demonstrates the workflow with animated status progression
- Auto-advancing 4-step workflow shows what happens during a real interaction
- Links lead to examples/docs for implementation details

### Component Structure

```
FeaturesSection (client component)
├── FeatureCard (×6)
│   ├── Collapsed State (default)
│   │   └── Icon, Title, Description, "Learn more" link
│   └── Expanded State (on click)
│       ├── Close button
│       ├── Extended description
│       ├── WorkflowVisualization
│       │   └── 4-step animated progression
│       └── CTA link to docs/examples
└── No scoped providers needed (uses global provider)
```

### Expandable Card Design

**Collapsed State:**

```
┌──────────────────────────────────┐
│ [Icon]                           │
│ Context-Aware Capture            │
│ Right-click any element to...    │
│                                  │
│ Learn more →                     │
└──────────────────────────────────┘
```

**Expanded State:**

```
┌──────────────────────────────────────────────────────────────────┐
│ [Icon] Context-Aware Capture                              [×]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ When you right-click an element, Anyclick captures comprehensive │
│ context about that element and its surroundings.                 │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │  Workflow Visualization                                      │ │
│ │                                                              │ │
│ │  ○ ─────── ◉ ─────── ○ ─────── ○                            │ │
│ │  Step 1   Step 2   Step 3   Step 4                          │ │
│ │                                                              │ │
│ │  ┌─────────────────────────────────────┐                    │ │
│ │  │ [✓] Capturing element context...    │                    │ │
│ │  │     CSS selector: button.primary    │                    │ │
│ │  │     Attributes: 3 captured          │                    │ │
│ │  └─────────────────────────────────────┘                    │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Try it in the demo →                                             │
└──────────────────────────────────────────────────────────────────┘
```

### Workflow Configurations Per Card

Each card has a unique 4-step workflow that auto-advances every ~1.5s:

#### 1. Context-Aware Capture

| Step | Label | Status Detail |

|------|-------|---------------|

| 1 | Detecting element | Finding target under cursor... |

| 2 | Capturing context | CSS selector, attributes, ancestors |

| 3 | Analyzing hierarchy | Parent containers, siblings |

| 4 | Context ready | Full element context captured ✓ |

#### 2. Visual Capture

| Step | Label | Status Detail |

|------|-------|---------------|

| 1 | Preparing capture | Initializing screenshot engine... |

| 2 | Capturing element | Taking element screenshot... |

| 3 | Capturing viewport | Taking full page screenshot... |

| 4 | Screenshots ready | 2 screenshots captured ✓ |

#### 3. Code Source Integration

| Step | Label | Status Detail |

|------|-------|---------------|

| 1 | Gathering context | Element data + screenshots... |

| 2 | Formatting issue | Creating markdown with context... |

| 3 | Creating issue | Sending to GitHub API... |

| 4 | Issue created | Issue #234 created ✓ |

#### 4. AI Agent

| Step | Label | Status Detail |

|------|-------|---------------|

| 1 | Analyzing context | AI processing element... |

| 2 | Understanding intent | Determining action type... |

| 3 | Generating response | Creating suggestions... |

| 4 | Ready | AI response ready ✓ |

#### 5. Framework Agnostic

| Step | Label | Status Detail |

|------|-------|---------------|

| 1 | Detecting framework | Checking for React/Vue/Svelte... |

| 2 | Loading adapter | Initializing React adapter... |

| 3 | Attaching listeners | Context menu ready... |

| 4 | Active | Anyclick enabled ✓ |

#### 6. Zero Config

| Step | Label | Status Detail |

|------|-------|---------------|

| 1 | Installing | npm install @ewjdev/anyclick-react |

| 2 | Wrapping app | Adding AnyclickProvider... |

| 3 | Configuring | Default settings applied... |

| 4 | Ready | Start right-clicking! ✓ |

### Implementation Details

**File: `apps/web/src/components/FeaturesSection.tsx`**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Check, Loader2 } from "lucide-react";
// ... other icon imports

interface WorkflowStep {
  label: string;
  detail: string;
}

interface FeatureConfig {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  expandedDescription: string;
  workflow: WorkflowStep[];
  linkHref: string;
  linkText: string;
  color: string; // tailwind color class
}

// Feature configurations with workflows
const features: FeatureConfig[] = [
  {
    id: "context-capture",
    icon: <MousePointerClick className="w-6 h-6" />,
    title: "Context-Aware Capture",
    description: "Right-click any element to capture its full DOM context...",
    expandedDescription: "When you right-click an element, Anyclick captures...",
    workflow: [
      { label: "Detecting element", detail: "Finding target under cursor..." },
      { label: "Capturing context", detail: "CSS selector, attributes, ancestors" },
      { label: "Analyzing hierarchy", detail: "Parent containers, siblings" },
      { label: "Context ready", detail: "Full element context captured ✓" },
    ],
    linkHref: "/examples/basic",
    linkText: "Try the demo",
    color: "violet",
  },
  // ... other features
];

function WorkflowVisualization({ 
  steps, 
  isActive,
  color 
}: { 
  steps: WorkflowStep[];
  isActive: boolean;
  color: string;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isActive, steps.length]);

  return (
    <div className="...">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {steps.map((_, i) => (
          <div key={i} className={`
            w-3 h-3 rounded-full transition-all duration-300
            ${i === currentStep ? `bg-${color}-500 scale-125` : 
              i < currentStep ? `bg-${color}-500/50` : 'bg-white/20'}
          `} />
        ))}
      </div>
      
      {/* Current step display */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-1">
          {currentStep === steps.length - 1 ? (
            <Check className={`w-4 h-4 text-${color}-400`} />
          ) : (
            <Loader2 className={`w-4 h-4 text-${color}-400 animate-spin`} />
          )}
          <span className="font-medium">{steps[currentStep].label}</span>
        </div>
        <p className="text-sm text-gray-400">{steps[currentStep].detail}</p>
      </div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: FeatureConfig }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      layout
      className={`
        group p-6 rounded-2xl bg-white/2 border border-white/5 
        hover:border-${feature.color}-500/30 transition-all hover:bg-white/4
        ${isExpanded ? 'col-span-2 row-span-2' : ''}
      `}
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          // Collapsed content
          <motion.div key="collapsed" /* ... */>
            {/* Icon, title, description, learn more link */}
          </motion.div>
        ) : (
          // Expanded content
          <motion.div key="expanded" /* ... */>
            <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}>
              <X className="w-4 h-4" />
            </button>
            
            <h3>{feature.title}</h3>
            <p>{feature.expandedDescription}</p>
            
            <WorkflowVisualization 
              steps={feature.workflow}
              isActive={isExpanded}
              color={feature.color}
            />
            
            <Link href={feature.linkHref}>
              {feature.linkText} <ArrowRight />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

### Link Destinations

| Feature | Link | Target |

|---------|------|--------|

| Context-Aware Capture | `/examples/basic` | Basic example with context capture |

| Visual Capture | `/examples/basic` | Basic example (has screenshot demo) |

| Code Source Integration | `/examples/github-integration` | GitHub integration example |

| AI Agent | `/examples/cursor-local` | Cursor local AI integration |

| Framework Agnostic | `/docs/react` | React integration docs |

| Zero Config | `/docs/getting-started` | Getting started guide |

---

## Part 2: Global Submission Feedback System

### Current Problems

1. **No success notification** - Menu closes, user doesn't know if feedback was received
2. **No error notification** - Errors are silent unless developer adds `onSubmitError` callback
3. **Submitting state** - Only shows "Sending..." text, no clear loading indicator
4. **No persistence** - User loses all feedback if something fails

### Existing Pattern: `showToast` in anyclick-extension

The extension already has a well-established toast pattern in two places:

**`content.ts` (vanilla JS):**

```typescript
function showToast(
  message: string,
  type: "success" | "error" | "warning" | "info" = "info",
): void {
  // Creates DOM element, positions bottom-right
  // Auto-hides after 4000ms
}
```

**`PopupApp.tsx` (React):**

```typescript
const showToast = useCallback((message: string, error = false) => {
  setToast({ message, error });
  setTimeout(() => setToast(null), 2500);
}, []);
```

**Standard colors across the codebase:**

- success: `#10b981` (emerald)
- error: `#ef4444` (red)
- warning: `#f59e0b` (amber)
- info: `#3b82f6` (blue)

### Proposed Solution: Unified Toast System

Add a toast system to `@ewjdev/anyclick-react` that:

- Follows the existing `showToast(message, type)` API pattern
- Uses the same 4 types and colors as the extension
- Auto-dismisses after 4 seconds (matching `content.ts`)
- Exports a `showToast` function for imperative use
- Auto-triggers on submission success/error by default

### Implementation Architecture

```
packages/anyclick-react/src/
├── Toast/
│   ├── index.ts
│   ├── Toast.tsx           # Individual toast component
│   ├── ToastContainer.tsx  # Portal container for toasts
│   ├── toastStore.ts       # Zustand store for toast state
│   ├── types.ts            # Toast types
│   └── styles.ts           # Toast styles (using standard colors)
├── AnyclickProvider.tsx    # Add ToastContainer + auto-toast on submit
└── index.ts                # Export showToast + toast utilities
```

### Toast Types

```typescript
/** Toast type - matches extension pattern */
type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Internal toast state */
interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, default 4000
}

/** Configuration for automatic toasts */
interface ToastConfig {
  enabled?: boolean;           // default: true
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxToasts?: number;          // default: 3
  successMessage?: string;     // default: "Feedback sent!"
  errorMessage?: string;       // default: "Failed to send feedback"
}

/** Standard colors - matching extension */
const TOAST_COLORS = {
  success: { bg: "#10b981", border: "#059669" },
  error: { bg: "#ef4444", border: "#dc2626" },
  warning: { bg: "#f59e0b", border: "#d97706" },
  info: { bg: "#3b82f6", border: "#2563eb" },
} as const;
```

### Public API

```typescript
// Imperative API - matches extension pattern
import { showToast } from "@ewjdev/anyclick-react";

showToast("Settings saved!", "success");
showToast("Upload failed", "error");
showToast("Feature coming soon", "warning");
showToast("Processing...", "info");

// Provider config for automatic toasts
<AnyclickProvider
  adapter={adapter}
  toastConfig={{
    enabled: true,
    position: "bottom-right",
    successMessage: "Thanks for your feedback!",
  }}
>
```

### Provider Integration

```tsx
// In AnyclickProvider.tsx
import { showToast, ToastContainer } from "./Toast";

export function AnyclickProvider({
  // ... existing props
  toastConfig = { enabled: true },
}: AnyclickProviderProps) {
  
  const submitAnyclick = useCallback(async (...) => {
    setIsSubmitting(true);
    try {
      await client.submitAnyclick(...);
      
      // Show success toast - uses imperative API like extension
      if (toastConfig.enabled !== false) {
        showToast(
          toastConfig.successMessage ?? "Feedback sent!",
          "success"
        );
      }
      
      onSubmitSuccess?.(payload);
    } catch (error) {
      // Show error toast
      if (toastConfig.enabled !== false) {
        showToast(
          toastConfig.errorMessage ?? "Failed to send feedback",
          "error"
        );
      }
      
      onSubmitError?.(error, payload);
    } finally {
      setIsSubmitting(false);
      // ... close menu
    }
  }, [...]);

  return (
    <AnyclickContext.Provider value={contextValue}>
      {/* Toast container renders via portal - only one needed */}
      <ToastContainer position={toastConfig.position ?? "bottom-right"} />
      {/* ... rest of provider */}
    </AnyclickContext.Provider>
  );
}
```

### Usage Examples

```tsx
// Automatic toasts on submission (default behavior)
<AnyclickProvider adapter={adapter}>
  <App />
</AnyclickProvider>

// Custom messages
<AnyclickProvider 
  adapter={adapter}
  toastConfig={{
    successMessage: "Thanks for the feedback!",
    errorMessage: "Oops, something went wrong",
  }}
>
  <App />
</AnyclickProvider>

// Disable automatic toasts (handle manually)
<AnyclickProvider 
  adapter={adapter}
  toastConfig={{ enabled: false }}
  onSubmitSuccess={() => showToast("Custom success!", "success")}
>
  <App />
</AnyclickProvider>

// Imperative use anywhere in the app
import { showToast } from "@ewjdev/anyclick-react";

function MyComponent() {
  const handleAction = () => {
    // Do something
    showToast("Action completed", "success");
  };
}
```

### Toast Component Design

Follows the extension's visual style - simple, colored background, single message:

```tsx
import { motion, AnimatePresence } from "motion/react";

const TOAST_COLORS = {
  success: { bg: "#10b981", border: "#059669" },
  error: { bg: "#ef4444", border: "#dc2626" },
  warning: { bg: "#f59e0b", border: "#d97706" },
  info: { bg: "#3b82f6", border: "#2563eb" },
} as const;

function Toast({ 
  toast, 
  onDismiss 
}: { 
  toast: { id: string; type: ToastType; message: string }; 
  onDismiss: () => void;
}) {
  const { bg, border } = TOAST_COLORS[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      style={{
        background: bg,
        borderLeft: `3px solid ${border}`,
      }}
      className="px-4 py-3 rounded-lg text-white text-sm font-medium 
                 shadow-lg backdrop-blur flex items-center gap-2"
    >
      <span className="flex-1">{toast.message}</span>
      <button 
        onClick={onDismiss}
        className="opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

/** Zustand store for toast state */
const useToastStore = create<{
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({
      toasts: [...state.toasts.slice(-2), { id, message, type }], // max 3
    }));
    // Auto-dismiss after 4 seconds (matching extension)
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

/** Public imperative API - matches extension pattern */
export function showToast(
  message: string, 
  type: ToastType = "info"
): void {
  useToastStore.getState().addToast(message, type);
}
```

### Enhanced Loading States in ContextMenu

Update the submission UI to be clearer:

**Current:**

```
[Send] → "Sending..."
```

**Proposed:**

```
[Send] → [Spinner] Sending... → [Success] ✓ Sent!
```
```tsx
// In CommentForm
<button disabled={isSubmitting} onClick={handleSubmit}>
  {isSubmitting ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      Sending...
    </>
  ) : (
    'Send'
  )}
</button>
```

---

## File Changes Summary

### Part 1: FeaturesSection

| File | Action | Description |

|------|--------|-------------|

| `apps/web/src/components/FeaturesSection.tsx` | **Modify** | Convert to client component, add expandable cards with workflow visualization |

### Part 2: Toast System

| File | Action | Description |

|------|--------|-------------|

| `packages/anyclick-react/src/Toast/Toast.tsx` | **Create** | Toast component |

| `packages/anyclick-react/src/Toast/ToastContainer.tsx` | **Create** | Container with portal |

| `packages/anyclick-react/src/Toast/toastStore.ts` | **Create** | Zustand store |

| `packages/anyclick-react/src/Toast/types.ts` | **Create** | Type definitions |

| `packages/anyclick-react/src/Toast/styles.ts` | **Create** | Style constants |

| `packages/anyclick-react/src/Toast/index.ts` | **Create** | Barrel export |

| `packages/anyclick-react/src/AnyclickProvider.tsx` | **Modify** | Add toast on submit |

| `packages/anyclick-react/src/types.ts` | **Modify** | Add ToastConfig type |

| `packages/anyclick-react/src/index.ts` | **Modify** | Export `showToast`, `ToastContainer`, `ToastConfig` |

| `packages/anyclick-react/src/ContextMenu.tsx` | **Modify** | Improve loading UI |

---

## Implementation Order

### Phase 1: Global Toast System (Do First)

1. Create Toast component and store
2. Integrate into AnyclickProvider
3. Test submission flow end-to-end

### Phase 2: FeaturesSection Enhancement

1. Create WorkflowVisualization component  
2. Define feature configurations with workflows
3. Implement expandable FeatureCard
4. Add animation with framer-motion
5. Test all cards expand/collapse properly

---

## Technical Considerations

### Dependencies

- **framer-motion** - Already in project, use for animations
- **zustand** - Already in project, use for toast store
- No new dependencies required

### Accessibility

- Toast announcements via `aria-live="polite"`
- Escape key to dismiss
- Focus management when cards expand
- Reduced motion support

### Performance

- Toast store is minimal (just array of toasts)
- WorkflowVisualization uses `setInterval`, cleanup on unmount
- Card expansion uses CSS Grid layout shift (GPU accelerated)

---

## Success Criteria

### FeaturesSection

- [ ] All 6 cards expand on click
- [ ] Workflow visualization auto-advances through 4 steps
- [ ] Animation is smooth (60fps)
- [ ] "Learn more" links navigate correctly
- [ ] Cards collapse when clicking X or clicking outside

### Toast System  

- [ ] Success toast appears after feedback submission
- [ ] Error toast appears on submission failure
- [ ] Toasts auto-dismiss after 4 seconds
- [ ] Multiple toasts stack properly
- [ ] Toast can be manually dismissed
- [ ] Works in all browsers

---

## Out of Scope

- Toast persistence across page navigation
- Toast action buttons (undo, retry)
- Custom toast themes per provider
- Sound effects on toast