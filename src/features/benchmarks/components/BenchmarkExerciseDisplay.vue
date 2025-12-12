<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BlockExercise } from '@/types/blocks'
import type { SplitComparison } from '@/features/benchmarks/composables/useBenchmarkSplitComparison'
import { formatDuration } from '@/lib/formatters'

type Props = {
  exercise: BlockExercise
  splitComparison?: SplitComparison | null
}

const { exercise, splitComparison = null } = defineProps<Props>()
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
  return splitComparison.isFaster ? 'status-success' : 'text-destructive'
})
</script>

<template>
  <div class="flex flex-col items-center gap-6 px-6 py-8" aria-live="polite">
    <!-- Exercise name -->
    <h2 class="text-5xl font-black text-center leading-tight">
      {{ exercise.name }}
    </h2>

    <!-- Prescribed reps -->
    <div class="flex items-baseline gap-3">
      <span class="text-7xl font-black tabular-nums text-primary">
        {{ exercise.prescribedReps }}
      </span>
      <span class="text-3xl font-semibold text-muted-foreground">
        {{ t('workouts.benchmarks.exerciseDisplay.reps') }}
      </span>
    </div>

    <!-- Load (if present) -->
    <div v-if="exercise.load" class="text-xl text-muted-foreground font-medium">
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
