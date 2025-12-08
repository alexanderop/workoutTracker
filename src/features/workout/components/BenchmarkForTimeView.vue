<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import BenchmarkExerciseDisplay from './BenchmarkExerciseDisplay.vue'
import BenchmarkCompletionScreen from './BenchmarkCompletionScreen.vue'
import ExerciseProgressDots from './ExerciseProgressDots.vue'
import type { ForTimeBlock } from '@/types/blocks'
import { getBlockExerciseList } from '@/types/blocks'

type AnimationState = {
  showCheckmark?: boolean
  isTransitioning?: boolean
}

/* eslint-disable vue/max-props -- Completion feature requires additional props */
type Props = {
  block: ForTimeBlock
  exerciseNumber: number
  totalExercisesInRound: number
  globalExerciseIndex: number
  totalExercises: number
  animationState?: AnimationState
  showCompletion?: boolean
  completionTime?: number
  benchmarkName?: string
}

const {
  block,
  exerciseNumber,
  totalExercisesInRound,
  globalExerciseIndex,
  totalExercises,
  animationState = {},
  showCompletion = false,
  completionTime = 0,
  benchmarkName = '',
} = defineProps<Props>()
/* eslint-enable vue/max-props */

const emit = defineEmits<{
  'view-details': []
}>()

const showCheckmark = computed(() => animationState.showCheckmark ?? false)
const isTransitioning = computed(() => animationState.isTransitioning ?? false)

const exercises = computed(() => getBlockExerciseList(block))
const currentExercise = computed(() => exercises.value[exerciseNumber - 1])
</script>

<template>
  <div class="flex-1 flex flex-col">
    <!-- Completion Screen (replaces exercise display when shown) -->
    <BenchmarkCompletionScreen
      v-if="showCompletion"
      :completion-time="completionTime"
      :benchmark-name="benchmarkName"
      @view-details="emit('view-details')"
    />

    <!-- Normal Exercise Display (when not completed) -->
    <template v-else>
      <!-- Progress dots (top) -->
      <ExerciseProgressDots :total-exercises="totalExercises" :current-index="globalExerciseIndex" />

      <!-- Exercise display with animation (center) -->
      <div class="flex-1 flex items-center justify-center relative overflow-hidden">
        <!-- Checkmark overlay -->
        <div
          v-if="showCheckmark"
          class="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm"
          data-testid="completion-checkmark"
        >
          <div class="animate-in zoom-in-50 duration-200 bg-white rounded-full p-6 shadow-2xl">
            <Check class="size-24 text-green-500" />
          </div>
        </div>

        <!-- Exercise display with slide transition -->
        <div
          :key="exerciseNumber"
          class="transition-all duration-500 ease-out"
          :class="{
            'opacity-0 -translate-x-full': isTransitioning && !showCheckmark,
            'opacity-100 translate-x-0': !isTransitioning,
          }"
        >
          <BenchmarkExerciseDisplay
            v-if="currentExercise"
            :exercise="currentExercise"
            :exercise-number="exerciseNumber"
            :total-exercises="totalExercisesInRound"
          />
        </div>
      </div>
    </template>
  </div>
</template>
