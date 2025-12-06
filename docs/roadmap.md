# Anyclick Roadmap (Notifications & Dashboard)

This roadmap tracks UX/UI layers that sit on top of the core error-handling plan
in `/Users/ericjohnson/.cursor/plans/anyclick_error_handling_de13c164.plan.md`.
Scope here does **not** block the error ingestion stack.

## Recently Completed

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

## Short-term (next up)

- Notifications package: Toast → Banner → Inline → Indicator, with
  NotificationContainer mount point.
- A11y & UX: focus management, ARIA labels, reduced-motion, theme hooks shared
  with `AnyclickProvider`.
- Noise controls: coalescing identical errors, per-severity rate limits,
  dismissal persistence, opt-in feedback prompts.
- Config: timeouts, placement, portal target, mobile-safe spacing, z-index and
  overlap rules.

## Mid-term

- Error dashboard (self-hostable) for viewing grouped errors, filters (project,
  release, env, tag, severity, date), fingerprint details, and screenshots/DOM
  context excerpts.
- Auth: project-level API keys + dashboard session auth
  (passwordless/link-based), project scoping, audit log for admin actions.
- Alerting: webhook destinations with signing + retry/backoff, threshold-based
  triggers (count, rate, new fingerprint), and muted periods.

## Later

- Integrations: Slack/Linear connectors, SSO options, CD/CI release mapping for
  source-map lookups.
- Analytics: trend views, cohorting by release/environment, regression
  detection, and optional RUM sampling knobs.
- Dashboard polish: saved views, shared links with redaction, dark/light themes,
  and multi-tenant separation.
