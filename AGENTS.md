# AGENTS.md

## Repository instructions

### Overview

This is a Yarn-based Turborepo monorepo for "anyclick" — a React developer toolkit that enables right-click feedback capture with DOM context. It contains 13 package workspaces (12 publishable and one private protocol package) plus a Next.js 16 documentation/demo site (`apps/web`).

### Quick reference

| Task               | Command                                          |
| ------------------ | ------------------------------------------------ |
| Install deps       | `yarn install`                                   |
| Build all packages | `yarn build`                                     |
| Dev mode (all)     | `yarn dev`                                       |
| Format check       | `yarn format:check`                              |
| Format fix         | `yarn format`                                    |
| Typecheck packages | `yarn turbo run typecheck --filter=./packages/*` |
| Build web app      | `yarn turbo run build --filter=web-app`          |

### Running the dev server

- `yarn dev` starts Turborepo dev mode for all packages (tsup watchers) and the web app (Next.js with Turbopack + HTTPS).
- The web app will be available at **https://localhost:3000** with a self-signed certificate (auto-generated via mkcert on first run).
- No external services are required for basic development. GitHub, Jira, OpenAI, and Upstash integrations are optional and controlled by env vars in `.env.local`.

### Important caveats

- Use **Node.js 24** from `.nvmrc` and CI, and Yarn 1.22.19 from `packageManager`. Root engine metadata still permits older Node versions.
- **`yarn build` must complete before `yarn dev`** on a fresh clone since packages depend on each other's build outputs (`^build` in turbo.json).
- The web app's `"lint": "next lint"` script has a known issue with Next.js 16 CLI (the command fails with "Invalid project directory provided"). CI only lints packages, not the web app: `yarn turbo run lint --filter=./packages/*`.
- Run current checks rather than relying on historical failure counts. Root scripts and `.github/workflows/ci.yml` define the current build/test/format workflow; absent package tasks are not evidence of lint/typecheck coverage.
- The `--experimental-https` flag on the web dev server auto-generates SSL certs in `apps/web/certificates/` on first run — no manual step required.

### Task-specific guidance

- For Cloudflare feasibility, runtime migration, deployment or rollback, read `.cursor/plans/vinext-cloudflare-workers-monorepo-migration.plan.md` and `docs/cloudflare-migration-review.md`. These describe proposed work; the current app still runs Next on Vercel.
- For release preparation, package publishing or release workflow changes, read `.agents/skills/anyclick-release/SKILL.md` and its release contract.
- `dev:showcase` and the existing Playwright harness use a separate plain-HTTP Next dev path. Browser tests mock showcase APIs; distinguish them from live backend validation.
- `tests/showcase/live.test.ts` can call paid AI and write to the configured demo GitHub repository when opted in. Use dedicated test destinations and report skipped live checks explicitly.
