# Features Guide

AI agent guidance for feature modules in this Vue 3 PWA.

## What Are Features?

**Self-contained domain modules** following Bulletproof architecture. Each feature owns its UI components, composables, and business logic.

**Tech**: Vue 3.5+ components with `<script setup>`, TypeScript, feature-scoped composables

**Dependency rule**: Features can only import from `src/shared` (composables, components, stores, db, types, lib). Features **cannot** import other features (ESLint-enforced).

## Feature Modules

| Feature | Purpose | Key Files |
|---------|---------|-----------|
| `workout/` | Active workout state & execution | `composables/useWorkout.ts` (singleton state) |
| `exercises/` | Exercise library CRUD | `composables/useExerciseForm.ts` |
| `templates/` | Workout template management | `composables/useTemplateForm.ts` |
| `benchmarks/` | Benchmark workout tracking & execution | `composables/useBenchmark.ts`, `useBenchmarkForm.ts` |
| `settings/` | App settings & preferences | `composables/useLanguageSettings.ts` |
| `timers/` | Standalone timer UI components | `components/TimerCard.vue` |

## Patterns & Conventions

### ✅ DO: Follow Bulletproof Feature Structure

```
src/features/workout/
├── components/          # Feature-specific Vue components
│   ├── WorkoutActiveMode.vue
│   └── WorkoutHeader.vue
├── composables/         # Feature-specific composables
│   ├── useWorkout.ts
│   └── useWorkoutPersistence.ts
├── lib/                 # Feature utilities
│   └── workoutUtils.ts
└── state/               # Singleton state (if needed)
    └── workoutState.ts
```

**Example**: `src/features/workout/` for workout execution logic

### ✅ DO: Use Singleton State Pattern for Shared State

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

### ✅ DO: Import from Shared Directories Only

```ts
// ✅ GOOD - Import from shared
import { useRestTimer } from '@/composables/timers/useRestTimer'
import { getWorkoutsRepository } from '@/db'
import { useExercisesStore } from '@/stores/exercises'
import type { Workout } from '@/types/workout'

// ❌ BAD - Cross-feature import (ESLint will error)
import { useTemplateForm } from '@/features/templates/composables/useTemplateForm'
```

### ✅ DO: Use Vue 3.5+ APIs

**Reactive props destructuring:**
```vue
<script setup lang="ts">
// ✅ Destructure with defaults
const { isActive = false, count = 0 } = defineProps<{
  isActive?: boolean
  count?: number
}>()

// ⚠️ For watchers, wrap in getter
watch(() => count, (newCount) => {
  console.log('Count changed:', newCount)
})
</script>
```

**Two-way binding with `defineModel`:**
```vue
<script setup lang="ts">
// ✅ Use defineModel for v-model
const open = defineModel<boolean>('open', { required: true })

function closeDialog() {
  open.value = false // Updates parent
}
</script>
```

**Template refs:**
```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'

const inputRef = useTemplateRef('input')

onMounted(() => {
  inputRef.value?.focus()
})
</script>

<template>
  <input ref="input" />
</template>
```

### ✅ DO: Use Block-Based Workout Model

Workouts are sequences of **blocks** using discriminated unions via `kind`:

```ts
type WorkoutBlock = StrengthBlock | TimedBlock

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

**Files**: `src/types/blocks.ts` (runtime types), `src/db/schema.ts` (persistence with `Db` prefix)

### ✅ DO: Use `tryCatch()` for Error Handling

```ts
import { tryCatch } from '@/lib/tryCatch'

// ✅ GOOD
const [error, workout] = await tryCatch(workoutRepository.getById(id))
if (error) {
  console.error('Failed to load workout:', error)
  return
}
// Use workout safely

// ❌ BAD - ESLint will error
try {
  const workout = await workoutRepository.getById(id)
} catch (error) {
  console.error(error)
}
```

### ❌ DON'T: Import Across Features

```ts
// ❌ BAD - workout feature importing from templates feature
import { useTemplateForm } from '@/features/templates/composables/useTemplateForm'

// ✅ GOOD - both features import from shared
import { getWorkoutsRepository } from '@/db'
```

### ❌ DON'T: Modify shadcn-vue Components

```ts
// ❌ BAD - Never edit these files
src/components/ui/button/Button.vue
src/components/ui/dialog/Dialog.vue

