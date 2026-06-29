---
type: Reference
title: "Code Review Improvements"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/CODE_REVIEW_IMPROVEMENTS.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## Code Review Improvements

**Review Date:** 2025-12-06
**Overall Score:** A- (92/100)
**Status:** Recommendations for future improvements

This document captures findings from a comprehensive code review covering Vue components, refactoring opportunities, test quality, and architecture/TypeScript patterns.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [High Priority Improvements](#high-priority-improvements)
3. [Medium Priority Improvements](#medium-priority-improvements)
4. [Low Priority Improvements](#low-priority-improvements)
5. [Test Quality Improvements](#test-quality-improvements)
6. [Patterns to Preserve](#patterns-to-preserve)
7. [Refactoring Roadmap](#refactoring-roadmap)

---

## Executive Summary

### Scores by Category

| Category                  | Score  | Assessment      |
| ------------------------- | ------ | --------------- |
| Architecture & TypeScript | 97/100 | Exceptional     |
| Test Quality              | 92/100 | Excellent       |
| Vue Components            | 87/100 | Good            |
| Refactoring Opportunities | 75/100 | Needs attention |

### Key Findings

- **Zero critical violations** in architecture or TypeScript
- **Zero dependency rule violations** (features don't import other features)
- **98% integration tests** - perfect Testing Trophy alignment
- **Zero mocking** in test suite - maximum confidence
- Main improvement areas: code duplication and component complexity

---

## High Priority Improvements

### 1. Extract Dialog Management Composable ✅ Done

**Location:** `src/composables/useDialogState.ts` (implemented)
**Was:** `src/views/ActiveWorkout.vue` — 310-line component with 8 dialog types managed via repetitive computed properties
**Impact:** Reduces component complexity by ~100 lines

**Current Code:**

```typescript
type ActiveDialog =
  | 'addBlock'
  | 'editExercise'
  | 'finish'
  | 'cancel'
  | 'configureAmrap'
  | 'configureEmom'
  | 'configureTabata'
  | 'configureForTime'
  | null

const activeDialog = ref<ActiveDialog>(null)

const editExerciseDialogOpen = computed({
  get: () => activeDialog.value === 'editExercise',
  set: (value: boolean) => {
    activeDialog.value = value ? 'editExercise' : null
  },
})

// Repeated 7 more times for each dialog type...
```

**Recommended Refactoring:**

```typescript
// src/composables/useDialogState.ts
export function useDialogState<T extends string>() {
  const activeDialog = ref<T | null>(null)

  function createDialogModel(dialogName: T) {
    return computed({
      get: () => activeDialog.value === dialogName,
      set: (value: boolean) => {
        activeDialog.value = value ? dialogName : null
      },
    })
  }

  return {
    activeDialog,
    createDialogModel,
    open: (dialog: T) => {
      activeDialog.value = dialog
    },
    close: () => {
      activeDialog.value = null
    },
    isOpen: (dialog: T) => activeDialog.value === dialog,
  }
}

// Usage in ActiveWorkout.vue
const { createDialogModel, open, close } = useDialogState<ActiveDialog>()
const editExerciseDialogOpen = createDialogModel('editExercise')
const addBlockDialogOpen = createDialogModel('addBlock')
// ... etc
```

**Benefits:**

- Eliminates ~30 lines of repetitive code
- Reusable across other views with dialogs
- Easier to test dialog state logic in isolation

---

### 2. Add defineModel to ResumeWorkoutDialog ✅ Done

**Location:** `src/components/ResumeWorkoutDialog.vue:8`
**Was:** Used `:open` prop instead of `v-model:open`, inconsistent with codebase standards
**Impact:** Consistency with Vue 3.5 patterns used elsewhere

**Current Code:**

```vue
<script setup lang="ts">
defineProps<{
  open: boolean
  workoutName: string
  blockCount: number
}>()

const emit = defineEmits<{
  resume: []
  discard: []
}>()
</script>

<template>
  <Dialog :open="open"></Dialog>
</template>
```

**Recommended Refactoring:**

```vue
<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

const { workoutName, blockCount } = defineProps<{
  workoutName: string
  blockCount: number
}>()

const emit = defineEmits<{
  resume: []
  discard: []
}>()
</script>

<template>
  <Dialog v-model:open="open"></Dialog>
</template>
```

---

### 3. Extract Base Timer Composable ✅ Done

**Location:** `src/composables/timers/useBaseTimer.ts` (implemented)
**Was:** ~80 lines of duplicated timer state management across AMRAP, EMOM, Tabata, and ForTime timers
**Impact:** Eliminates duplication, improves testability

**Duplicated Pattern (in all 4 timer composables):**

```typescript
const status = ref<TimerStatus>('idle')
const elapsedMs = ref(0)
const startedAt = ref<number | null>(null)
const pausedDuration = ref(0)

const { pause: stopInterval, resume: startInterval } = useIntervalFn(
  () => {
    if (status.value !== 'running' || !startedAt.value) return
    const now = Date.now()
    elapsedMs.value = now - startedAt.value - pausedDuration.value
    // ... timer-specific logic
  },
  100,
  { immediate: false },
)
```

**Recommended Refactoring:**

```typescript
// src/composables/timers/useBaseTimer.ts
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'

export type BaseTimerConfig = {
  onTick?: (elapsedSeconds: number) => void
  onComplete?: () => void
  tickInterval?: number
}

export function useBaseTimer(config: BaseTimerConfig = {}) {
  const { tickInterval = 100 } = config

  const status = ref<TimerStatus>('idle')
  const elapsedMs = ref(0)
  const startedAt = ref<number | null>(null)
  const pausedDuration = ref(0)
  const pausedAt = ref<number | null>(null)

  const elapsedSeconds = computed(() => Math.floor(elapsedMs.value / 1000))

  const { pause: stopInterval, resume: startInterval } = useIntervalFn(
    () => {
      if (status.value !== 'running' || !startedAt.value) return
      const now = Date.now()
      elapsedMs.value = now - startedAt.value - pausedDuration.value
      config.onTick?.(elapsedSeconds.value)
    },
    tickInterval,
    { immediate: false },
  )

  function start() {
    if (status.value === 'running') return

    if (status.value === 'paused' && pausedAt.value) {
      pausedDuration.value += Date.now() - pausedAt.value
      pausedAt.value = null
    } else {
      startedAt.value = Date.now()
      elapsedMs.value = 0
      pausedDuration.value = 0
    }

    status.value = 'running'
    startInterval()
  }

  function pause() {
    if (status.value !== 'running') return
    status.value = 'paused'
    pausedAt.value = Date.now()
    stopInterval()
  }

  function toggle() {
    if (status.value === 'running') {
      pause()
    } else {
      start()
    }
  }

  function reset() {
    status.value = 'idle'
    elapsedMs.value = 0
    startedAt.value = null
    pausedDuration.value = 0
    pausedAt.value = null
    stopInterval()
  }

  function complete() {
    status.value = 'completed'
    stopInterval()
    config.onComplete?.()
  }

  return {
    // State
    status: readonly(status),
    elapsedMs: readonly(elapsedMs),
    elapsedSeconds,
    isRunning: computed(() => status.value === 'running'),
    isPaused: computed(() => status.value === 'paused'),
    isCompleted: computed(() => status.value === 'completed'),

    // Actions
    start,
    pause,
    toggle,
    reset,
    complete,
  }
}

// Usage in useAmrapTimer.ts
export function useAmrapTimer(config: AmrapTimerConfig = {}) {
  const block = shallowRef<AmrapBlock | null>(null)
  const rounds = ref(0)
  const currentExerciseIndex = ref(0)

  const baseTimer = useBaseTimer({
    onTick: (seconds) => {
      if (block.value && seconds >= block.value.config.durationSeconds) {
        completeAmrap()
      }
    },
  })

  function completeAmrap(): AmrapResult {
    baseTimer.complete()
    return {
      rounds: rounds.value,
      // ... AMRAP-specific result
    }
  }

  return {
    ...baseTimer,
    block,
    rounds,
    currentExerciseIndex,
    complete: completeAmrap,
  }
}
```

**Benefits:**

- Eliminates ~80 lines of duplicated code
- Single place to fix timer bugs
- Easier to test timer mechanics in isolation
- New timer types can reuse base logic

---

### 4. Replace Test Icon Class Checks with Semantic Queries

**Locations:**

- `src/__tests__/integration/workout-management.spec.ts:173-174`
- `src/__tests__/integration/workout-management.spec.ts:220-221`
- `src/__tests__/integration/workout-management.spec.ts:265`
- `src/__tests__/integration/workout-queue.spec.ts:154`

**Problem:** Tests query icon CSS classes which are implementation details

**Current Code:**

```typescript
const playIcon = startButton.querySelector('svg.lucide-play')
const rotateIcon = startButton.querySelector('svg.lucide-rotate-ccw')
expect(playIcon).toBeTruthy()
expect(rotateIcon).toBeFalsy()
```

**Recommended Refactoring:**

```typescript
// Option 1: Test button's accessible name changes
expect(getByRole('button', { name: /start workout/i })).toBeDefined()
// After state change:
expect(getByRole('button', { name: /resume workout/i })).toBeDefined()

// Option 2: Add aria-label to buttons that changes with state
// In component:
<Button :aria-label="isResuming ? 'Resume workout' : 'Start workout'">
  <PlayIcon v-if="!isResuming" />
  <RotateCcwIcon v-else />
</Button>

// In test:
expect(getByRole('button', { name: /resume workout/i })).toBeDefined()
```

**Benefits:**

- Tests remain stable when icons change
- Verifies accessibility is correct
- Follows Testing Library query priority

---

## Medium Priority Improvements

### 5. Extract completeSet into Smaller Functions

**Location:** `src/features/workout/composables/useWorkout.ts:174-205`
**Problem:** 31-line function with three responsibilities: validation, mutation, navigation
**Impact:** Improves testability and readability

**Current Code:**

```typescript
function completeSet(set: Set): CompleteSetResult {
  const blockIndex = workout.value.selectedBlockIndex

  // Guard: Toggle completed set back to active
  if (set.status === 'completed') {
    updateSetInBlock(blockIndex, set.id, (s) => ({ ...s, status: 'active' }))
    return { kind: 'uncompleted' }
  }

  // Guard: Reject invalid sets
  if (!isSetReady(set)) return { kind: 'uncompleted' }

  // Mark as completed
  updateSetInBlock(blockIndex, set.id, (s) => ({ ...s, status: 'completed' }))

  // Get current block (re-fetch after update)
  const currentBlock = workout.value.blocks[blockIndex]
  if (!currentBlock || !isStrengthBlock(currentBlock)) {
    return { kind: 'completed', nextAction: 'workout-complete' }
  }

  // Try: Activate next set in current block
  const nextSetResult = activateNextSetInBlock(blockIndex, currentBlock, set)
  if (nextSetResult) return nextSetResult

  // Try: Advance to next block
  const nextBlockResult = advanceToNextBlock(blockIndex + 1)
  if (nextBlockResult) return nextBlockResult

  // Fallback: Workout complete
  return { kind: 'completed', nextAction: 'workout-complete' }
}
```

**Recommended Refactoring:**

```typescript
function completeSet(set: Set): CompleteSetResult {
  const blockIndex = workout.value.selectedBlockIndex

  const toggleResult = handleSetToggle(blockIndex, set)
  if (toggleResult) return toggleResult

  if (!isSetReady(set)) return { kind: 'uncompleted' }

  markSetCompleted(blockIndex, set.id)

  return determineNextAction(blockIndex, set)
}

function handleSetToggle(blockIndex: number, set: Set): CompleteSetResult | null {
  if (set.status !== 'completed') return null

  updateSetInBlock(blockIndex, set.id, (s) => ({ ...s, status: 'active' }))
  return { kind: 'uncompleted' }
}

function markSetCompleted(blockIndex: number, setId: number): void {
  updateSetInBlock(blockIndex, setId, (s) => ({ ...s, status: 'completed' }))
}

function determineNextAction(blockIndex: number, completedSet: Set): CompleteSetResult {
  const currentBlock = workout.value.blocks[blockIndex]

  if (!currentBlock || !isStrengthBlock(currentBlock)) {
    return { kind: 'completed', nextAction: 'workout-complete' }
  }

  return (
    activateNextSetInBlock(blockIndex, currentBlock, completedSet) ??
    advanceToNextBlock(blockIndex + 1) ?? { kind: 'completed', nextAction: 'workout-complete' }
  )
}
```

---

### 6. Implement Block Converter Strategy Pattern

**Location:** `src/db/converters.ts:289-320`
**Problem:** Repeated switch statements on `block.kind` in multiple locations
**Impact:** Adding new block types requires changes in 5+ locations

**Current Pattern (repeated in converters.ts, templates.ts):**

```typescript
function blockToDb(block: Readonly<WorkoutBlock>, orderIndex: number): DbWorkoutBlock {
  switch (block.kind) {
    case 'strength':
      return strengthBlockToDb(block, orderIndex)
    case 'amrap':
      return amrapBlockToDb(block, orderIndex)
    case 'emom':
      return emomBlockToDb(block, orderIndex)
    case 'tabata':
      return tabataBlockToDb(block, orderIndex)
    case 'fortime':
      return forTimeBlockToDb(block, orderIndex)
  }
}
```

**Recommended Refactoring:**

```typescript
// src/db/converters/blockConverterRegistry.ts
type BlockConverter<T extends WorkoutBlock, D extends DbWorkoutBlock> = {
  toDb: (block: Readonly<T>, orderIndex: number) => D
  fromDb: (dbBlock: Readonly<D>, index: number) => T
  toTemplate: (block: Readonly<T>) => DbTemplateBlock
}

const BLOCK_CONVERTERS: {
  [K in BlockKind]: BlockConverter<
    Extract<WorkoutBlock, { kind: K }>,
    Extract<DbWorkoutBlock, { kind: K }>
  >
} = {
  strength: {
    toDb: strengthBlockToDb,
    fromDb: dbToStrengthBlock,
    toTemplate: strengthBlockToTemplate,
  },
  amrap: {
    toDb: amrapBlockToDb,
    fromDb: dbToAmrapBlock,
    toTemplate: amrapBlockToTemplate,
  },
  // ... other block types
}

// Usage - single dispatch point
export function blockToDb(block: Readonly<WorkoutBlock>, orderIndex: number): DbWorkoutBlock {
  return BLOCK_CONVERTERS[block.kind].toDb(block as never, orderIndex)
}

export function dbToBlock(dbBlock: Readonly<DbWorkoutBlock>, index: number): WorkoutBlock {
  return BLOCK_CONVERTERS[dbBlock.kind].fromDb(dbBlock as never, index)
}
```

**Benefits:**

- Adding new block type = add one entry to registry
- No modification of existing switch statements
- Type-safe dispatch

---

### 7. Replace CSS Class Queries in Exercise List Tests

**Location:** `src/__tests__/integration/timed-block-exercise-list.spec.ts:80`
**Problem:** Queries elements by CSS class which is an implementation detail

**Current Code:**

```typescript
function getExerciseRows(dialog: HTMLElement): Array<Element> {
  return Array.from(dialog.querySelectorAll('[class*="bg-secondary"]'))
}
```

**Recommended Refactoring:**

**Option A: Add semantic list structure to component:**

```vue
<!-- In ExerciseList component -->
<ul role="list" aria-label="Selected exercises">
  <li v-for="exercise in exercises" :key="exercise.id" role="listitem">
    {{ exercise.name }}
  </li>
</ul>
```

```typescript
// In test
function getExerciseRows(dialog: HTMLElement): Array<Element> {
  const list = within(dialog).getByRole('list', { name: /selected exercises/i })
  return within(list).getAllByRole('listitem')
}
```

**Option B: Use data-testid as last resort:**

```vue
<div v-for="exercise in exercises" :key="exercise.id" data-testid="exercise-row">
```

```typescript
function getExerciseRows(dialog: HTMLElement): Array<Element> {
  return Array.from(dialog.querySelectorAll('[data-testid="exercise-row"]'))
}
```

**Option A is preferred** - follows Testing Library query priority.

---

### 8. Simplify Settings View Type Handlers

**Location:** `src/views/TheSettingsView.vue:114-124`
**Problem:** Complex type coercion handlers inline

**Current Code:**

```typescript
function handleWeightUnitChange(value: AcceptableValue | ReadonlyArray<AcceptableValue>) {
  if (value === 'kg' || value === 'lbs') {
    settingsStore.weightUnit = value
  }
}

function handleLanguageChange(value: AcceptableValue) {
  if (value === 'en' || value === 'de') {
    settingsStore.setLanguage(value)
  }
}
```

**Recommended Refactoring:**

```typescript
// Use computed with getter/setter for cleaner two-way binding
const weightUnit = computed({
  get: () => settingsStore.weightUnit,
  set: (value: string) => {
    if (value === 'kg' || value === 'lbs') {
      settingsStore.weightUnit = value
    }
  },
})

const language = computed({
  get: () => settingsStore.language,
  set: (value: string) => {
    if (value === 'en' || value === 'de') {
      settingsStore.setLanguage(value)
    }
  },
})
```

---

### 9. Add Keyboard Navigation Tests

**Problem:** Tests use click/type but don't verify keyboard navigation
**Impact:** Ensures WAI-ARIA compliance

**Recommended Addition:**

```typescript
// src/__tests__/integration/accessibility.spec.ts
describe('Keyboard Navigation', () => {
  it('navigates dialogs with Tab, Enter, and Escape', async () => {
    const { user, getByRole } = await createTestApp({ initialRoute: '/workout' })

    // Open dialog
    await user.click(getByRole('button', { name: /add block/i }))

    // Tab through options
    await user.keyboard('{Tab}')
    expect(document.activeElement).toHaveAttribute('role', 'button')

    // Select with Enter
    await user.keyboard('{Enter}')

    // Close with Escape
    await user.keyboard('{Escape}')
    expect(queryByRole('dialog')).toBeFalsy()
  })

  it('supports keyboard shortcuts for common actions', async () => {
    // ... test keyboard shortcuts
  })
})
```

---

## Low Priority Improvements

### 10. Replace Primitive Block IDs with Branded Type

**Location:** Multiple files
**Problem:** Block IDs are `number` in-memory but `string` in database, causing conversion overhead

**Current Pattern:**

```typescript
// types/blocks.ts
export type StrengthBlock = {
  kind: 'strength'
  id: number // In-memory
}

// db/schema.ts
export type DbStrengthBlock = {
  kind: 'strength'
  id: string // Database
}

// Constant conversion in converters
id: String(block.id)
id: Number(dbBlock.id)
```

**Recommended Refactoring:**

```typescript
// src/types/brandedTypes.ts
export type BlockId = string & { readonly __brand: unique symbol }

export function createBlockId(): BlockId {
  return crypto.randomUUID() as BlockId
}

export function blockIdFromString(value: string): BlockId {
  return value as BlockId
}

// Usage - same type everywhere, no conversion needed
export type StrengthBlock = {
  kind: 'strength'
  id: BlockId
}

export type DbStrengthBlock = {
  kind: 'strength'
  id: BlockId // Same type!
}
```

**Benefits:**

- Eliminates 20+ type conversions
- Prevents ID collision bugs
- UUID format is more robust than incrementing numbers

---

### 11. Add Readonly to Const Lookup Objects

**Location:** `src/types/blocks.ts:171, 179`

**Current Code:**

```typescript
export const BLOCK_LABELS: Record<BlockKind, string> = {
  strength: 'Strength',
  amrap: 'AMRAP',
  // ...
}

export const BLOCK_ICONS: Record<BlockKind, Component> = {
  // ...
}
```

**Recommended Refactoring:**

```typescript
export const BLOCK_LABELS: Readonly<Record<BlockKind, string>> = {
  strength: 'Strength',
  amrap: 'AMRAP',
  // ...
} as const

export const BLOCK_ICONS: Readonly<Record<BlockKind, Component>> = {
  // ...
} as const
```

---

### 12. Remove Speculative exerciseDefinitionId from Templates

**Location:** `src/db/implementations/dexie/templates.ts`
**Problem:** `exerciseDefinitionId: null` is always null and never used

**Current Code:**

```typescript
exercises: block.exercises.map((ex) => ({
  exerciseDefinitionId: null, // Always null - unused
  name: ex.name,
  prescribedReps: ex.prescribedReps,
  load: ex.load,
  thumbnail: ex.thumbnail,
}))
```

**Recommended:** Remove the field from schema if not planned for near-term use.

---

### 13. Centralize Timer Configuration Constants

**Locations:**

- `src/composables/timers/useRestTimer.ts:6` - `MAX_REST_TIME_SECONDS = 300`
- `src/features/workout/composables/useWorkoutPersistence.ts:10` - `AUTO_SAVE_DEBOUNCE_MS = 1000`
- Timer tick intervals (100ms) hardcoded in multiple files

**Recommended Refactoring:**

```typescript
// src/config/timers.ts
export const TIMER_CONFIG = {
  /** Maximum rest timer duration */
  REST_TIMER_MAX_SECONDS: 5 * 60,

  /** Debounce delay for auto-saving workout state */
  AUTO_SAVE_DEBOUNCE_MS: 1000,

  /**
   * Timer tick interval - balance between UI smoothness and performance.
   * 100ms provides smooth countdown display without excessive updates.
   */
  TIMER_TICK_INTERVAL_MS: 100,
} as const
```

---

## Test Quality Improvements

### Current State: Excellent (92/100)

The test suite follows Kent C. Dodds' testing philosophy exceptionally well:

- 98% integration tests
- Zero mocking
- Real database integration
- Complete user flow testing

### Specific Improvements

| Issue                  | Location                             | Recommendation                |
| ---------------------- | ------------------------------------ | ----------------------------- |
| Icon class checks      | `workout-management.spec.ts`         | Use semantic button names     |
| CSS class queries      | `timed-block-exercise-list.spec.ts`  | Add list semantics            |
| DOM traversal          | `workout-management.spec.ts:204`     | Add aria-label to back button |
| Missing keyboard tests | N/A                                  | Add accessibility test file   |
| Long helper functions  | `timed-block-workflows.spec.ts:7-45` | Move to Page Objects          |

---

## Patterns to Preserve

These patterns demonstrate excellent engineering and should be maintained:

### 1. Discriminated Unions with Exhaustive Checks

```typescript
switch (block.kind) {
  case 'strength': // ...
  case 'amrap': // ...
  default: {
    const exhaustiveCheck: never = block
    throw new Error(`Unknown block kind: ${JSON.stringify(exhaustiveCheck)}`)
  }
}
```

### 2. Readonly Parameters in Converters

```typescript
function setToDb(set: Readonly<Set>): DbSet
function blockToDb(block: Readonly<WorkoutBlock>, orderIndex: number): DbWorkoutBlock
```

### 3. Error-First Tuples via tryCatch

```typescript
const [error, data] = await tryCatch(repository.get())
if (error) {
  // Handle error
  return
}
// Use data safely
```

### 4. Disposal Tracking in Composables

```typescript
let isDisposed = false
onScopeDispose(() => {
  isDisposed = true
})

watchDebounced(state, async () => {
  if (isDisposed) return // Prevents stale writes
  // ...
})
```

### 5. Getter-Based i18n Labels

```typescript
export const EQUIPMENT_LABELS: Readonly<Record<Equipment, string>> = {
  get barbell() {
    return i18n.global.t('exercises.equipment.barbell')
  },
}
```

### 6. Vue 3.5 APIs

- `defineModel` for two-way binding
- `useTemplateRef` for template refs
- Reactive props destructuring with defaults

---

## Refactoring Roadmap

### Phase 1: Quick Wins (1-2 days)

1. [x] Add `defineModel` to `ResumeWorkoutDialog.vue` ✅ Done
2. [ ] Add `Readonly<>` to const lookup objects
3. [ ] Replace icon class checks in tests with semantic queries

### Phase 2: Composable Extraction (3-5 days)

4. [x] Extract `useDialogState` composable ✅ Done (`src/composables/useDialogState.ts`)
5. [x] Extract `useBaseTimer` composable ✅ Done (`src/composables/timers/useBaseTimer.ts`)
6. [ ] Refactor `completeSet` into smaller functions

### Phase 3: Architecture Improvements (1 week)

7. [ ] Implement Block Converter Strategy pattern
8. [ ] Replace primitive Block IDs with branded type
9. [ ] Add keyboard navigation tests
10. [ ] Centralize timer configuration

### Phase 4: Polish (ongoing)

11. [ ] Add semantic structure to exercise lists
12. [ ] Move test helpers to Page Objects
13. [ ] Remove unused `exerciseDefinitionId` from templates
14. [ ] Standardize error handling approach

---

## Metrics to Track

After implementing improvements:

| Metric                       | Current | Target |
| ---------------------------- | ------- | ------ |
| Lines in ActiveWorkout.vue   | 310     | <150   |
| Timer composable duplication | ~80 LOC | 0 (useBaseTimer ✅) |
| `@ts-expect-error` comments  | 0       | 0 ✅   |
| Test icon/class queries      | 5       | 0      |
| Block type switch statements | 3       | 1      |

---

## Conclusion

This codebase is already production-grade with exceptional architecture. The improvements listed here are optimizations that will:

1. **Reduce maintenance burden** through less duplication
2. **Improve testability** through smaller, focused functions
3. **Enhance extensibility** through Strategy patterns
4. **Increase confidence** through better test queries

None of these are critical fixes - the application works well as-is. Prioritize based on pain points encountered during development.
