# Vinext Cloudflare Workers monorepo migration

## Goal

Migrate anyclick from a Vercel-hosted Next.js monorepo to a Cloudflare Workers-oriented monorepo using Vinext as the Next.js compatibility layer and deployment path.

Vinext replaces the previous OpenNext direction for this plan. The main idea is to keep the existing Next.js app structure, run it through Vinext's Vite-based Next.js API implementation, and deploy to Cloudflare Workers with native Worker bindings.

## Current repo shape

- Root is a Yarn 1 Turborepo with `apps/*` and `packages/*` workspaces.
- `apps/web` is the only app today and runs Next.js 16 with App Router.
- `packages/*` contains publishable `@ewjdev/anyclick-*` packages built with `tsup`.
- Backend behavior currently lives in `apps/web/src/app/api/**/route.ts`.
- Deployment is currently Vercel-oriented.

## Target repo shape

```text
anyclick/
  apps/
    web/                 # Next-compatible Vinext app deployed to Cloudflare Workers
    api/                 # Optional later split for high-risk API routes
  packages/
    anyclick-*           # Existing publishable packages, mostly unchanged
  .cursor/plans/
    vinext-cloudflare-workers-monorepo-migration.plan.md
```

Start with a single `apps/web` Vinext deployment. Add `apps/api` only if route size, payload limits, bindings, or release isolation justify splitting the API out after the first compatibility pass.

## Assumptions to confirm

- Use Vinext, not `@opennextjs/cloudflare`.
- Keep Yarn 1 and Turborepo unless Vinext compatibility forces a narrow tooling change.
- Preserve the existing Next.js App Router files during the first migration pass.
- Keep npm package publishing, Changesets, roadmap sync, and feedback cleanup workflows on GitHub Actions.
- Use Cloudflare Workers as the first production target.

## Vinext migration strategy

### 1. Compatibility scan

- Add Vinext as a dev dependency in `apps/web`.
- Run `vinext check` against `apps/web`.
- Capture every incompatibility into a migration checklist before changing runtime behavior.
- Pay special attention to:
  - App Router route handlers.
  - React Server Components.
  - `next/server` and `NextResponse` usage.
  - `next/image` behavior.
  - `next.config.js` compatibility.
  - API route streaming.

### 2. Non-destructive script adoption

Keep existing Next scripts during the first pass and add Vinext scripts beside them:

```json
{
  "scripts": {
    "dev": "next dev --turbopack --experimental-https",
    "build": "next build",
    "vinext:dev": "vinext dev",
    "vinext:check": "vinext check",
    "vinext:build": "vinext build",
    "vinext:deploy": "vinext deploy"
  }
}
```

After Vinext is proven, switch the default web scripts from `next` to `vinext`.

### 3. Cloudflare config generation

Use `vinext init` or `vinext deploy` to generate the initial Worker/Vite files, then commit the generated files explicitly so the deployment is reviewable:

- `apps/web/vite.config.ts`
- `apps/web/wrangler.jsonc`
- `apps/web/worker/index.ts`
- Vinext cache or binding setup files, if generated

Do not rely on generated config staying implicit in CI.

### 4. Environment and bindings

Replace production runtime dependence on `process.env` with Cloudflare bindings where route handlers execute in Workers.

Initial bindings:

- `GITHUB_TOKEN`
- `GITHUB_REPO`
- `JIRA_URL`
- `JIRA_EMAIL`
- `JIRA_API_TOKEN`
- `JIRA_PROJECT_KEY`
- `CURSOR_API_KEY`
- `CURSOR_REPOSITORY`
- `CURSOR_DEFAULT_REF`
- `CURSOR_AUTO_CREATE_PR`
- `OPENAI_API_KEY`
- `UPLOADTHING_TOKEN`
- `QUICKCHAT_KV_REST_API_URL`
- `QUICKCHAT_KV_REST_API_TOKEN`

Native Cloudflare storage options:

- Keep Upstash Redis first for rate limiting and chat history parity.
- Move chat history to KV after route parity is proven.
- Use Durable Objects only if rate limiting needs strong per-IP coordination beyond Upstash/KV behavior.
- Use R2 for future screenshot/media storage if GitHub issue payload size becomes a constraint.

### 5. API route migration checklist

Keep route paths stable so existing clients and demos do not need a first-pass rewrite.

| Route                        | Current purpose                      | Vinext/Workers work                                     |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------- |
| `/api/feedback`              | Create GitHub/Jira/Cursor feedback   | Bind env, audit payload size, guard local Cursor branch |
| `/api/ac/jira`               | Jira metadata and search             | Bind env, verify Basic auth encoding in Worker runtime  |
| `/api/anyclick/chat`         | AI suggestions and streaming chat    | Validate `ai` streaming response under Workers          |
| `/api/anyclick/chat/history` | Upstash-backed chat history          | Keep Upstash first, later evaluate KV                   |
| `/api/uploadthing`           | UploadThing file/url/data URL upload | Verify multipart parsing and UploadThing server adapter |

