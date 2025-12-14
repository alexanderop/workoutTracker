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
    ? t('workouts.benchmarks.splitComparison.ahead', { time: comparisonTime.value })
    : t('workouts.benchmarks.splitComparison.behind', { time: comparisonTime.value })
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
            {{ t('workouts.benchmarks.splitComparison.settingBaseline') }}
          </span>
        </div>
        <span class="text-lg font-medium text-muted-foreground">
          {{ t('workouts.benchmarks.splitComparison.goAllOut') }}
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
