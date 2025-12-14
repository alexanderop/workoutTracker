# Benchmark Workout UI Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the benchmark workout active screen with race-timing display style for improved readability, next exercise visibility, and PB motivation.

**Architecture:** Component-based redesign touching 4 files. Create 2 new components (BenchmarkProgressBar, BenchmarkNextExercise), update 2 existing (BenchmarkExerciseDisplay, BenchmarkForTimeView). Add i18n translations.

**Tech Stack:** Vue 3.5+, TypeScript strict, Tailwind CSS, vue-i18n

---

## Task 1: Add i18n Translations

**Files:**
- Modify: `src/i18n/messages/en/workouts.ts:176-246`
- Modify: `src/i18n/messages/de/workouts.ts` (same keys)

**Step 1: Add new English translations**

Add these keys inside the `benchmarks` object in `src/i18n/messages/en/workouts.ts`:

```typescript
// Add after line 246 (inside benchmarks object, before closing brace)
progress: {
  exerciseCount: '{current}/{total}',
  announcement: 'Exercise {current} of {total}',
},
split: {
  ahead: "You're {time} ahead!",
  behind: 'Push! {time} behind',
  settingBaseline: 'Setting your baseline',
  goAllOut: 'Go all out!',
},
next: {
  label: 'NEXT',
  finalExercise: 'FINAL EXERCISE',
},
```

**Step 2: Run type-check to verify**

Run: `pnpm type-check`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/i18n/messages/en/workouts.ts src/i18n/messages/de/workouts.ts
git commit -m "feat(i18n): add benchmark workout redesign translations"
```

---

## Task 2: Create BenchmarkProgressBar Component

**Files:**
- Create: `src/features/benchmarks/components/BenchmarkProgressBar.vue`

**Step 1: Create the component**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type Props = {
  current: number // 1-based current exercise
  total: number
}

const { current, total } = defineProps<Props>()
const { t } = useI18n()

const progressPercent = computed(() => {
  if (total === 0) return 0
  return ((current - 1) / total) * 100
})

const dotPosition = computed(() => {
  if (total === 0) return 0
  // Position dot at current exercise (not after it)
  return ((current - 0.5) / total) * 100
})
</script>

<template>
  <div
    role="progressbar"
    :aria-valuenow="current"
    :aria-valuemin="1"
    :aria-valuemax="total"
    :aria-label="t('workouts.benchmarks.progress.announcement', { current, total })"
    class="flex items-center gap-3"
  >
    <!-- Progress bar -->
    <div class="flex-1 h-1.5 bg-muted rounded-full relative overflow-hidden">
      <!-- Completed portion -->
      <div
        class="absolute inset-y-0 left-0 bg-primary/40 rounded-full transition-all duration-300"
        :style="{ width: `${progressPercent}%` }"
      />
      <!-- Current position dot -->
      <div
        class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3 bg-primary rounded-full shadow-sm shadow-primary/50 transition-all duration-300"
        :style="{ left: `${dotPosition}%` }"
      />
    </div>

    <!-- Exercise count -->
    <span class="text-sm font-medium tabular-nums text-muted-foreground min-w-[3ch]">
      {{ t('workouts.benchmarks.progress.exerciseCount', { current, total }) }}
    </span>
  </div>
</template>
```

**Step 2: Run type-check**

Run: `pnpm type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/features/benchmarks/components/BenchmarkProgressBar.vue
git commit -m "feat(benchmarks): add BenchmarkProgressBar component"
```

---

## Task 3: Create BenchmarkNextExercise Component

**Files:**
- Create: `src/features/benchmarks/components/BenchmarkNextExercise.vue`

**Step 1: Create the component**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight } from 'lucide-vue-next'
import type { BlockExercise } from '@/types/blocks'

type Props = {
  exercise: BlockExercise | null
  isFinalExercise?: boolean
}

const { exercise, isFinalExercise = false } = defineProps<Props>()
const { t } = useI18n()

const displayText = computed(() => {
  if (isFinalExercise || !exercise) {
    return t('workouts.benchmarks.next.finalExercise')
  }

  let text = exercise.name
  if (exercise.prescribedReps) {
    text += ` · ${exercise.prescribedReps} ${t('workouts.benchmarks.exerciseDisplay.reps')}`
  }
  if (exercise.load) {
    text += ` · ${exercise.load}`
  }
  return text
})
</script>

<template>
  <div
    v-if="exercise || isFinalExercise"
    class="px-4 py-3 bg-muted/30 border-t border-border/50"
  >
    <div class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <template v-if="!isFinalExercise">
        <span class="font-semibold uppercase tracking-wider text-xs">
          {{ t('workouts.benchmarks.next.label') }}
        </span>
        <ChevronRight class="size-4" aria-hidden="true" />
      </template>
      <span class="font-medium">{{ displayText }}</span>
    </div>
  </div>