### 6. Package compatibility audit

Most packages stay publishable and runtime-agnostic. Server-facing packages need a Worker audit:

- `@ewjdev/anyclick-github`: replace or validate `Buffer` usage for base64/media behavior.
- `@ewjdev/anyclick-jira`: replace or validate `Buffer` usage for Basic auth and attachments.
- `@ewjdev/anyclick-cursor`: validate auth header construction.
- `@ewjdev/anyclick-uploadthing`: validate dynamic server import and base64 conversion.
- `@ewjdev/anyclick-cursor-local`: keep Node-only and development-only.

Prefer small Worker-safe helpers over enabling broad compatibility flags everywhere.

### 7. Web app migration

- Keep `apps/web/src/app` in place.
- Remove root `.env.local` loading from `next.config.js` once Cloudflare bindings are wired.
- Preserve `transpilePackages` until Vinext proves local workspace package resolution works without it.
- Validate docs/demo pages against Vinext dev and deployed Workers preview.
- Re-check any `next/image`, font, or image optimization behavior because Vinext handles those differently from Vercel.

### 8. CI/CD changes

Replace Vercel deployment with Cloudflare deployment:

- Add Cloudflare API token and account ID secrets.
- Add a workflow job for `yarn workspace web-app vinext:check`.
- Add a workflow job for `yarn workspace web-app vinext:build`.
- Add a deploy job using `vinext deploy` on `main`.
- Keep npm release workflows unchanged.

Clean up existing CI drift while touching workflows:

- Root has `format:check`, but CI currently calls `yarn format --check`.
- Turbo references package `lint` and `typecheck`, but packages may not define those scripts consistently.

## Execution phases

### Phase 1: plan and compatibility report

- Add this plan.
- Run `vinext check`.
- Create a short compatibility report with required code changes.

### Phase 2: Vinext scaffold

- Add Vinext dependency and non-destructive scripts.
- Generate and commit Vinext/Vite/Worker config.
- Ensure `vinext dev` starts locally.
- Ensure `vinext build` completes.

### Phase 3: runtime binding pass

- Convert API route env access to a small environment adapter that can read Cloudflare bindings in Workers and local env in development.
- Keep route behavior unchanged.
- Add missing env documentation to `.env.example`.

### Phase 4: route parity

- Test `/api/feedback` with GitHub issue creation or a mocked token path.
- Test `/api/ac/jira?action=status` and at least one authenticated Jira metadata path.
- Test `/api/anyclick/chat` streaming.
- Test `/api/anyclick/chat/history` save, load, and clear.
- Test `/api/uploadthing` with file and URL upload paths if credentials are available.

### Phase 5: Cloudflare deploy

- Wire Cloudflare secrets and bindings.
- Deploy a preview Worker.
- Route the production domain after preview parity is confirmed.
- Remove or disable the Vercel deploy workflow.

### Phase 6: optional API split

Split `apps/api` out only if the single Vinext Worker becomes difficult to operate.

Good reasons to split:

- Upload or feedback payload limits need different Worker settings.
- Chat streaming needs independent release controls.
- API routes need separate observability or bindings.
- The web Worker bundle becomes too large.

## Testing plan

Minimum evidence before switching production traffic:

- `yarn install --frozen-lockfile`
- `yarn build`
- `yarn workspace web-app vinext:check`
- `yarn workspace web-app vinext:build`
- Local `vinext dev` smoke test for the docs/demo app.
- Worker preview smoke test for page rendering.
- Worker preview API tests for feedback, Jira status, chat history, and chat streaming.

Manual browser validation is required before production cutover because this is a web runtime migration.

## Risks

- Vinext is newer and targets pragmatic compatibility rather than bug-for-bug Vercel/Next parity.
- AI streaming may behave differently under Workers.
- UploadThing server adapter may assume Node APIs.
- Screenshot-heavy feedback payloads may hit Worker request size or CPU limits.
- `Buffer` usage in server adapters may require Worker-safe replacements.
- Cloudflare bindings require a cleaner env boundary than current `process.env` usage.
- CI currently has script drift that may hide migration failures.

## Definition of done

- Vinext plan and compatibility report are committed.
- `apps/web` can run under Vinext locally.
- `apps/web` can build for Cloudflare Workers.
- Existing demos render under a Worker preview.
- Existing API routes respond with parity under a Worker preview.
- Vercel deploy is replaced by Cloudflare deploy.
- Secrets and env docs match the actual runtime requirements.
