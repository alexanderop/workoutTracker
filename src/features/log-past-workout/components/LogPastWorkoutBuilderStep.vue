<script setup lang="ts">
import { computed } from 'vue'
import { Dumbbell } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { useDialogState } from '@/composables/useDialogState'
import type { Exercise } from '@/composables/useExerciseSearch'
import {
  AddBlockDialog,
  ConfigureAmrapDialog,
  ConfigureEmomDialog,
  ConfigureTabataDialog,
  ConfigureForTimeDialog,
  ConfigureCardioDialog,
} from '@/components/blocks'
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
import type {
  AmrapConfig,
  BlockExercise,
  CardioConfig,
  EmomConfig,
  ForTimeConfig,
  StrengthBlock,
  TabataConfig,
  TimedBlockKind,
} from '@/types/blocks'

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

// Dialog state
type PastWorkoutDialog =
  | 'addBlock'
  | 'configureAmrap'
  | 'configureEmom'
  | 'configureTabata'
  | 'configureForTime'
  | 'configureCardio'

const { createDialogModel, open: openDialog } = useDialogState<PastWorkoutDialog>()

const addBlockDialogOpen = createDialogModel('addBlock')
const configureAmrapOpen = createDialogModel('configureAmrap')
const configureEmomOpen = createDialogModel('configureEmom')
const configureTabataOpen = createDialogModel('configureTabata')
const configureForTimeOpen = createDialogModel('configureForTime')
const configureCardioOpen = createDialogModel('configureCardio')

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

function handleAddTimedBlock(kind: TimedBlockKind) {
  const dialogMap: Record<TimedBlockKind, PastWorkoutDialog> = {
    amrap: 'configureAmrap',
    emom: 'configureEmom',
    tabata: 'configureTabata',
    fortime: 'configureForTime',
  }
  openDialog(dialogMap[kind])
}

function handleConfirmAmrap(config: AmrapConfig, exercises: ReadonlyArray<BlockExercise>) {
  addAmrapBlock(config, exercises)
}

function handleConfirmEmom(config: EmomConfig, exercises: ReadonlyArray<BlockExercise>) {
  addEmomBlock(config, exercises)
}

function handleConfirmTabata(config: TabataConfig, exercise: BlockExercise) {
  addTabataBlock(config, exercise)
}

function handleConfirmForTime(config: ForTimeConfig, exercises: ReadonlyArray<BlockExercise>) {
  addForTimeBlock(config, exercises)
}

function handleAddCardioBlock() {
  openDialog('configureCardio')
}

function handleConfirmCardio(config: CardioConfig) {
  addCardioBlock(config)
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
      @add-block="openDialog('addBlock')"
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
        <Button class="gap-2" @click="openDialog('addBlock')">
          <Dumbbell class="icon-sm" aria-hidden="true" />
          {{ t('logPastWorkout.addFirstBlock', 'Add First Exercise') }}
        </Button>
      </EmptyContent>
    </Empty>

    <!-- Dialogs -->
    <AddBlockDialog
      v-model:open="addBlockDialogOpen"
      @add-exercise="handleAddExercise"
      @add-timed-block="handleAddTimedBlock"
      @add-cardio-block="handleAddCardioBlock"
    />

    <ConfigureAmrapDialog
      v-model:open="configureAmrapOpen"
      @confirm="handleConfirmAmrap"
    />
    <ConfigureEmomDialog
      v-model:open="configureEmomOpen"
      @confirm="handleConfirmEmom"
    />
    <ConfigureTabataDialog
      v-model:open="configureTabataOpen"
      @confirm="handleConfirmTabata"
    />
    <ConfigureForTimeDialog
      v-model:open="configureForTimeOpen"
      @confirm="handleConfirmForTime"
    />
    <ConfigureCardioDialog
      v-model:open="configureCardioOpen"
      @confirm="handleConfirmCardio"
    />
  </div>
</template>
