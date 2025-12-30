# CLAUDE.md

AI agent guidance for Vue 3 PWA workout tracker.

## Project

**Stack**: Vue 3.5+, TypeScript (strict), Vite, Dexie (IndexedDB), Vitest, shadcn-vue, Tailwind

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

**Note**: This project intentionally migrated from Pinia to VueUse's `createGlobalState()` pattern.

## Directory Map

- `src/features/` - [Feature modules](src/features/CLAUDE.md) (workout, exercises, templates, benchmarks, settings, timers)
- `src/__tests__/` - [Testing patterns](src/__tests__/CLAUDE.md)
- `src/db/` - [Database/repositories](src/db/CLAUDE.md)
- `src/stores/` - Global state using VueUse's `createGlobalState()` + `reactive()` (see [examples](src/stores/))
- `src/composables/` - Shared reactive logic (timers, dialogs, search)
- `src/views/` - Route-level pages
- `src/components/ui/` - shadcn-vue primitives

## Vue Pattern (No ESLint Rule)

Use `defineModel` for two-way binding: `const open = defineModel<boolean>('open')`

## Coding Guidelines

- **Stores**: Use `createGlobalState()` from VueUse for store management in `src/stores/` (do not use Pinia)

## Documentation Agents (ALWAYS Use)

**Rule: Always fetch current documentation BEFORE implementing anything with these libraries.** Don't rely on training data — fetch first, then implement.

| Library/Tool | Agent to Use |
|--------------|--------------|
| Vitest (testing, mocking, coverage) | `vitest-docs-specialist` |
| VueUse (composables, utilities) | `vueuse-docs-specialist` |
| Dexie (database, queries, IndexedDB) | `dexie-db-specialist` |
| shadcn-vue (UI components, forms) | `shadcn-vue-specialist` |
| Claude Code (hooks, MCP, features) | `claude-code-guide` |

**Mandatory triggers:**
- Any new feature touching these libraries → fetch docs first
- Any error or unexpected behavior → fetch docs to verify correct usage
- Any configuration changes → fetch docs for current options

## Available Tools

`gh` (GitHub CLI), `tree`, `rg` (ripgrep), `sg` (ast-grep) are installed.

### ast-grep

Structural search/replace using AST patterns. Install: `brew install ast-grep`

```bash
# Vue/TS patterns
sg -p 'ref<$T>($$$)' src/                    # Find typed refs
sg -p 'const $NAME = computed($$$)' src/    # Find computed properties
sg -p 'watch($DEPS, $CALLBACK)' src/        # Find watch calls
sg -p 'onMounted($$$)' src/                 # Find lifecycle hooks
sg -p 'async function $NAME($$$) {$$$}' src/ # Find async functions

# Debugging
sg -p 'console.log($$$)' src/               # Find console.log calls
```

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
