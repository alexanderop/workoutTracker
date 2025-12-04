# Workout Tracker - AI Agent Instructions

Vue 3 PWA for strength and CrossFit-style workout tracking with block-based programming.

## Quick Commands

```bash
pnpm dev          # Dev server
pnpm test:unit    # Run tests (add <file> for single file)
pnpm lint         # oxlint + eslint with auto-fix
pnpm build        # Type-check + production build
```

## Architecture Overview

### Block-Based Workouts

Workouts are sequences of **blocks** using discriminated unions via `kind`:
- **Strength** (`kind: 'strength'`): Set/rep tracking with kg, reps, RIR
- **Timed** (`kind: 'amrap' | 'emom' | 'tabata' | 'fortime'`): CrossFit-style timers

**Key files:** `src/types/blocks.ts` (runtime types), `src/db/schema.ts` (persistence, `Db` prefix)

### State Management

- **Workout state**: Singleton ref in `src/composables/useWorkout.ts` - all components share same state
- **Pinia stores**: Only for `exercises` and `settings` (`src/stores/`)
- **Persistence**: Dexie IndexedDB with repository pattern (`src/db/repositories/`)

### Workout Modes

`'builder'` (configure blocks) → `'active'` (execute workout)

## Code Patterns

### TypeScript Strict Rules

- **NO** `any`, `enum`, or type assertions (`as T`) - use `unknown` + guards, literal unions
- **Discriminated unions** over optional properties for state
- **Immutability**: `Readonly<T>`, `ReadonlyArray<T>` for function args
- Use `type` over `interface`; `Array<T>` over `T[]`

### Vue 3.5+ APIs (REQUIRED)

```vue
<!-- Reactive props destructure with defaults -->
<script setup lang="ts">
const { count = 0 } = defineProps<{ count?: number }>()

<!-- Two-way binding -->
const open = defineModel<boolean>('open', { required: true })

<!-- Template refs -->
const inputRef = useTemplateRef('input')
</script>
```

**Important:** Wrap destructured props in getters for watchers: `watch(() => count, ...)`

### shadcn-vue Components

- Location: `src/components/ui/` - **NEVER modify these files**
- Built on **reka-ui** library - check reka-ui docs for correct API
- Use `v-model` not `v-model:checked` for Switch, etc.

## Testing

### Composables

```ts
// Direct test (no lifecycle)
const { start, isRunning } = useRestTimer()

// With lifecycle (onMounted, etc.)
const [result, app] = withSetup(() => useMyComposable())
app.unmount() // cleanup
```

### Integration Tests

```ts
const app = await createTestApp({ initialRoute: '/' })
await app.navigateTo('/workout')
await app.startWorkout()
await app.fillSet(0, { kg: 100, reps: 8, rir: 2 })
app.cleanup()
```

### Factories

```ts
// In-memory (useWorkout tests)
const workout = workoutBuilder().withStrengthBlock('Squat', 3).build()

// Database (integration)
const dbWorkout = dbWorkoutBuilder().withExercise('Deadlift', 3).completed().build()
```

**Helpers:** `src/__tests__/helpers/`, **Factories:** `src/__tests__/factories/`

## File Organization

| Path | Purpose |
|------|---------|
| `src/composables/` | Core logic, timers (singletons for workout state) |
| `src/composables/timers/` | AMRAP, EMOM, Tabata, ForTime timer state machines |
| `src/components/ui/` | shadcn-vue primitives (DO NOT EDIT) |
| `src/components/{feature}/` | Feature components with parent-prefixed names |
| `src/db/repositories/` | Database access layer |
| `docs/agent/` | Detailed guides for testing and composables |

## Key Documentation

Read before working on specific areas:
- `docs/agent/testing.md` - Test helpers, factories, patterns
- `docs/agent/composables.md` - useWorkout API, timer state machines
- `src/components/CLAUDE.md` - Vue 3.5 component patterns
