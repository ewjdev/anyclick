# Contributing to anyclick

Thank you for your interest in contributing to anyclick! This document provides guidelines and information about contributing to the project.

## Table of Contents

- [Contributing to anyclick](#contributing-to-anyclick)
  - [Table of Contents](#table-of-contents)
  - [Code of Conduct](#code-of-conduct)
  - [Getting Started](#getting-started)
  - [Development Setup](#development-setup)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Project Structure](#project-structure)
    - [Useful Commands](#useful-commands)
  - [Making Changes](#making-changes)
    - [Working on a Package](#working-on-a-package)
    - [Working on the Web App](#working-on-the-web-app)
    - [Adding a New Feature](#adding-a-new-feature)
  - [Pull Request Process](#pull-request-process)
    - [PR Title Format](#pr-title-format)
  - [Coding Standards](#coding-standards)
    - [TypeScript](#typescript)
    - [React Components](#react-components)
    - [Formatting](#formatting)
  - [Commit Messages](#commit-messages)
  - [Changesets](#changesets)
    - [Creating a Changeset](#creating-a-changeset)
    - [Guidelines](#guidelines)
  - [Questions?](#questions)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone. Please be kind and constructive in all interactions.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment (see below)
4. Create a new branch for your changes
5. Make your changes
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 22.0.0 or later
- Yarn 1.22.x

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/anyclick.git
cd anyclick

# Install dependencies
yarn install

# Build all packages
yarn build

# Start development mode
yarn dev
```

### Project Structure

```
anyclick/
├── apps/
│   └── web/                    # Documentation & examples site
├── packages/
│   ├── anyclick-core/          # Framework-agnostic core library
│   ├── anyclick-react/         # React provider and UI
│   ├── anyclick-github/        # GitHub Issues adapter
│   ├── anyclick-cursor/        # Cursor Cloud Agent adapter
│   └── anyclick-cursor-local/  # Local Cursor adapter
├── .changeset/                 # Changeset configuration
└── .github/                    # GitHub workflows
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `yarn dev` | Start all packages in development mode |
| `yarn build` | Build all packages |
| `yarn clean` | Clean all build artifacts |
| `yarn format` | Format code with Prettier |
| `yarn changeset` | Create a changeset for your changes |

## Making Changes

### Working on a Package

1. Navigate to the package directory
2. Make your changes
3. Test locally by running `yarn dev` in the root
4. Build to ensure no TypeScript errors: `yarn build`

### Working on the Web App

1. Navigate to `apps/web`
2. Run `yarn dev` to start the Next.js development server
3. Open http://localhost:3000

### Adding a New Feature

1. Consider if the feature belongs in `core` or a specific adapter/provider
2. Write TypeScript types first
3. Implement the feature
4. Add tests if applicable
5. Update documentation
6. Create a changeset

## Pull Request Process

1. **Create a Changeset**: Run `yarn changeset` and describe your changes
2. **Ensure Quality**: 
   - Code builds without errors
   - Code is formatted (`yarn format`)
   - TypeScript has no errors
3. **Update Documentation**: If your changes affect the public API, update relevant docs
4. **Submit PR**: Create a pull request with a clear description

### PR Title Format

Use a descriptive title that follows this format:
- `feat: add new feature` - New features
- `fix: resolve issue with X` - Bug fixes
- `docs: update README` - Documentation changes
- `chore: update dependencies` - Maintenance tasks
- `refactor: simplify X` - Code refactoring

## Coding Standards

### TypeScript

- Use strict TypeScript settings
- Export types from package index files
- Use `interface` for object types, `type` for unions/intersections
- Avoid `any` - use `unknown` and narrow types

### React Components

- Use functional components with hooks
- Export components as named exports
- Include TypeScript props interfaces
- Use `'use client'` only when necessary

### Formatting

- Use Prettier for formatting
- 2-space indentation
- Single quotes
- Semicolons
- 100 character line length (soft limit)

## Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation
- `style` - Formatting (no code change)
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

Example:
```
feat(react): add support for custom menu icons

Added an `icon` prop to FeedbackMenuItem that accepts a ReactNode.
Icons are rendered alongside the label in the context menu.

Closes #123
```

## Changesets

We use [Changesets](https://github.com/changesets/changesets) for versioning and changelogs.

### Creating a Changeset

```bash
yarn changeset
```

1. Select the packages affected by your change
2. Choose the version bump type:
   - `major` - Breaking changes
   - `minor` - New features (backwards compatible)
   - `patch` - Bug fixes
3. Write a summary of your changes

### Guidelines

- Create one changeset per logical change
- Be descriptive in the summary (it appears in CHANGELOG)
- Link to relevant issues/PRs
- Consider all affected packages

Example changeset:

```markdown
---
"@ewjdev/anyclick-react": minor
"@ewjdev/anyclick-core": patch
---

Add custom icon support for menu items

Users can now pass an `icon` prop to FeedbackMenuItem components.
The icon is rendered alongside the label in the context menu.
```

## Questions?

Feel free to:
- Open an issue for questions
- Start a discussion in GitHub Discussions
- Reach out on Twitter [@anyclick](https://twitter.com/anyclick)

Thank you for contributing! 🎉

