---
type: Reference
title: "Vue Design Patterns for Component Refactoring"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/REFACTORING_PATTERNS.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## Vue Design Patterns for Component Refactoring

This guide explains the design patterns used by the `/refactor-component` slash command to improve Vue components.

## 1. Long Components Pattern

**Problem:** Components exceeding 300 lines become hard to understand and maintain.

**Solution:** Break into smaller, self-documenting components with clear names.

**When to apply:**

- Component is > 300 lines
- Multiple distinct UI sections
- Different concerns mixed together

**Example:**

```typescript
// Before: One monolithic component (520 lines)
// src/views/ActiveWorkout.vue

// After: Refactored structure
// src/views/ActiveWorkout.vue (62 lines - controller)
// src/components/workout/WorkoutHeader.vue
// src/components/workout/ExerciseCarousel.vue
// src/components/workout/SetTable.vue
// src/components/workout/RestTimerWidget.vue
// ... etc
```

**Metrics:**

- Original: 520 lines → Refactored: 62 lines (-88%)
- Easier to understand at a glance
- Each component focuses on one section

---

## 2. Data Store Pattern (State Management)

**Problem:** State management scattered throughout component makes it hard to understand data flow.

**Solution:** Extract state into a reusable composable with accessor methods.

**When to apply:**

- Component has multiple `ref()` or complex state
- State needs to be shared or accessed from multiple places
- State changes through multiple functions

**Example:**

```typescript
// Before: State in component
const workout = ref<Workout>({ exercises: [] })
const selectedExerciseId = ref(1)

function selectExercise(id) {
  selectedExerciseId.value = id
}
function addExercise(name) {
  // implementation
}

// After: State in composable
export function useWorkout() {
  const workout = ref<Workout>({ exercises: [] })

  function selectExercise(id) {
    workout.value.selectedExerciseId = id
  }
  function addExercise(name) {
    // implementation
  }

  return { workout, selectExercise, addExercise }
}

// In component:
const { workout, selectExercise, addExercise } = useWorkout()
```

**Benefits:**

- State logic isolated and testable
- Can be used in multiple components
- Clear interface for state mutations
- Easier to understand data flow

---

## 3. Thin Composables Pattern

**Problem:** Business logic mixed with Vue reactivity makes code harder to test.

**Solution:** Separate pure business logic into functions, wrap in reactive layer.

**When to apply:**

- Complex calculations or transformations
- Formatting functions
- Validation or processing logic
- Utilities that don't depend on Vue reactivity

**Example:**

```typescript
// Before: Logic in component
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  return `${mins}:${seconds.toString().padStart(2, '0')}`
}

function calculate10RM(kg, reps) {
  return Math.round(kg * (1 + reps / 30) * 10) / 10
}

// After: Pure functions separated
// src/lib/workout-utils.ts
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  return `${mins}:${seconds.toString().padStart(2, '0')}`
}

export function calculate10RM(kg: number, reps: number): number {
  if (kg === 0 || reps === 0) return 0
  return Math.round(kg * (1 + reps / 30) * 10) / 10
}

// Thin composable layer
export function useRestTimer() {
  const restTime = ref(0)

  function getFormattedTime() {
    return formatTime(restTime.value)
  }

  return { restTime, getFormattedTime }
}
```

**Benefits:**

- Pure functions easier to test
- Business logic reusable without Vue
- Clear separation of concerns
- Better performance (pure functions are inlineable)

---

## 4. Extract Conditional Pattern

**Problem:** Complex template conditionals make templates hard to read.

**Solution:** Extract each conditional branch into its own component.

**When to apply:**

- Multiple `v-if`/`v-else` branches with significant content
- Different UI structures for different states
- Complex conditional logic

**Example:**

```vue
<!-- Before: Inline conditionals -->
<template>
  <div v-if="loading" class="spinner">...</div>
  <div v-else-if="error" class="error">
    <!-- Many lines of error UI -->
  </div>
  <div v-else class="content">
    <!-- Many lines of content UI -->
  </div>
</template>

<!-- After: Extracted components -->
<template>
  <LoadingSpinner v-if="loading" />
  <ErrorDisplay v-else-if="error" :error="error" />
  <ContentDisplay v-else :data="data" />
</template>
```

**Benefits:**

- Templates are more readable
- Each state has dedicated component
- Easier to test each state separately
- State-specific logic stays together

---

## 5. List Component Pattern

**Problem:** Complex v-for loops with lots of content make templates bloated.

**Solution:** Extract loop iteration logic into a dedicated child component.

**When to apply:**

- `v-for` loop with complex content per item
- Item has multiple interactive elements
- Item logic is distinct from parent

**Example:**

