# Anyclick Roadmap (Notifications & Dashboard)

This roadmap tracks UX/UI layers that sit on top of the core error-handling plan
in `/Users/ericjohnson/.cursor/plans/anyclick_error_handling_de13c164.plan.md`.
Scope here does **not** block the error ingestion stack.

## Recently Completed

- ✅ **Chrome Extension**: Standalone browser extension with DOM capture,
  screenshots, custom context menu, DevTools panel integration, and Inspector
  popup window (similar to Redux DevTools). See
  [packages/anyclick-extension](../packages/anyclick-extension/README.md)
- ✅ **Jira Integration**: Full Jira Cloud support with issue creation,
  screenshot attachments, ADF descriptions, custom fields (Epic Link, Team), and
  session-based credentials. See
  [packages/anyclick-jira](../packages/anyclick-jira/CHANGELOG.md)
- ✅ **GitHub Integration**: Create GitHub Issues with rich markdown, embedded
  screenshots, and automatic labeling. See
  [packages/anyclick-github](../packages/anyclick-github/CHANGELOG.md)
- ✅ **Cursor AI Agent**: Local and cloud agent integrations for AI-assisted
  code fixes. See
  [packages/anyclick-cursor](../packages/anyclick-cursor/CHANGELOG.md)
- ✅ **Menu Theming**: CSS custom properties for comprehensive menu
  customization, scoped providers with theme inheritance. See
  [packages/anyclick-react v1.1.0](../packages/anyclick-react/CHANGELOG.md)
- ✅ **Mobile Support**: Touch event handling with press-and-hold for mobile
  devices, proper scoped provider delegation.
- ✅ **Element Inspector**: Improved hierarchy navigation, utility class
  filtering, selector generation.

<!-- ROADMAP:AUTO-START -->
## Short-term (next up)

- ✅ **Chrome Extension**: Standalone Chrome extension with DOM capture, screenshots, custom context menu, DevTools panel, and ... [plan](https://github.com/ewjdev/anyclick/tree/main/packages/anyclick-extension)
- ✅ **Jira Integration**: Create Jira tickets directly from anyclick context menu with screenshot and DOM context. [plan](https://github.com/ewjdev/anyclick/tree/main/packages/anyclick-jira)
- **Quick Chat (AI Assistant)**: Inline AI chat in context menu. Type-to-chat, element context extraction, suggested prompts, pinnabl...
- **Notifications Package**: Toast → Banner → Inline → Indicator, with NotificationContainer mount point.
- **Accessibility & UX**: Focus management, ARIA labels, reduced-motion, theme hooks shared with AnyclickProvider.
- **Noise Controls**: Coalescing identical errors, per-severity rate limits, dismissal persistence, opt-in feedback prompt...
- **Configuration Options**: Timeouts, placement, portal target, mobile-safe spacing, z-index and overlap rules.
- **Auto Error Collection**: Automatically capture unhandled errors with DOM context and screenshots.
- **Element-Specific Menus**: Show different menu options based on the clicked element type or context.

## Mid-term

- ✅ **No Buttons??** [plan](https://github.com/ewjdev/anyclick/blob/main/.cursor/plans/no-buttons.plan.md) `Plan`
- **Error Dashboard**: Self-hostable dashboard for viewing grouped errors, filters (project, release, env, tag, severity, d...
- **Authentication**: Project-level API keys + dashboard session auth (passwordless/link-based), project scoping, audit lo...
- **Alerting**: Webhook destinations with signing + retry/backoff, threshold-based triggers (count, rate, new finger...
- **Playwright Test Generation**: Generate Playwright test code from captured interactions and DOM context.
- **Workflow Recording**: Record sequences of user actions and clicks to capture complete user flows.

## Later

- **Integrations**: Slack/Linear connectors, SSO options, CD/CI release mapping for source-map lookups.
- **Analytics**: Trend views, cohorting by release/environment, regression detection, and optional RUM sampling knobs...
- **Dashboard Polish**: Saved views, shared links with redaction, dark/light themes, and multi-tenant separation.
- **Slack Integration**: Post feedback and bug reports to Slack channels with rich formatting.
- **Pain Point Analytics**: Aggregate and analyze feedback to identify common user pain points.
- **Click Behavior Tracking**: Track click patterns and user behavior for UX insights.
- **Visual Diff/Comparison**: Compare screenshots to detect visual regressions and differences.
<!-- ROADMAP:AUTO-END -->
