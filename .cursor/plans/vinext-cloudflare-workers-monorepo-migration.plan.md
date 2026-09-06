# Cloudflare Workers migration: decision and execution plan

Reviewed 2026-09-05 (Pacific). Status: **ready for a bounded feasibility implementation; production migration is conditional on the gates below**. This PR changes documentation only. It does not establish deployed compatibility, savings, or performance parity.

Source baseline: `main` at `10be24553ad09b8ebec5b517b7e1fe2608ab707b`. Original PR #68 head: `c125f4f70cb0416e133081233aca4da1db1132c3`. Refresh the inventory when implementation starts. Read [the review and evidence](../../docs/cloudflare-migration-review.md) for findings, the actual compatibility scan, costs, alternatives, and source links. This filename is retained so existing plan links continue to work.

## 1. Decision and scope

**Recommendation: evaluate a single Vinext web Worker, keep Vercel available, and migrate only after measured parity.** The browser SDK, npm distribution, and most HTTP integrations are portable. Hosting the examples beside Cloudflare AI services is a useful product direction. Neither fact proves that replacing Next's runtime with Vinext will make the existing site faster or cheaper.

Cloudflare currently recommends Vinext, while identifying it as beta. OpenNext remains a fallback that adapts `next build` output. These are separate choices from moving hosting to Workers. [Cloudflare Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/), [OpenNext guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/).

| Decision     | Default                                                   | Revisit only when                                             |
| ------------ | --------------------------------------------------------- | ------------------------------------------------------------- |
| Hosting      | Workers Paid, one `apps/web` Worker with static assets    | Measured resource or operating requirement fails a gate       |
| Framework    | Vinext first; retain working Next/Vercel path             | Required behavior cannot pass the two-day Vinext spike        |
| Fallback     | OpenNext on the same Next version                         | Vinext fails; at most three additional engineering days       |
| State        | Existing Upstash Redis, schema and key semantics retained | Separate transactional state migration is designed and tested |
| Providers    | Keep OpenAI, UploadThing, GitHub, Jira and Cursor Cloud   | Provider-specific incompatibility is reproduced under workerd |
| Packages     | Same exports, browser behavior, npm scope and Changesets  | A compatibility fix requires a public package release         |
| Toolchain    | Node 24.x, Yarn 1.22.19, Turborepo                        | Reproducible pinned-toolchain failure requires a narrow fix   |
| Local Cursor | Existing local Node service stays development-only        | Never relocate its shell execution into the web Worker        |
| CI/CD        | GitHub Actions; one production deployment authority       | No concurrent Workers Builds production deploys               |
| AI expansion | Separate examples after hosting parity                    | Does not silently change migration acceptance                 |

Out of scope: UI/framework rewrite, migrating npm distribution, Redis-to-KV or R2 media migration, model replacement, a new API service, and autonomous AI execution. API paths, methods, response schemas and example URLs remain stable except the explicit hardening changes in section 4.

### Ownership, external inputs and stop rules

One senior engineer owns execution and evidence. Routine decisions use these defaults without further design approval. Record deviations and tests in the implementation PR. Missing credentials leave the corresponding live gate **blocked**, never "passed with mocks."

Before provisioning, record the actual account/zone IDs, canonical and alias hosts, Vercel project/deployment IDs, preview resources and authorized budget in the implementation artifact `docs/cloudflare-migration/operations.md` (no secret values). Verify these against active credentials. Account ownership, billing authority and a production window are external inputs; continue local work while obtaining them.

Timebox feasibility to two engineering days. If Vinext fails, spend at most three further days on OpenNext. If neither passes, retain Vercel and deliver an isolated Cloudflare example instead. Avoid an unbounded framework rewrite. Estimate **12–20 engineering days total plus seven calendar days of production observation**, contingent on the spike; this is estimated effort, not a benchmark.

## 2. Application and acceptance contract

The current monorepo has 13 package workspaces (12 publishable and one private protocol package), one Next.js `16.3.4` / React `19.2.1` app, 22 pages, three layouts and 14 route handlers. Node 24 and `yarn format:check` are already in CI. Root `engines.node` and Node types still describe older versions. Avoid repeating the original plan's superseded Node-22 migration.

```text
Browser / extension -> HTTPS pages and /api/*
  -> apps/web: Vinext + workerd + generated static assets
     -> Upstash: sessions, history, locks, budgets, receipts
     -> OpenAI, GitHub, Jira, Cursor Cloud, UploadThing HTTP APIs
GitHub Actions -> package builds/tests -> web artifact -> preview / production
GitHub Actions -> Changesets -> npm (independent of Cloudflare credentials)
Local development -> local Cursor HTTP service -> local Node/shell
```

