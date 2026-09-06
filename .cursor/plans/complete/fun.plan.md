# Fun Mode — "Go-Kart Cursor" Mode

## Concept Overview

**Core Idea**: Transform any scoped `AnyclickProvider` set to "fun" mode into an interactive race course where the cursor becomes a go-kart. This leverages the existing scoped provider architecture where each provider has a container boundary (`containerRef`) that naturally defines a track perimeter.

**The Vision**: When a user enters a scoped provider with `theme={{ funMode: true }}`, the cursor transforms into a go-kart that can be driven around the DOM structure. The provider's container becomes the outer track wall, sibling elements become lanes/obstacles, and child elements create inner track paths. This creates a playful, game-like interaction layer that doesn't interfere with normal functionality.

## Architecture Integration

### How Scoped Providers Work

Scoped providers (`scoped={true}`) create a boundary using `containerRef` that limits event capture to elements within that container. The provider registry (`useProviderStore`) tracks all providers and can:

- Find providers for any given element (`findProvidersForElement`)
- Determine parent/child relationships via `parentId` and `depth`
- Merge themes hierarchically (child themes override parent)
- Check if elements are within scoped provider containers

### Integration Points

1. **AnyclickProvider Theme Extension**: Extend `AnyclickTheme` in `packages/anyclick-react/src/types.ts` to include:
   ```typescript
   funMode?: boolean | FunModeConfig;
   ```

Where `FunModeConfig` includes track rules, power-up settings, quest definitions, etc.

2. **PointerProvider Enhancement**: Extend `PointerConfig` in `packages/anyclick-pointer/src/types.ts` to support fun mode:
   ```typescript
   mode?: 'normal' | 'fun' | 'calm';
   funConfig?: FunModeConfig;
   ```

The `CustomPointer` component (`packages/anyclick-pointer/src/CustomPointer.tsx`) will conditionally render `GoKartPointer` when `mode === 'fun'`.

3. **Provider Store Integration**: When a scoped provider has `funMode: true`, register it in a fun mode registry that tracks:

   - Active fun mode providers
   - Current kart position relative to each provider's container
   - Track boundaries (computed from DOM structure)

4. **Track Generation**: When fun mode activates, analyze the scoped provider's container DOM structure:

   - **Parent container** (`containerRef.current`) = outer track wall
   - **Sibling elements** = lanes/obstacles (use `containerRef.current.parentElement.children`)
   - **Child elements** = inner track paths (use `containerRef.current.children`)
   - Cache track layout using `getBoundingClientRect()` for collision detection

### Execution Strategy

#### Phase 1: Core Infrastructure

**Location**: `packages/anyclick-pointer/src/`

1. **Type Definitions** (`types.ts`):

   - Add `FunModeConfig` interface with track rules, power-ups, quests
   - Extend `PointerConfig` with `mode` and `funConfig`
   - Add `GoKartState` interface for kart position, velocity, rotation

2. **GoKartPointer Component** (`GoKartPointer.tsx`):

   - Replace `CustomPointer` when `mode === 'fun'`
   - Render go-kart sprite/visualization
   - Handle kart rotation based on movement direction
   - Integrate with collision detection system

3. **Fun Mode Manager** (`funMode.ts`):

   - Track active fun mode providers
   - Detect when cursor enters/exits fun mode scopes
   - Coordinate between multiple scoped fun providers
   - Manage calm mode toggle

#### Phase 2: Movement & Controls

**Location**: `packages/anyclick-pointer/src/`

1. **Movement System** (`movement.ts`):

   - Keyboard controls (Arrow keys, WASD) → velocity/acceleration physics
   - Device tilt support (`DeviceOrientationEvent`) → map tilt to steering
   - Scroll wheel → turbo boost (temporary speed multiplier)
   - Long-press detection → drift mode (increased turn radius, skid marks)

2. **Physics Engine** (`physics.ts`):

   - Velocity/acceleration calculations
   - Friction/drag for natural movement feel
   - Collision response (bounce, slide along walls)
   - Boundary enforcement (keep kart within track)

#### Phase 3: Collision & Track Detection

**Location**: `packages/anyclick-pointer/src/`

