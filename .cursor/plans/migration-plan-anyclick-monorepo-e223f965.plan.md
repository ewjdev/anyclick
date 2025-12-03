# anyclick Monorepo – Structure Overview

## Current Structure (Completed)

```
anyclick/
├── apps/
│   └── web/                          # Next.js 16 + React 19 + Tailwind 4
│       └── src/
│           ├── app/                  # Pages & API routes
│           │   ├── api/feedback/     # Feedback API endpoint
│           │   └── page.tsx          # Landing/splash page
│           ├── components/           # Shared UI components
│           └── lib/                  # Utilities
├── packages/
│   ├── anyclick-core/                # @anyclick/core – Framework-agnostic core library
│   │   └── src/
│   │       ├── client.ts
│   │       ├── dom.ts
│   │       ├── payload.ts
│   │       ├── screenshot.ts
│   │       └── types.ts
│   ├── anyclick-react/               # @anyclick/react – React provider & context menu UI
│   │   └── src/
│   │       ├── FeedbackProvider.tsx
│   │       ├── ContextMenu.tsx
│   │       ├── ScreenshotPreview.tsx
│   │       └── context.ts
│   ├── anyclick-cursor/              # @anyclick/cursor – Cursor AI agent adapter
│   │   └── src/
│   │       ├── agentAdapter.ts
│   │       ├── formatters.ts
│   │       └── types.ts
│   ├── anyclick-cursor-local/        # @anyclick/cursor-local – Local filesystem adapter
│   │   └── src/
│   │       ├── localAdapter.ts
│   │       ├── server.ts
│   │       └── formatters.ts
│   └── anyclick-github/              # @anyclick/github – GitHub Issues integration
│       └── src/
│           ├── githubAdapter.ts
│           ├── httpAdapter.ts
│           ├── server.ts
│           └── formatters.ts
├── package.json                      # Root – Yarn workspaces
├── turbo.json                        # Turborepo configuration
└── yarn.lock                         # Yarn lockfile
```

## ✅ Completed Work

- [x] Monorepo scaffolding with Yarn workspaces
- [x] Turborepo configuration with `build`, `dev`, `lint`, `clean` tasks
- [x] All 5 library packages migrated under `@anyclick/*` scope
- [x] Package builds configured with tsup (ESM + CJS + DTS)
- [x] Web app bootstrapped with Next.js 16 + React 19 + Tailwind 4
- [x] Web app depends on all `@anyclick/*` packages
- [x] Feedback API route implemented

## 📋 Remaining Work

### Web App – Docs & Examples

The `apps/web` serves dual purposes:

1. **Landing/splash page** showcasing anyclick capabilities
2. **Documentation site** with implementation examples

#### Pages to Build

| Route | Purpose |

|-------|---------|

| `/` | Landing page – hero, features, quick start |

| `/docs` | Documentation index |

| `/docs/getting-started` | Installation & basic setup |

| `/docs/core` | Core library API reference |

| `/docs/react` | React provider usage |

| `/docs/adapters` | Cursor, GitHub, Local adapters |

| `/examples` | Interactive examples gallery |

| `/examples/basic` | Minimal implementation |

| `/examples/custom-menu` | Custom context menu styling |

| `/examples/github-integration` | GitHub Issues workflow |

| `/examples/cursor-local` | Local development workflow |

#### Example Customizations to Showcase

- **Theming**: Dark mode, branded colors, custom fonts
- **Menu items**: Adding/removing actions, custom icons
- **Screenshot options**: Quality, cropping, annotations
- **Adapter configurations**: Different backends (GitHub, local files, custom)
- **Form customization**: Custom fields, validation, categories

### Publishing

- [ ] Set `private: false` on packages intended for npm
- [ ] Add `repository`, `homepage`, `bugs` fields to package.json files
- [ ] Configure changesets or semantic-release for versioning
- [ ] Add GitHub Actions workflow for CI/CD

### Polish

- [ ] Add comprehensive README to each package
- [ ] Add CONTRIBUTING.md
- [ ] Add LICENSE file (MIT already specified in packages)
- [ ] Set up ESLint/Prettier across workspace

## Package Dependencies Graph

```
@anyclick/react
    └── @anyclick/core

@anyclick/cursor
    └── @anyclick/core

@anyclick/cursor-local
    └── @anyclick/core

@anyclick/github
    └── @anyclick/core
```

## Scripts Reference

| Command | Description |

|---------|-------------|

| `yarn dev` | Run all packages in dev mode |

| `yarn build` | Build all packages |

| `yarn clean` | Clean all dist folders |

| `yarn format` | Format code with Prettier |