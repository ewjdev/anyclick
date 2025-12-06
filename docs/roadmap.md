# Anyclick Roadmap (Notifications & Dashboard)

This roadmap tracks UX/UI layers that sit on top of the core error-handling plan in `/Users/ericjohnson/.cursor/plans/anyclick_error_handling_de13c164.plan.md`. Scope here does **not** block the error ingestion stack.

<!-- ROADMAP:AUTO-START -->
## Short-term (next up)

- 🚧 **Quick Chat (AI Assistant)**: Inline AI chat in context menu with type-to-chat, element context extraction, suggested prompts, and pinnable drawer mode. `In Progress`
- **Notifications Package**: Toast → Banner → Inline → Indicator, with NotificationContainer mount point.
- **Accessibility & UX**: Focus management, ARIA labels, reduced-motion, theme hooks shared with AnyclickProvider.
- **Noise Controls**: Coalescing identical errors, per-severity rate limits, dismissal persistence, opt-in feedback prompt...
- **Configuration Options**: Timeouts, placement, portal target, mobile-safe spacing, z-index and overlap rules.

## Mid-term

- ✅ **No Buttons??** [plan](.cursor/plans/no-buttons.plan.md) `Plan`
- **Error Dashboard**: Self-hostable dashboard for viewing grouped errors, filters (project, release, env, tag, severity, d...
- **Authentication**: Project-level API keys + dashboard session auth (passwordless/link-based), project scoping, audit lo...
- **Alerting**: Webhook destinations with signing + retry/backoff, threshold-based triggers (count, rate, new finger...

## Later

- **Integrations**: Slack/Jira/Linear connectors, SSO options, CD/CI release mapping for source-map lookups.
- **Analytics**: Trend views, cohorting by release/environment, regression detection, and optional RUM sampling knobs...
- **Dashboard Polish**: Saved views, shared links with redaction, dark/light themes, and multi-tenant separation.
<!-- ROADMAP:AUTO-END -->
