<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUp, ArrowDown, Target } from '@lucide/vue'
import type { BlockExercise } from '@/blocks'
import type { SplitComparison } from '@/features/benchmarks/composables/useBenchmarkSplitComparison'
import { formatDuration } from '@/lib/formatters'

type ComparisonDisplayState =
  | { type: 'first-attempt' }
  | { type: 'split-comparison'; icon: Component; time: string; message: string; isFaster: boolean }
  | { type: 'none' }

type Properties = {
  exercise: BlockExercise
  splitComparison?: SplitComparison | null
  isFirstAttempt?: boolean
}

const { exercise, splitComparison = null, isFirstAttempt = false } = defineProps<Properties>()
const { t } = useI18n()

/**
 * Unified comparison display state (Extract Conditional pattern).
 * Returns all data needed for rendering the comparison section.
 */
const comparisonDisplay = computed<ComparisonDisplayState>(() => {
  // First attempt: show baseline message
  if (isFirstAttempt) {
    return { type: 'first-attempt' }
  }

  // Has split comparison data: show comparison
  if (splitComparison) {
    const isFaster = splitComparison.isFaster
    const formattedTime = formatDuration(Math.abs(splitComparison.delta))
    const message = isFaster
      ? t('workouts.benchmarks.splitComparison.ahead', { time: formattedTime })
      : t('workouts.benchmarks.splitComparison.behind', { time: formattedTime })

    return {
      type: 'split-comparison',
      icon: isFaster ? ArrowUp : ArrowDown,
      time: formattedTime,
      message,
      isFaster,
    }
  }

  // No comparison data available
  return { type: 'none' }
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
      <template v-if="comparisonDisplay.type === 'first-attempt'">
        <div class="flex items-center gap-2 text-primary">
          <Target class="size-5" aria-hidden="true" />
          <span class="text-sm font-semibold uppercase tracking-wider">
            {{ t('workouts.benchmarks.splitComparison.settingBaseline') }}
          </span>
        </div>
        <span class="text-lg font-medium text-muted-foreground">
          {{ t('workouts.benchmarks.splitComparison.goAllOut') }}
        </span>
      </template>

      <!-- Split comparison (when we have PB data) -->
      <template v-else-if="comparisonDisplay.type === 'split-comparison'">
        <div class="flex items-center gap-2">
          <component
            :is="comparisonDisplay.icon"
            class="size-6"
            :class="comparisonDisplay.isFaster ? 'text-success' : 'text-destructive'"
            aria-hidden="true"
          />
          <span
            class="text-3xl font-bold tabular-nums"
            :class="comparisonDisplay.isFaster ? 'text-success' : 'text-destructive'"
          >
            {{ comparisonDisplay.isFaster ? '-' : '+' }}{{ comparisonDisplay.time }}
          </span>
        </div>
        <span
          class="text-sm font-medium"
          :class="comparisonDisplay.isFaster ? 'text-success' : 'text-destructive'"
        >
          {{ comparisonDisplay.message }}
        </span>
      </template>
    </div>
  </div>
</template>
