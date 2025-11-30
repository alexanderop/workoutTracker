<script setup lang="ts">
import { Dumbbell, Plus } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import WorkoutAddBlockDialog from '@/components/workout/WorkoutAddBlockDialog.vue'
import WorkoutBlockCarousel from '@/components/workout/WorkoutBlockCarousel.vue'
import WorkoutCancelDialog from '@/components/workout/WorkoutCancelDialog.vue'
import WorkoutConfigureBlockDialog from '@/components/workout/WorkoutConfigureBlockDialog.vue'
import WorkoutEditExerciseDialog from '@/components/workout/WorkoutEditExerciseDialog.vue'
import WorkoutFinishDialog from '@/components/workout/WorkoutFinishDialog.vue'
import WorkoutHeader from '@/components/workout/WorkoutHeader.vue'
import WorkoutPreviousHistory from '@/components/workout/WorkoutPreviousHistory.vue'
import WorkoutSetTable from '@/components/workout/WorkoutSetTable.vue'
import WorkoutTimedBlockCard from '@/components/workout/WorkoutTimedBlockCard.vue'
import WorkoutTimedBlockFocusView from '@/components/workout/WorkoutTimedBlockFocusView.vue'
import WorkoutTimerWidget from '@/components/workout/WorkoutTimerWidget.vue'
import { useBlockTimer } from '@/composables/useBlockTimer'
import { useRestTimer } from '@/composables/useRestTimer'
import type { Set } from '@/composables/useWorkout'
import { getWorkoutRef, resetWorkout, useWorkout } from '@/composables/useWorkout'
import { useWorkoutPersistence } from '@/composables/useWorkoutPersistence'
import type {
  AmrapConfig,
  BlockExercise,
  EmomConfig,
  ForTimeConfig,
  TabataConfig,
  TimedBlockKind,
} from '@/types/blocks'
import { getBlockExerciseList, isTimedBlock } from '@/types/blocks'

const router = useRouter()
const {
  workout,
  selectedBlock,
  selectedExercise,
  selectBlock,
  completeSet,
  addExercise,
  removeBlock,
  updateExercise,
  addSet,
  removeSet,
  setSetCount,
  updateSetValue,
  reorderBlocks,
  addAmrapBlock,
  addEmomBlock,
  addTabataBlock,
  addForTimeBlock,
  setBlockResult,
} = useWorkout()

const restTimer = useRestTimer()
const blockTimer = useBlockTimer({
  onComplete: handleBlockTimerComplete,
})

// Initialize persistence for this workout session
const workoutRef = getWorkoutRef()
const {
  isInitialized,
  startNewWorkoutSession,
  markInitialized,
  completeWorkout,
  saveNow,
  discardActiveWorkout,
} = useWorkoutPersistence(workoutRef)

onMounted(() => {
  // If not already initialized (from resume), start a new session
  if (!isInitialized.value) {
    startNewWorkoutSession()
    return
  }
  markInitialized()
})

// Dialog states
const showAddBlock = ref(false)
const showEditExercise = ref(false)
const showFinishDialog = ref(false)
const showCancelDialog = ref(false)
const showConfigureBlock = ref(false)
const configuringBlockKind = ref<TimedBlockKind | null>(null)

// Focus mode for timed blocks (full-screen immersive timer)
const showTimedBlockFocus = ref(false)

// Computed helpers
const currentTimedBlock = computed(() => {
  if (!selectedBlock.value || !isTimedBlock(selectedBlock.value)) return null
  return selectedBlock.value
})

const isBlockTimerActive = computed(() => {
  return (
    blockTimer.isRunning.value || blockTimer.blockState.value?.state.timerState.status !== 'idle'
  )
})

// Handlers
async function handleConfirmFinish(name: string) {
  workout.value.name = name
  await saveNow()
  const completed = await completeWorkout()
  if (completed) {
    resetWorkout()
    router.push(`/workout/summary/${completed.id}`)
    return
  }
  router.push('/')
}

async function handleConfirmCancel() {
  await discardActiveWorkout()
  resetWorkout()
  router.push('/')
}

function handleSetComplete(set: Set) {
  const result = completeSet(set)

  switch (result.kind) {
    case 'completed':
      restTimer.start()
      break
    case 'uncompleted':
      break
  }
}

function handleSaveExercise(data: {
  name: string
  equipment: string
  targetReps: number
  setCount: number
}) {
  if (!selectedExercise.value) return
  updateExercise(data)
  setSetCount(workout.value.selectedBlockIndex, data.setCount)
}

