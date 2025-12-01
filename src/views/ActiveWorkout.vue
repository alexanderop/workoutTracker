<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import WorkoutActiveMode from '@/components/workout/WorkoutActiveMode.vue'
import WorkoutAddBlockDialog from '@/components/workout/WorkoutAddBlockDialog.vue'
import WorkoutBuilderMode from '@/components/workout/WorkoutBuilderMode.vue'
import WorkoutCancelDialog from '@/components/workout/WorkoutCancelDialog.vue'
import WorkoutConfigureBlockDialog from '@/components/workout/WorkoutConfigureBlockDialog.vue'
import WorkoutEditExerciseDialog from '@/components/workout/WorkoutEditExerciseDialog.vue'
import WorkoutFinishDialog from '@/components/workout/WorkoutFinishDialog.vue'
import { getWorkoutRef, resetWorkout, useWorkout } from '@/composables/useWorkout'
import { useWorkoutMode } from '@/composables/useWorkoutMode'
import { useWorkoutPersistence } from '@/composables/useWorkoutPersistence'
import { useWorkoutWakeLock } from '@/composables/useWorkoutWakeLock'
import type {
  AmrapConfig,
  BlockExercise,
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
} = useWorkout()

const { isBuilderMode, isActiveMode } = useWorkoutMode()

// Keep screen awake during active workouts
useWorkoutWakeLock()

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
const editingBlockIndex = ref<number | null>(null)

// Handlers for finish/cancel
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

// Block management handlers
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

function handleEditBlock(index: number) {
  const block = workout.value.blocks[index]
  if (!block) return

  if (isStrengthBlock(block)) {
    editingBlockIndex.value = index
    showEditExercise.value = true
  }
}
</script>

<template>
  <div class="h-full">
    <!-- Builder Mode -->
    <WorkoutBuilderMode
      v-if="isBuilderMode"
      @add-block="showAddBlock = true"
      @edit-block="handleEditBlock"
    />

    <!-- Active Mode -->
    <WorkoutActiveMode
      v-if="isActiveMode"
      @end-workout="showFinishDialog = true"
      @cancel-workout="showCancelDialog = true"
      @workout-complete="showFinishDialog = true"
    />

    <!-- Dialogs (shared across modes) -->
    <WorkoutAddBlockDialog
      :open="showAddBlock"
      @update:open="showAddBlock = $event"
      @add-exercise="addExercise"
      @add-timed-block="handleAddTimedBlock"
    />

    <WorkoutConfigureBlockDialog
      :open="showConfigureBlock"
      :block-kind="configuringBlockKind"
      @update:open="showConfigureBlock = $event"
      @confirm-amrap="handleConfirmAmrap"
      @confirm-emom="handleConfirmEmom"
      @confirm-tabata="handleConfirmTabata"
      @confirm-fortime="handleConfirmForTime"
    />

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

    <WorkoutFinishDialog v-model:open="showFinishDialog" @confirm="handleConfirmFinish" />

    <WorkoutCancelDialog v-model:open="showCancelDialog" @confirm="handleConfirmCancel" />
  </div>
</template>
