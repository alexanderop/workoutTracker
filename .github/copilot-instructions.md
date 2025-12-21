# Copilot Instructions

Vue 3 PWA workout tracker with **Bulletproof feature-based architecture**.

## Stack & Commands

**Stack**: Vue 3.5+, TypeScript (strict), Vite, Pinia, Dexie (IndexedDB), Vitest + Playwright browser mode, shadcn-vue (reka-ui), Tailwind

```bash
pnpm dev          # Development server
pnpm test         # Run tests (NOT test:unit)
pnpm lint         # Auto-fix lint (enforces architecture)
pnpm type-check   # TypeScript checking
pnpm knip         # Find unused exports
```

**Pre-commit**: `pnpm type-check && pnpm lint && pnpm test`

## Architecture

**Import hierarchy** (ESLint enforced): `Views → Features → Shared`

```
src/
├── views/           # Route pages (import features only)
├── features/        # Self-contained domain modules
│   ├── workout/     # Active workout state, block operations
│   ├── exercises/   # Exercise library CRUD
│   ├── templates/   # Workout template management
│   ├── benchmarks/  # Benchmark workout tracking
│   ├── settings/    # App preferences
│   └── timers/      # Standalone timer UI
├── composables/     # Shared reactive logic
├── components/ui/   # shadcn-vue primitives (DO NOT EDIT)
├── db/              # Repository pattern with Dexie
└── types/           # Domain types (blocks.ts, workout.ts)
```

## Key Patterns

### Block-Based Workout Model
Workouts are sequences of **blocks** using discriminated unions via `kind`:
```ts
type WorkoutBlock = StrengthBlock | TimedBlock  // kind: 'strength' | 'amrap' | 'emom' | ...
```
See [src/types/blocks.ts](src/types/blocks.ts) for all block types.

### Singleton State in Features
`useWorkout()` returns a shared singleton ref—all components see the same state:
```ts
const { workout, selectBlock } = useWorkout()  // Shared across components
```

### Repository Pattern for Database
Import repos via getters, use converters between `Db*` types and domain types:
```ts
import { getWorkoutsRepository } from '@/db'
import { convertWorkoutToDb } from '@/db/converters'

await getWorkoutsRepository().create(convertWorkoutToDb(workout))
```
Database types use `null` (not `undefined`). See [src/db/CLAUDE.md](src/db/CLAUDE.md).

### Two-Way Binding
Use `defineModel` for v-model props: `const open = defineModel<boolean>('open')`

### shadcn-vue Uses reka-ui
Check [reka-ui.com](https://reka-ui.com) for component APIs (NOT Radix).

## Testing

**Framework**: Vitest 4 + Playwright browser mode (NOT jsdom)

```ts
import { page } from 'vitest/browser'
import { createTestApp } from '@/__tests__/helpers/createTestApp'
import { resetDatabase } from '@/__tests__/setup'

beforeEach(async () => { await resetDatabase() })

it('navigates workout flow', async () => {
  const app = await createTestApp({ initialRoute: '/' })
  await page.getByRole('button', { name: /start/i }).click()
  await expect.element(page.getByText(/block/i)).toBeVisible()
  app.cleanup()  // REQUIRED
})
```

**Assertions**: Use `expect.element()` for DOM, `expect.poll()` for async/state.

**Factories**: `workoutBuilder()`, `dbWorkoutBuilder()` in `src/__tests__/factories/`.

## TypeScript Style

- **No `any`** — use `unknown` + guards
- **No `enum`** — use literal unions or `as const`
- **No type assertions** — use `@ts-expect-error` with comment if needed
- **Discriminated unions** over optional properties for state
- Use `Array<T>` syntax, not `T[]`
- Named exports only, no defaults

## Conventions

- **Commits**: Conventional with scope: `feat(workout): add rest timer`
- **Imports**: Relative `./` for same feature, absolute `@/` for cross-feature
- **Feature structure**: `components/`, `composables/`, `lib/`, `state/`
