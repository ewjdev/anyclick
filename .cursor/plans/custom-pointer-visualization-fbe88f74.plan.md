<!-- fbe88f74-774b-4388-9aa6-79d83c2df3c2 7eebc206-d3e2-4ca0-8395-76650877fc78 -->

# Custom Pointer Visualization Package

## Overview

Create a new `anyclick-pointer` package that provides customizable cursor visualization with smooth animations using motion.dev. The pointer will transform from an arrow icon to a semi-transparent circle on right-click, creating a unique "theme your click/cursor" experience.

## Package Structure

Create new package at `packages/anyclick-pointer/` following the same patterns as other packages:

- `src/index.ts` - Main exports
- `src/PointerProvider.tsx` - React context provider for pointer state
- `src/CustomPointer.tsx` - Main pointer visualization component
- `src/types.ts` - TypeScript types and interfaces
- `src/animations.ts` - Motion.dev animation configurations
- `package.json` - Package configuration
- `tsconfig.json` - TypeScript config
- `README.md` - Documentation

## Implementation Details

### 1. Package Setup (`packages/anyclick-pointer/package.json`)

- Add dependencies: `motion` (motion.dev), `lucide-react` (for icons), `react`, `react-dom`
- Add peer dependencies: `react >=19.1.1`, `react-dom >=19.2.0`
- Follow same build setup as `anyclick-react` (tsup, esm/cjs formats)

### 2. Types (`src/types.ts`)

Define interfaces for:

- `PointerConfig` - Configuration for pointer behavior (visibility, theme, icons)
- `PointerTheme` - Theme configuration (colors, sizes, icons)
- `PointerProviderProps` - Props for PointerProvider component
- `PointerState` - Internal state type

### 3. Pointer Component (`src/CustomPointer.tsx`)

- Use `motion` components for animations
- Track mouse position using `mousemove` events
- Display custom cursor icon (default: ArrowRight or Pointer from lucide-react)
- On right-click (`contextmenu` event):
- Transform arrow icon to semi-transparent circle
- Use motion.dev's `animate` prop for smooth transition
- Circle should fade in and scale up slightly
- Position pointer element using fixed positioning, following cursor
- Support custom icons via props

### 4. Animation Configuration (`src/animations.ts`)

- Define motion.dev animation variants:
- `normal` state: Arrow icon, default size/opacity
- `rightClick` state: Circle icon, semi-transparent, slightly larger
- Use spring animations for smooth transitions
- Configure timing and easing

### 5. Pointer Provider (`src/PointerProvider.tsx`)

- Create React context for pointer state
- Manage pointer visibility state
- Provide configuration via context
- Export `usePointer` hook for accessing pointer state
- Support integration with FeedbackProvider (optional prop to sync with feedback enabled state)

### 6. Integration Points

- **Standalone usage**: Can be used independently
- **With FeedbackProvider**: Optional integration to sync visibility with feedback enabled state
- **Configurable**: Props to control visibility, theme, icons

### 7. Exports (`src/index.ts`)

Export:

- `PointerProvider` component
- `CustomPointer` component
- `usePointer` hook
- Types and interfaces
- Animation utilities

## Key Features

1. **Custom Cursor Icon**: Replace default cursor with lucide-react icon (ArrowRight/Pointer)
2. **Right-Click Animation**: Smooth transformation to semi-transparent circle
3. **Motion.dev Animations**: Spring-based animations for natural feel
4. **Composable**: Follows same patterns as other packages
5. **Configurable**: Theme, icons, visibility all configurable via props
6. **Integration Ready**: Can integrate with FeedbackProvider or work standalone

## Files to Create/Modify

### New Files:

- `packages/anyclick-pointer/package.json`
- `packages/anyclick-pointer/tsconfig.json`
- `packages/anyclick-pointer/src/index.ts`
- `packages/anyclick-pointer/src/types.ts`
- `packages/anyclick-pointer/src/CustomPointer.tsx`
- `packages/anyclick-pointer/src/PointerProvider.tsx`
- `packages/anyclick-pointer/src/animations.ts`
- `packages/anyclick-pointer/README.md`

### Potential Integration (Optional):

- Update `packages/anyclick-react/src/FeedbackProvider.tsx` to optionally accept pointer config
- Update `packages/anyclick-react/src/index.ts` to re-export pointer components if integrated

## Technical Considerations

1. **Performance**: Use `requestAnimationFrame` for smooth cursor tracking
2. **Z-index**: Ensure pointer appears above other content but below context menu
3. **Pointer Events**: Handle `pointer-events: none` to avoid blocking interactions
4. **Browser Compatibility**: Ensure works across modern browsers
5. **Accessibility**: Consider `prefers-reduced-motion` for animations

## Dependencies

- `motion` (motion.dev) - For animations
- `lucide-react` - For SVG icons
- `react`, `react-dom` - React peer dependencies

### To-dos

- [ ] Create package structure: package.json, tsconfig.json, and basic directory structure for anyclick-pointer
- [ ] Define TypeScript types and interfaces in src/types.ts for pointer configuration, theme, and component props
- [ ] Create src/animations.ts with motion.dev animation variants for normal and right-click states
- [ ] Build CustomPointer component with mouse tracking, lucide-react icons, and right-click circle transformation
- [ ] Create PointerProvider component with React context for managing pointer state and configuration
- [ ] Create src/index.ts with proper exports following package patterns
- [ ] Create README.md with usage examples, API documentation, and integration guide
