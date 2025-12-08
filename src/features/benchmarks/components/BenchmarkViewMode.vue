<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BenchmarkExerciseCard from './BenchmarkExerciseCard.vue'
import { formatBenchmarkType } from '@/lib/formatters'
import type { DbBenchmark } from '@/db/schema'

const { benchmark, showContent } = defineProps<{
  benchmark: DbBenchmark
  showContent: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <!-- Workout type banner with bold typography -->
  <div
    class="border-b bg-muted/30 px-4 py-6"
    :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
    :style="{ animationDelay: '100ms' }"
  >
    <div class="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {{ t('workouts.benchmarks.detail.workoutStructure') }}
    </div>
    <div class="text-2xl font-bold">
      {{ formatBenchmarkType(benchmark.type, benchmark.rounds) }}
    </div>
  </div>

  <!-- Exercise list with staggered animations -->
  <div class="space-y-3 p-4">
    <BenchmarkExerciseCard
      v-for="(exercise, index) in benchmark.exercises"
      :key="index"
      :exercise="exercise"
      :index="index"
      :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
      :style="{ animationDelay: `${150 + index * 50}ms` }"
    />
  </div>
</template>
