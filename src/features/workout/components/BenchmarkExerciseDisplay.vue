<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { BlockExercise } from '@/types/blocks'

type Props = {
  exercise: BlockExercise
  exerciseNumber: number
  totalExercises: number
}

const { exercise, exerciseNumber, totalExercises } = defineProps<Props>()
const { t } = useI18n()
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
  </div>
</template>
