<script setup lang="ts">
import { computed } from 'vue'
import { Check, Timer } from 'lucide-vue-next'
import BenchmarkExerciseDisplay from './BenchmarkExerciseDisplay.vue'
import CompletionScreen from '@/components/CompletionScreen.vue'
import BenchmarkProgressBar from './BenchmarkProgressBar.vue'
import BenchmarkNextExercise from './BenchmarkNextExercise.vue'
import type { ForTimeBlock } from '@/types/blocks'
import { getBlockExerciseList } from '@/types/blocks'
import type { SplitComparison } from '@/features/benchmarks/composables/useBenchmarkSplitComparison'

type AnimationState = {
  showCheckmark?: boolean
  isTransitioning?: boolean
}

type ExerciseProgressState = {
  current: number
  totalInRound: number
  globalIndex: number
  totalCount: number
  currentRound: number
  totalRounds: number
  isFirstAttempt?: boolean
}

type BenchmarkCompletionState = {
  isComplete: boolean
  time: number
  benchmarkName: string
}

type Properties = {
  block: ForTimeBlock
  progress: ExerciseProgressState
  completion?: BenchmarkCompletionState
  animationState?: AnimationState
  splitComparison?: SplitComparison | null
  elapsedTime?: string
}

const {
  block,
  progress,
  completion,
  animationState = {},
  splitComparison = null,
  elapsedTime = '00:00',
} = defineProps<Properties>()

const emit = defineEmits<{
  'view-details': []
  'tap-advance': []
}>()

const showCheckmark = computed(() => animationState.showCheckmark ?? false)
const isTransitioning = computed(() => animationState.isTransitioning ?? false)

const exercises = computed(() => getBlockExerciseList(block))
const currentExercise = computed(() => exercises.value[progress.current - 1])

const nextExercise = computed(() => {
  const nextIndex = progress.current // current is 1-based, so this gives next (0-based)
  if (nextIndex >= exercises.value.length) return null
  return exercises.value[nextIndex]
})

const isLastExercise = computed(() => progress.globalIndex + 1 >= progress.totalCount)

function handleTap() {
  if (isTransitioning.value) return
  emit('tap-advance')
}
</script>

<template>
  <div class="flex-1 flex flex-col">
    <!-- Completion Screen -->
    <CompletionScreen
      v-if="completion?.isComplete"
      :name="completion.benchmarkName"
      :duration="completion.time"
      :duration-label="$t('workouts.benchmarks.completion.finalTime')"
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

        <!-- Segmented progress bar showing rounds -->
        <BenchmarkProgressBar
          :current-exercise="progress.current"
          :exercises-per-round="progress.totalInRound"
          :current-round="progress.currentRound"
          :total-rounds="progress.totalRounds"
          :global-current="progress.globalIndex + 1"
          :global-total="progress.totalCount"
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