</template>
```

**Step 2: Run type-check**

Run: `pnpm type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/features/benchmarks/components/BenchmarkNextExercise.vue
git commit -m "feat(benchmarks): add BenchmarkNextExercise component"
```

---

## Task 4: Update BenchmarkExerciseDisplay Component

**Files:**
- Modify: `src/features/benchmarks/components/BenchmarkExerciseDisplay.vue`

**Step 1: Update the component with new design**

Replace the entire file content:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUp, ArrowDown, Target } from 'lucide-vue-next'
import type { BlockExercise } from '@/types/blocks'
import type { SplitComparison } from '@/features/benchmarks/composables/useBenchmarkSplitComparison'
import { formatDuration } from '@/lib/formatters'

type Props = {
  exercise: BlockExercise
  splitComparison?: SplitComparison | null
  isFirstAttempt?: boolean
}

const { exercise, splitComparison = null, isFirstAttempt = false } = defineProps<Props>()
const { t } = useI18n()

const comparisonTime = computed(() => {
  if (!splitComparison) return null
  return formatDuration(Math.abs(splitComparison.delta))
})

const isFaster = computed(() => splitComparison?.isFaster ?? false)

const comparisonMessage = computed(() => {
  if (!splitComparison || !comparisonTime.value) return null

  return isFaster.value
    ? t('workouts.benchmarks.split.ahead', { time: comparisonTime.value })
    : t('workouts.benchmarks.split.behind', { time: comparisonTime.value })
})
</script>

<template>
  <div class="flex flex-col items-center gap-4 px-6" aria-live="polite">
    <!-- Exercise name - UPPERCASE, athletic style -->
    <h2 class="text-4xl font-black text-center leading-tight tracking-wide uppercase">
      {{ exercise.name }}
    </h2>

    <!-- Prescribed reps - Hero element -->
    <div class="flex items-baseline gap-2">
      <span class="text-8xl font-black tabular-nums text-primary leading-none">
        {{ exercise.prescribedReps }}
      </span>
      <span class="text-2xl font-semibold text-muted-foreground">
        {{ t('workouts.benchmarks.exerciseDisplay.reps') }}
      </span>
    </div>

    <!-- Load (if present) -->
    <div v-if="exercise.load" class="text-lg text-muted-foreground font-medium">
      {{ exercise.load }}
    </div>

    <!-- Divider -->
    <div class="w-32 h-px bg-border my-2" aria-hidden="true" />

    <!-- Split comparison OR First attempt message -->
    <div class="flex flex-col items-center gap-1 min-h-[4rem]">
      <!-- First attempt state -->
      <template v-if="isFirstAttempt">
        <div class="flex items-center gap-2 text-primary">
          <Target class="size-5" aria-hidden="true" />
          <span class="text-sm font-semibold uppercase tracking-wider">
            {{ t('workouts.benchmarks.split.settingBaseline') }}
          </span>
        </div>
        <span class="text-lg font-medium text-muted-foreground">
          {{ t('workouts.benchmarks.split.goAllOut') }}
        </span>
      </template>

      <!-- Split comparison (when we have PB data) -->
      <template v-else-if="splitComparison">
        <div class="flex items-center gap-2">
          <component
            :is="isFaster ? ArrowUp : ArrowDown"
            class="size-6"
            :class="isFaster ? 'text-green-500' : 'text-destructive'"
            aria-hidden="true"
          />
          <span
            class="text-3xl font-bold tabular-nums"
            :class="isFaster ? 'text-green-500' : 'text-destructive'"
          >
            {{ isFaster ? '-' : '+' }}{{ comparisonTime }}
          </span>
        </div>
        <span
          class="text-sm font-medium"
          :class="isFaster ? 'text-green-500' : 'text-destructive'"
        >
          {{ comparisonMessage }}
        </span>
      </template>
    </div>
  </div>
</template>
```

**Step 2: Run type-check**

Run: `pnpm type-check`
Expected: PASS

**Step 3: Run lint**

Run: `pnpm lint`
Expected: PASS (or auto-fixed)

**Step 4: Commit**

```bash
git add src/features/benchmarks/components/BenchmarkExerciseDisplay.vue
git commit -m "refactor(benchmarks): redesign BenchmarkExerciseDisplay with athletic style"
```

---

## Task 5: Update BenchmarkForTimeView Component

**Files:**
- Modify: `src/features/benchmarks/components/BenchmarkForTimeView.vue`

**Step 1: Update imports and add next exercise logic**

At the top of the script section, update imports:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { Check, Timer } from 'lucide-vue-next'
import BenchmarkExerciseDisplay from './BenchmarkExerciseDisplay.vue'
import BenchmarkCompletionScreen from './BenchmarkCompletionScreen.vue'
import BenchmarkProgressBar from './BenchmarkProgressBar.vue'
import BenchmarkNextExercise from './BenchmarkNextExercise.vue'
import type { ForTimeBlock } from '@/types/blocks'
import { getBlockExerciseList } from '@/types/blocks'
import type { SplitComparison } from '@/features/benchmarks/composables/useBenchmarkSplitComparison'
```

**Step 2: Add next exercise computed**

After the `currentExercise` computed, add:

```typescript
const nextExercise = computed(() => {
  const nextIndex = progress.current // current is 1-based, so this gives next (0-based)
  if (nextIndex >= exercises.value.length) return null
  return exercises.value[nextIndex]
})

