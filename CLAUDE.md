# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

```bash
pnpm dev              # Dev server with HMR
pnpm test             # Run all tests (Playwright browser)
pnpm test <file>      # Run single test file
pnpm test:headed      # Run tests with visible browser
pnpm test:ui          # Run tests with Vitest UI
pnpm lint             # oxlint + eslint with auto-fix
pnpm build            # Type-check + production build
pnpm type-check       # TypeScript only
pnpm knip             # Find unused exports/dependencies
```

## Architecture

Vue 3 PWA using **Bulletproof feature-based architecture** for workout tracking.

### Dependency Rules

```
views/ → features/ → shared (composables/, components/, stores/, db/)
```

- **Features cannot import other features** (ESLint-enforced)
- **Shared code cannot import features**
- Views orchestrate features; features contain domain logic

### Key Directories

| Path | Purpose |
|------|---------|
| `src/features/workout/` | Core workout execution logic and persistence |
| `src/features/exercises/` | Exercise library CRUD |
| `src/composables/timers/` | Timer composables (rest, AMRAP, EMOM, Tabata, ForTime) |
| `src/db/repositories/` | Dexie IndexedDB data access layer |
| `src/components/ui/` | shadcn-vue primitives — **DO NOT EDIT** |
| `src/types/blocks.ts` | Block discriminated unions (runtime types) |
| `src/db/schema.ts` | Persistence types (`Db` prefix) |

### Block-Based Workouts

Workouts contain sequences of **blocks** using discriminated unions via `kind`:
- **Strength** (`kind: 'strength'`): Set/rep tracking with kg, reps, RIR
- **Timed** (`kind: 'amrap' | 'emom' | 'tabata' | 'fortime'`): CrossFit-style timers

### State Management

- **Workout state**: Singleton ref in `src/features/workout/composables/useWorkout.ts`
- **Pinia stores**: Only for `exercises` and `settings` (`src/stores/`)
- **Persistence**: Dexie IndexedDB with repository pattern

## Code Standards

### TypeScript

- **NO** `any`, `enum`, or type assertions (`as T`)
- Use `unknown` + type guards, literal unions for discriminated types
- Prefer `type` over `interface`; `Array<T>` over `T[]`
- Use `Readonly<T>`, `ReadonlyArray<T>` for function parameters

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

### Component Naming

- Prefix child components with parent name: `WorkoutSetTable.vue`, not `SetTable.vue`
- Multi-attribute elements on separate lines
- Extract complex template expressions to methods

### shadcn-vue

- Built on **reka-ui** — check reka-ui docs for API details
- Use `v-model` not `v-model:checked` for Switch components
- Never modify files in `src/components/ui/`

## Testing

### Composable Testing

```ts
// Direct test (no lifecycle)
const { start, isRunning } = useRestTimer()

// With lifecycle (onMounted, etc.)
const [result, app] = withSetup(() => useMyComposable())
app.unmount() // cleanup
```

### Integration Testing

```ts
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

// Database (integration)
const dbWorkout = dbWorkoutBuilder().withExercise('Deadlift', 3).completed().build()
```

**Helpers:** `src/__tests__/helpers/` | **Factories:** `src/__tests__/factories/`

## Key Documentation

- `docs/agent/testing.md` — Test helpers, factories, patterns
- `docs/agent/composables.md` — useWorkout API, timer state machines
- `docs/agent/architecture.md` — Full architecture diagram
- `src/components/CLAUDE.md` — Vue 3.5 component patterns
