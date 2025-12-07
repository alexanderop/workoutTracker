# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

```bash
pnpm dev                    # Development server with HMR
pnpm test                   # Run all tests (Playwright browser mode)
pnpm test src/features/     # Run tests for a specific directory
pnpm test:headed            # Run tests with visible browser
pnpm test:ui                # Interactive Vitest UI
pnpm lint                   # oxlint + eslint with auto-fix
pnpm build                  # Type-check + production build
pnpm type-check             # TypeScript checking only
pnpm knip                   # Find unused exports/dependencies
```

## Architecture

This is a Vue 3 PWA using **Bulletproof feature-based architecture** for strength and CrossFit workout tracking.

### Dependency Rules (ESLint-Enforced)

```
Views → Features → Shared (composables, components, stores, db)
```

- Features **cannot** import other features
- Shared code **cannot** import features or views
- Features **cannot** import views

### Directory Structure

| Path | Purpose |
|------|---------|
| `src/views/` | Route-level pages (orchestrate features) |
| `src/features/` | Self-contained domain modules |
| `src/composables/` | Shared reactive logic, timer state machines |
| `src/components/ui/` | shadcn-vue primitives (**DO NOT EDIT**) |
| `src/db/` | Dexie IndexedDB with repository pattern |
| `src/stores/` | Pinia stores (exercises, settings only) |
| `src/types/` | TypeScript types |

### Block-Based Workout Model

Workouts are sequences of **blocks** using discriminated unions via `kind`:
- **Strength** (`kind: 'strength'`): Sets with kg, reps, RIR tracking
- **Timed** (`kind: 'amrap' | 'emom' | 'tabata' | 'fortime'`): CrossFit-style timers

Key files: `src/types/blocks.ts` (runtime types), `src/db/schema.ts` (persistence with `Db` prefix)

### State Management

- **Workout state**: Singleton ref in `src/features/workout/composables/useWorkout.ts`
- **Pinia stores**: Only for `exercises` and `settings` in `src/stores/`
- **Persistence**: Repository pattern via `src/db/interfaces.ts`

## Code Standards

### TypeScript Rules

- **NO** `any`, `enum`, or type assertions (`as T`)
- Use `unknown` + type guards instead of `any`
- Discriminated unions over optional properties for state
- `Readonly<T>` and `ReadonlyArray<T>` for function arguments
- Use `type` over `interface`; `Array<T>` over `T[]`

### Vue 3.5+ APIs (Required)

```vue
<script setup lang="ts">
// Reactive props destructure with defaults
const { count = 0 } = defineProps<{ count?: number }>()

// Two-way binding
const open = defineModel<boolean>('open', { required: true })

// Template refs
const inputRef = useTemplateRef('input')
</script>
```

**Important:** Wrap destructured props in getters for watchers: `watch(() => count, ...)`

### Error Handling

Use `tryCatch()` from `@/lib/tryCatch` instead of native try/catch (ESLint-enforced):

```ts
const [error, data] = await tryCatch(somePromise)
if (error) {
  // handle error
  return
}
// use data
```

### Routing

Use named routes with `RouteNames` from `@/router` (ESLint-enforced):

```ts
router.push({ name: RouteNames.WorkoutDetail, params: { id } })
```

### shadcn-vue Components

- Location: `src/components/ui/` — **NEVER modify these files**
- Built on **reka-ui** — check reka-ui docs for correct API
- Use `v-model` not `v-model:checked` for Switch, etc.

## Testing

Tests run in **Playwright browser mode** (not jsdom). All tests use `fake-indexeddb` for database isolation.

### Running Tests

```bash
pnpm test                           # All tests
pnpm test src/features/workout/     # Specific directory
pnpm test --watch                   # Watch mode
pnpm test:headed                    # Visible browser (debugging)
```

### Test Helpers

**Direct composable testing:**
```ts
const { start, isRunning } = useRestTimer()
```

**With lifecycle hooks:**
```ts
import { withSetup } from '@/__tests__/helpers/withSetup'
const [result, app] = withSetup(() => useMyComposable())
app.unmount() // cleanup
```

**Integration tests:**
```ts
import { createTestApp } from '@/__tests__/helpers/createTestApp'
const app = await createTestApp({ initialRoute: '/' })
await app.navigateTo('/workout')
await app.startWorkout()
await app.fillSet(0, { kg: 100, reps: 8, rir: 2 })
app.cleanup()
```

### Test Factories

```ts
// In-memory (useWorkout tests)
const workout = workoutBuilder().withStrengthBlock('Squat', 3).build()

// Database (integration tests)
const dbWorkout = dbWorkoutBuilder().withExercise('Deadlift', 3).completed().build()
```

Location: `src/__tests__/factories/`

### Reset Database Between Tests

```ts
import { resetDatabase } from '@/__tests__/setup'
beforeEach(async () => {
  await resetDatabase()
})
```

## Key Documentation

- `docs/agent/testing.md` — Test helpers, factories, patterns
- `docs/agent/composables.md` — useWorkout API, timer state machines
- `docs/agent/architecture.md` — Dependency rules diagram
