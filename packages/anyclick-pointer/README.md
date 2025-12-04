# @ewjdev/anyclick-pointer

> Custom cursor visualization with smooth animations - "Theme your click/cursor"

[![npm version](https://img.shields.io/npm/v/@ewjdev/anyclick-pointer.svg)](https://www.npmjs.com/package/@ewjdev/anyclick-pointer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@ewjdev/anyclick-pointer` provides a customizable cursor visualization that replaces the default browser cursor with a themed, animated pointer. The pointer transforms between different states based on user interactions:

- **Normal state**: Shows a customizable pointer icon (default: arrow cursor)
- **Right-click state**: Transforms to a semi-transparent circle with ripple effect
- **Pressing state**: Shows a scaled-down pointer with subtle circle indicator

## Installation

```bash
npm install @ewjdev/anyclick-pointer
# or
yarn add @ewjdev/anyclick-pointer
# or
pnpm add @ewjdev/anyclick-pointer
```

## Quick Start

Wrap your application with `PointerProvider` to enable the custom cursor:

```tsx
import { PointerProvider } from '@ewjdev/anyclick-pointer';

function App() {
  return (
    <PointerProvider>
      <YourApp />
    </PointerProvider>
  );
}
```

That's it! The custom pointer will now replace the default cursor throughout your application.

## Features

- **Custom Cursor Icon**: Replace default cursor with customizable pointer
- **Right-Click Animation**: Smooth transformation to semi-transparent circle with ripple
- **Press Animation**: Visual feedback when clicking/pressing
- **Menu-Aware**: Automatically shows pointer icon over menus (`role="menu"`)
- **High Performance**: Uses direct DOM manipulation for position updates (no React re-renders)
- **CSS Transitions**: Smooth GPU-accelerated animations
- **Configurable**: Theme colors, sizes, icons all customizable via props
- **Accessibility**: Respects `prefers-reduced-motion` system preference
- **TypeScript**: Full type definitions included

## Interaction States

The pointer has three interaction states:

| State | Trigger | Visual |
|-------|---------|--------|
| `normal` | Default / Mouse move | Pointer icon visible |
| `rightClick` | Right-click (context menu) | Circle visible, pointer hidden |
| `pressing` | Left mouse button down | Scaled pointer + faint circle |

### Menu-Aware Behavior

When a context menu is open (right-click state):
- **Over menu** (`role="menu"`): Pointer icon appears for easy menu interaction
- **Outside menu**: Circle remains visible indicating the menu is open
- **Click anywhere**: Returns to normal state, closes menu

## Configuration

### Theme Configuration

Customize the pointer appearance with colors, sizes, and custom icons:

```tsx
import { PointerProvider } from '@ewjdev/anyclick-pointer';
import { Crosshair } from 'lucide-react';

function App() {
  return (
    <PointerProvider
      theme={{
        colors: {
          // Pointer icon color
          pointerColor: '#3b82f6',
          // Circle background (right-click state)
          circleColor: 'rgba(59, 130, 246, 0.4)',
          // Circle border color
          circleBorderColor: 'rgba(59, 130, 246, 0.7)',
        },
        sizes: {
          // Pointer icon size in pixels
          pointerSize: 24,
          // Circle size in pixels
          circleSize: 44,
          // Circle border width in pixels
          circleBorderWidth: 2,
        },
        // Custom pointer icon (any React node)
        pointerIcon: <Crosshair size={24} />,
        // Custom circle element (optional)
        circleElement: <MyCustomCircle />,
      }}
    >
      <YourApp />
    </PointerProvider>
  );
}
```

### Behavior Configuration

Control pointer behavior:

```tsx
<PointerProvider
  config={{
    // When to show: "always" | "enabled" | "never"
    visibility: 'always',
    
    // Hide the default browser cursor
    hideDefaultCursor: true,
    
    // Z-index (must be higher than your UI elements)
    zIndex: 10001,
    
    // Respect prefers-reduced-motion
    respectReducedMotion: true,
    
    // Offset from cursor position [x, y]
    offset: [0, 0],
  }}
>
  <YourApp />
</PointerProvider>
```

### Enable/Disable Programmatically

```tsx
function App() {
  const [pointerEnabled, setPointerEnabled] = useState(true);

  return (
    <PointerProvider enabled={pointerEnabled}>
      <button onClick={() => setPointerEnabled(!pointerEnabled)}>
        Toggle Custom Pointer
      </button>
      <YourApp />
    </PointerProvider>
  );
}
```

## Using the Hook

Access pointer state and controls from any child component:

```tsx
import { usePointer } from '@ewjdev/anyclick-pointer';

function PointerDebugPanel() {
  const { 
    state, 
    isEnabled, 
    setEnabled, 
    setInteractionState,
    theme,
    config 
  } = usePointer();

  return (
    <div>
      <h3>Pointer State</h3>
      <p>Position: ({state.position.x}, {state.position.y})</p>
      <p>Interaction: {state.interactionState}</p>
      <p>Visible: {state.isVisible ? 'Yes' : 'No'}</p>
      <p>Enabled: {isEnabled ? 'Yes' : 'No'}</p>
      
      <h3>Controls</h3>
      <button onClick={() => setEnabled(!isEnabled)}>
        {isEnabled ? 'Disable' : 'Enable'} Pointer
      </button>
      <button onClick={() => setInteractionState('rightClick')}>
        Simulate Right-Click
      </button>
    </div>
  );
}
```

## Standalone CustomPointer

Use the pointer component directly without the provider for more control:

```tsx
import { CustomPointer } from '@ewjdev/anyclick-pointer';

function App() {
  const handleInteractionChange = (state) => {
    console.log('Pointer interaction:', state);
    // 'normal' | 'rightClick' | 'pressing'
  };

  return (
    <>
      <YourApp />
      <CustomPointer
        enabled={true}
        theme={{
          colors: { 
            pointerColor: '#10b981',
            circleColor: 'rgba(16, 185, 129, 0.4)',
          },
        }}
        config={{
          hideDefaultCursor: true,
          zIndex: 10001,
        }}
        onInteractionChange={handleInteractionChange}
      />
    </>
  );
}
```

## Complete Application Example

Here's a full example showing how to integrate the pointer in a Next.js application:

```tsx
// app/providers.tsx
'use client';

import { PointerProvider } from '@ewjdev/anyclick-pointer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PointerProvider
      theme={{
        colors: {
          pointerColor: '#6366f1', // Indigo
          circleColor: 'rgba(99, 102, 241, 0.3)',
          circleBorderColor: 'rgba(99, 102, 241, 0.6)',
        },
        sizes: {
          pointerSize: 20,
          circleSize: 40,
        },
      }}
      config={{
        visibility: 'always',
        hideDefaultCursor: true,
      }}
    >
      {children}
    </PointerProvider>
  );
}

// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

## Integration with FeedbackProvider

Use alongside `@ewjdev/anyclick-react` for a complete feedback experience:

```tsx
import { FeedbackProvider } from '@ewjdev/anyclick-react';
import { PointerProvider } from '@ewjdev/anyclick-pointer';
import { createHttpAdapter } from '@ewjdev/anyclick-github';

const adapter = createHttpAdapter({ endpoint: '/api/feedback' });

function App() {
  return (
    <FeedbackProvider adapter={adapter}>
      <PointerProvider
        theme={{
          colors: {
            pointerColor: '#3b82f6',
            circleColor: 'rgba(59, 130, 246, 0.4)',
          },
        }}
        config={{
          visibility: 'always',
          hideDefaultCursor: true,
        }}
      >
        <YourApp />
      </PointerProvider>
    </FeedbackProvider>
  );
}
```

## Custom Pointer Icons

You can use any React component as the pointer icon:

```tsx
import { PointerProvider } from '@ewjdev/anyclick-pointer';
import { Hand, Crosshair, Target, Pointer } from 'lucide-react';

// Using Lucide icons
<PointerProvider
  theme={{
    pointerIcon: <Crosshair size={24} strokeWidth={2} />,
  }}
>

// Using a custom SVG
<PointerProvider
  theme={{
    pointerIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path d="M12 2L2 22h20L12 2z" fill="currentColor" />
      </svg>
    ),
  }}
>

// Using an image
<PointerProvider
  theme={{
    pointerIcon: <img src="/custom-cursor.png" width={24} height={24} />,
  }}
>
```

## Custom Circle Element

Customize the right-click circle indicator:

```tsx
<PointerProvider
  theme={{
    circleElement: (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(99,102,241,0) 70%)',
          border: '2px dashed rgba(99,102,241,0.6)',
        }}
      />
    ),
  }}
