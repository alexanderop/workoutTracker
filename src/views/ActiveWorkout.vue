<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDialogState } from '@/composables/useDialogState'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/router'
import WorkoutActiveMode from '@/features/workout/components/WorkoutActiveMode.vue'
import WorkoutCompletionScreen from '@/features/workout/components/WorkoutCompletionScreen.vue'
import WorkoutAddBlockDialog from '@/features/workout/components/WorkoutAddBlockDialog.vue'
import WorkoutBuilderMode from '@/features/workout/components/WorkoutBuilderMode.vue'
import WorkoutCancelDialog from '@/components/WorkoutCancelDialog.vue'
import WorkoutConfigureAmrapDialog from '@/features/workout/components/WorkoutConfigureAmrapDialog.vue'
import WorkoutConfigureEmomDialog from '@/features/workout/components/WorkoutConfigureEmomDialog.vue'
import WorkoutConfigureForTimeDialog from '@/features/workout/components/WorkoutConfigureForTimeDialog.vue'
import WorkoutConfigureTabataDialog from '@/features/workout/components/WorkoutConfigureTabataDialog.vue'
import WorkoutConfigureCardioDialog from '@/features/workout/components/WorkoutConfigureCardioDialog.vue'
import WorkoutEditExerciseDialog from '@/features/workout/components/WorkoutEditExerciseDialog.vue'
import type { ExerciseEditData } from '@/features/workout/components/WorkoutEditExerciseDialog.vue'
import WorkoutFinishDialog from '@/components/WorkoutFinishDialog.vue'
import WorkoutQueueDrawer from '@/features/workout/components/WorkoutQueueDrawer.vue'
import { getWorkoutRef, resetWorkout, useWorkout } from '@/features/workout/composables/useWorkout'
import { useWorkoutMode } from '@/features/workout/composables/useWorkoutMode'
import { useWorkoutPersistence } from '@/features/workout/composables/useWorkoutPersistence'
import type {
  AmrapConfig,
  BlockExercise,
  CardioConfig,
  EmomConfig,
  ForTimeConfig,
  TabataConfig,
  TimedBlockKind,
} from '@/types/blocks'
import { isStrengthBlock } from '@/types/blocks'

const router = useRouter()
const {
  workout,
  selectedExercise,
  addExercise,
  updateExercise,
  setSetCount,
  addAmrapBlock,
  addEmomBlock,
  addTabataBlock,
  addForTimeBlock,
  addCardioBlock,
} = useWorkout()

const { isBuilderMode, isActiveMode, isCompletedMode, enterCompletionMode } = useWorkoutMode()

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

// Dialog state
type WorkoutDialog =
  | 'addBlock'
  | 'editExercise'
  | 'finish'
  | 'cancel'
  | 'configureAmrap'
  | 'configureEmom'
  | 'configureTabata'
  | 'configureForTime'
  | 'configureCardio'

const { createDialogModel, open: openDialog } = useDialogState<WorkoutDialog>()

const addBlockDialogOpen = createDialogModel('addBlock')
const editExerciseDialogOpen = createDialogModel('editExercise')
const finishDialogOpen = createDialogModel('finish')
const cancelDialogOpen = createDialogModel('cancel')
const configureAmrapOpen = createDialogModel('configureAmrap')
const configureEmomOpen = createDialogModel('configureEmom')
const configureTabataOpen = createDialogModel('configureTabata')
const configureForTimeOpen = createDialogModel('configureForTime')
const configureCardioOpen = createDialogModel('configureCardio')

const editingBlockIndex = ref<number | null>(null)
const queueDrawerOpen = ref(false)

// Track completion data for the completion screen
const completionData = ref<{ name: string; duration: number; id: string } | null>(null)

// Computed for exercise edit dialog
const selectedExerciseData = computed<ExerciseEditData | null>(() => {
  if (!selectedExercise.value) return null
  return {
    targetReps: selectedExercise.value.targetReps,
    setCount: selectedExercise.value.sets.length,
  }
})

