---
"@ewjdev/anyclick-core": minor
"@ewjdev/anyclick-react": minor
---

Improve element inspector hierarchy navigation and selector generation

- Add utility class filtering in selector generation to exclude Tailwind/Bootstrap utilities
- Redesign ElementHierarchyNav to show 3-line sibling-based view matching code editor conventions
- Add ellipsis indicator for deeply nested elements (depth > 3 levels)
- Improve CSS truncation with single-line display for long class names
- Export `isBlacklisted` function from ElementHierarchyNav for external use
- Add 'br' tag to element blacklist
