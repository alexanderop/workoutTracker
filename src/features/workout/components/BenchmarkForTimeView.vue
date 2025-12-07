<script setup lang="ts">
import { computed } from 'vue'
import BenchmarkExerciseDisplay from './BenchmarkExerciseDisplay.vue'
import ExerciseProgressDots from './ExerciseProgressDots.vue'
import type { ForTimeBlock } from '@/types/blocks'
import { getBlockExerciseList } from '@/types/blocks'

type Props = {
  block: ForTimeBlock
  exerciseNumber: number
  totalExercisesInRound: number
  globalExerciseIndex: number
  totalExercises: number
}

const { block, exerciseNumber, totalExercisesInRound, globalExerciseIndex, totalExercises } =
  defineProps<Props>()

const exercises = computed(() => getBlockExerciseList(block))
const currentExercise = computed(() => exercises.value[exerciseNumber - 1])
</script>

<template>
  <div class="flex-1 flex flex-col">
    <!-- Progress dots (top) -->
    <ExerciseProgressDots :total-exercises="totalExercises" :current-index="globalExerciseIndex" />

    <!-- Exercise display (center) -->
    <div class="flex-1 flex items-center justify-center">
      <BenchmarkExerciseDisplay
        v-if="currentExercise"
        :exercise="currentExercise"
        :exercise-number="exerciseNumber"
        :total-exercises="totalExercisesInRound"
      />
    </div>
  </div>
</template>