1. **Track Analyzer** (`trackAnalyzer.ts`):

   - Analyze scoped provider container DOM structure
   - Map parent/sibling/child relationships to track boundaries
   - Cache `getBoundingClientRect()` results for performance
   - Handle dynamic DOM changes (ResizeObserver/MutationObserver)

2. **Collision Detection** (`collision.ts`):

   - Hit-testing using cached bounding boxes
   - Detect collisions with track boundaries
   - Calculate collision normals for bounce physics
   - Optimize with spatial partitioning if needed

#### Phase 4: Visual Effects

**Location**: `packages/anyclick-pointer/src/`

1. **Track Renderer** (`trackRenderer.tsx`):

   - Render neon outlines on detected boundaries
   - Add mini shadows for depth perception
   - Theme-aware colors (respect `prefers-color-scheme`)
   - Canvas or SVG overlay for performance

2. **Particle Systems** (`particles.ts`):

   - Skid mark trails (fade out over time)
   - Spark trails during turbo boost
   - Collision impact effects
   - Canvas-based for performance

3. **Haptic Feedback** (`haptics.ts`):

   - Use `navigator.vibrate()` API
   - Gentle vibrations on collisions/drift
   - Respect `prefers-reduced-motion`
   - Subtle, non-intrusive patterns

#### Phase 5: Game Mechanics

**Location**: `packages/anyclick-pointer/src/`

1. **Lap Timer** (`lapTimer.ts`):

   - Track time per lap
   - Detect lap completion (kart completes circuit of parent container)
   - Store best lap times per provider
   - Display timer UI overlay

2. **Checkpoint System** (`checkpoints.ts`):

   - Identify key sibling elements as checkpoints
   - Visual checkpoint gates (animated when passed)
   - Track checkpoint completion order
   - Required checkpoints for lap validation

3. **Quest System** (`quests.ts`):

   - Generate micro-quests based on DOM structure:
     - "Collect 3 buttons" → find all `<button>` elements
     - "Park inside the form" → navigate to `<form>` element
   - Track quest progress
   - Quest UI overlay
   - Quest completion rewards

#### Phase 6: Power-ups

**Location**: `packages/anyclick-pointer/src/`

1. **Power-up Detection** (`powerups.ts`):

   - **Boost from links**: Detect hover over `<a>` elements → temporary speed boost
   - **Shield from buttons**: Detect hover over `<button>` elements → collision immunity
   - **Sticky tires from inputs**: Detect hover over `<input>`, `<textarea>`, `<select>` → precise steering

2. **Power-up Effects**:

   - Visual indicators (glow, particles)
   - Duration timers
   - Stacking rules (can multiple power-ups be active?)

#### Phase 7: Safety & Accessibility

**Location**: `packages/anyclick-pointer/src/`

1. **Calm Mode** (`calmMode.ts`):

   - Keyboard shortcut (e.g., `Escape` or `Ctrl+Shift+C`)
   - UI button to toggle calm mode
   - Instantly revert to normal cursor
   - Preserve fun mode state for re-enable

2. **Accessibility Preservation**:

   - Ensure keyboard navigation still works (Tab, Enter, Space)
   - Preserve focus management
   - Screen reader compatibility (ARIA labels)
   - Never block real input events (clicks, keyboard input)
   - Fun mode should be additive, not replacement

#### Phase 8: Multiplayer (Optional)

**Location**: `packages/anyclick-pointer/src/`

1. **Multi-pointer View** (`multiplayer.ts`):

   - Allow multiple go-karts on same track
   - Each kart has unique color/identifier
   - Sync positions via shared state (localStorage or WebSocket)
   - Collision detection between karts

2. **Ghost Lap Sharing** (`ghostLaps.ts`):

   - Record lap data (position over time)
   - Store ghost lap data
   - Render ghost kart visualization
   - Show teammate best times

#### Phase 9: Extensibility

**Location**: `packages/anyclick-react/src/types.ts` and `packages/anyclick-pointer/src/`

1. **Custom Track Rules**:

   - Extend `FunModeConfig` to allow component-specific rules
   - Example: `{ componentType: 'modal', trackRules: { tightHairpin: true } }`
   - Rule system that modifies track generation

2. **Track Generation Seeding**:

   - Seed-based track generation per scoped provider
   - Deterministic layout based on provider ID + DOM structure hash
   - Allow manual track definition override

## Implementation Details

