# @ewjdev/anyclick-pointer

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

