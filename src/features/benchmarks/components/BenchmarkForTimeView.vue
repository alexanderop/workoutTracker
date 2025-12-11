<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import BenchmarkExerciseDisplay from './BenchmarkExerciseDisplay.vue'
import BenchmarkCompletionScreen from './BenchmarkCompletionScreen.vue'
import ExerciseProgressDots from '@/components/ExerciseProgressDots.vue'
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
  isFirstAttempt?: boolean
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
} = defineProps<Props>()

const emit = defineEmits<{
  'view-details': []
  'tap-advance': []
}>()

const showCheckmark = computed(() => animationState.showCheckmark ?? false)
const isTransitioning = computed(() => animationState.isTransitioning ?? false)

const exercises = computed(() => getBlockExerciseList(block))
const currentExercise = computed(() => exercises.value[progress.current - 1])

function handleTap() {
  if (isTransitioning.value) return
  emit('tap-advance')
}
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

    <!-- Focus Mode Display (tappable area) -->
    <div
      v-else
      role="button"
      tabindex="0"
      :aria-label="$t('workouts.benchmarks.tapToAdvance')"
      class="flex-1 flex flex-col justify-between cursor-pointer select-none active:bg-muted/30 transition-colors"
      @click="handleTap"
      @keydown.enter="handleTap"
      @keydown.space.prevent="handleTap"
    >
      <!-- Top section: Timer -->
      <div class="pt-8 text-center">
        <span class="text-3xl font-mono tabular-nums text-muted-foreground">
          {{ elapsedTime }}
        </span>
      </div>

      <!-- Middle section: Exercise display -->
      <div class="flex flex-col items-center justify-center relative overflow-hidden">
        <!-- First Attempt Message -->
        <div
          v-if="progress.isFirstAttempt"
          role="status"
          aria-live="polite"
          class="mx-4 mb-4 px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg"
        >
          <p class="text-center text-sm font-medium text-primary">
            {{ $t('workouts.benchmarks.firstAttempt') }}
          </p>
        </div>

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
            :split-comparison="splitComparison"
          />
        </div>
      </div>

      <!-- Bottom section: Progress dots -->
      <ExerciseProgressDots
        class="pb-8"
        :total-exercises="progress.totalCount"
        :current-index="progress.globalIndex"
      />
    </div>
  </div>
</template>
