# CLAUDE.md

AI agent guidance for this Vue 3 PWA workout tracker.

## Project Snapshot

**Single-project Vue 3 PWA** using Bulletproof feature-based architecture for strength and CrossFit workout tracking.

**Tech**: Vue 3.5+, TypeScript (strict), Vite, Pinia, Dexie (IndexedDB), Vitest (Playwright browser mode), shadcn-vue, Tailwind CSS

**Architecture**: ESLint-enforced dependency rules: `Views → Features → Shared` (features cannot import other features)

📖 **Sub-guides**: Features, testing, and database patterns have dedicated CLAUDE.md files below.

## Root Setup Commands

```bash
# Install dependencies
pnpm install

# Development server with HMR
pnpm dev

# Type-check entire project
pnpm type-check

# Run all tests (Playwright browser mode)
pnpm test

# Lint with oxlint + eslint (auto-fix)
pnpm lint

# Production build (includes type-check)
pnpm build

# Find unused exports/dependencies
pnpm knip
```

## Universal Conventions

### Code Style
- **TypeScript strict mode**: NO `any`, `enum`, or type assertions (`as T`)
- Use `type` over `interface`; `Array<T>` over `T[]`
- Use `unknown` + type guards instead of `any`
- Active voice in all comments and documentation

### Vue 3.5+ Required APIs
- Reactive props destructuring: `const { count = 0 } = defineProps<{ count?: number }>()`
- Two-way binding: `const open = defineModel<boolean>('open', { required: true })`
- Template refs: `const inputRef = useTemplateRef('input')`

### Enforced Patterns (ESLint)
- Error handling: Use `tryCatch()` from `@/lib/tryCatch` (NOT native `try/catch`)
- Routing: Use `RouteNames` from `@/router` (NOT string literals)
- Import boundaries: Features cannot import other features or views

### Commit Format
- Conventional Commits with scope: `feat(workout): add rest timer`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Run `pnpm lint` and `pnpm type-check` before committing

### Branch Strategy
- Main branch: `main`
- Feature branches: `feature/description` or descriptive names
- Check git status output for current branch name

## Security & Secrets

- **Never commit** tokens, API keys, or credentials
- Environment variables: Use `.env.local` (gitignored)
- **No PII tracking**: App is fully local (IndexedDB only)

## JIT Index - Directory Map

### Core Directories
- **Features** (`src/features/`) → [see src/features/CLAUDE.md](src/features/CLAUDE.md)
  - `exercises/` - Exercise library CRUD
  - `workout/` - Workout execution state & logic
  - `templates/` - Workout template management
  - `benchmarks/` - Benchmark workout tracking
  - `settings/` - App settings & preferences
  - `timers/` - Standalone timer UI components

- **Testing** (`src/__tests__/`) → [see src/__tests__/CLAUDE.md](src/__tests__/CLAUDE.md)
  - `integration/` - Full user flow tests
  - `composables/` - Composable unit tests
  - `factories/` - Test data builders
  - `helpers/` - Test utilities (`createTestApp`, `withSetup`)

- **Database** (`src/db/`) → [see src/db/CLAUDE.md](src/db/CLAUDE.md)
  - Repository pattern with Dexie (IndexedDB)
  - Schema: `schema.ts` (runtime types with `Db` prefix)
  - Interfaces: `interfaces.ts` (repository abstractions)

### Supporting Directories
- **Composables** (`src/composables/`) - Shared reactive logic
  - `timers/` - Timer state machines (rest, AMRAP, EMOM, Tabata, ForTime)
- **Components** (`src/components/`)
  - `ui/` - shadcn-vue primitives (**DO NOT EDIT**)
  - `timers/` - Reusable timer UI
- **Views** (`src/views/`) - Route-level pages (orchestrate features)
- **Stores** (`src/stores/`) - Pinia stores (exercises, settings only)
- **Types** (`src/types/`) - Shared TypeScript types
- **Router** (`src/router/`) - Vue Router config with `RouteNames`
- **i18n** (`src/i18n/`) - Internationalization

### Quick Find Commands

```bash
# Find a composable by name
rg -n "export (const|function) use" src/composables src/features

# Find a component
rg -n "export default" src/components src/features --type vue

# Find route definitions
rg -n "RouteNames\." src/router

# Find a specific exercise or workout type
rg -n "kind: '(strength|amrap|emom|tabata|fortime)'" src/

# Find test files for a feature
find src/__tests__ -name "*workout*.spec.ts"

# Find database repositories
ls src/db/implementations/
```

## Definition of Done

Before creating a PR, ensure:

- [ ] `pnpm type-check` passes (no TypeScript errors)
- [ ] `pnpm lint` passes (oxlint + eslint)
- [ ] `pnpm test` passes (all tests green)
- [ ] No `any`, `enum`, or type assertions added
- [ ] No cross-feature imports (ESLint will catch this)
- [ ] shadcn-vue components in `src/components/ui/` not modified
- [ ] Followed Vue 3.5+ APIs (`defineProps` destructuring, `defineModel`, `useTemplateRef`)

**Quick check command:**
```bash
pnpm type-check && pnpm lint && pnpm test
```