// Handlers for finish/cancel
async function handleConfirmFinish(name: string) {
  workout.value.name = name
  await saveNow()

  // Enter completion mode to show the completion screen
  enterCompletionMode()

  const completed = await completeWorkout()
  if (completed) {
    // Store data for completion screen, wait for user to proceed
    completionData.value = {
      name,
      duration: completed.durationSeconds,
      id: completed.id,
    }
    return
  }

  // Fallback if completion fails
  resetWorkout()
  router.push({ name: RouteNames.Home })
}

// Handler for completion screen button
function handleViewDetails() {
  if (!completionData.value) return
  const id = completionData.value.id
  resetWorkout()
  router.push({ name: RouteNames.WorkoutSummary, params: { id } })
}

async function handleConfirmCancel() {
  await discardActiveWorkout()
  resetWorkout()
  router.push({ name: RouteNames.Home })
}

// Block management handlers
function handleAddTimedBlock(kind: TimedBlockKind) {
  const dialogMap: Record<TimedBlockKind, WorkoutDialog> = {
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

function handleSaveExercise(data: ExerciseEditData) {
  if (!selectedExercise.value) return
  updateExercise({ targetReps: data.targetReps })
  setSetCount(workout.value.selectedBlockIndex, data.setCount)
}

async function handleWorkoutComplete() {
  openDialog('finish')
}

function handleEditBlock(index: number) {
  const block = workout.value.blocks[index]
  if (!block) return

  if (isStrengthBlock(block)) {
    editingBlockIndex.value = index
    openDialog('editExercise')
  }
}

function handleOpenQueue() {
  queueDrawerOpen.value = true
}

function handleQueueAddBlock() {
  queueDrawerOpen.value = false
  openDialog('addBlock')
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 mx-auto w-full max-w-5xl">
      <!-- Builder Mode -->
      <WorkoutBuilderMode
        v-if="isBuilderMode"
        @add-block="openDialog('addBlock')"
        @edit-block="handleEditBlock"
      />

      <!-- Active Mode -->
      <WorkoutActiveMode
        v-if="isActiveMode"
        @end-workout="openDialog('finish')"
        @cancel-workout="openDialog('cancel')"
        @workout-complete="handleWorkoutComplete"
        @open-queue="handleOpenQueue"
      />

      <!-- Completed Mode -->
      <WorkoutCompletionScreen
        v-if="isCompletedMode && completionData"
        :workout-name="completionData.name"
        :duration="completionData.duration"
        @view-details="handleViewDetails"
      />
    </div>

    <!-- Dialogs (shared across modes) -->
    <WorkoutAddBlockDialog
      v-model:open="addBlockDialogOpen"
      @add-exercise="(id, name) => addExercise(id, name)"
      @add-timed-block="handleAddTimedBlock"
      @add-cardio-block="handleAddCardioBlock"
    />

    <WorkoutConfigureAmrapDialog
      v-model:open="configureAmrapOpen"
      @confirm="handleConfirmAmrap"
    />
    <WorkoutConfigureEmomDialog
      v-model:open="configureEmomOpen"
      @confirm="handleConfirmEmom"
    />
    <WorkoutConfigureTabataDialog
      v-model:open="configureTabataOpen"
      @confirm="handleConfirmTabata"
    />
    <WorkoutConfigureForTimeDialog
      v-model:open="configureForTimeOpen"
      @confirm="handleConfirmForTime"
    />
    <WorkoutConfigureCardioDialog
      v-model:open="configureCardioOpen"
      @confirm="handleConfirmCardio"
    />

    <WorkoutEditExerciseDialog
      v-if="selectedExerciseData"
      v-model:open="editExerciseDialogOpen"
      :exercise="selectedExerciseData"
      @save="handleSaveExercise"
    />

    <WorkoutFinishDialog
      v-model:open="finishDialogOpen"
      @confirm="handleConfirmFinish"
    />

    <WorkoutCancelDialog
      v-model:open="cancelDialogOpen"
      @confirm="handleConfirmCancel"
    />

    <!-- Queue Drawer (active mode) -->
    <WorkoutQueueDrawer
      v-model:open="queueDrawerOpen"
      @add-block="handleQueueAddBlock"
    />
  </div>
</template>
