# Refactoring Guide: Benchmark Split Tracking Feature

**Generated:** 2025-12-09
**Updated:** 2025-12-09 (Validated and revised)
**Review Scope:** Uncommitted changes for split-time tracking and first-attempt detection

---

## Table of Contents

1. [Critical Issues](#critical-issues)
2. [High Priority Refactoring](#high-priority-refactoring)
3. [Medium Priority Improvements](#medium-priority-improvements)
4. [Low Priority Enhancements](#low-priority-enhancements)
5. [Progress Tracking](#progress-tracking)

---

## Critical Issues

### 1. Fix Type Assertion in WorkoutActiveMode

**File:** `src/features/workout/components/WorkoutActiveMode.vue:159`
**Severity:** HIGH
**Effort:** 20 minutes

**Current code:**
```typescript
// @ts-expect-error - template ref returns unknown but runtime type is TimedBlockResult
const result: TimedBlockResult | undefined = timedViewRef.value?.complete()
```

**Recommended Solution: Use Zod for Runtime Validation**

Zod provides both runtime validation AND TypeScript type safety. Since Zod is already installed in the project, this is the best approach.

**Step 1:** Create Zod schemas in `src/types/blocks.ts`:

```typescript
import { z } from 'zod'

// Zod schemas for result types
export const AmrapResultSchema = z.object({
  rounds: z.number(),
  partialReps: z.number(),
  actualDuration: z.number(),
})

export const EmomResultSchema = z.object({
  completedMinutes: z.number(),
  missedMinutes: z.array(z.number()),
})

export const TabataResultSchema = z.object({
  repsPerRound: z.array(z.number()),
})

export const ForTimeResultSchema = z.object({
  completionTime: z.number(),
  completed: z.boolean(),
  splitTimes: z.array(z.number()).optional(),
})

export const TimedBlockResultSchema = z.union([
  AmrapResultSchema,
  EmomResultSchema,
  TabataResultSchema,
  ForTimeResultSchema,
])

// Type guard using Zod
export function isTimedBlockResult(value: unknown): value is TimedBlockResult {
  return TimedBlockResultSchema.safeParse(value).success
}
```

**Step 2:** Use in the component:

```typescript
import { isTimedBlockResult } from '@/types/blocks'

function handleCompleteBlock() {
  if (!currentBlock.value || !isTimedBlock(currentBlock.value)) return

  const result = timedViewRef.value?.complete()
  if (isTimedBlockResult(result)) {
    // TypeScript now knows result is TimedBlockResult
    setBlockResult(currentBlockIndex.value, result)
  }

  if (isLastBlock.value) {
    emit('workout-complete')
    return
  }

  advanceToNextBlock()
}
```

**Benefits:**
- ✅ Runtime validation ensures data integrity
- ✅ Automatic TypeScript type narrowing
- ✅ Single source of truth for result structure
- ✅ Easier to maintain than manual type guards
- ✅ Can catch bugs at runtime if component returns malformed data

---

**Alternative 1: Type the template ref**

If you prefer compile-time checking only:

```typescript
import { useTemplateRef } from 'vue'

const timedViewRef = useTemplateRef<{
  complete: () => TimedBlockResult | undefined
  toggle: () => void
  reset: () => void
}>('timedView')

// Use directly without type guards
function handleCompleteBlock() {
  if (!currentBlock.value || !isTimedBlock(currentBlock.value)) return

  const result = timedViewRef.value?.complete()
  if (result) {
    setBlockResult(currentBlockIndex.value, result)
  }

  advanceToNextBlock()
}
```

**Alternative 2: Manual type guard** (not recommended, use Zod instead)

See the Zod approach above for a better solution with runtime validation.

---

## High Priority Refactoring

### 2. Extract handleNextExercise into Smaller Functions

**File:** `src/features/workout/components/WorkoutActiveMode.vue:189-234`
**Severity:** HIGH (Long Function)
**Effort:** 30 minutes

**Current code:** 46 lines with multiple responsibilities

**Solution:**
```typescript
async function handleNextExercise() {
  if (isExerciseTransitioning.value) return

  recordSplitTime()
  await playExerciseTransitionAnimation()

  const result = advanceToNextExercise()

  if (result === 'workout-complete') {
    await handleBenchmarkCompletion()
  }
}

function recordSplitTime() {
  if (splitTracker && benchmarkTimer) {
    splitTracker.recordSplit(benchmarkTimer.getPreciseElapsedSeconds())
  }
}

async function playExerciseTransitionAnimation() {
  isExerciseTransitioning.value = true
  showExerciseCheckmark.value = true
  await new Promise(resolve => setTimeout(resolve, 300))

  showExerciseCheckmark.value = false
  await new Promise(resolve => setTimeout(resolve, 500))

  isExerciseTransitioning.value = false
}

async function handleBenchmarkCompletion() {
  benchmarkTimer?.pause()

  if (currentBlock.value?.kind === 'fortime') {
    const completionTime = benchmarkTimer?.getPreciseElapsedSeconds() ?? 0
    benchmarkCompletionTime.value = completionTime
    setBlockResult(currentBlockIndex.value, {
      completionTime,
      completed: true,
      splitTimes: splitTracker?.getSplits(),
    })
  }

  showBenchmarkCompletion.value = true
}
```

---

### 3. Extract Animation State to Composable

**Files:**
- New: `src/composables/workout/useBenchmarkAnimation.ts`
- Update: `src/features/workout/components/WorkoutActiveMode.vue`

**Severity:** HIGH (Data Clumps)
**Effort:** 45 minutes

**Create new file:** `src/composables/workout/useBenchmarkAnimation.ts`

```typescript
import { reactive, readonly } from 'vue'

export function useBenchmarkAnimation() {
  const state = reactive({
    isTransitioning: false,
    showCheckmark: false,
    showCompletion: false,
    completionTime: 0,
  })

  async function playExerciseTransition() {
    state.isTransitioning = true
    state.showCheckmark = true

    // Phase 1: Checkmark (300ms)
    await new Promise(resolve => setTimeout(resolve, 300))

    state.showCheckmark = false
    // Phase 2: Slide transition (500ms)
    await new Promise(resolve => setTimeout(resolve, 500))

    state.isTransitioning = false
  }

  function showCompletion(time: number) {
    state.showCompletion = true
    state.completionTime = time
  }

  function reset() {
    Object.assign(state, {
      isTransitioning: false,
      showCheckmark: false,
      showCompletion: false,
      completionTime: 0,
    })
  }

  return {
    state: readonly(state),
    playExerciseTransition,
    showCompletion,
    reset,
  }
}
```

**Update WorkoutActiveMode.vue:**
```typescript
import { useBenchmarkAnimation } from '@/composables/workout/useBenchmarkAnimation'

// Replace 4 separate refs with composable
const animation = isBenchmarkMode ? useBenchmarkAnimation() : null

// Update template
<BenchmarkForTimeView
  :animation-state="animation?.state"
  :show-completion="animation?.state.showCompletion"
  :completion-time="animation?.state.completionTime"
/>

// Update handleNextExercise
async function handleNextExercise() {
  if (!animation) return
  if (animation.state.isTransitioning) return

  recordSplitTime()
  await animation.playExerciseTransition()

  const result = advanceToNextExercise()

  if (result === 'workout-complete') {
    const completionTime = benchmarkTimer?.getPreciseElapsedSeconds() ?? 0
    animation.showCompletion(completionTime)
  }
}
```

---

### 4. Reduce BenchmarkForTimeView Props (Apply Parameter Object Pattern)

**File:** `src/features/workout/components/BenchmarkForTimeView.vue`
**Severity:** HIGH (10 props)
**Effort:** 30 minutes

**Current code:**
```typescript
type Props = {
  block: ForTimeBlock
  exerciseNumber: number
  totalExercisesInRound: number
  globalExerciseIndex: number
  totalExercises: number
  animationState?: AnimationState
  showCompletion?: boolean
  completionTime?: number
  benchmarkName?: string
  isFirstAttempt?: boolean
}
```

**Solution:**
```typescript
type ExerciseProgressState = {
  current: number
  totalInRound: number
  globalIndex: number
  totalCount: number
}

type BenchmarkCompletionState = {
  isComplete: boolean
  time: number
  benchmarkName: string
}

type Props = {
  block: ForTimeBlock
  progress: ExerciseProgressState
  completion?: BenchmarkCompletionState
  animationState?: AnimationState
  isFirstAttempt?: boolean
}
```

**Update parent component (WorkoutActiveMode.vue):**
```vue
<BenchmarkForTimeView
  :block="currentBlock"
  :progress="{
    current: currentExercisePosition?.current ?? 1,
    totalInRound: currentExercisePosition?.total ?? 1,
    globalIndex: globalExerciseIndex ?? 0,
    totalCount: totalExerciseCount ?? 1,
  }"
  :completion="showBenchmarkCompletion ? {
    isComplete: true,
    time: benchmarkCompletionTime,
    benchmarkName: workout.name,
  } : undefined"
  :animation-state="animation?.state"
  :is-first-attempt="firstAttemptTracking?.isFirstAttempt.value ?? false"
/>
```

**Update BenchmarkForTimeView.vue template:**
```vue
<!-- Replace exerciseNumber with progress.current -->
<ExerciseProgressDots
  :current-index="progress.current - 1"
  :total-exercises="progress.totalInRound"
/>

<!-- Replace showCompletion with completion -->
<BenchmarkCompletionScreen
  v-if="completion?.isComplete"
  :completion-time="completion.time"
  :benchmark-name="completion.benchmarkName"
/>
```

---

## Medium Priority Improvements

### 5. Add Accessibility - Hide Decorative Icons

**Files:**
- `src/features/workout/components/BenchmarkForTimeView.vue`
- `src/features/workout/components/BenchmarkCompletionScreen.vue`
- `src/features/workout/components/WorkoutActiveModeFooter.vue`

**Severity:** MEDIUM (WCAG 1.1.1)
**Effort:** 10 minutes

**Find all icon components and add `aria-hidden="true"`:**

```vue
<!-- BenchmarkForTimeView.vue line 90 -->
<Check class="size-24 text-green-500" aria-hidden="true" />

<!-- BenchmarkCompletionScreen.vue line 31 -->
<Trophy class="w-12 h-12 text-primary" aria-hidden="true" />
<Check class="w-8 h-8 text-primary" aria-hidden="true" />

<!-- WorkoutActiveModeFooter.vue - all ChevronLeft, ChevronRight icons -->
<ChevronLeft class="size-5" aria-hidden="true" />
<ChevronRight class="size-5" aria-hidden="true" />

<!-- Icons inside labeled buttons -->
<component :is="primaryAction.icon" class="size-5" aria-hidden="true" />
```

---

### 6. Improve Progress Indicator Accessibility

**File:** `src/features/workout/components/ExerciseProgressDots.vue`
**Severity:** MEDIUM (WCAG 1.3.1)
**Effort:** 15 minutes

**Current code:** Individual dots without proper semantic structure

**Solution:**
```vue
<template>
  <div role="status" aria-label="Exercise progress" class="px-4 py-3">
    <!-- Add screen reader announcement -->
    <div aria-live="polite" aria-atomic="true" class="sr-only">
      {{ $t('workouts.progress.announcement', { current: currentIndex + 1, total: totalExercises }) }}
    </div>

    <div class="flex items-center justify-center gap-2">
      <div
        v-for="(state, i) in dots"
        :key="i"
        role="presentation"
        class="transition-all duration-200"
        :class="{
          'h-2 w-2 rounded-full bg-primary': state === 'active',
          'h-1.5 w-1.5 rounded-full bg-primary/60': state === 'completed',
          'h-1.5 w-1.5 rounded-full bg-muted-foreground/20': state === 'upcoming',
        }"
      />
    </div>
  </div>
</template>
```

**Add to i18n messages** (`src/i18n/messages/en/workouts.ts`):
```typescript
progress: {
  announcement: 'Exercise {current} of {total}'
}
```

**Add German translation** (`src/i18n/messages/de/workouts.ts`):
```typescript
progress: {
  announcement: 'Übung {current} von {total}'
}
```

---

### 7. Add Screen Reader Announcement for Checkmark

**File:** `src/features/workout/components/BenchmarkForTimeView.vue:84-92`
**Severity:** MEDIUM (WCAG 4.1.3)
**Effort:** 5 minutes

**Current code:**
```vue
<div
  v-if="showCheckmark"
  class="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm"
  data-testid="completion-checkmark"
>
  <div class="animate-in zoom-in-50 duration-200 bg-white rounded-full p-6 shadow-2xl">
    <Check class="size-24 text-green-500" />
  </div>
</div>
```

**Solution:**
```vue
<div
  v-if="showCheckmark"
  role="status"
  aria-live="assertive"
  class="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm"
  data-testid="completion-checkmark"
>
  <div class="sr-only">{{ $t('workouts.exerciseCompleted') }}</div>
  <div class="animate-in zoom-in-50 duration-200 bg-white rounded-full p-6 shadow-2xl">
    <Check class="size-24 text-green-500" aria-hidden="true" />
  </div>
</div>
```

**Add to i18n:**
```typescript
// en/workouts.ts
exerciseCompleted: 'Exercise completed'

// de/workouts.ts
exerciseCompleted: 'Übung abgeschlossen'
```

---

### 8. Add Timestamp Validation in Timer

**File:** `src/composables/timers/useBenchmarkGlobalTimer.ts:42-48`
**Severity:** MEDIUM (Data Validation)
**Effort:** 10 minutes

**Current code:**
```typescript
function initializeFromWorkout(globalTimerStartedAt: number | null) {
  if (!globalTimerStartedAt) return

  startedAt.value = globalTimerStartedAt
  isRunning.value = true
  startInterval()
}
```

**Solution:**
```typescript
function initializeFromWorkout(globalTimerStartedAt: number | null) {
  if (!globalTimerStartedAt) return

  // Validate timestamp is reasonable (not in future, not before 2020)
  const now = Date.now()
  const MIN_TIMESTAMP = 1577836800000 // 2020-01-01

  if (globalTimerStartedAt > now) {
    console.warn('[Timer] Timestamp is in future, using current time')
    startedAt.value = now
  } else if (globalTimerStartedAt < MIN_TIMESTAMP) {
    console.warn('[Timer] Invalid timestamp, resetting timer')
    return
  } else {
    startedAt.value = globalTimerStartedAt
  }

  isRunning.value = true
  startInterval()
}
```

---

## Low Priority Enhancements

### 9. Use Semantic Time Elements

**Files:**
- `src/features/workout/components/WorkoutActiveModeFooter.vue:189-196`
- `src/features/workout/components/BenchmarkCompletionScreen.vue:50-60`

**Severity:** LOW (Semantic HTML)
**Effort:** 10 minutes

**WorkoutActiveModeFooter.vue:**
```vue
<div v-if="displayedTimer" class="flex items-center justify-center gap-3 py-2 mb-2 -mx-4 px-4">
  <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
    {{ displayedTimerLabel }}
  </span>
  <time
    :datetime="`PT${displayedTimer.replace(':', 'M')}S`"
    :class="cn('font-mono text-2xl font-bold tabular-nums', blockColors.text)"
  >
    {{ displayedTimer }}
  </time>
</div>
```

**BenchmarkCompletionScreen.vue:**
```vue
<div class="text-center" :class="isVisible ? 'animate-slide-up-fade' : 'opacity-0'">
  <time
    :datetime="`PT${completionTime}S`"
    class="text-6xl font-bold font-mono text-primary tabular-nums"
  >
    {{ formattedTime }}
  </time>
  <p class="text-muted-foreground mt-2">Final Time</p>
</div>
```

---

### 10. Improve Footer Accessibility

**File:** `src/features/workout/components/WorkoutActiveModeFooter.vue:187-259`
**Severity:** LOW (Semantic HTML)
**Effort:** 10 minutes

**Current issue:** The component uses `<footer>` but is already wrapped in PageLayout's `<footer>`, creating nested footers.

**Solution:**
Change the root element from `<footer>` to `<div>` and add proper ARIA labels:

```vue
<div
  class="px-4 pb-4 pt-2 safe-area-bottom bg-background/95 backdrop-blur-sm"
  aria-label="Workout controls"
>
  <!-- Timer Display Row -->
  <div v-if="displayedTimer" aria-live="polite" class="flex items-center justify-center gap-3 py-2 mb-2 -mx-4 px-4">
    <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {{ displayedTimerLabel }}
    </span>
    <time :datetime="..." :class="...">
      {{ displayedTimer }}
    </time>
  </div>

  <!-- Action Buttons Row -->
  <div class="flex items-center gap-3" role="group" aria-label="Workout actions">
    <!-- buttons -->
  </div>

  <!-- Back Exercise Button Row -->
  <div
    v-if="isBenchmarkMode && canGoBack"
    class="flex justify-center mt-2"
    role="group"
    aria-label="Exercise navigation"
  >
    <!-- button -->
  </div>
</div>
```

---

### 11. Use useAsyncState in useBenchmarkFirstAttempt

**File:** `src/composables/workout/useBenchmarkFirstAttempt.ts`
**Severity:** LOW (Code Quality)
**Effort:** 20 minutes

**Current implementation:** Manual loading state management (47 lines)

**VueUse alternative (32 lines - 32% reduction):**
```typescript
import { useAsyncState } from '@vueuse/core'
import { computed, watch, toValue, type MaybeRefOrGetter } from 'vue'
import { getBenchmarksRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import { isFirstBenchmarkAttempt } from '@/lib/splitTracking'

export function useBenchmarkFirstAttempt(benchmarkId: MaybeRefOrGetter<string | null>) {
  const { state: attemptHistory, isLoading, execute } = useAsyncState(
    async () => {
      const id = toValue(benchmarkId)
      if (!id) return []

      const repo = getBenchmarksRepository()
      const [error, attempts] = await tryCatch(repo.getAttemptHistory(id))

      if (error) {
        console.error('Failed to load attempt history:', error)
        return []
      }
      return attempts
    },
    [],
    { immediate: true }
  )

  const isFirstAttempt = computed(() => isFirstBenchmarkAttempt(attemptHistory.value))

  // Auto-reload on benchmarkId change
  watch(() => toValue(benchmarkId), () => execute())

  return {
    isFirstAttempt,
    isLoading,
    reload: execute,
  }
}
```

**Benefits:**
- Built-in loading state
- Automatic cleanup (watchers are properly managed)
- Error handling infrastructure
- 15 lines saved (32% reduction)
- Consistent with existing pattern in `src/features/settings/composables/useLanguage.ts`

---

## Progress Tracking

Use this checklist to track your progress:

### Critical (Must Fix Before Merge)
- [ ] 1. Fix type assertion in WorkoutActiveMode

### High Priority
- [ ] 2. Extract handleNextExercise into smaller functions
- [ ] 3. Extract animation state to composable
- [ ] 4. Reduce BenchmarkForTimeView props

### Medium Priority (Accessibility & Performance)
- [ ] 5. Add aria-hidden to decorative icons
- [ ] 6. Improve progress indicator accessibility
- [ ] 7. Add screen reader announcement for checkmark
- [ ] 8. Add timestamp validation in timer

### Low Priority (Nice to Have)
- [ ] 9. Use semantic time elements
- [ ] 10. Improve footer accessibility
- [ ] 11. Use useAsyncState

---

## Estimated Time Investment

- **Critical (item 1):** 20 minutes
- **High priority (items 2-4):** 1 hour 45 minutes
- **Medium priority (items 5-8):** 40 minutes
- **Low priority (items 9-11):** 40 minutes

**Total: ~3 hours 25 minutes**

---

## Implementation Order

Recommended order to maximize efficiency and minimize refactoring churn:

1. **Item 1** (Critical) - Fix type assertion with Zod (20 min)
2. **Item 3** (High) - Extract animation composable (45 min)
3. **Item 2** (High) - Extract handleNextExercise - uses animation composable (30 min)
4. **Item 4** (High) - Reduce props - uses animation composable (30 min)
5. **Items 5-8** (Medium) - Accessibility improvements (40 min)
6. **Items 9-11** (Low) - Optional enhancements (40 min)

---

## Notes

- Start with critical item to ensure code safety
- High priority items (2-4) have dependencies - follow recommended order
- Accessibility improvements (5-8) can be done in a single focused session
- Low priority items are optional but provide good incremental improvements
- Item 11 (useAsyncState) also improves code quality and follows existing patterns

**Validated:** All items in this guide have been validated against the current codebase and follow Vue 3.5+ best practices and WCAG 2.1 guidelines.
