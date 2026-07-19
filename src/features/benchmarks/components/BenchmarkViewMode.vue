<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import RoundTabs from './RoundTabs.vue'
import BenchmarkExerciseCard from './BenchmarkExerciseCard.vue'
import BenchmarkAttemptHistory from './BenchmarkAttemptHistory.vue'
import { formatBenchmarkType } from '@/lib/formatters'
import { usePersonalBestDisplay } from '../composables/usePersonalBestDisplay'
import { useBenchmarkAttemptHistory } from '../composables/useBenchmarkAttemptHistory'
import type { DbBenchmark } from '@/db/schema'

const orderKeyCollator = new Intl.Collator()

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

// Active round for tabbed navigation
const activeRoundIndex = ref(0)

// Sort rounds and exercises by orderKey
const sortedRounds = computed(() => {
  return [...benchmark.rounds].toSorted((a, b) => orderKeyCollator.compare(a.orderKey, b.orderKey))
})

// Get the currently active round
const activeRound = computed(() => sortedRounds.value[activeRoundIndex.value])

function sortedExercises(round: (typeof sortedRounds.value)[number]) {
  return [...round.exercises].toSorted((a, b) => orderKeyCollator.compare(a.orderKey, b.orderKey))
}
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
      {{ formatBenchmarkType(benchmark.type, sortedRounds.length) }}
    </div>
  </div>

  <!-- Round tabs and exercises -->
  <div class="space-y-4 p-4">
    <!-- Round tabs -->
    <div
      :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
      :style="{ animationDelay: '150ms' }"
    >
      <RoundTabs
        :rounds="sortedRounds"
        :active-index="activeRoundIndex"
        @select="activeRoundIndex = $event"
      />
    </div>

    <!-- Round header -->
    <div
      :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
      :style="{ animationDelay: '200ms' }"
      class="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
    >
      {{
        t('workouts.benchmarks.round', {
          current: activeRoundIndex + 1,
          total: sortedRounds.length,
        })
      }}
    </div>

    <!-- Exercises for active round -->
    <div
      v-if="activeRound"
      :class="showContent ? 'animate-slide-up-fade' : 'opacity-0'"
      :style="{ animationDelay: '250ms' }"
      class="space-y-3"
    >
      <BenchmarkExerciseCard
        v-for="(exercise, exerciseIndex) in sortedExercises(activeRound)"
        :key="exercise.orderKey"
        :exercise="exercise"
        :index="exerciseIndex"
      />
    </div>
  </div>

  <!-- Attempt History Section -->
  <BenchmarkAttemptHistory :attempts="attempts" />
</template>
