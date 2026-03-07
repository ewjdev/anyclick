# Anyclick React Style Slots

This document freezes the v5 render surface for `@ewjdev/anyclick-react` styling.
Each user-visible node maps to one public slot name. Behavior, positioning math,
highlight calculations, event routing, and adapter submission flow are intentionally
out of scope.

## Context Menu

| Surface | Slot | Notes |
| --- | --- | --- |
| Backdrop portal overlay | `menu.overlay` | Click-away surface only |
| Floating menu shell | `menu.surface` | Receives deprecated `menuClassName`/`menuStyle` shims |
| Header row | `menu.header` | Title and top-right controls |
| Header control buttons | `menu.headerAction` | Drag handle and quick-chat toggle |
| Scrollable/root list wrapper | `menu.list` | Wraps items or submenu |
| Item button row | `menu.item` | Active, disabled, selected states |
| Item icon wrapper | `menu.itemIcon` | Icon container only |
| Item label wrapper | `menu.itemLabel` | Text plus badge |
| Badge pill | `menu.itemBadge` | Tone-aware |
| Submenu chevron wrapper | `menu.submenuIndicator` | Indicator only |
| Submenu back button | `menu.backButton` | Special-case menu item |
| Drag handle button | `menu.dragHandle` | Dynamic-position mode only |

## Comment Form

| Surface | Slot | Notes |
| --- | --- | --- |
| Comment section wrapper | `comment.section` | Mounted inside menu surface |
| Comment textarea | `comment.textarea` | Uses shared textarea semantics too |
| Primary send button | `comment.primaryAction` | Loading-aware |
| Secondary cancel button | `comment.secondaryAction` | Neutral action |

## Screenshot Preview

| Surface | Slot | Notes |
| --- | --- | --- |
| Screenshot panel shell | `screenshot.surface` | Inline or expanded modal state |
| Header row | `screenshot.header` | Title, size, expand/collapse |
| Tab button | `screenshot.tab` | Default tab state |
| Active tab button | `screenshot.tabActive` | Selected tab styling |
| Preview viewport | `screenshot.preview` | Image frame |
| Empty state container | `screenshot.empty` | No capture available |
| Error state container | `screenshot.error` | Failed capture copy |
| Metadata row | `screenshot.meta` | Size and dimensions |
| Action buttons | `screenshot.action` | Retake, cancel, send, continue |

## QuickChat

| Surface | Slot | Notes |
| --- | --- | --- |
| QuickChat shell | `quickChat.surface` | Inline or pinned drawer state |
| Header row | `quickChat.header` | Context controls and actions |
| Messages viewport | `quickChat.messageList` | Message stack wrapper |
| Composer textarea | `quickChat.input` | Auto-resizing textarea |
| Submit and outbound actions | `quickChat.submit` | Send and external-chat buttons |

## Inspect Simple

| Surface | Slot | Notes |
| --- | --- | --- |
| Dialog shell | `inspect.surface` | Mobile sheet or floating panel |
| Header row | `inspect.header` | Identity pill and close/open buttons |
| Body content wrapper | `inspect.content` | Selector, status, action row |
| Action buttons | `inspect.action` | Copy/save/open actions |

## Shared Primitives

| Surface | Slot | Notes |
| --- | --- | --- |
| Generic button primitive | `shared.button` | Neutral by default, tone-aware |
| Generic input primitive | `shared.input` | Single-line controls |
| Generic textarea primitive | `shared.textarea` | Multi-line controls |
| Generic badge primitive | `shared.badge` | Token-driven pill styling |

