# CLAUDE.md

AI agent guidance for Vue 3 PWA workout tracker.

## Project

**Stack**: Vue 3.5+, TypeScript (strict), Vite, Pinia, Dexie (IndexedDB), Vitest, shadcn-vue, Tailwind

**Architecture**: Bulletproof feature-based. ESLint enforces `Views → Features → Shared` boundaries.

## Commands

```bash
pnpm dev          # Development server
pnpm test         # Run tests (NOT test:unit - that doesn't exist!)
pnpm lint         # Fix lint errors (enforces ALL code style rules)
pnpm type-check   # TypeScript checking
pnpm build        # Production build
pnpm knip         # Find unused exports
```

## Before Committing

```bash
pnpm type-check && pnpm lint && pnpm test
```

Conventional Commits with scope: `feat(workout): add rest timer`

## Directory Map

- `src/features/` - [Feature modules](src/features/CLAUDE.md) (workout, exercises, templates, benchmarks, settings, timers)
- `src/__tests__/` - [Testing patterns](src/__tests__/CLAUDE.md)
- `src/db/` - [Database/repositories](src/db/CLAUDE.md)
- `src/composables/` - Shared reactive logic (timers, dialogs, search)
- `src/views/` - Route-level pages
- `src/components/ui/` - shadcn-vue primitives

## Vue Pattern (No ESLint Rule)

Use `defineModel` for two-way binding: `const open = defineModel<boolean>('open')`

## Available Tools

`gh` (GitHub CLI), `tree`, `rg` (ripgrep) are installed.

## Code Intelligence (LSP)

MCP LSP tools provide accurate code navigation. Prefer over grep for symbol lookups.

| Use Case | Tool |
|----------|------|
| Find definition | `find_definition` |
| Find all usages | `find_references` |
| Rename symbol | `rename_symbol` (use `dry_run: true` to preview) |
| Check type errors | `get_diagnostics` |

**Use grep instead for**: text patterns, comments, strings, open-ended exploration.

## Slash Commands

**Git Workflow**: `/push`, `/pr`, `/ship`, `/fix-pipeline`, `/review-coderabbit`, `/merge-and-branch`

## Quick Find

```bash
rg -n "export (const|function) use" src/composables src/features  # Composables
rg -n "RouteNames\." src/router                                    # Routes
tree src/features -L 2                                             # Directory structure
```
