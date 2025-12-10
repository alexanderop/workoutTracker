<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BlockExercise } from '@/types/blocks'
import type { SplitComparison } from '@/composables/workout/useBenchmarkSplitComparison'
import { formatDuration } from '@/lib/formatters'

type Props = {
  exercise: BlockExercise
  exerciseNumber: number
  totalExercises: number
  splitComparison?: SplitComparison | null
}

const { exercise, exerciseNumber, totalExercises, splitComparison = null } = defineProps<Props>()
const { t } = useI18n()

const comparisonText = computed(() => {
  if (!splitComparison) return null

  const delta = splitComparison.delta
  const absDelta = Math.abs(delta)
  const sign = delta < 0 ? '-' : '+'

  return `${sign}${formatDuration(absDelta)}`
})

const comparisonColor = computed(() => {
  if (!splitComparison) return ''
  return splitComparison.isFaster ? 'text-green-500' : 'text-red-500'
})
</script>

<template>
  <div class="flex flex-col items-center gap-4 px-6 py-8" aria-live="polite">
    <!-- Exercise number -->
    <div class="text-sm font-bold text-muted-foreground uppercase tracking-widest">
      {{ t('workouts.benchmarks.exerciseDisplay.exerciseNumber', { current: exerciseNumber, total: totalExercises }) }}
    </div>

    <!-- Exercise name -->
    <h2 class="text-4xl font-black text-center leading-tight">
      {{ exercise.name }}
    </h2>

    <!-- Prescribed reps -->
    <div class="flex items-baseline gap-2">
      <span class="text-6xl font-black tabular-nums text-primary">
        {{ exercise.prescribedReps }}
      </span>
      <span class="text-2xl font-semibold text-muted-foreground">
        {{ t('workouts.benchmarks.exerciseDisplay.reps') }}
      </span>
    </div>

    <!-- Load (if present) -->
    <div v-if="exercise.load" class="text-lg text-muted-foreground font-medium">
      {{ exercise.load }} {{ t('common.units.kg') }}
    </div>

    <!-- Split comparison (if present) -->
    <div v-if="splitComparison" class="mt-2 flex flex-col items-center gap-1">
      <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {{ t('workouts.benchmarks.split') }}
      </span>
      <div class="flex items-center gap-2">
        <span class="text-2xl font-bold tabular-nums" :class="comparisonColor">
          {{ comparisonText }}
        </span>
      </div>
    </div>
  </div>
</template>