// ✅ GOOD - Create feature-specific wrapper if needed
src/features/workout/components/WorkoutButton.vue
```

## Touch Points / Key Files

### Core Workout State
- **Singleton state**: `src/features/workout/composables/useWorkout.ts`
  - Shared `workout` ref across all components
  - Block operations: `selectBlock`, `removeBlock`, `reorderBlocks`
  - Set operations: `completeSet`, `addSet`, `removeSet`
- **Workout mode**: `src/features/workout/composables/useWorkoutMode.ts`
- **Duration timer**: `src/features/workout/composables/useWorkoutDurationTimer.ts`
- **Timed block exercises**: `src/features/workout/composables/useTimedBlockExercises.ts`
- **Summary stats**: `src/features/workout/composables/useSummaryStats.ts`
- **Workout detail**: `src/features/workout/composables/useWorkoutDetail.ts`

### Persistence
- **Auto-save**: `src/features/workout/composables/useWorkoutPersistence.ts`
  - `loadActiveWorkout()` - Load from IndexedDB
  - `completeWorkout()` - Save to history
  - `discardActiveWorkout()` - Delete without saving

### Benchmark Feature
- **Core state**: `src/features/benchmarks/composables/useBenchmark.ts`
- **Form management**: `src/features/benchmarks/composables/useBenchmarkForm.ts`
- **Persistence**: `src/features/benchmarks/composables/useBenchmarkPersistence.ts`
- **Mode switching**: `src/features/benchmarks/composables/useBenchmarkMode.ts`
- **Detail view**: `src/features/benchmarks/composables/useBenchmarkDetail.ts`
- **Exercise navigation**: `src/features/benchmarks/composables/useBenchmarkExerciseNavigation.ts`
- **Personal best display**: `src/features/benchmarks/composables/usePersonalBestDisplay.ts`
- **Attempt history**: `src/features/benchmarks/composables/useBenchmarkAttemptHistory.ts`
- **Split comparison**: `src/features/benchmarks/composables/useBenchmarkSplitComparison.ts`

### Exercise Library
- **Exercise store**: `src/stores/exercises.ts` (Pinia store)
- **CRUD composable**: `src/features/exercises/composables/useExerciseForm.ts`

### Settings
- **Settings store**: `src/stores/settings.ts` (Pinia store)
- **Language**: `src/features/settings/composables/useLanguageSettings.ts`

### Block Types
- **Runtime types**: `src/types/blocks.ts`
- **Database types**: `src/db/schema.ts` (with `Db` prefix)
- **Type guards**: `isStrengthBlock()`, `isTimedBlock()`, `getBlockExerciseList()`

## JIT Index Hints

```bash
# Find a feature composable
rg -n "export function use" src/features/workout/composables

# Find feature components
find src/features/workout/components -name "*.vue"

# Find block type usages
rg -n "kind: '(strength|amrap|emom|tabata|fortime)'" src/features

# Find singleton state files
rg -n "getWorkoutRef|getSingletonRef" src/features

# Find feature imports (should only be from @/)
rg -n "from '@/(composables|stores|db|types|lib)" src/features/workout

# Check for illegal cross-feature imports (should be empty)
rg -n "from '@/features/" src/features/workout

# List all benchmark composables
ls src/features/benchmarks/composables

# List all benchmark components
ls src/features/benchmarks/components

# Find benchmark state management
rg -n "useBenchmark" src/features/benchmarks
```

## Common Gotchas

### 1. Wrap Destructured Props in Getters for Watchers

```ts
// ❌ BAD - watches the destructured value, not reactive
const { count } = defineProps<{ count: number }>()
watch(count, ...) // Breaks reactivity!

// ✅ GOOD - wrap in getter
const { count } = defineProps<{ count: number }>()
watch(() => count, ...) // Maintains reactivity
```

### 2. shadcn-vue Uses reka-ui (Not Radix)

```vue
<!-- ❌ BAD - v-model:checked doesn't exist in reka-ui -->
<Switch v-model:checked="enabled" />

<!-- ✅ GOOD - use v-model -->
<Switch v-model="enabled" />
```

Check [reka-ui docs](https://reka-ui.com) for correct API.

### 3. Named Routes Required

```ts
import { RouteNames } from '@/router'

// ✅ GOOD
router.push({ name: RouteNames.WorkoutDetail, params: { id } })

// ❌ BAD - ESLint will error
router.push('/workout/' + id)
```

### 4. Feature Isolation Is Enforced

If you see this ESLint error:
```
Import from "@/features/..." is not allowed from features (import-x/no-restricted-paths)
```

**Fix**: Move shared code to `src/composables/`, `src/lib/`, or `src/types/`.

## Pre-PR Checks

Run before creating a PR:

```bash
# Type-check, lint, and test
pnpm type-check && pnpm lint && pnpm test

# Check for unused exports
pnpm knip
```

**Feature-specific checks:**
```bash
# Test only workout feature
pnpm test src/features/workout

# Check composable usage
pnpm check:composables
```