>
```

## Animation Customization

Import animation utilities for advanced customization:

```tsx
import {
  springTransition,
  quickSpringTransition,
  fadeTransition,
  pointerVariants,
  circleVariants,
  rippleVariants,
  createSpringTransition,
  getTransition,
} from '@ewjdev/anyclick-pointer';

// Create custom spring animation
const mySpring = createSpringTransition({
  stiffness: 300,
  damping: 25,
  mass: 1,
});

// Get transition based on reduced motion preference
const transition = getTransition(prefersReducedMotion, 'spring');
```

## API Reference

### PointerProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Child components |
| `theme` | `PointerTheme` | See defaults | Theme configuration |
| `config` | `PointerConfig` | See defaults | Behavior configuration |
| `enabled` | `boolean` | `true` | Enable/disable pointer |
| `className` | `string` | - | Container class name |
| `style` | `CSSProperties` | - | Container styles |

### CustomPointer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `PointerTheme` | See defaults | Theme configuration |
| `config` | `PointerConfig` | See defaults | Behavior configuration |
| `enabled` | `boolean` | `true` | Enable/disable pointer |
| `onInteractionChange` | `(state) => void` | - | Callback on state change |

### PointerTheme

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `colors.pointerColor` | `string` | `'currentColor'` | Pointer icon color |
| `colors.circleColor` | `string` | `'rgba(59, 130, 246, 0.4)'` | Circle background |
| `colors.circleBorderColor` | `string` | `'rgba(59, 130, 246, 0.7)'` | Circle border |
| `sizes.pointerSize` | `number` | `24` | Pointer icon size (px) |
| `sizes.circleSize` | `number` | `44` | Circle size (px) |
| `sizes.circleBorderWidth` | `number` | `2` | Circle border width (px) |
| `pointerIcon` | `ReactNode` | `MousePointer2` | Custom pointer icon |
| `circleElement` | `ReactNode` | Default circle | Custom circle element |

### PointerConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `visibility` | `'always' \| 'enabled' \| 'never'` | `'always'` | When to show pointer |
| `hideDefaultCursor` | `boolean` | `true` | Hide browser cursor |
| `zIndex` | `number` | `10001` | Pointer z-index |
| `respectReducedMotion` | `boolean` | `true` | Honor system preference |
| `offset` | `[number, number]` | `[0, 0]` | Position offset [x, y] |

### usePointer Hook

Returns `PointerContextValue`:

| Property | Type | Description |
|----------|------|-------------|
| `state` | `PointerState` | Current pointer state |
| `isEnabled` | `boolean` | Whether pointer is enabled |
| `theme` | `PointerTheme` | Current theme |
| `config` | `PointerConfig` | Current config |
| `setInteractionState` | `(state) => void` | Set interaction state |
| `setEnabled` | `(enabled) => void` | Toggle enabled state |

### PointerState

| Property | Type | Description |
|----------|------|-------------|
| `position` | `{ x: number; y: number }` | Cursor position |
| `interactionState` | `'normal' \| 'rightClick' \| 'pressing'` | Current state |
| `isVisible` | `boolean` | Whether pointer is visible |
| `isInBounds` | `boolean` | Whether in document bounds |

## Performance

The CustomPointer component is optimized for performance:

- **Direct DOM manipulation**: Position updates bypass React's reconciliation (~60 updates/sec)
- **CSS transitions**: All animations use GPU-accelerated CSS transitions
- **Passive event listeners**: Mouse move events use `{ passive: true }`
- **Minimal re-renders**: Only interaction state changes trigger React re-renders

## Browser Support

Works in all modern browsers that support:
- CSS `position: fixed`
- CSS `transform` with `translate3d`
- CSS custom properties (CSS variables)
- `requestAnimationFrame`

## Troubleshooting

### Pointer not showing above my UI elements

Increase the `zIndex` in config:

```tsx
<PointerProvider config={{ zIndex: 99999 }}>
```

### Pointer flickering

Ensure you're not causing unnecessary re-renders in the parent component. The pointer position uses refs to avoid this.

### Default cursor still showing

Check that `hideDefaultCursor: true` is set and no other CSS is overriding `cursor: none`.

### Pointer not appearing over certain elements

Some elements with very high z-index may appear above the pointer. Adjust the pointer's `zIndex` accordingly.

## License

MIT
