# @ewjdev/anyclick-pointer

## 1.1.0

### Minor Changes

- **Nested Provider Support**: `PointerProvider` now supports nesting. When you nest providers, hovering over a nested provider's children will apply that provider's theme to the pointer.

  ```tsx
  <PointerProvider theme={{ colors: { pointerColor: 'blue' } }}>
    <div>Blue pointer here</div>
    
    {/* Nested - theme applied on hover */}
    <PointerProvider theme={{ colors: { pointerColor: 'red' } }}>
      <div>Red pointer when hovering here!</div>
    </PointerProvider>
  </PointerProvider>
  ```

- **Theme Inheritance**: Nested providers inherit and merge with parent themes. You only need to specify the values you want to override.

- **New Helper Functions**:
  - `mergeThemeWithDefaults(theme)` - Merge a partial theme with default values
  - `mergeThemeWithParent(parentTheme, childTheme)` - Merge a child theme with parent
  - `mergeConfigWithDefaults(config)` - Merge a partial config with defaults
  - `mergeConfigWithParent(parentConfig, childConfig)` - Merge a child config with parent

- **New Hooks**:
  - `useParentPointerTheme()` - Access parent provider's theme for manual merging

- **New Type Exports**:
  - `MergedTheme` - Type for fully merged theme with required values

### Implementation Details

- Root provider renders the actual `CustomPointer` component
- Nested providers wrap children in a hover-detection container
- Theme overrides are managed via a stack - hovering pushes theme, leaving pops it
- Supports arbitrary nesting depth

## 1.0.0

### Major Changes

- Initial release of the custom pointer library

### Features

- **Custom Pointer Component**: Fully customizable cursor visualization with smooth animations
- **PointerProvider**: React context provider for global pointer state management
- **usePointer Hook**: Access and control pointer state from any component
- **Dynamic Theme Updates**: Update pointer theme at runtime via `setTheme` function
- **Transparent Background Support**: Toggle between transparent and semi-transparent filled backgrounds
- **Menu-Aware Behavior**: Automatically switches between pointer icon and circle when hovering over menus
- **Performance Optimized**: Direct DOM manipulation for position updates, CSS-first animations
- **Right-Click Animation**: Smooth circle expansion with ripple effect on right-click
- **Press Effects**: Visual feedback when clicking (scaled pointer + faint circle)
- **Custom Icons**: Support for any React component as pointer icon
- **Accessibility**: Respects `prefers-reduced-motion` for reduced animations
- **High Z-Index**: Ensures pointer appears above all UI elements (z-index: 10001)

### Configuration Options

- **Theme**: Customize colors, sizes, and pointer icon
- **Config**: Control visibility, default cursor hiding, z-index, and position offset
- **Default Theme**: Semi-transparent fill (30% opacity) with theme color matching

### Documentation

- Comprehensive README with usage examples
- Interactive examples page with live theme customization
- API reference for all configuration options
