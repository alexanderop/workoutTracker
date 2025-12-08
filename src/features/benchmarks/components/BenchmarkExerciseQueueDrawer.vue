<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { BlockExercise } from '@/types/blocks'
import BenchmarkExerciseQueueItem from './BenchmarkExerciseQueueItem.vue'

type Props = {
  benchmarkType: 'fortime' | 'rounds'
  totalBlocks: number
  exercises: ReadonlyArray<BlockExercise>
  currentBlockIndex: number
  currentExerciseIndex: number
}

const { benchmarkType, totalBlocks, exercises, currentBlockIndex, currentExerciseIndex } =
  defineProps<Props>()

const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()

// Compute current global exercise index
const currentGlobalIndex = computed(() => {
  return currentBlockIndex * exercises.length + currentExerciseIndex
})

// Determine exercise status based on global index
function getExerciseStatus(globalIndex: number): 'completed' | 'active' | 'pending' {
  if (globalIndex < currentGlobalIndex.value) return 'completed'
  if (globalIndex === currentGlobalIndex.value) return 'active'
  return 'pending'
}

// Exercise list item types
type ExerciseListItem =
  | { type: 'round-header'; roundNumber: number }
  | {
      type: 'exercise'
      exercise: BlockExercise
      status: 'completed' | 'active' | 'pending'
      exerciseNumber: number
      roundNumber: number
      globalIndex: number
    }

// Build exercise list
const exerciseList = computed<ReadonlyArray<ExerciseListItem>>(() => {
  // ForTime: Flat list of exercises
  if (benchmarkType === 'fortime') {
    return exercises.map((ex, index) => ({
      type: 'exercise' as const,
      exercise: ex,
      status: getExerciseStatus(index),
      exerciseNumber: index + 1,
      roundNumber: 1,
      globalIndex: index,
    }))
  }

  // Rounds: Grouped by round with headers
  const list: Array<ExerciseListItem> = []
  for (let round = 0; round < totalBlocks; round++) {
    // Add round header
    list.push({ type: 'round-header', roundNumber: round + 1 })

    // Add exercises for this round
    exercises.forEach((ex, exIndex) => {
      const globalIndex = round * exercises.length + exIndex
      list.push({
        type: 'exercise',
        exercise: ex,
        status: getExerciseStatus(globalIndex),
        exerciseNumber: exIndex + 1,
        roundNumber: round + 1,
        globalIndex,
      })
    })
  }

  return list
})
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent class="max-h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>{{ t('workouts.benchmarks.queue.title') }}</DialogTitle>
        <DialogDescription class="sr-only">
          {{ t('workouts.benchmarks.queue.description') }}
        </DialogDescription>
      </DialogHeader>

      <!-- Scrollable list of exercises -->
      <div class="flex-1 overflow-y-auto -mx-4 px-4 flex flex-col" role="list">
        <template v-for="(item, index) in exerciseList" :key="index">
          <!-- Round header -->
          <div
            v-if="item.type === 'round-header'"
            class="px-4 py-2 bg-muted/50 border-y border-border sticky top-0 z-10"
          >
            <h3
              class="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              role="heading"
              aria-level="3"
            >
              {{ t('workouts.benchmarks.queue.roundHeader', { round: item.roundNumber }) }}
            </h3>
          </div>

          <!-- Exercise item -->
          <BenchmarkExerciseQueueItem
            v-else-if="item.type === 'exercise'"
            :exercise="item.exercise"
            :status="item.status"
            :exercise-number="item.exerciseNumber"
            :round-number="benchmarkType === 'rounds' ? item.roundNumber : undefined"
          />
        </template>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
