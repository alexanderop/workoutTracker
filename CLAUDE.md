# CLAUDE.md

Vue 3.5+ PWA workout tracker. TypeScript (strict), Vite, Dexie, Vitest, shadcn-vue, Tailwind.

## Commands

```bash
pnpm dev          # Development server
pnpm test         # Run tests (NOT test:unit!)
pnpm lint         # Fix lint errors
pnpm type-check   # TypeScript checking
pnpm build        # Production build
pnpm knip         # Find unused exports
```

## Pre-Commit

```bash
pnpm type-check && pnpm lint && pnpm test
```

Conventional Commits with scope: `feat(workout): add rest timer`

## Critical Conventions

- **State**: Use `createGlobalState()` from VueUse (NOT Pinia)
- **Two-way binding**: `defineModel` → `const open = defineModel<boolean>('open')`

## Structure

```
src/features/   # Feature modules (workout, exercises, templates, benchmarks, settings, timers)
src/db/         # Database/repositories (Dexie)
src/__tests__/  # Tests (Vitest + Playwright browser mode)
src/stores/     # Global state (createGlobalState)
src/composables/# Shared reactive logic
src/views/      # Route-level pages
src/components/ui/ # shadcn-vue primitives
```

## Documentation Agents (ALWAYS Use)

**Rule**: Fetch docs BEFORE implementing with these libraries.

| Library | Agent |
|---------|-------|
| Vitest | `vitest-docs-specialist` |
| VueUse | `vueuse-docs-specialist` |
| Dexie | `dexie-db-specialist` |
| shadcn-vue | `shadcn-vue-specialist` |
| Claude Code | `claude-code-guide` |

## Tools

`gh`, `tree`, `rg`, `sg` (ast-grep) available. Prefer LSP tools (`find_definition`, `find_references`, `rename_symbol`) for symbol lookups.
