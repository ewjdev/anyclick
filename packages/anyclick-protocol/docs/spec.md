# ANYCLICK PROTOCOL — HUMAN-FRIENDLY OVERVIEW (v0.2)

This document explains the **concepts**, **intentions**, and **meaning** behind the Anyclick protocol in plain language.

It links directly to the technical spec (`anyclick-spec.ts`) so both technical and non-technical readers can follow along.

---

# 🧭 Table of Contents

- [ANYCLICK PROTOCOL — HUMAN-FRIENDLY OVERVIEW (v0.2)](#anyclick-protocol--human-friendly-overview-v02)
- [🧭 Table of Contents](#-table-of-contents)
- [1. What is an Anyclick Event?](#1-what-is-an-anyclick-event)
- [2. Intent — What the User Meant](#2-intent--what-the-user-meant)
- [3. Target — What Was Clicked](#3-target--what-was-clicked)
- [4. Operation — What the System Did](#4-operation--what-the-system-did)
- [5. Navigation — Where the User Went](#5-navigation--where-the-user-went)
- [6. State Snapshot — What the UI Looked Like](#6-state-snapshot--what-the-ui-looked-like)
- [7. Visual Payload — Screenshots](#7-visual-payload--screenshots)
- [8. Hierarchy — DOM Context](#8-hierarchy--dom-context)
- [9. Source Mapping — Linking UI ↔ Code](#9-source-mapping--linking-ui--code)
- [10. Result Payload](#10-result-payload)
- [11. Origin + Workflow Metadata](#11-origin--workflow-metadata)
- [12. Source Opener (DevTools → Editor)](#12-source-opener-devtools--editor)
- [🎉 Summary](#-summary)

---

# <a name="what-is-an-anyclick-event"></a>1. What is an Anyclick Event?

An **Anyclick Event** is a structured record describing:

- **What the user did**  
- **What they meant to do**  
- **What UI element they interacted with**  
- **What the system did as a result**  
- **Where in the code this interaction came from**

A single record can power:

- Debugging  
- Autofix workflows  
- Analytics  
- Support / QA tools  
- AI automation  
- Visual regressions  
- Replay/testing

🔗 See the spec: [`InteractionEvent`](anyclick-spec.ts#L22)

---

# <a name="intent"></a>2. Intent — What the User Meant

Intent turns a raw click into **meaning**:

- `"ui.click"`
- `"domain.cart.add"`
- `"domain.checkout.start"`
- `"domain.appointment.slot.select"`
- `"domain.clinical.note.save"`

Intent is the heart of Anyclick because it makes UI actions **semantic**.

Intent can be:

- Declared (via HTML or component)
- Inferred (from text/role)
- Derived (from scope or analytics)

🔗 See spec: [`Intent`](anyclick-spec.ts#L113)

---

# <a name="target"></a>3. Target — What Was Clicked

Target describes the UI element:

- DOM element (button, input, link)
- Virtual action (e.g. voice command → "create appointment")
- Native mobile control

Target includes:

- CSS selector  
- ARIA/role  
- attributes  
- bounding box  

🔗 Spec: [`TargetReference`](anyclick-spec.ts#L46)

---

# <a name="operation"></a>4. Operation — What the System Did

While **intent** is what the *user meant*,  
**operation** is what the *system performs*.

Examples:

- `"data.create"` (e.g., creating a task)
- `"data.update"` (e.g., canceling an appointment)
- `"data.delete"` (e.g., deleting a lab order)
- `"memory.remember"` (saving user preference)
- `"ai.visual.compare"` (snapshot comparison)

Operations also include:

- Approval  
- Status (`pending`, `failed`, `succeeded`)  
- Expected side effects  

🔗 Spec: [`Operation`](anyclick-spec.ts#L135)

---

# <a name="navigation"></a>5. Navigation — Where the User Went

Every useful user journey crosses multiple screens.

Navigation captures:

- from → to  
- method (`push`, `replace`, `pop`)  
- optional HTTP status code  

🔗 Spec: [`NavigationContext`](anyclick-spec.ts#L193)

---

# <a name="state"></a>6. State Snapshot — What the UI Looked Like

A lightweight view of the UI at the moment:

- Form values (non-sensitive only)  
- Toggle states  
- Component visibility  
- Disabled states  

Not a full-page serialization — just enough context for:

- Autofix  
- Testing  
- AI reasoning  
- Analytics  

🔗 Spec: [`StateSnapshot`](anyclick-spec.ts#L209)

---

# <a name="visual"></a>7. Visual Payload — Screenshots

Optional images:

- element  
- viewport  
- ancestor container  

Useful for:

- Bug reports  
- QA  
- Replay  
- AI visual understanding  

🔗 Spec: [`VisualPayload`](anyclick-spec.ts#L228)

---

# <a name="hierarchy"></a>8. Hierarchy — DOM Context

A list of parent nodes up the DOM tree:

- tag  
- role  
- attributes  
- semantic component ids  

This answers: *"Where does this element live in the UI?"*

🔗 Spec: [`HierarchyEntry`](anyclick-spec.ts#L247)

---

# <a name="source"></a>9. Source Mapping — Linking UI ↔ Code

This connects an event directly to source code:

- component name  
- file path  
- line + column  
- handler name  

Enables:

- "Open in Cursor / VS Code"  
- Autofix  
- Component lineage  
- Linking feedback to exact file  

🔗 Spec: [`SourceReference`](anyclick-spec.ts#L263)

---

# <a name="result"></a>10. Result Payload

What happened after the operation:

- success / failure / partial  
- diff score (visual regression)  
- stack or error codes  
- AI-generated output  

🔗 Spec: [`ResultPayload`](anyclick-spec.ts#L280)

---

# <a name="metadata"></a>11. Origin + Workflow Metadata

Useful for multi-step flows:

- `flowId`
- `stepIndex`
- `correlatesWith`

And deployment context:

- cloud / self-hosted  
- environment  
- tenant  

🔗 Spec: (`flowId`, `origin`) around [`InteractionEvent`](anyclick-spec.ts#L17)

---

# <a name="source-opener"></a>12. Source Opener (DevTools → Editor)

This is the part of the spec used by the Chrome extension:

- On right-click, capture component + file + line
- Build a `cursor://` or `vscode://file/...` URL
- Jump directly to the code that produced the UI element

🔗 Spec: [`SourceOpenRequest`](anyclick-spec.ts#L308)

---

# 🎉 Summary

Anyclick turns every UI interaction into a **meaningful, structured, contextual event**.

This empowers:

- Debugging  
- Autofix  
- Customer support  
- Analytics  
- QA  
- AI-assisted development  
- UX optimization  
- Seamless collaboration between engineers, PMs, designers, and business teams  

The **TypeScript spec** is the contract.  
This document is the explanation.

Use both together to integrate Anyclick cleanly and confidently.