```vue
<!-- Before: Complex v-for -->
<script setup>
const props = defineProps<{ sets: Set[] }>()
defineEmits<{ 'toggle-complete': [set: Set] }>()
</script>

<!-- After: Extracted component -->
<template>
  <div v-for="set in sets" :key="set.id">
    <Input v-model="set.kg" />
    <Input v-model="set.reps" />
    <Button @click="toggleSetComplete(set)" />
    <!-- More complex logic -->
  </div>
</template>

<!-- SetTable.vue -->
<template>
  <SetTable :sets="sets" @toggle-complete="toggleSetComplete" />
</template>

<template>
  <div v-for="set in sets" :key="set.id">
    <Input v-model="set.kg" />
    <Input v-model="set.reps" />
    <Button @click="$emit('toggle-complete', set)" />
  </div>
</template>
```

**Benefits:**

- Parent template stays clean
- Iteration logic encapsulated
- Items become testable
- Easier to reorder or customize items

---

## 6. Controller Component Pattern

**Problem:** Components mix UI concerns with orchestration logic.

**Solution:** Have main component act as orchestrator, delegate UI to child components.

**When to apply:**

- Component composes multiple child components
- Multiple features that should be independent
- Top-level views that coordinate sub-features

**Structure:**

```vue
<script setup>
import FeatureFooter from '@/components/feature/Footer.vue'
// Import composables for state/logic
// Import child components for UI
import FeatureHeader from '@/components/feature/Header.vue'
import FeatureList from '@/components/feature/List.vue'

const { data, selectItem, removeItem } = useFeatureStore()

// Minimal state for UI control
const isDialogOpen = ref(false)
</script>

<template>
  <div>
    <!-- Compose child components -->
    <FeatureHeader :title="data.title" @action="handleAction" />
    <FeatureList :items="data.items" @select="selectItem" />
    <FeatureFooter :count="data.items.length" />
  </div>
</template>
```

**Characteristics:**

- Minimal template (mostly just component composition)
- Uses composables for real state/logic
- Delegates UI to humble child components
- Acts as orchestrator/coordinator

**Benefits:**

- Clear separation of concerns
- Easy to understand component structure
- Components are highly reusable
- Testing each part becomes simpler

---

## 7. Humble Components Pattern (Props Down, Events Up)

**Problem:** Child components tightly coupled to parent, hard to reuse.

**Solution:** Components accept props for data, emit events for actions. No side effects.

**When to apply:**

- Any reusable UI component
- Child components
- Presentational components

**Rules:**

1. **Props Down** - Components receive all data via props
2. **Events Up** - Components emit events for user actions
3. **No Side Effects** - Components don't reach up to modify parent state
4. **Pure Rendering** - Components render based solely on props

**Example:**

```typescript
// src/components/workout/SetTable.vue
interface Props {
  sets: Set[]
  loading?: boolean
}

// defineProps<Props>()
// defineEmits<{
//   'toggleComplete': [set: Set]
//   'updateReps': [set: Set, reps: number]
// }>()

// Template:
// <div v-for="set in sets" :key="set.id">
//   <!-- Props used for rendering -->
//   <span>Set {{ set.id }}</span>
//   <Input :model-value="set.reps" />
//   <!-- Events emitted for actions -->
//   <Button @click="$emit('toggleComplete', set)" />
// </div>
```

**Benefits:**

- Components are reusable
- No hidden dependencies
- Easy to test (just test inputs/outputs)
- Clear data flow
- Composable with different parents

---

## Pattern Application Checklist

When refactoring a component, check for:

- [ ] **Lines > 300?** → Apply Long Components pattern
- [ ] **Multiple refs/state?** → Apply Data Store pattern
- [ ] **Complex functions?** → Apply Thin Composables pattern
- [ ] **Multiple v-if branches?** → Apply Extract Conditional pattern
- [ ] **Complex v-for content?** → Apply List Component pattern
- [ ] **Orchestrates multiple features?** → Apply Controller Component pattern
- [ ] **Child component?** → Apply Humble Components pattern

---

## Before & After Example

### Before: Monolithic Component

```
src/views/ActiveWorkout.vue (520 lines)
├── State: workout, restTime, showAddExercise, ...
├── Functions: calculate10RM, formatTime, toggleTimer, ...
├── Template: Header, Carousel, Table, History, Timer
└── All mixed together
```

### After: Refactored Structure

```
src/
├── lib/
│   └── workout-utils.ts (pure functions)
├── composables/
│   ├── useWorkout.ts (state & logic)
│   └── useRestTimer.ts (timer logic)
├── components/workout/
│   ├── WorkoutHeader.vue (header UI)
│   ├── ExerciseCarousel.vue (carousel UI)
│   ├── SetTable.vue (table UI)
│   ├── PreviousHistory.vue (history UI)
│   ├── RestTimerWidget.vue (timer UI)
│   └── WorkoutAddExerciseDialog.vue (dialog UI)
└── views/
    └── ActiveWorkout.vue (62 lines - orchestrator)
```

**Results:**

- 88% reduction in main component
- 8 new focused, reusable modules
- Clear separation of concerns
- Each piece independently testable
- Much easier to extend with new features