const isLastExercise = computed(() => progress.current >= progress.totalCount)
```

**Step 3: Replace the template section**

Replace the entire `<template>` with:

```vue
<template>
  <div class="flex-1 flex flex-col">
    <!-- Completion Screen -->
    <BenchmarkCompletionScreen
      v-if="completion?.isComplete"
      :completion-time="completion.time"
      :benchmark-name="completion.benchmarkName"
      @view-details="emit('view-details')"
    />

    <!-- Active workout display -->
    <div
      v-else
      role="button"
      tabindex="0"
      :aria-label="$t('workouts.benchmarks.tapToAdvance')"
      class="flex-1 flex flex-col cursor-pointer select-none active:bg-muted/30 transition-colors"
      @click="handleTap"
      @keydown.enter="handleTap"
      @keydown.space.prevent="handleTap"
    >
      <!-- Header zone: First attempt badge + Timer + Progress -->
      <div class="pt-6 px-4 space-y-4">
        <!-- First Attempt Badge -->
        <div
          v-if="progress.isFirstAttempt"
          role="status"
          aria-live="polite"
          class="mx-auto w-fit px-4 py-2 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-full"
        >
          <p class="text-center text-sm font-semibold text-primary">
            {{ $t('workouts.benchmarks.firstAttempt') }}
          </p>
        </div>

        <!-- Timer - Large and prominent -->
        <div class="flex items-center justify-center gap-2">
          <Timer class="size-5 text-muted-foreground" aria-hidden="true" />
          <span class="text-4xl font-mono font-bold tabular-nums text-foreground tracking-tight">
            {{ elapsedTime }}
          </span>
        </div>

        <!-- Progress bar -->
        <BenchmarkProgressBar
          :current="progress.current"
          :total="progress.totalCount"
        />
      </div>

      <!-- Exercise zone: Current exercise display -->
      <div class="flex-1 flex flex-col items-center justify-center relative overflow-hidden py-8">
        <!-- Checkmark overlay -->
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

        <!-- Exercise display with slide transition -->
        <div
          :key="progress.current"
          class="w-full transition-all duration-500 ease-out"
          :class="{
            'opacity-0 -translate-x-full': isTransitioning && !showCheckmark,
            'opacity-100 translate-x-0': !isTransitioning,
          }"
        >
          <BenchmarkExerciseDisplay
            v-if="currentExercise"
            :exercise="currentExercise"
            :split-comparison="splitComparison"
            :is-first-attempt="progress.isFirstAttempt"
          />
        </div>
      </div>

      <!-- Footer zone: Next exercise preview -->
      <BenchmarkNextExercise
        :exercise="nextExercise"
        :is-final-exercise="isLastExercise"
      />
    </div>
  </div>
</template>
```

**Step 4: Run type-check**

Run: `pnpm type-check`
Expected: PASS

**Step 5: Run lint**

Run: `pnpm lint`
Expected: PASS

**Step 6: Commit**

```bash
git add src/features/benchmarks/components/BenchmarkForTimeView.vue
git commit -m "refactor(benchmarks): implement race-timing display layout"
```

---

## Task 6: Visual Testing and Polish

**Files:**
- All benchmark components

**Step 1: Run the dev server and test manually**

Run: `pnpm dev`

Test scenarios:
1. Start a benchmark with 2+ exercises
2. Verify timer is large and prominent
3. Verify progress bar shows current position
4. Verify exercise name is UPPERCASE
5. Verify rep count is the hero element (largest)
6. Verify "NEXT" preview shows correctly
7. Verify final exercise shows "FINAL EXERCISE"
8. Tap through to completion

**Step 2: Run all tests**

Run: `pnpm test`
Expected: All tests PASS (or minor snapshot updates if any)

**Step 3: Run full check**

Run: `pnpm type-check && pnpm lint && pnpm test`
Expected: All PASS

**Step 4: Final commit**

```bash
git add -A
git commit -m "test: verify benchmark workout UI redesign"
```

---

## Summary

| Task | Component | Action |
|------|-----------|--------|
| 1 | i18n | Add translation keys |
| 2 | BenchmarkProgressBar | New component |
| 3 | BenchmarkNextExercise | New component |
| 4 | BenchmarkExerciseDisplay | Redesign existing |
| 5 | BenchmarkForTimeView | Layout restructure |
| 6 | Manual testing | Visual verification |

**Total estimated components touched:** 4
**New files:** 2
**Modified files:** 3 (including i18n)
