# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Type-check + build for production
pnpm test:unit        # Run all unit tests
pnpm test:unit src/__tests__/composables/useWorkout.spec.ts  # Run single test file
pnpm lint             # Run oxlint + eslint with auto-fix
pnpm type-check       # TypeScript type checking only
```

## Architecture

### Block-Based Workout System

Workouts consist of ordered **blocks** (discriminated union via `kind` property):

- **Strength blocks** (`kind: 'strength'`): Traditional set/rep tracking with kg, reps, RIR per set
- **Timed blocks** (`kind: 'amrap' | 'emom' | 'tabata' | 'fortime'`): CrossFit-style blocks with configs and results

Types are defined in `src/types/blocks.ts` (runtime types) and `src/db/schema.ts` (persistence types with `Db` prefix).

### State Management

- **Workout state**: Singleton ref in `src/composables/useWorkout.ts` - shared across all components via `useWorkout()` composable
- **Pinia stores**: Only for exercises (`useExercisesStore`) and settings (`useSettingsStore`)
- **Persistence**: Dexie IndexedDB in `src/db/` with repositories pattern

### Workout Modes

Two modes controlled by `workout.mode`:
- `'builder'`: Add/remove/reorder blocks, configure exercises
- `'active'`: Execute workout, complete sets, run timers

### Key Composables

- `useWorkout()`: Core workout state and mutations
- `useWorkoutPersistence()`: Auto-save/restore to IndexedDB
- `useRestTimer()`: Rest timer between sets
- Timed block timers in `src/composables/timers/`:
  - `useAmrapTimer()`: AMRAP countdown with round tracking
  - `useEmomTimer()`: EMOM minute transitions and exercise rotation
  - `useTabataTimer()`: Tabata work/rest phase management
  - `useForTimeTimer()`: For Time count-up with optional time cap

### Testing

- **Unit tests**: `src/__tests__/composables/` - test composables directly
- **Integration tests**: `src/__tests__/integration/` - full user flows with `createTestApp()` helper
- **Factories**: `src/__tests__/factories/` - create test data with builder pattern
- **Setup**: `src/__tests__/setup.ts` - uses `fake-indexeddb` for DB isolation

Use `withSetup()` helper for composables needing Vue lifecycle, `createTestApp()` for full app rendering.

### UI Components

- `src/components/ui/`: shadcn-vue primitives (reka-ui based) - do not modify
- `src/components/{feature}/`: Feature components prefixed with feature name (e.g., `WorkoutSetTable.vue`)

## Code Style

### TypeScript Rules (enforced by ESLint)

- Use `type` not `interface`
- Use `Array<T>` not `T[]`
- Use `ref()` not `reactive()`
- Use `unknown` + type guards, not `any`
- Separate type imports: `import type { X } from '...'`
- No type assertions (`as`) except `as const`
- No enums - use literal unions or `as const` objects
- No `else`/`else if` - use early returns or ternary

### Vue Rules

- Component names: PascalCase, multi-word (except App, Layout, shadcn-ui components)
- Child components prefixed with parent name: `WorkoutSetTable`, `ExerciseMuscleSelector`
- Props: camelCase in script, kebab-case in template attributes
- Events: kebab-case
- Max template depth: 8

### Writing Style

Always use active voice in responses and code comments.
