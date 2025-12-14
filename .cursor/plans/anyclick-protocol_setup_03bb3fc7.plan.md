---
name: anyclick-protocol setup
overview: Set up the anyclick-protocol package with proper TypeScript structure, documentation, and exports following the existing monorepo patterns.
todos:
  - id: create-src-structure
    content: Move existing files into src/ directory structure (spec.ts, intents/)
    status: completed
  - id: create-docs-folder
    content: Create docs/ folder and move spec.md into it
    status: completed
  - id: create-package-json
    content: Create package.json with @ewjdev/anyclick-protocol configuration
    status: completed
  - id: create-tsconfig
    content: Create tsconfig.json following anyclick-core pattern
    status: completed
  - id: create-index-ts
    content: Create src/index.ts with organized exports and JSDoc comments
    status: completed
  - id: create-readme
    content: Create README.md with overview, installation, and usage examples
    status: completed
  - id: create-changelog
    content: Create CHANGELOG.md with initial v0.2.0 entry
    status: completed
---

# anyclick-protocol Package Setup

## Package Structure

Create a standard TypeScript package structure mirroring existing packages like `anyclick-core`:

```
packages/anyclick-protocol/
├── docs/
│   └── spec.md              # Human-readable protocol documentation (moved)
├── src/
│   ├── index.ts             # Main entry point with all exports
│   ├── spec.ts              # Core protocol types (moved from root)
│   └── intents/             # Domain-specific intent enums (moved)
│       ├── index.ts
│       ├── art.ts
│       ├── ehr.ts
│       ├── insurance.ts
│       ├── service.ts
│       └── store.ts
├── package.json             # Package configuration
├── tsconfig.json            # TypeScript config
├── README.md                # Package documentation
└── CHANGELOG.md             # Version history
```

## Configuration Files

### [package.json](packages/anyclick-protocol/package.json)

```json
{
  "name": "@ewjdev/anyclick-protocol",
  "version": "0.2.0",
  "description": "Canonical protocol specification for Anyclick interaction events",
  "sideEffects": false,
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js",
      "import": "./dist/index.mjs"
    }
  }
}
```

Key points:

- Version `0.2.0` matches protocol spec version
- No runtime dependencies (pure TypeScript types + minimal type guards)
- Uses same `tsup` build setup as other packages

### [tsconfig.json](packages/anyclick-protocol/tsconfig.json)

Follow existing pattern from [anyclick-core/tsconfig.json](packages/anyclick-core/tsconfig.json).

## Entry Point Structure

### [src/index.ts](packages/anyclick-protocol/src/index.ts)

Exports organized into logical groups:

```typescript
// Protocol version
export type { AnyclickVersion } from "./spec";

// Core event types
export type { InteractionEvent, EventKind } from "./spec";

// Actor types
export type { ActorReference, ActorType } from "./spec";

// Target types (DOM, Virtual, Native)
export type { TargetReference, DomTarget, VirtualTarget, NativeTarget, BoundingBox } from "./spec";

// Intent types
export type { Intent } from "./spec";

// Operation types
export type { Operation, OperationDomain, OperationKind, ... } from "./spec";

// Context types (Navigation, State, Visual, Hierarchy)
export type { NavigationContext, StateSnapshot, VisualPayload, ... } from "./spec";

// Source mapping
export type { SourceReference, SourceLocation, SourceOpenRequest } from "./spec";

// Type guards
export { isDomTarget, isVirtualTarget, isNativeTarget, ... } from "./spec";

// Domain-specific intents
export * from "./intents";
```

## Integration Points with anyclick-core

The protocol provides foundational types that `anyclick-core` could adopt:

| Protocol Type | Current Core Type | Integration Notes |

|--------------|-------------------|-------------------|

| `InteractionEvent` | `AnyclickPayload` | Protocol is superset; core payload maps to subset |

| `Intent` | `AnyclickType` | Protocol Intent has confidence + inference source |

| `TargetReference` | `ElementContext` | Protocol supports DOM, Virtual, and Native targets |

| `SourceReference` | N/A | New capability for code mapping |

**Future integration (not in this task):**

- Core could depend on protocol for shared types
- Adapters could reference `InteractionEvent` when formatting output
- React package could use `Intent` for declarative intent markup

## Documentation

### README.md Content

- Overview of the protocol purpose
- Installation instructions
- Quick reference to key types
- Link to detailed spec in `docs/spec.md`
- Usage examples showing type imports

### CHANGELOG.md

Initialize with v0.2.0 entry documenting initial package setup.

## Build Verification

After setup, verify:

1. `yarn install` works at monorepo root
2. `yarn build` in protocol package generates `dist/` with `.d.ts` files
3. Types are properly exported and importable