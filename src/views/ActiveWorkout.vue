<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDialogState } from '@/composables/useDialogState'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/router'
import WorkoutActiveMode from '@/features/workout/components/WorkoutActiveMode.vue'
import WorkoutCompletionScreen from '@/features/workout/components/WorkoutCompletionScreen.vue'
import WorkoutBuilderMode from '@/features/workout/components/WorkoutBuilderMode.vue'
import WorkoutCancelDialog from '@/features/workout/components/WorkoutCancelDialog.vue'
import { WorkoutBlockDialogs } from '@/components/blocks'
import WorkoutEditExerciseDialog from '@/features/workout/components/WorkoutEditExerciseDialog.vue'
import type { ExerciseEditData } from '@/features/workout/components/WorkoutEditExerciseDialog.vue'
import WorkoutFinishDialog from '@/features/workout/components/WorkoutFinishDialog.vue'
import WorkoutQueueDrawer from '@/features/workout/components/WorkoutQueueDrawer.vue'
import { useWorkout } from '@/features/workout/composables/useWorkout'
import { getWorkoutRef, resetWorkout } from '@/stores/workoutState'
import { useWorkoutMode } from '@/features/workout/composables/useWorkoutMode'
import { useWorkoutPersistence } from '@/features/workout/composables/useWorkoutPersistence'
import {
  useWorkoutBlockDialogs,
  type WorkoutBlockDialog,
} from '@/composables/useWorkoutBlockDialogs'
import { isStrengthBlock } from '@/blocks'

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
const workoutReference = getWorkoutRef()
const {
  isInitialized,
  startNewWorkoutSession,
  markInitialized,
  completeWorkout,
  saveNow,
  discardActiveWorkout,
} = useWorkoutPersistence(workoutReference)

onMounted(() => {
  // If not already initialized (from resume), start a new session
  if (!isInitialized.value) {
    startNewWorkoutSession()
    return
  }
  markInitialized()
})

// Dialog state
type WorkoutDialog = WorkoutBlockDialog | 'editExercise' | 'finish' | 'cancel'

const { createDialogModel, open: openDialog } = useDialogState<WorkoutDialog>()

const editExerciseDialogOpen = createDialogModel('editExercise')
const finishDialogOpen = createDialogModel('finish')
const cancelDialogOpen = createDialogModel('cancel')
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
} = useWorkoutBlockDialogs({ createDialogModel, open: openDialog })

const editingBlockIndex = ref<number | null>(null)
const queueDrawerOpen = ref(false)

// Duration for finish dialog (in minutes, pre-filled with elapsed time)
const finishDurationMinutes = ref(0)

// Track completion data for the completion screen
const completionData = ref<{ name: string; duration: number; id: string } | null>(null)

// Computed for exercise edit dialog
const selectedExerciseData = computed<ExerciseEditData | null>(() => {
  if (!selectedExercise.value) return null
  return {
    exerciseDefinitionId: selectedExercise.value.exerciseDefinitionId,
    targetReps: selectedExercise.value.targetReps,
    targetDuration: selectedExercise.value.targetDuration,
    targetWeight: selectedExercise.value.targetWeight,
    setCount: selectedExercise.value.sets.length,
  }
})

// Handlers for finish/cancel
async function handleConfirmFinish(name: string, durationSeconds: number) {
  workout.value.name = name
  await saveNow()

  // Enter completion mode to show the completion screen
  enterCompletionMode()

  const completed = await completeWorkout('', durationSeconds)
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

function handleSaveExercise(data: ExerciseEditData) {
  if (!selectedExercise.value) return
  updateExercise({
    targetReps: data.targetReps,
    targetDuration: data.targetDuration,
    targetWeight: data.targetWeight,
  })
  setSetCount(workout.value.selectedBlockIndex, data.setCount)
}

function openFinishDialog() {
  // Calculate elapsed time in minutes for the finish dialog
  const elapsedMs = Date.now() - workout.value.startedAt
  finishDurationMinutes.value = Math.round(elapsedMs / 60_000)
  openDialog('finish')
}

async function handleWorkoutComplete() {
  openFinishDialog()
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
  openAddBlockDialog()
}
</script>

<template>
  <div class="h-full">
    <!-- Builder Mode -->
    <WorkoutBuilderMode
      v-if="isBuilderMode"
      @add-block="openAddBlockDialog"
      @edit-block="handleEditBlock"
    />

    <!-- Active Mode -->
    <WorkoutActiveMode
      v-if="isActiveMode"
      @end-workout="openFinishDialog"
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

    <!-- Dialogs (shared across modes) -->
    <WorkoutBlockDialogs
      v-model:add-block-open="addBlockDialogOpen"
      v-model:amrap-open="configureAmrapOpen"
      v-model:emom-open="configureEmomOpen"
      v-model:tabata-open="configureTabataOpen"
      v-model:for-time-open="configureForTimeOpen"
      v-model:cardio-open="configureCardioOpen"
      @add-exercise="(exercise) => addExercise(exercise.id ?? exercise.name, exercise.name)"
      @add-timed-block="openTimedBlockDialog"
      @add-cardio-block="openCardioBlockDialog"
      @confirm-amrap="addAmrapBlock"
      @confirm-emom="addEmomBlock"
      @confirm-tabata="addTabataBlock"
      @confirm-for-time="addForTimeBlock"
      @confirm-cardio="addCardioBlock"
    />

    <WorkoutEditExerciseDialog
      v-if="selectedExerciseData"
      v-model:open="editExerciseDialogOpen"
      :exercise="selectedExerciseData"
      @save="handleSaveExercise"
    />

    <WorkoutFinishDialog
      v-model:open="finishDialogOpen"
      v-model:duration-minutes="finishDurationMinutes"
      @confirm="handleConfirmFinish"
    />

    <WorkoutCancelDialog v-model:open="cancelDialogOpen" @confirm="handleConfirmCancel" />

    <!-- Queue Drawer (active mode) -->
    <WorkoutQueueDrawer v-model:open="queueDrawerOpen" @add-block="handleQueueAddBlock" />
  </div>
</template>