// Block management
function handleAddTimedBlock(kind: TimedBlockKind) {
  configuringBlockKind.value = kind
  showConfigureBlock.value = true
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

// Timed block actions
function handleStartBlock() {
  if (!currentTimedBlock.value) return
  blockTimer.initializeBlock(currentTimedBlock.value)
  blockTimer.start()
  // Auto-open focus mode when starting a timed block
  showTimedBlockFocus.value = true
}

function handleCompleteBlock() {
  const result = blockTimer.complete()
  if (result && currentTimedBlock.value) {
    setBlockResult(workout.value.selectedBlockIndex, result)
  }
  // Close focus mode when block is completed
  showTimedBlockFocus.value = false
}

function handleIncrementRound() {
  blockTimer.incrementRound()
}

function handleBlockTimerComplete() {
  handleCompleteBlock()
}

// Initialize block timer when selecting a timed block
function handleSelectBlock(index: number) {
  // If switching away from an active timed block, complete it first
  if (isBlockTimerActive.value && currentTimedBlock.value) {
    handleCompleteBlock()
  }

  selectBlock(index)

  // Initialize timer for new timed block
  const newBlock = workout.value.blocks[index]
  if (newBlock && isTimedBlock(newBlock) && !newBlock.result) {
    blockTimer.initializeBlock(newBlock)
  }
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col">
    <!-- Header (only for strength blocks) -->
    <WorkoutHeader
      v-if="selectedExercise"
      :exercise-name="selectedExercise.name"
      :equipment="selectedExercise.equipment"
      :target-reps="selectedExercise.targetReps"
      @delete="removeBlock(workout.selectedBlockIndex)"
      @edit="showEditExercise = true"
    />

    <!-- Timed Block Header -->
    <div v-else-if="currentTimedBlock" class="px-4 pt-4 pb-2">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold">
            {{ currentTimedBlock.kind.toUpperCase() }}
          </h2>
          <p class="text-sm text-muted-foreground">
            {{ getBlockExerciseList(currentTimedBlock).length }}
            {{ getBlockExerciseList(currentTimedBlock).length === 1 ? 'exercise' : 'exercises' }}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          class="text-destructive"
          @click="removeBlock(workout.selectedBlockIndex)"
        >
          Remove
        </Button>
      </div>
    </div>

    <!-- Block Carousel -->
    <WorkoutBlockCarousel
      :blocks="workout.blocks"
      :selected-index="workout.selectedBlockIndex"
      @select="handleSelectBlock"
      @remove="removeBlock"
      @reorder="reorderBlocks"
      @add-block="showAddBlock = true"
    />

    <!-- Main Content -->
    <div class="flex-1 p-4 overflow-y-auto">
      <!-- Strength Block Content -->
      <template v-if="selectedExercise">
        <WorkoutSetTable
          :sets="selectedExercise.sets"
          @toggle-complete="handleSetComplete"
          @add-set="addSet(workout.selectedBlockIndex)"
          @remove-set="removeSet(workout.selectedBlockIndex, $event)"
          @update-set="updateSetValue"
        />

        <WorkoutPreviousHistory :sets="[]" />
      </template>

      <!-- Timed Block Content -->
      <template v-else-if="currentTimedBlock">
        <WorkoutTimedBlockCard
          :block="currentTimedBlock"
          :is-active="isBlockTimerActive"
          :is-running="blockTimer.isRunning.value"
          @start="handleStartBlock"
          @increment-round="handleIncrementRound"
          @expand-focus="showTimedBlockFocus = true"
        />
      </template>

      <!-- Empty State -->
      <Empty
        v-else
        class="animate-in fade-in-50 duration-500 h-full flex items-center justify-center border-0"
      >
        <EmptyContent>
          <EmptyMedia variant="icon" class="bg-primary/10 text-primary">
            <Dumbbell class="size-6" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Start Your Workout</EmptyTitle>
            <EmptyDescription>
              Add exercises or timed blocks to begin tracking your session.
            </EmptyDescription>
          </EmptyHeader>
          <Button class="gap-2" @click="showAddBlock = true">
            <Plus class="size-4" />
            Add First Block
          </Button>
        </EmptyContent>
      </Empty>
    </div>

    <!-- Timer Widget -->
    <WorkoutTimerWidget
      :block="selectedBlock"
      :block-timer="blockTimer"
      :rest-timer="restTimer"
      @finish="showFinishDialog = true"
      @cancel="showCancelDialog = true"
      @start-block="handleStartBlock"
      @complete-block="handleCompleteBlock"
      @increment-round="handleIncrementRound"
    />

    <!-- Add Block Dialog -->
    <WorkoutAddBlockDialog
      :open="showAddBlock"
      @update:open="showAddBlock = $event"
      @add-exercise="addExercise"
      @add-timed-block="handleAddTimedBlock"
    />

    <!-- Configure Block Dialog -->
    <WorkoutConfigureBlockDialog
      :open="showConfigureBlock"
      :block-kind="configuringBlockKind"
      @update:open="showConfigureBlock = $event"
      @confirm-amrap="handleConfirmAmrap"
      @confirm-emom="handleConfirmEmom"
      @confirm-tabata="handleConfirmTabata"
      @confirm-fortime="handleConfirmForTime"
    />

    <!-- Edit Exercise Dialog -->
    <WorkoutEditExerciseDialog
      v-if="selectedExercise"
      :open="showEditExercise"
      :exercise-name="selectedExercise.name"
      :equipment="selectedExercise.equipment"
      :target-reps="selectedExercise.targetReps"
      :set-count="selectedExercise.sets.length"
      @update:open="showEditExercise = $event"
      @save="handleSaveExercise"
    />

    <!-- Finish Workout Confirmation Dialog -->
    <WorkoutFinishDialog v-model:open="showFinishDialog" @confirm="handleConfirmFinish" />

    <!-- Cancel Workout Confirmation Dialog -->
    <WorkoutCancelDialog v-model:open="showCancelDialog" @confirm="handleConfirmCancel" />

    <!-- Focus Mode for Timed Blocks -->
    <WorkoutTimedBlockFocusView
      v-if="showTimedBlockFocus && currentTimedBlock"
      :block="currentTimedBlock"
      :block-timer="blockTimer"
      @complete-block="handleCompleteBlock"
      @increment-round="handleIncrementRound"
      @end-workout="showCancelDialog = true"
      @collapse="showTimedBlockFocus = false"
    />
  </div>
</template>
