# @ewjdev/anyclick-pointer

> Custom cursor visualization with smooth animations - "Theme your click/cursor"

[![npm version](https://img.shields.io/npm/v/@ewjdev/anyclick-pointer.svg)](https://www.npmjs.com/package/@ewjdev/anyclick-pointer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@ewjdev/anyclick-pointer` provides a customizable cursor visualization with smooth motion.dev animations. The pointer transforms from an arrow to a semi-transparent circle on right-click, creating a unique touch-like visual experience.

## Installation

```bash
npm install @ewjdev/anyclick-pointer
```

## Quick Start

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

## Features

- **Custom Cursor Icon**: Replace default cursor with customizable pointer
- **Right-Click Animation**: Smooth transformation to semi-transparent circle
- **Motion.dev Animations**: Spring-based animations for natural feel
- **Composable**: Follows same patterns as other anyclick packages
- **Configurable**: Theme, icons, visibility all configurable via props
- **Accessibility**: Respects `prefers-reduced-motion`

## Configuration

### Theme Configuration

Customize the pointer appearance:

```tsx
import { PointerProvider } from '@ewjdev/anyclick-pointer';
import { Crosshair } from 'lucide-react';

<PointerProvider
  theme={{
    colors: {
      pointerColor: '#3b82f6',
      circleColor: 'rgba(59, 130, 246, 0.4)',
      circleBorderColor: 'rgba(59, 130, 246, 0.7)',
    },
    sizes: {
      pointerSize: 24,
      circleSize: 44,
      circleBorderWidth: 2,
    },
    // Custom pointer icon
    pointerIcon: <Crosshair size={24} />,
  }}
>
  <YourApp />
</PointerProvider>
```

### Behavior Configuration

Control pointer behavior:

```tsx
<PointerProvider
  config={{
    // Visibility: "always" | "enabled" | "never"
    visibility: 'always',
    // Hide the default browser cursor
    hideDefaultCursor: true,
    // Z-index for the pointer element
    zIndex: 9990,
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
<PointerProvider enabled={isPointerEnabled}>
  <YourApp />
</PointerProvider>
```

## Using the Hook

Access pointer state and controls from any child component:

```tsx
import { usePointer } from '@ewjdev/anyclick-pointer';

function MyComponent() {
  const { state, isEnabled, setEnabled, setInteractionState } = usePointer();

  return (
    <div>
      <p>Pointer position: {state.position.x}, {state.position.y}</p>
      <p>Interaction state: {state.interactionState}</p>
      <button onClick={() => setEnabled(!isEnabled)}>
        Toggle Pointer
      </button>
    </div>
  );
}
```

## Standalone CustomPointer

Use the pointer component directly without the provider:

```tsx
import { CustomPointer } from '@ewjdev/anyclick-pointer';

function App() {
  return (
    <>
      <YourApp />
      <CustomPointer
        enabled={true}
        theme={{
          colors: { pointerColor: '#10b981' },
        }}
        onInteractionChange={(state) => console.log('Interaction:', state)}
      />
    </>
  );
}
```

## Integration with FeedbackProvider

Use alongside `@ewjdev/anyclick-react` for a complete experience:

```tsx
import { FeedbackProvider } from '@ewjdev/anyclick-react';
import { PointerProvider } from '@ewjdev/anyclick-pointer';
import { createHttpAdapter } from '@ewjdev/anyclick-github';

const adapter = createHttpAdapter({ endpoint: '/api/feedback' });

function App() {
  return (
    <PointerProvider>
      <FeedbackProvider adapter={adapter}>
        <YourApp />
      </FeedbackProvider>
    </PointerProvider>
  );
}
```

## Animation Customization

Import and customize animation utilities:

```tsx
import {
  springTransition,
  quickSpringTransition,
  pointerVariants,
  circleVariants,
  createSpringTransition,
} from '@ewjdev/anyclick-pointer';

// Create custom spring animation
const mySpring = createSpringTransition({
  stiffness: 300,
  damping: 25,
  mass: 1,
});
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
| `zIndex` | `number` | `9990` | Pointer z-index |
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

## Browser Support

Works in all modern browsers that support:
- CSS `position: fixed`
- `requestAnimationFrame`
- CSS custom properties

## License

MIT

