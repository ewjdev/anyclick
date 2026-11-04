# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a Yarn-based Turborepo monorepo for "anyclick" — a React developer toolkit that enables right-click feedback capture with DOM context. It consists of 13 npm packages under `@ewjdev/` scope plus a Next.js 16 documentation/demo site (`apps/web`).

### Quick reference

| Task | Command |
|------|---------|
| Install deps | `yarn install` |
| Build all packages | `yarn build` |
| Dev mode (all) | `yarn dev` |
| Format check | `yarn format:check` |
| Format fix | `yarn format` |
| Typecheck packages | `yarn turbo run typecheck --filter=./packages/*` |
| Build web app | `yarn turbo run build --filter=web-app` |

### Running the dev server

- `yarn dev` starts Turborepo dev mode for all packages (tsup watchers) and the web app (Next.js with Turbopack + HTTPS).
- The web app will be available at **https://localhost:3000** with a self-signed certificate (auto-generated via mkcert on first run).
- No external services are required for basic development. GitHub, Jira, OpenAI, and Upstash integrations are optional and controlled by env vars in `.env.local`.

### Important caveats

- **Node.js 22+** is required (CI uses Node 22; `engines` field says `>=20.9.0` but CONTRIBUTING.md specifies 22+).
- **`yarn build` must complete before `yarn dev`** on a fresh clone since packages depend on each other's build outputs (`^build` in turbo.json).
- The web app's `"lint": "next lint"` script has a known issue with Next.js 16 CLI (the command fails with "Invalid project directory provided"). CI only lints packages, not the web app: `yarn turbo run lint --filter=./packages/*`.
- **Format check** (`yarn format:check`) will report ~91 pre-existing formatting issues. These are in `.cursor/plans/`, docs, and some source files. This is the repo's current state.
- The `--experimental-https` flag on the web dev server auto-generates SSL certs in `apps/web/certificates/` on first run — no manual step required.
