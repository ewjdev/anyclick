# @ewjdev/anyclick-protocol

> Canonical protocol specification for Anyclick interaction events

[![npm version](https://img.shields.io/npm/v/@ewjdev/anyclick-protocol.svg)](https://www.npmjs.com/package/@ewjdev/anyclick-protocol)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@ewjdev/anyclick-protocol` provides the foundational TypeScript types and domain-specific intent enums for the Anyclick interaction event protocol. This package defines how user interactions are captured, how intent is represented, and how context (UI, navigation, visual snapshots) is structured.

The protocol enables:
- **Semantic Intent** - Turn raw clicks into meaningful business events
- **Full Context** - Capture UI state, navigation, screenshots, and source code mapping
- **Domain-Specific Intents** - Pre-defined intent enums for common business domains
- **Type Safety** - Complete TypeScript definitions with type guards

## Installation

```bash
yarn add @ewjdev/anyclick-protocol
# or
npm install @ewjdev/anyclick-protocol
```

## Quick Start

### Basic Usage

```typescript
import type { InteractionEvent, Intent } from "@ewjdev/anyclick-protocol";

// Create an interaction event
const event: InteractionEvent = {
  id: "evt_123",
  version: "anyclick:0.2",
  kind: "interaction",
  timestamp: new Date().toISOString(),
  actor: {
    type: "human",
    userId: "user_456",
  },
  target: {
    kind: "dom",
    tag: "button",
    selector: "#checkout-button",
    role: "button",
  },
  intent: {
    type: "domain.store.checkout.start",
    confidence: 1.0,
    inferredFrom: ["developer"],
  },
};
```

### Using Domain-Specific Intents

```typescript
import {
  StoreIntent,
  EhrIntent,
  type InteractionEvent,
} from "@ewjdev/anyclick-protocol";

// Use predefined intent enums
const checkoutEvent: InteractionEvent = {
  // ... other fields
  intent: {
    type: StoreIntent.CHECKOUT_START,
    confidence: 1.0,
    inferredFrom: ["component"],
  },
};

const appointmentEvent: InteractionEvent = {
  // ... other fields
  intent: {
    type: EhrIntent.APPT_SLOT_SELECT,
    confidence: 0.95,
    inferredFrom: ["heuristic"],
  },
};
```

### Type Guards

```typescript
import {
  isDomTarget,
  isInteractionEvent,
  type TargetReference,
  type InteractionEvent,
} from "@ewjdev/anyclick-protocol";

function handleTarget(target: TargetReference) {
  if (isDomTarget(target)) {
    console.log("DOM element:", target.selector);
  } else if (isVirtualTarget(target)) {
    console.log("Virtual action:", target.id);
  }
}

function handleEvent(event: InteractionEvent) {
  if (isInteractionEvent(event)) {
    console.log("User interaction:", event.intent.type);
  }
}
```

## Core Types

### InteractionEvent

The core data record representing a user interaction with full context:

```typescript
interface InteractionEvent {
  id: string;
  version: AnyclickVersion;
  kind: EventKind;
  timestamp: string;
  actor: ActorReference;
  target: TargetReference;
  intent: Intent;
  operation?: Operation;
  navigation?: NavigationContext;
  state?: StateSnapshot;
  visual?: VisualPayload;
  hierarchy?: HierarchyEntry[];
  source?: SourceReference;
  result?: ResultPayload;
  // ... additional metadata fields
}
```

### Intent

Represents the semantic meaning of a user action:

```typescript
interface Intent {
  type: string; // e.g., "domain.store.cart.add"
  confidence: number; // 0-1 confidence score
  inferredFrom?: ("developer" | "component" | "role" | "dataset" | "heuristic")[];
  parameters?: Record<string, any>;
}
```

### TargetReference

The UI element or virtual action that was interacted with:

```typescript
type TargetReference = DomTarget | VirtualTarget | NativeTarget;
```

## Domain-Specific Intents

The package includes predefined intent enums for common business domains:

- **EHR** (`EhrIntent`) - Electronic Health Records workflows
- **Store** (`StoreIntent`) - E-commerce and fulfillment
- **Service Quote** (`ServiceQuoteIntent`) - Contract/service-based businesses
- **Insurance** (`InsuranceIntent`) - Insurance marketing and quoting
- **Artwork** (`ArtworkIntent`) - Online art marketplace

See the [intents documentation](./src/intents/) for detailed examples of each domain.

## Documentation

- **[Protocol Specification](./docs/spec.md)** - Human-friendly overview of the protocol
- **[TypeScript Spec](./src/spec.ts)** - Complete type definitions with inline documentation
- **[Intent Examples](./src/intents/)** - Domain-specific intent enums with usage examples

## Integration with Other Packages

This protocol package is designed to be used by:

- **@ewjdev/anyclick-core** - Core library can reference protocol types for event structure
- **@ewjdev/anyclick-react** - React components can use intent enums for declarative markup
- **Adapters** - Custom adapters can format protocol events for different backends

## TypeScript Support

This package is written in TypeScript and provides complete type definitions. All types are exported from the main entry point:

```typescript
import type {
  InteractionEvent,
  Intent,
  TargetReference,
  Operation,
  // ... and more
} from "@ewjdev/anyclick-protocol";
```

## Related Packages

- [`@ewjdev/anyclick-core`](https://www.npmjs.com/package/@ewjdev/anyclick-core) - Framework-agnostic core library
- [`@ewjdev/anyclick-react`](https://www.npmjs.com/package/@ewjdev/anyclick-react) - React provider and UI components
- [`@ewjdev/anyclick-github`](https://www.npmjs.com/package/@ewjdev/anyclick-github) - GitHub Issues integration
- [`@ewjdev/anyclick-cursor`](https://www.npmjs.com/package/@ewjdev/anyclick-cursor) - Cursor AI integration

## License

MIT © [anyclick](https://anyclick.ewj.dev)
