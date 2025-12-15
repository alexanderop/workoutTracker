# Features Guide

AI agent guidance for feature modules in this Vue 3 PWA.

## Overview

**Self-contained domain modules** following Bulletproof architecture. Each feature owns its UI components, composables, and business logic.

## Feature Modules

| Feature | Purpose | Entry Point |
|---------|---------|-------------|
| `workout/` | Active workout state & execution | `composables/useWorkout.ts` |
| `exercises/` | Exercise library CRUD | `composables/useExerciseForm.ts` |
| `templates/` | Workout template management | `composables/useTemplateForm.ts` |
| `benchmarks/` | Benchmark workout tracking | `composables/useBenchmark.ts` |
| `settings/` | App settings & preferences | `composables/useLanguageSettings.ts` |
| `timers/` | Standalone timer UI | `components/TimerCard.vue` |
| `log-past-workout/` | Retroactive workout entry | `composables/usePastWorkout.ts` |

## Feature Structure

```
src/features/workout/
├── components/      # Feature-specific Vue components
├── composables/     # Feature-specific composables
├── lib/             # Feature utilities
└── state/           # Singleton state (if needed)
```

## Singleton State Pattern

The `useWorkout()` composable provides a **singleton ref** shared across all components:

```ts
// src/features/workout/composables/useWorkout.ts
import { getWorkoutRef } from '@/stores/workoutState'

const workout = getWorkoutRef() // Shared singleton ref

export function useWorkout() {
  return {
    workout,           // Ref<Workout> - shared across all components
    selectBlock,
    removeBlock,
    // ...
  }
}
```

**Why**: All components see the same workout state, no prop drilling needed.

## Block-Based Workout Model

Workouts are sequences of **blocks** using discriminated unions via `kind`:

```ts
type WorkoutBlock = StrengthBlock | TimedBlock | CardioBlock

type TimedBlock = AmrapBlock | EmomBlock | TabataBlock | ForTimeBlock

// Strength block
type StrengthBlock = {
  kind: 'strength'
  id: number
  exerciseName: string
  sets: Array<Set>
}

// Timed blocks
type AmrapBlock = {
  kind: 'amrap'
  id: number
  config: AmrapConfig
  exercises: Array<BlockExercise>
  result?: AmrapResult
}
```

**Files**: `src/types/blocks.ts` (runtime), `src/db/schema.ts` (persistence with `Db` prefix)

## Key Composables

**Workout Feature:**
- `useWorkout.ts` - Singleton state, block/set operations
- `useWorkoutPersistence.ts` - Auto-save, complete, discard

**Benchmark Feature:**
- `useBenchmark.ts` - Core benchmark state
- `useBenchmarkPersistence.ts` - Save attempts

## Gotchas

### 1. Wrap Destructured Props in Getters for Watchers

```ts
// ❌ BAD - breaks reactivity
const { count } = defineProps<{ count: number }>()
watch(count, ...)

// ✅ GOOD - wrap in getter
watch(() => count, ...)
```

### 2. shadcn-vue Uses reka-ui (Not Radix)

```vue
<!-- ❌ BAD - v-model:checked doesn't exist -->
<Switch v-model:checked="enabled" />

<!-- ✅ GOOD - use v-model -->
<Switch v-model="enabled" />
```

Check [reka-ui docs](https://reka-ui.com) for correct API.

## Quick Find

```bash
rg -n "export function use" src/features/workout/composables  # Feature composables
find src/features/workout/components -name "*.vue"            # Feature components
rg -n "kind: '(strength|amrap|emom|tabata|fortime)'" src/     # Block types
```
