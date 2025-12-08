<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BenchmarkExerciseCard from './BenchmarkExerciseCard.vue'
import BenchmarkAttemptHistory from './BenchmarkAttemptHistory.vue'
import { formatBenchmarkType } from '@/lib/formatters'
import { usePersonalBestDisplay } from '../composables/usePersonalBestDisplay'
import { useBenchmarkAttemptHistory } from '../composables/useBenchmarkAttemptHistory'
import type { DbBenchmark } from '@/db/schema'

const { benchmark, personalBest, showContent } = defineProps<{
  benchmark: DbBenchmark
  personalBest: number | null
  showContent: boolean
}>()

const { t } = useI18n()
const { hasPb, formatHero } = usePersonalBestDisplay()

// Load attempt history
const benchmarkId = computed(() => benchmark.id)
const { attempts } = useBenchmarkAttemptHistory(benchmarkId)
</script>

<template>
  <!-- Personal Best Display -->
  <div
    v-if="hasPb(personalBest)"
    role="status"
    aria-live="polite"
    class="border-b bg-gradient-to-br from-primary/10 to-primary/5 px-4 py-8"
    :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
    :style="{ animationDelay: '50ms' }"
  >
    <div class="mx-auto max-w-sm text-center">
      <div class="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
        {{ t('workouts.benchmarks.personalBest') }}
      </div>
      <div class="text-5xl font-bold">
        {{ formatHero(personalBest) }}
      </div>
    </div>
  </div>

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

  <!-- Attempt History Section -->
  <BenchmarkAttemptHistory :attempts="attempts" />
</template>
