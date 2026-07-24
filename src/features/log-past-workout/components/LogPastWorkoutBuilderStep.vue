<script setup lang="ts">
import { computed } from 'vue'
import { Dumbbell } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { useWorkoutBlockDialogs } from '@/composables/useWorkoutBlockDialogs'
import type { Exercise } from '@/composables/useExerciseSearch'
import { WorkoutBlockDialogs } from '@/components/blocks'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import WorkoutBlockPlaylist from '@/components/blocks/WorkoutBlockPlaylist.vue'
import { usePastWorkout } from '../composables/usePastWorkout'
import type { StrengthBlock } from '@/blocks'

const { t } = useI18n()

const {
  blocks,
  selectedBlockIndex,
  addBlock,
  addAmrapBlock,
  addEmomBlock,
  addTabataBlock,
  addForTimeBlock,
  addCardioBlock,
  removeBlockByIndex,
  reorderBlocks,
  selectBlock,
} = usePastWorkout()

const {
  addBlockDialogOpen,
  configureAmrapOpen,
  configureEmomOpen,
  configureTabataOpen,
  configureForTimeOpen,
  configureCardioOpen,
  openAddBlockDialog,
  openTimedBlockDialog,
  openCardioBlockDialog,
} = useWorkoutBlockDialogs()

const hasBlocks = computed(() => blocks.value.length > 0)

/**
 * Creates a StrengthBlock from an Exercise.
 * Sets are initialized as completed (past workout).
 */
function createStrengthBlockFromExercise(exercise: Exercise): StrengthBlock {
  return {
    kind: 'strength',
    id: 0, // Will be assigned by addBlock
    exerciseDefinitionId: exercise.id ?? null,
    name: exercise.name,
    equipment: exercise.equipment ?? 'bodyweight',
    targetReps: 8,
    targetDuration: null,
    targetWeight: null,
    image: exercise.image ?? null,
    sets: [
      { id: 1, kg: '', reps: '', duration: '', rir: '', status: 'completed' },
      { id: 2, kg: '', reps: '', duration: '', rir: '', status: 'completed' },
      { id: 3, kg: '', reps: '', duration: '', rir: '', status: 'completed' },
    ],
  }
}

function handleAddExercise(exercise: Exercise) {
  const block = createStrengthBlockFromExercise(exercise)
  addBlock(block)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Block Playlist -->
    <WorkoutBlockPlaylist
      v-if="hasBlocks"
      :blocks="blocks"
      :selected-index="selectedBlockIndex"
      @select="selectBlock"
      @edit="selectBlock"
      @remove="removeBlockByIndex"
      @reorder="reorderBlocks"
      @add-block="openAddBlockDialog"
    />

    <!-- Empty State -->
    <Empty v-if="!hasBlocks" class="border-0 py-8">
      <EmptyContent>
        <EmptyMedia variant="icon" class="bg-primary/10 text-primary">
          <Dumbbell class="icon-lg" aria-hidden="true" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{{ t('logPastWorkout.noBlocks', 'No exercises yet') }}</EmptyTitle>
          <EmptyDescription>
            {{ t('logPastWorkout.noBlocksDescription', 'Add exercises to log your past workout') }}
          </EmptyDescription>
        </EmptyHeader>
        <Button class="gap-2" @click="openAddBlockDialog">
          <Dumbbell class="icon-sm" aria-hidden="true" />
          {{ t('logPastWorkout.addFirstBlock', 'Add First Exercise') }}
        </Button>
      </EmptyContent>
    </Empty>

    <!-- Dialogs -->
    <WorkoutBlockDialogs
      v-model:add-block-open="addBlockDialogOpen"
      v-model:amrap-open="configureAmrapOpen"
      v-model:emom-open="configureEmomOpen"
      v-model:tabata-open="configureTabataOpen"
      v-model:for-time-open="configureForTimeOpen"
      v-model:cardio-open="configureCardioOpen"
      @add-exercise="handleAddExercise"
      @add-timed-block="openTimedBlockDialog"
      @add-cardio-block="openCardioBlockDialog"
      @confirm-amrap="addAmrapBlock"
      @confirm-emom="addEmomBlock"
      @confirm-tabata="addTabataBlock"
      @confirm-for-time="addForTimeBlock"
      @confirm-cardio="addCardioBlock"
    />
  </div>
</template>
