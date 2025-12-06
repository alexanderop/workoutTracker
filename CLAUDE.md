# CLAUDE.md

- always do TDD when implementing a new feature 
- only write integration tests 

## Quick Commands

```bash
pnpm dev              # Dev server
pnpm test:unit        # Run all tests
pnpm test:unit <file> # Run single test file
pnpm lint             # oxlint + eslint with auto-fix
pnpm build            # Type-check + production build
pnpm type-check       # TypeScript validation only
pnpm knip             # Find unused exports/dependencies
```

## Architecture Overview

Vue 3 PWA for strength and CrossFit-style workout tracking using a **Bulletproof feature-based architecture**.

### Block-Based Workout Model

Workouts are sequences of **blocks** using discriminated unions via `kind`:
- **Strength** (`kind: 'strength'`): Set/rep tracking with kg, reps, RIR
- **Timed** (`kind: 'amrap' | 'emom' | 'tabata' | 'fortime'`): CrossFit-style timers

**Key files:** `src/types/blocks.ts` (runtime types), `src/db/schema.ts` (persistence with `Db` prefix)

### Project Structure

```
src/
├── features/           # Self-contained feature modules (Bulletproof pattern)
│   ├── exercises/      # Exercise library CRUD
│   ├── settings/       # App settings & preferences
│   ├── templates/      # Workout templates
│   ├── timers/         # Timer composables (rest timer export)
│   └── workout/        # Workout execution logic
├── views/              # Route-level page components (orchestrate features)
├── components/         # Shared components
│   └── ui/             # shadcn-vue primitives (DO NOT EDIT)
├── composables/        # Shared composables (singletons for workout state)
├── stores/             # Pinia stores (exercises, settings only)
├── db/                 # Dexie IndexedDB + repository pattern
├── types/              # Shared TypeScript types
└── lib/                # Utility functions
```

### Feature Boundary Rules (ESLint-Enforced)

- Features cannot import from other features
- Shared code (`components/`, `composables/`, `lib/`, `db/`, `types/`, `stores/`) cannot import from features or views
- Features cannot import from views (views are top-level orchestrators)

### State Management

- **Workout state**: Singleton ref in `src/composables/useWorkout.ts` - all components share same state
- **Pinia stores**: Only for `exercises` and `settings` (`src/stores/`)
- **Persistence**: Dexie IndexedDB with repository pattern (`src/db/repositories/`)
- **Workout modes**: `'builder'` (configure blocks) → `'active'` (execute workout)

## Code Patterns

### TypeScript Strict Rules (ESLint-Enforced)

- **NO** `any` - use `unknown` + type guards
- **NO** `enum` - use literal unions or `as const` objects
- **NO** type assertions (`as T`) - except `as const`
- **NO** `else`/`else if` - use early returns or ternary operators
- **NO** `reactive()` - use `ref()` for consistent patterns
- Use `type` over `interface`
- Use `Array<T>` over `T[]`
- Separate type imports: `import type { Foo } from './foo'`

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

### shadcn-vue Components

- Location: `src/components/ui/` - **NEVER modify these files**
- Built on **reka-ui** - check reka-ui docs for correct API
- Style: new-york, uses CSS variables for theming
- Primary color defined in `src/style.css` via `--primary` (OKLCH format)

### Component Naming

Prefix child components with parent name (Vue Style Guide Priority B):
- `WorkoutSetTable.vue` not `SetTable.vue`
- `ExerciseMuscleSelector.vue` not `MuscleSelector.vue`

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

// Database (integration tests)
const dbWorkout = dbWorkoutBuilder().withExercise('Deadlift', 3).completed().build()
```

**Helpers:** `src/__tests__/helpers/`, **Factories:** `src/__tests__/factories/`

### Test Setup

Tests use `fake-indexeddb`. Import `resetDatabase` to clear tables:
```ts
import { resetDatabase } from '@/__tests__/setup'
beforeEach(async () => await resetDatabase())
```

## Key Documentation

- `docs/agent/testing.md` - Test helpers, factories, patterns
- `docs/agent/composables.md` - useWorkout API, timer state machines
- `src/components/CLAUDE.md` - Vue 3.5 component patterns
