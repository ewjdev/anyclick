---
name: Swift Native AnyClick Implementation
overview: Create a native macOS application using Swift that intercepts right-clicks, resolves context (including deep browser context via an extension bridge), and displays a dynamic, graph-based native menu.
todos:
  - id: scaffold-swift-project
    content: Scaffold Swift Project in `apps/anyclick-native`
    status: pending
  - id: implement-input-monitor
    content: Implement InputMonitor and MenuRenderer (Proof of Concept)
    status: pending
    dependencies:
      - scaffold-swift-project
  - id: implement-graph-engine
    content: Design and Implement Graph Data Structure in Swift
    status: pending
    dependencies:
      - scaffold-swift-project
  - id: update-extension-manifest
    content: Update Extension Manifest for Native Messaging
    status: pending
  - id: implement-browser-bridge
    content: Implement Browser Bridge in Swift and Extension
    status: pending
    dependencies:
      - update-extension-manifest
      - scaffold-swift-project
isProject: false
---

# AnyClick Native macOS Implementation Plan

This plan outlines the creation of a high-performance native macOS application that replaces/augments the web-based AnyClick flows. It uses system-level hooks for event tracking and a bridge to the browser for DOM interactions.

## Architecture

```mermaid
graph TD
    User((User)) -->|Right Click| InputMonitor[Input Monitor (CGEventTap)]
    InputMonitor -- Suppress OS Menu --> ContextEngine[Context Engine]
    
    subgraph Native App [Swift macOS App]
        InputMonitor
        ContextEngine
        GraphEngine[Graph Engine]
        MenuRenderer[Menu Renderer]
        ActionExecutor[Action Executor]
    end
    
    subgraph Browser [Chrome/Arc/Safari]
        Extension[AnyClick Extension]
        DOM[DOM Context]
    end
    
    ContextEngine -->|Get Active App| OS[macOS Accessibility API]
    ContextEngine -.->|Native Messaging| Extension
    
    Extension -->|DOM Data| ContextEngine
    
    ContextEngine -->|Context + AppID| GraphEngine
    GraphEngine -->|Menu Items| MenuRenderer
    MenuRenderer -->|Show| User
    
    User -->|Select Action| ActionExecutor
    ActionExecutor -->|Perform| OS
    ActionExecutor -->|Execute Script| Extension
```



## Core Components

### 1. Native Application Structure (`apps/anyclick-native`)

- **Technology**: Swift 6, AppKit (for low-level events/menus), SwiftUI (for Settings UI).
- **Permissions**:
  - `Accessibility`: To read selected text and UI elements.
  - `Input Monitoring`: To intercept global mouse clicks.
  - `Native Messaging`: To communicate with the browser extension.

### 2. The Graph Engine

A JSON-based configuration engine that resolves menu items based on `(Application, Context)`.

**Schema Definition:**

```json
{
  "rules": [
    {
      "appId": "com.microsoft.VSCode",
      "context": { "hasSelection": true },
      "actions": ["copy", "save-to-context", "ask-ai"]
    },
    {
      "appId": "com.google.Chrome",
      "context": { "domType": "image" },
      "actions": ["save-image", "upload-thing"]
    }
  ]
}
```

### 3. Context & Event Loop

1. **Hook**: `CGEvent.tapCreate` listens for right-mouse-down.
2. **Filter**: If a modifier key (e.g., `Cmd`) is held (optional config), passthrough to OS. Otherwise, suppress.
3. **Resolve**:
  - Get `NSWorkspace.shared.frontmostApplication`.
  - Use `AXUIElement` to get selected text.
  - If Browser, send "Ping" to Extension via Native Messaging to get DOM element under cursor.

### 4. Extension Bridge

- **Update** `packages/anyclick-extension` to support Native Messaging.
- **Protocol**: 
  - `Request: { type: "GET_CONTEXT", x: 100, y: 200 }`
  - `Response: { element: "img", src: "...", id: "..." }`
  - `Command: { type: "EXECUTE", action: "remove-element", targetId: "..." }`

## Implementation Steps

### Phase 1: Native Foundation

- Initialize Xcode project in `apps/anyclick-native`.
- Implement `InputMonitor` class using `CoreGraphics`.
- Create `PermissionManager` to request/check Accessibility/Input permissions.
- Implement basic `MenuRenderer` using `NSMenu`.

### Phase 2: Graph & Context

- Define `GraphConfig` structs and load default rules.
- Implement `ContextResolver` (getting frontmost app bundle ID and selected text).
- Connect `InputMonitor` -> `ContextResolver` -> `Graph` -> `Menu`.

### Phase 3: Browser Integration

- Add `nativeMessaging` permission to `packages/anyclick-extension/manifest.json`.
- Implement Native Messaging Host registration script.
- Create `BrowserBridge` in Swift to handle stdio communication with Chrome.
- Update Extension content script to answer "Context Requests".

## File Structure

- `apps/anyclick-native/`
  - `Sources/`
    - `Core/` (Graph, EventLoop)
    - `Mac/` (Accessibility, InputTap)
    - `Bridge/` (NativeMessaging)
    - `UI/` (Settings, Menu)
- `packages/anyclick-extension/src/native/` (New bridge logic)

## Key Challenges & Mitigations

- **Speed**: Waiting for Chrome extension response might delay menu. 
  - *Mitigation*: Show menu immediately with "Loading..." or generic actions, update when response arrives (or strict 50ms timeout).
- **Sandboxing**: App Store distribution is hard with Accessibility/NativeMessaging. 
  - *Mitigation*: Distribute as signed Developer ID app (outside App Store).

