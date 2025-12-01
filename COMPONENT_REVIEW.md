# Vue Component Review - Refactoring Opportunities

*Generated: 2025-12-01*

Based on analysis of the codebase components against 12 Vue design patterns.

## Patterns Followed Well

The codebase successfully implements:

1. **Data Store Pattern** - `useWorkout()` composable provides centralized state management
2. **Humble Components** - Most components focus on presentation, delegating logic to composables
3. **Controller Components** - `ActiveWorkout.vue` effectively bridges UI and business logic
4. **List Component Pattern** - `WorkoutBlockPlaylist.vue` properly extracts carousel items
5. **Preserve Object Pattern** - Timer props grouped logically in `WorkoutActiveModeFooter`
6. **Thin Composables** - Composables like `useWorkoutMode` separate concerns cleanly

---

## Issues to Address

### 1. Extract Conditional Pattern
**File:** `src/components/workout/WorkoutActiveMode.vue:172-204`
**Issue:** Multiple v-if conditions for timed block types with similar structure
**Impact:** Medium
**Suggestion:** Use Strategy Pattern with dynamic component

```vue
<!-- Current: Multiple v-if branches -->
<WorkoutAmrapView v-if="currentBlock.kind === 'amrap'" ... />
<WorkoutEmomView v-else-if="currentBlock.kind === 'emom'" ... />
<WorkoutTabataView v-else-if="currentBlock.kind === 'tabata'" ... />
<WorkoutForTimeView v-else-if="currentBlock.kind === 'fortime'" ... />

<!-- Suggested: Dynamic component -->
<script setup lang="ts">
const timedViewComponents = {
  amrap: WorkoutAmrapView,
  emom: WorkoutEmomView,
  tabata: WorkoutTabataView,
  fortime: WorkoutForTimeView,
} as const

const timedViewComponent = computed(() =>
  isTimedBlock(currentBlock.value)
    ? timedViewComponents[currentBlock.value.kind]
    : null
)
</script>

<template>
  <component
    v-if="timedViewComponent"
    :is="timedViewComponent"
    ref="timedView"
    :block="currentBlock"
    :on-complete="handleCompleteBlock"
  />
</template>
```

---

### 2. Long Component + Extract Conditional Pattern
**File:** `src/components/workout/WorkoutConfigureBlockDialog.vue`
**Issue:** Component is 475 lines with large config forms using block-kind-specific v-if branches (125 lines of conditional templates)
**Impact:** High
**Suggestion:** Split into focused components

#### Proposed Structure:

1. **WorkoutConfigureBlockDialog.vue** (orchestrator) - ~100 lines
   - Dialog shell
   - Coordinate config/exercise pickers

2. **WorkoutBlockConfigForm.vue** (extracted) - ~150 lines
   - Block-specific config forms
   - Use strategy pattern for kind-specific forms

3. **WorkoutBlockExercisePicker.vue** (extracted) - ~100 lines
   - Exercise search/selection
   - Exercise list management

#### Individual Config Components:
```
src/components/workout/config/
├── WorkoutAmrapConfig.vue
├── WorkoutEmomConfig.vue
├── WorkoutTabataConfig.vue
└── WorkoutForTimeConfig.vue
```

```vue
<!-- Parent uses dynamic component -->
<component
  :is="configComponents[blockKind]"
  v-model="configs[blockKind]"
/>
```

**Benefits:**
- Each config component <50 lines
- Easier to test individual configs
- Improved readability and maintainability
- Clear component responsibilities

---

### 3. Hidden Components Pattern
**File:** `src/components/workout/WorkoutActiveModeFooter.vue:14-20`
**Issue:** Props `isTimerRunning`, `timerDisplay`, and `timerLabel` always used together for timed blocks
**Impact:** Low
**Suggestion:** Group related timer props into single object

```vue
<!-- Current: Separate timer props -->
type Props = {
  isTimerRunning?: boolean
  timerDisplay?: string
  timerLabel?: string
  // ...
}

<!-- Suggested: Grouped timer data -->
type TimerData = {
  isRunning: boolean
  display: string
  label: string
}

type Props = {
  timer?: TimerData
  // ...
}
```

---

### 4. Extract Composable Pattern
**File:** `src/components/workout/WorkoutAddExerciseDialog.vue:26-34`
**Issue:** Exercise filtering logic mixed with component presentation
**Impact:** Low
**Suggestion:** Extract to reusable composable

```ts
// src/composables/useExerciseSearch.ts
export function useExerciseSearch() {
  const searchQuery = ref('')

  const filteredExercises = computed(() => {
    if (!searchQuery.value.trim()) {
      return popularExercises
    }
    const query = searchQuery.value.toLowerCase()
    return popularExercises.filter(ex =>
      ex.name.toLowerCase().includes(query)
    )
  })

  return { searchQuery, filteredExercises }
}
```

**Reusable in:**
- `WorkoutAddExerciseDialog`
- `WorkoutConfigureBlockDialog`
- Future exercise pickers

---

## Priority Summary

| Priority | Issue | File | Effort |
|----------|-------|------|--------|
| High | Extract long component | `WorkoutConfigureBlockDialog.vue` | Medium |
| Medium | Use dynamic components | `WorkoutActiveMode.vue` | Low |
| Low | Extract composable | `WorkoutAddExerciseDialog.vue` | Low |
| Low | Group timer props | `WorkoutActiveModeFooter.vue` | Low |

---

## Notes

The codebase demonstrates strong understanding of Vue composition patterns, proper state management, and component hierarchy. These suggestions are optimizations rather than critical issues.