### Complete API matrix

Each route maps to its existing `apps/web/src/app/api/**/route.ts`. Capture status, body shape, content type, CORS, cookies, cache headers and external effects on both backends using identical fixtures. Permit only time/ID/provider-text differences. Every row is required even for a currently disabled production integration: validate disabled behavior and configured behavior in an isolated environment.

| Endpoint                     | Methods       | Required acceptance cases                                                                                                                                                                  |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/api/feedback`              | GET, POST     | Status; GitHub issue + screenshot; Jira env and `x-jira-credentials`; Cursor Cloud test launch; invalid input/provider failures; hosted `cursor_local` returns 403, local path still works |
| `/api/ac/jira`               | GET           | `status` including unset env; `issue-types`, `fields`, `search`; per-request header credential override; missing parameters; Basic-auth bytes; upstream 4xx/5xx                            |
| `/api/anyclick/chat`         | POST          | AI SDK stream, legacy `suggest` and `refine`; chunk/protocol order; cancellation, timeout, provider error, quota and Redis outage                                                          |
| `/api/anyclick/chat/history` | GET, POST     | Existing GET response; `save`, `load`, `clear`; 24-hour retention, deduplication, last 50 messages; trusted IP mapping and missing-IP rejection                                            |
| `/api/anyclick/stage-metric` | POST          | Valid event 204; invalid JSON/ID/boolean 400; oversized input 413; aggregate log reaches sink                                                                                              |
| `/api/uploadthing`           | OPTIONS, POST | Preflight; `file`, `url`, `dataUrl` FormData; header-token precedence/server fallback; absent token 503; provider rejection; binary/name/MIME fidelity; extension-origin upload            |
| `/api/showcase/workspace`    | GET, POST     | Create/read/reset; cookie flags; invalid/expired session; disabled 503; capabilities; state survives reload                                                                                |
| `/api/showcase/history`      | GET           | Session-owned conversation/revision; invalid conversation; cross-session isolation; immediate read after write                                                                             |
| `/api/showcase/suggestions`  | POST          | Structured suggestions; invalid context; quota/token-budget exhaustion; upstream timeout/unavailable AI                                                                                    |
| `/api/showcase/chat`         | POST          | Incremental UI stream with `data-result`; saved server history; concurrent sends; cancellation, partial history and lock release; provider error/timeout                                   |
| `/api/showcase/preview`      | POST          | Valid editable preview; hash/revision; ten-minute expiry capped by session; review required; no external mutation                                                                          |
| `/api/showcase/execute`      | POST          | Local actions/undo; stale revision 409; idempotency replay/conflicting key; GitHub input deduplication; screenshot + issue; uncertain outcomes                                             |
| `/api/showcase/execution`    | GET           | Session-scoped receipt; unknown ID; reconcile `outcome_unknown` without resubmission; cooldown/budget                                                                                      |
| `/api/showcase/events`       | POST          | Allowlisted event; session/budget enforcement; atomic count/seven-day expiry; all responses uncached                                                                                       |

Enumerate all page URLs in `docs/cloudflare-migration/routes.md` during implementation. Cover homepage/showcase enabled and disabled, every docs/example URL, layouts, navigation/back/forward/deep links, error/not-found pages, metadata/icons, assets, CSS and responsive behavior. Existing browser tests mock showcase APIs and cannot alone satisfy real-Worker acceptance.

## 3. Ordered work packages and gates

Deliver small implementation PRs in this order; PR #68 remains the design document. Every work package updates its evidence before proceeding. G0–G2 can complete without production resource changes.

### WP0 — baseline (G0)

1. Branch from current `main`; record SHA/inventory. Select and record a Node 24.x patch for both comparison builds; keep Yarn 1.22.19. Align root tooling engine to `>=24 <25`. Do not raise published package consumer engines merely to match build CI.
2. Run frozen install, current build, tests and web typecheck. Record baseline failures separately, with a linked resolution or precise bounded exclusion. A missing Turbo task is not proof of lint/typecheck coverage.
3. Inventory Vercel Git integration and Actions deployment, project root/build settings, domains, variable names and active integrations. Inspect 30 days of aggregate billing/traffic, or label the shorter available window.
4. Capture browser screenshots and timing from an immutable Vercel deployment built from the same source as the experiment. Use synthetic records and dedicated destinations for mutations.
5. Start the section 8 evidence artifacts and cost inputs. Preserve exact Vercel restore configuration before any routing change.

**G0:** reproducible baseline, external inputs identified, traffic/billing coverage labeled, every route inventoried, no unexplained failures hidden. Missing billing permits feasibility work but prevents claiming savings.

### WP1 — additive scaffold and feasibility (G1)

1. Read current CLI help/metadata; pin selected versions in `apps/web/package.json` and `yarn.lock`. Review-time candidates: `vinext@1.0.0-beta.9`, `@vinext/cloudflare@1.0.0-beta.7`, `@cloudflare/vite-plugin@1.54.4`, `wrangler@4.129.0`. Resolve compatible Vite/RSC peers instead of independently selecting newest majors.
2. Scan from `apps/web`, retain findings, then initialize with the explicit Cloudflare target. Inspect generated changes; keep Yarn 1 (upstream `yarn dlx` examples are not applicable).

   ```bash
   yarn workspace web-app add --dev --exact vinext@1.0.0-beta.9
   yarn workspace web-app exec vinext check
   yarn workspace web-app exec vinext init --platform=cloudflare
   ```

3. Keep `dev`, `build`, `start` as Next scripts during overlap. Add the following contracts, installing and pinning their binaries:

   ```json
   {
     "vinext:check": "vinext check",
     "vinext:dev": "vinext dev",
     "vinext:build": "vinext build",
     "vinext:deploy:preview": "vinext-cloudflare deploy --env preview",
     "vinext:deploy:production": "vinext-cloudflare deploy --env production"
   }
   ```

   The deploy binary now comes from `@vinext/cloudflare`; the original `vinext deploy` command is obsolete. `--env preview` selects configuration, not isolated credentials/storage. [Vinext deployment reference](https://github.com/cloudflare/vinext#deployment).

4. Confine ESM conversion to `apps/web`: add `type: module`, convert Next config to `next.config.mjs` with ESM imports and explicit root-env path, and convert/rename other CommonJS config files to supported forms. Verify Next still loads its config. Preserve `agentRules`, image allowlist and workspace resolution behavior until assessed. Never stub a required native dependency and call that parity.
5. Commit actual generated Vite/Worker/Wrangler config; do not invent entry/output names from the old plan. Configure App Router RSC in workerd with SSR as child environment. Check asset paths, aliases, server/client boundaries and React deduplication.
6. Pin a tested compatibility date, initially `2026-09-05`. Current dates enable Node compatibility by default; test `Buffer` and `node:crypto` rather than replacing them categorically. Record flags required by the installed runtime. [Node compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/).
7. Add a distinct `vinext:build` Turbo task depending on `^build`, with actual generated outputs separated from `.next`. Disable cache for deploy/preview and initially for environment-sensitive Vinext builds. Enable build caching only after declaring every input/public variable. Ignore generated artifacts and `.dev.vars*`.
8. Build packages before Vinext. Add a documented `vinext:preview` script that runs the generated production bundle locally under workerd, using its actual Wrangler config. A Node-only `vinext start` does not satisfy this. Keep a clean Next production build runnable.

**G1:** scanner issues resolved; partial findings addressed with browser tests; frozen install and both builds pass; production workerd serves homepage, workspace, streaming and each upload format with fixtures; dependency graph and dry-run output recorded. Exit 0 from the scanner alone does not pass.

**Fallback:** after two engineering days, record the exact Vinext blocker/reproducer. Test OpenNext on the same source/Next version in a separate branch without Vinext-only imports. Review-time `@opennextjs/cloudflare@1.20.6` declares a Next peer range including `16.3.4`; metadata is not runtime proof. Apply the same gates. Stop migration if both paths fail within five cumulative days.

### WP2 — runtime correctness (G2)

Implement sections 4–5. Limit changes to the app unless a published adapter fails a reproduced runtime test. Preserve state schema/providers. Add targeted coverage for binding timing, spoofed identity, concurrent writes, disconnects and byte limits.

**G2:** Node/workerd contracts pass; local Cursor works locally and is unreachable on hosted paths; secrets absent from client assets; two distinct binding sets work without rebuilding; concurrency/error cases pass. Explicit hardening differences are documented in fixtures.

### WP3 — isolated preview and live parity (G3)

Implement section 6. Deploy only to the verified preview target. Run the API matrix with workerd fixtures, then real providers using isolated accounts/repositories. Add `E2E_BASE_URL` support to Playwright, disabling its local Next `webServer` when remote. Keep mocked UI tests and create a distinct suite that does not intercept backend calls.

**G3:** same-commit deployed comparison, every API/page case green, no silent live skips, upload bytes/URLs verified, real streamed AI saved/restored, provider error/retry cases verified, release SHA/target recorded. Preview cannot write production data or use production provider credentials.

### WP4 — measurements and rehearsal (G4)

Apply section 7. Rehearse Worker-version rollback and Vercel-origin restoration on a staging host, preserving session/receipt continuity using the same staging Redis. Populate the runbook with exact commands, IDs, DNS/route records and expected readbacks; resolve placeholders before cutover.

**G4:** resource/performance and cost decision gates pass; restore succeeds within target; existing and new sessions work after restoration; no duplicate external effects. Record an evidence-backed `GO` or `NO-GO`.

### WP5 — cutover and retirement (G5)

Follow section 6. Keep compatible Vercel deployment/credentials for seven days; freeze incompatible state/protocol changes. After seven days of stable operation, retire Vercel's automatic deploy paths/config, update default developer/build scripts if desired, and revoke unused deployment secrets. Preserve a restore tag/runbook; npm release automation remains intact.

**G5:** seven-day report, browser verification, no unresolved migration incident, one active deployer, working alerts/restore procedure, required package releases/docs/Changesets and complete evidence.

## 4. Required runtime work

### Environment and homepage

Add `apps/web/src/lib/runtime/env.ts` for Next/Node, a shared typed schema and `env.cloudflare.ts` for Workers. App consumers import one stable path; a precise server-side Vite alias selects the Cloudflare implementation reading `env` from `cloudflare:workers`. Next resolves the Node implementation using `process.env`. Validate resolution in both production builds before converting consumers; do not mask unresolved imports with catch-all fallbacks.

Read configuration within requests, then create/pass provider clients. Remove module-scope secret capture from QuickChat's OpenAI/Redis clients. Cover `api/utils.ts`, provider routes, `lib/showcase/{storage,actions,github}.ts` and **`app/page.tsx`**, whose `SHOWCASE_ENABLED` branch can otherwise be baked into static output. Make the homepage flag request-time on both backends; exclude it from prerender/cache until safe. Changing the flag must update UI and API capability without rebuilding.

Keep `process.env.NODE_ENV` where compile-time development behavior is intended; use a separate deployment selector. Hosted preview uses production security behavior. Root dotenv remains only a local Next convenience, not production secret delivery. Repository CLI scripts remain Node programs.

### Identity, storage and cache

- Add one platform-aware `clientIp(request)`. At direct Cloudflare ingress use platform `CF-Connecting-IP`, ignoring caller `X-Forwarded-For`; on Vercel retain verified trusted-ingress extraction; local fixtures inject identity explicitly. Test IPv4/IPv6/spoofed/missing headers. Missing hosted identity fails closed on history/rate-limited routes instead of collapsing users into `anonymous`/`unknown`. Validate any Worker proxy separately before trusting forwarded identity. [Header semantics](https://developers.cloudflare.com/fundamentals/reference/http-headers/).
- Apply to `api/utils.ts`, QuickChat history and showcase storage. Preserve `chat:<ip>`/quota representations for stable real client addresses across cutover. IP-based QuickChat already shares history behind NAT; a session-based redesign is separate. Never recover legacy history through an untrusted IP fallback.
- Change QuickChat's Redis-outage behavior from allowing paid AI requests to retryable 503. Document/test this intentional hardening on both backends. Showcase already fails when storage/budget config is missing.
- Preserve Lua CAS and budget reservations, `SET NX EX` locks, token-checked release, session TTL, ten-minute previews, seven-day GitHub receipts/deduplication and uncertain-outcome reconciliation. Use separate preview Redis databases; prefixes alone do not isolate existing raw keys. No KV replacement.
- Verify concrete concurrency invariants: two edits from the same revision yield one commit and one 409; 20 simultaneous retries of one execution ID produce one side effect/receipt; two different IDs for the same GitHub input produce at most one issue; a reservation at limit N rejects N+1 atomically; an expired lock owner cannot release its successor's lock. Confirm preview/session expiry, immediate history reads, and rollback reads using persisted records rather than process-local mocks alone.
- Return `Cache-Control: no-store` on every `/api/*` outcome and cookie-bearing response. Bypass framework/CDN cache for APIs/personalized content. Test A cannot receive B's data through warm caches or RSC navigation. Cache immutable public assets only; keep user data out of cache adapters.

### Streaming, deadlines and cancellation

- Preserve AI SDK 5 wire protocol and `data-result` parts. Measure incremental chunks with a stream reader; `response.text()` alone cannot prove streaming. Verify React rendering and server-history restoration.
- Replace QuickChat's untracked `tee()` logger with bounded inline instrumentation or tracked work that cannot accumulate a second unbounded stream. Log counts/timing, not prompts/captures/cookies/tokens. Remove production `bodySample` logging where it exposes content.
- Retain showcase's 45-second AI abort. Implement explicit overall deadlines for routes relying on `maxDuration`: suggestions 15 seconds, chat/execution 60 seconds including cleanup. Keep worst-case work below lock TTLs. Next `runtime = "nodejs"`/`maxDuration` are not proof of a persistent Node process or an enforced Workers wall-clock timeout.
- Propagate cancellation. Persist required state before successful mutation responses. Use request-lifetime support only for bounded cleanup/telemetry. On disconnect preserve partial history/receipts; never blindly retry an uncertain GitHub write. Lock expiry is a recovery safety net, not normal release. Test disconnect immediately before final persistence and verify recovery under workerd.

### Packages, uploads and local-only paths

| Source                                                        | Action                                                                                                                      |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `packages/anyclick-github/src/githubAdapter.ts`               | Exercise base64 README/media writes; preserve bytes and branch behavior                                                     |
| `packages/anyclick-jira/src/jiraAdapter.ts`                   | Unicode Basic auth, attachment decoding, Blob/FormData, metadata fields                                                     |
| `packages/anyclick-cursor/src/agentAdapter.ts`                | Basic-auth header and cloud launch payload                                                                                  |
| `packages/anyclick-uploadthing/src/serverAdapter.ts`          | Lazy UTApi import, File/Blob, Buffer decoding and per-request credentials                                                   |
| `packages/anyclick-cursor-local/src/{localAdapter,server}.ts` | Keep `spawn`/local server outside Worker dependency graph; preserve local service                                           |
| Browser packages/extension                                    | Capture, masking, inspector, pointer, conversations, T3Chat navigation and uploads; no Cloudflare imports in public exports |

Use supported Node APIs first. For a required package fix, preserve Node/browser exports and add meaningful byte/behavior tests plus a Changeset. An import that resolves to a nonfunctional stub fails acceptance.

Enforce size before full buffering, including chunked bodies without `Content-Length`. Preserve showcase's 2 MiB JSON limit. Initial proposed policy: other feedback/chat JSON 2 MiB; uploaded file/decoded data URL 8 MiB; total multipart body 12 MiB; stage metric retains its 1,024-character contract plus an early byte cap. G0 measures supported real payloads; revise client/server limits together if these defaults reject normal captures. Test below/at/above boundaries and concurrent uploads; honor smaller provider limits with actionable 413 errors.

For URL upload, prefer the provider's supported path and test it. If application-side fetch is needed, constrain public HTTPS destinations, private/local addresses, redirects, bytes and time; do not introduce an unrestricted proxy. Preserve extension header-token CORS. Restrict/rate-limit server-token fallback so the public Worker is not an unlimited upload relay; test extension origins separately from cookie-based showcase origins.

Default hosted upload policy: a caller supplying its own upload token retains the existing extension preflight/header contract; a request using the server token must have the exact configured `APP_ORIGIN` and consumes a Redis-backed allowance of ten uploads per trusted IP per UTC day. Reject absent/disallowed origin with 403 on that fallback path, exhaustion with 429 and storage failure with 503. Do not return credentialed wildcard CORS. Apply the same behavior to the Vercel fallback before comparison; add provider-account spending controls for aggregate exposure. Keep token values and Jira credential headers out of logs.

### Fonts, images and UI output

The scanner reports CDN Google fonts and partial image optimization. Preserve typography and same-origin delivery by vendoring the exact used font files/licenses and CSS weights/subsets. Retain `next/font` only if the pinned Vinext demonstrates equivalent self-hosting in network/browser tests. For current small `/logo.png`, a tested static/unoptimized path may suffice; add an Images binding only for a demonstrated transformation requirement. Validate `s.yimg.com` allowlisting and rejection of unapproved remote origins where used.

Verify Tailwind/PostCSS, CodeMirror, motion, workspace exports, single React runtime, hydration, mobile capture, metadata and boundaries. Keep public URLs, test old-tab navigation across deployments and inspect generated chunks. Cache public pages only after HTML/RSC/cache-key correctness tests; no speculative ISR/KV/TPR setup.

## 5. Environment contract

Declare each preview/production environment explicitly; Wrangler vars are not inherited automatically. Generate Worker types with the pinned toolchain and commit or regenerate deterministically. [Environment variables](https://developers.cloudflare.com/workers/configuration/environment-variables/).

| Values                                                                                                                                            | Scope                                    | Validation/default                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN`, `JIRA_API_TOKEN`, `CURSOR_API_KEY`, `OPENAI_API_KEY`, `UPLOADTHING_TOKEN`, `QUICKCHAT_KV_REST_API_TOKEN`, `SHOWCASE_GITHUB_TOKEN` | Worker secrets, separate per environment | Never client/build vars; required for enabled capabilities                                           |
| `JIRA_EMAIL`                                                                                                                                      | Server-only secret config                | Required with Jira                                                                                   |
| `GITHUB_REPO`, `JIRA_URL`, `JIRA_PROJECT_KEY`, `CURSOR_REPOSITORY`, `CURSOR_DEFAULT_REF`, `CURSOR_AUTO_CREATE_PR`                                 | Server vars                              | Validate repo/URL/boolean; explicit test destinations in preview                                     |
| `QUICKCHAT_KV_REST_API_URL`                                                                                                                       | Server var                               | HTTPS Upstash Redis endpoint, despite the KV name                                                    |
| `SHOWCASE_ENABLED`, `SHOWCASE_MODEL`, `SHOWCASE_DAILY_TOKEN_BUDGET`, `SHOWCASE_GITHUB_REPO`                                                       | Server vars                              | Off by default; positive safe-integer AI budget; dedicated public demo repo with `issues/src` branch |
| `LOCAL_CURSOR_SERVER_URL`                                                                                                                         | Local development only                   | Existing localhost service; absent hosted                                                            |
| Proposed `DEPLOY_ENV`, `APP_ORIGIN`                                                                                                               | Server vars                              | `local`/`preview`/`production`; approved hosted HTTPS origin                                         |
| `CLOUDFLARE_API_TOKEN`                                                                                                                            | Deployment CI secret                     | Account-scoped rights; never injected into Worker/client                                             |
| `CLOUDFLARE_ACCOUNT_ID`                                                                                                                           | CI/config identifier                     | Matches recorded account or deploy fails                                                             |
| `ASSETS`/generated runtime bindings                                                                                                               | Wrangler bindings                        | Actual generated paths; isolated resources                                                           |
| Optional image/cache bindings                                                                                                                     | Only if required                         | Record IDs, purpose, cost and restore implications                                                   |

Update `.env.example` (UploadThing token is missing), add a non-secret `.dev.vars.example`, and document each command's env-file loading. Ignore all real local secret files. Never expose secrets via Vite `define`, `VITE_*`, `NEXT_PUBLIC_*`, Next `env`, client assets, static HTML, sourcemaps or build logs. Docs must render without every integration enabled.

Preview starts with showcase off until isolated resources and a small explicit budget are configured. Fork/untrusted PRs build/test without deploy/provider secrets. `check:showcase` reads local env; it does not prove remote Worker secrets are installed. Add target-specific protected preflight plus actual route checks.

## 6. Deployment and recovery

### CI/CD

- Preserve CI, Changesets/npm, roadmap sync and feedback cleanup; verify cleanup's GitHub target/media retention. Add Cloudflare build/test requiring package build, web typecheck, reviewed scanner findings, workerd contracts and formatting. Do not count missing Turbo tasks or invalid `next lint` as coverage.
- Deployment depends on checks for the **same SHA**. Prefer a single workflow with `needs`; if using `workflow_run`, verify trusted source/event/branch/artifact SHA. Include lockfile, root package/Turbo/shared config and workflow paths in deploy triggers, not only `apps/web/**` and `packages/**`.
- Use GitHub environments and per-environment concurrency. Cancel superseded previews; serialize production promotions. Keep one production deploy authority; disable parallel Workers Builds deploys.
- Build once per target configuration, deploy that artifact, record SHA/lock hash/config/version ID. Validate pinned deployer's `--skip-build`/generated Wrangler flow instead of rebuilding with different env during promotion.
- Start with one serialized trusted-branch preview Worker (proposed `anyclick-web-preview`, verify availability), isolated Redis/providers and no production domains. Per-PR Workers are optional later, with close-event cleanup and bounded lifetime. Version preview URLs do not themselves isolate bindings. [Preview URLs](https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/).
- Production target (proposed `anyclick-web-production`) uses explicit account/env. Add a minimal health/version endpoint returning status/SHA, not secrets; provider readiness remains protected preflight plus synthetic journeys.

### Production sequence

1. Finish G0–G4; record window/operator. Freeze incompatible schema changes. Bring the Vercel fallback to the same contract, including env/IP/error hardening; record and verify its immutable deployment.
2. Inspect authoritative DNS and canonical/alias records. If the zone needs Cloudflare onboarding, perform nameserver/DNSSEC migration separately with full-record parity including mail. Complete that before app cutover.
3. Prefer a Worker route over a proxied hostname that still targets Vercel, so removing the route restores origin routing. Prove actual Vercel domain/TLS behavior on staging. If a Worker Custom Domain is required, rehearse detaching it and restoring exact prior DNS/TLS configuration; changing a DNS record alone may not remove its binding.
4. Snapshot route/domain bindings, DNS/TTL, cache rules, redirects and Vercel settings. Verify deployed Worker/assets/secrets and synthetic checks on the pre-cutover host; guard paid endpoints on alternate hostnames.
5. Pause competing Vercel promotions, retain known-good deployment, then switch the full app including APIs. Initial rollout uses staging followed by a full switch, not improvised DNS percentages. Gradual Worker deployments split Worker versions, not Vercel versus Workers automatically.
6. Verify hosts/TLS/redirects, homepage, real stream/history, one reviewed synthetic action and capture/assets in desktop/mobile browsers. Confirm release SHA and no preview-origin links. Watch continuously for the first hour and compare daily for seven days.
7. After seven days, evaluate G5; retire both Vercel automatic deploy paths, revoke unused secrets, preserve restore tag/runbook and update contributor/deployment docs.

### Rollback

Immediately restore for session leakage, lost acknowledged state, duplicate external writes, broken primary journey or repeatable resource exhaustion. Also restore for migration-attributable 5xx above 1% for five minutes with at least 100 requests (or two consecutive synthetic failures at low traffic), p95 above 1.5× baseline for ten minutes, or sustained projected spend beyond budget. Distinguish provider-wide incidents while prioritizing restoration.

Freeze deploys; record SHA/time/request IDs; disable affected paid capability if necessary. For a code regression, restore the rehearsed prior Worker version. For runtime/platform failure, restore Vercel by reverting the actual Worker routing mechanism and recorded domain/DNS settings. Target **15-minute service restoration**, demonstrated in staging; lower DNS TTL ahead of time where applicable.

Code rollback does not restore external data or all binding configuration. Preserve needed assets/resources and restore config separately as rehearsed. Keep Redis and compatible schema; never flush state. Reconcile uncertain GitHub receipts rather than resubmitting. Re-run health, session/history, streaming and mutation readback on the restored host, retain incident evidence and diagnose before retrying cutover. [Rollback limitations](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).

## 7. Measurable go/no-go gates

These are proposed engineering thresholds, not measured production claims. Compare identical source/model/fixtures/dependencies and cache state on immutable targets. Test US West, US East and Europe (or substitute a region supported by traffic evidence), reporting cold/warm separately. Take at least 100 samples per key route/region using synthetic providers for volume, plus ten bounded real AI/upload confirmations per target. Keep paid tests within budget; disclose small-sample limitations.

| Gate          | Threshold/evidence                                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Functionality | All API/page cases; zero session leaks, lost acknowledged writes or duplicate provider actions                                                 |
| Browser       | 390px/1440px screenshots; desktop Chromium and real Safari/iOS; no new hydration errors, overflow or broken capture/context menus              |
| Page speed    | p75 LCP within 10% of baseline, CLS increase ≤0.02; at least 20 consistent runs per representative page/target                                 |
| APIs          | Workspace/history/preview/mocked mutation p95 within baseline + max(20%, 100 ms), per region                                                   |
| Streaming     | First meaningful chunk p95 within baseline + max(20%, 300 ms); incremental delivery; cancellation and recoverable state                        |
| Resources     | <80% current uncompressed bundle limit; startup <800 ms; profiled peak memory <90 MiB at test concurrency; no CPU/memory errors                |
| Load          | Ten minutes at 2× observed peak concurrency, minimum ten fixture journeys; overlap uploads/chat without unbudgeted real-provider load          |
| Cost          | Real current/expected/10× usage model including shared account, providers, logs, overlap, engineering/maintenance; passes review decision rule |
| Operations    | Delivered synthetic alert, artifact/SHA traceability, ≤15-minute restore rehearsal with session/receipt continuity                             |

Current docs list 128 MB isolate memory, 64 MiB uncompressed bundle size and one-second startup. Refresh limits and actual account entitlements at implementation time. Zone/account request-body limits differ from app/CPU limits. Splitting APIs does not enlarge the zone body cap or per-isolate memory. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).

Capture release/request ID/route/status/duration, first-chunk/finish reason, provider status and budget/storage failure category. Preserve aggregate example events; redact user content/secrets. Alert on 5xx, resource exceptions, Redis/stream failures and spend, and verify alert delivery. Measure upstream latency separately. If upstream RTT dominates, benchmark supported placement settings before splitting services. Split only for evidenced dependency/bundle or operational isolation needs, with a fresh routing/identity/latency design.

## 8. Engineer handoff and definition of done

Create these during implementation; they are not fabricated measurements in this PR:

- `docs/cloudflare-migration/compatibility.md`: exact SHA/versions, findings, dependency audit, build/runtime outputs and resolved exceptions.
- `docs/cloudflare-migration/routes.md`: complete inventory and baseline/Worker case results, including intentional hardening.
- `docs/cloudflare-migration/benchmarks.json`: targets/SHAs/time/region/cache/concurrency/sample size, percentiles, LCP/CLS, resource measurements and raw artifacts.
- `docs/cloudflare-migration/costs.md`: actual coverage, projection formulas, engineering/maintenance, payback and strategic decision.
- `docs/cloudflare-migration/operations.md`: identities, secret names, exact deploy/restore commands/readbacks, alerts, cleanup and cutover/recovery log.
- `tests/cloudflare/`: backend contract/lifecycle/concurrency tests and real-browser smoke suite, distinct fixture/live-provider modes; CI retains traces/screenshots/sanitized outputs.

Existing baseline commands:

```bash
yarn install --frozen-lockfile
yarn build
yarn test:showcase
yarn typecheck:web
yarn workspace @ewjdev/anyclick-devtools test
yarn test:roadmap
yarn test:showcase:browser
yarn format:check
```

Implement/verify `vinext:*`, `test:cloudflare` and `test:cloudflare:browser` scripts with fixture defaults. Existing live tests opt in via `SHOWCASE_LIVE_BASE_URL` and additionally `SHOWCASE_LIVE_GITHUB=1` for GitHub writes. Repair their session setup: a fresh bare GET currently conflicts with the handler's same-origin initiation requirement. Report live skips explicitly; a release gate requiring live evidence fails if skipped. Use dedicated destinations and record test cleanup/retention without deleting unrelated records.

Completion requires G0–G5, every artifact, accurate deployed docs, package release requirements where applicable and no production-critical case replaced by mocks. A successful scanner run or preview alone is not migration completion.

## 9. Cloudflare AI examples after parity

Deliver separately through existing provider/adapter boundaries. A small Cloudflare backend can serve these examples while the website stays on Vercel; full migration is not a prerequisite.

| Order | Example                                     | Acceptance                                                                                                                                                                                                                                                                         |
| ----- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Contextual suggestions via Workers AI       | Opt-in route/AI binding; same masking/schema/stream/cancel contract; pinned supported model evaluated on ≥30 representative fixtures for validity, usefulness, latency/cost; preserve OpenAI default pending evidence. [Workers AI](https://developers.cloudflare.com/workers-ai/) |
| 2     | AI Gateway for existing provider traffic    | Opt-in example shows usage/latency and controlled failures; sensitive prompt/response logging and caching off by default; compare with/without Gateway. [AI Gateway](https://developers.cloudflare.com/ai-gateway/)                                                                |
| 3     | Durable conversation or asynchronous action | Separate Agents/Durable Objects or Queue/Workflow example for demonstrated disconnect/recovery need; preserve proposal, user review, idempotent execution and receipt recovery                                                                                                     |
| 4     | Screenshot storage or docs retrieval        | Separate R2 or Vectorize/AI Search example with scoped access/retention/deletion; public docs first; private captures require explicit data contract                                                                                                                               |

Each example ships a runnable recipe, setup/teardown, binding/env template, bounded budget, failure states and tests. Publish a reusable Cloudflare adapter only after an app example demonstrates a stable interface; keep Cloudflare dependencies out of the browser SDK. Success is a useful integration a developer can reproduce.
