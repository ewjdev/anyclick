# Anyclick Adapters (Experimental)

Adapters and helpers for Anyclick that are outside common/core use cases—like game/fun modes or custom cursor behaviors. These are intentionally experimental and may change without notice.

## Usage

```ts
import { createGameModeAdapter } from "@ewjdev/anyclick-adapters";
import { usePointer } from "@ewjdev/anyclick-pointer";

const adapter = createGameModeAdapter();

// Example: activate via a toggle
const { setConfig } = usePointer();
adapter.activate({ setConfig });
// Later
adapter.deactivate?.({ setConfig });
```

## Status

- `experimental: true` adapters log a one-time console warning.
- APIs are not stable; pin versions and test before upgrading.

