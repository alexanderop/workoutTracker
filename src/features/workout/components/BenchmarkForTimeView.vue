<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import BenchmarkExerciseDisplay from './BenchmarkExerciseDisplay.vue'
import BenchmarkCompletionScreen from './BenchmarkCompletionScreen.vue'
import ExerciseProgressDots from './ExerciseProgressDots.vue'
import type { ForTimeBlock } from '@/types/blocks'
import { getBlockExerciseList } from '@/types/blocks'
import type { SplitComparison } from '@/composables/workout/useBenchmarkSplitComparison'

type AnimationState = {
  showCheckmark?: boolean
  isTransitioning?: boolean
}

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
  splitComparison?: SplitComparison | null
}

const {
  block,
  progress,
  completion,
  animationState = {},
  isFirstAttempt = false,
  splitComparison = null,
} = defineProps<Props>()

const emit = defineEmits<{
  'view-details': []
}>()

const showCheckmark = computed(() => animationState.showCheckmark ?? false)
const isTransitioning = computed(() => animationState.isTransitioning ?? false)

const exercises = computed(() => getBlockExerciseList(block))
const currentExercise = computed(() => exercises.value[progress.current - 1])
</script>

<template>
  <div class="flex-1 flex flex-col">
    <!-- Completion Screen (replaces exercise display when shown) -->
    <BenchmarkCompletionScreen
      v-if="completion?.isComplete"
      :completion-time="completion.time"
      :benchmark-name="completion.benchmarkName"
      @view-details="emit('view-details')"
    />

    <!-- Normal Exercise Display (when not completed) -->
    <template v-else>
      <!-- Progress dots (top) -->
      <ExerciseProgressDots :total-exercises="progress.totalCount" :current-index="progress.globalIndex" />

      <!-- First Attempt Message (positioned above exercise) -->
      <div
        v-if="isFirstAttempt && !completion?.isComplete"
        role="status"
        aria-live="polite"
        class="px-4 py-3 mb-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg"
      >
        <p class="text-center text-sm font-medium text-primary">
          {{ $t('workouts.benchmarks.firstAttempt') }}
        </p>
      </div>

      <!-- Exercise display with animation (center) -->
      <div class="flex-1 flex items-center justify-center relative overflow-hidden">
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
          class="transition-all duration-500 ease-out"
          :class="{
            'opacity-0 -translate-x-full': isTransitioning && !showCheckmark,
            'opacity-100 translate-x-0': !isTransitioning,
          }"
        >
          <BenchmarkExerciseDisplay
            v-if="currentExercise"
            :exercise="currentExercise"
            :exercise-number="progress.current"
            :total-exercises="progress.totalInRound"
            :split-comparison="splitComparison"
          />
        </div>
      </div>
    </template>
  </div>
</template>