### Track Boundary Detection

When fun mode activates for a scoped provider:

```typescript
// Pseudo-code for track analysis
const container = provider.containerRef.current;
const parent = container.parentElement;
const siblings = Array.from(parent.children).filter((el) => el !== container);
const children = Array.from(container.children);

// Outer wall = container's bounding box
const outerWall = container.getBoundingClientRect();

// Obstacles = sibling bounding boxes
const obstacles = siblings.map((sibling) => ({
  element: sibling,
  bounds: sibling.getBoundingClientRect(),
  type: "obstacle",
}));

// Inner tracks = child bounding boxes
const innerTracks = children.map((child) => ({
  element: child,
  bounds: child.getBoundingClientRect(),
  type: "track",
}));
```

### Provider Coordination

When cursor moves, check which fun mode providers are active:

```typescript
// Use existing store to find providers
const providers = useProviderStore.getState().providers;
const funProviders = Array.from(providers.values()).filter(
  (p) => p.theme?.funMode && p.scoped && p.containerRef.current,
);

// Check if cursor is within any fun provider's container
const cursorElement = document.elementFromPoint(x, y);
const activeFunProvider = funProviders.find((p) =>
  p.containerRef.current?.contains(cursorElement),
);
```

### Theme Merging

Fun mode configs merge hierarchically like other theme properties:

```typescript
// Child provider inherits parent's fun mode, can override
<AnyclickProvider theme={{ funMode: { powerUps: true } }}>
  <AnyclickProvider
    scoped
    theme={{ funMode: { powerUps: false, quests: true } }}
  >
    {/* This scoped provider has powerUps: false, quests: true */}
  </AnyclickProvider>
</AnyclickProvider>
```

## File Structure

```
packages/anyclick-pointer/src/
├── types.ts                    # Extended with FunModeConfig, GoKartState
├── CustomPointer.tsx           # Conditionally render GoKartPointer
├── GoKartPointer.tsx           # NEW: Go-kart visualization component
├── funMode.ts                  # NEW: Fun mode manager/coordinator
├── movement.ts                 # NEW: Movement controls (keyboard, tilt, scroll)
├── physics.ts                  # NEW: Physics engine (velocity, collision)
├── trackAnalyzer.ts           # NEW: DOM structure → track boundaries
├── collision.ts                # NEW: Hit-testing and collision detection
├── trackRenderer.tsx           # NEW: Visual track boundaries
├── particles.ts                # NEW: Skid marks, spark trails
├── haptics.ts                  # NEW: Vibration feedback
├── lapTimer.ts                 # NEW: Lap timing system
├── checkpoints.ts              # NEW: Checkpoint gates
├── quests.ts                   # NEW: Micro-quest system
├── powerups.ts                 # NEW: Power-up detection and effects
├── calmMode.ts                 # NEW: Calm mode toggle
├── multiplayer.ts              # NEW: Multi-pointer support (optional)
└── ghostLaps.ts               # NEW: Ghost lap recording (optional)

packages/anyclick-react/src/
├── types.ts                    # Extended AnyclickTheme with funMode
└── AnyclickProvider.tsx        # Pass funMode config to pointer system
```

## Usage Example

```tsx
// Enable fun mode on a scoped provider
<AnyclickProvider
  scoped
  theme={{
    funMode: {
      enabled: true,
      powerUps: true,
      quests: ["collectButtons", "parkInForm"],
      trackRules: {
        tightHairpin: false,
        checkpointSiblings: true,
      },
    },
  }}
>
  <div className="dashboard">
    {/* This entire dashboard becomes a race track */}
    <header>Sibling = checkpoint</header>
    <main>Inner track</main>
    <footer>Another checkpoint</footer>
  </div>
</AnyclickProvider>
```

## Key Principles

1. **Non-blocking**: Fun mode never prevents normal interaction. Users can still click, type, navigate normally.
2. **Scoped by design**: Only activates within scoped providers with `funMode: true`.
3. **Theme-aware**: Respects existing theme system (colors, contrast, reduced motion).
4. **Performance**: Use canvas/SVG for effects, cache track boundaries, optimize collision detection.
5. **Accessibility first**: Keyboard nav, screen readers, focus management all preserved.
6. **Progressive enhancement**: Works without fun mode, adds playful layer when enabled.
