<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/router'
import WorkoutActiveMode from '@/features/workout/components/WorkoutActiveMode.vue'
import WorkoutAddBlockDialog from '@/features/workout/components/WorkoutAddBlockDialog.vue'
import WorkoutBuilderMode from '@/features/workout/components/WorkoutBuilderMode.vue'
import WorkoutCancelDialog from '@/features/workout/components/WorkoutCancelDialog.vue'
import WorkoutConfigureAmrapDialog from '@/features/workout/components/WorkoutConfigureAmrapDialog.vue'
import WorkoutConfigureEmomDialog from '@/features/workout/components/WorkoutConfigureEmomDialog.vue'
import WorkoutConfigureForTimeDialog from '@/features/workout/components/WorkoutConfigureForTimeDialog.vue'
import WorkoutConfigureTabataDialog from '@/features/workout/components/WorkoutConfigureTabataDialog.vue'
import WorkoutEditExerciseDialog from '@/features/workout/components/WorkoutEditExerciseDialog.vue'
import type { ExerciseEditData } from '@/features/workout/components/WorkoutEditExerciseDialog.vue'
import WorkoutFinishDialog from '@/features/workout/components/WorkoutFinishDialog.vue'
import WorkoutQueueDrawer from '@/features/workout/components/WorkoutQueueDrawer.vue'
import { getWorkoutRef, resetWorkout, useWorkout } from '@/features/workout/composables/useWorkout'
import { useWorkoutMode } from '@/features/workout/composables/useWorkoutMode'
import { useWorkoutPersistence } from '@/features/workout/composables/useWorkoutPersistence'
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
type ActiveDialog =
  | 'addBlock'
  | 'editExercise'
  | 'finish'
  | 'cancel'
  | 'configureAmrap'
  | 'configureEmom'
  | 'configureTabata'
  | 'configureForTime'
  | null

const activeDialog = ref<ActiveDialog>(null)
const editingBlockIndex = ref<number | null>(null)
const queueDrawerOpen = ref(false)

// Computed for exercise edit dialog
const selectedExerciseData = computed<ExerciseEditData | null>(() => {
  if (!selectedExercise.value) return null
  return {
    name: selectedExercise.value.name,
    equipment: selectedExercise.value.equipment,
    targetReps: selectedExercise.value.targetReps,
    setCount: selectedExercise.value.sets.length,
  }
})

const editExerciseDialogOpen = computed({
  get: () => activeDialog.value === 'editExercise',
  set: (value: boolean) => {
    activeDialog.value = value ? 'editExercise' : null
  },
})

const addBlockDialogOpen = computed({
  get: () => activeDialog.value === 'addBlock',
  set: (value: boolean) => {
    activeDialog.value = value ? 'addBlock' : null
  },
})

// Handlers for finish/cancel
async function handleConfirmFinish(name: string) {
  workout.value.name = name
  await saveNow()
  const completed = await completeWorkout()
  if (completed) {
    resetWorkout()
    router.push({ name: RouteNames.WorkoutSummary, params: { id: completed.id } })
    return
  }
  router.push({ name: RouteNames.Home })
}

async function handleConfirmCancel() {
  await discardActiveWorkout()
  resetWorkout()
  router.push({ name: RouteNames.Home })
}

// Block management handlers
function handleAddTimedBlock(kind: TimedBlockKind) {
  const dialogMap: Record<TimedBlockKind, ActiveDialog> = {
    amrap: 'configureAmrap',
    emom: 'configureEmom',
    tabata: 'configureTabata',
    fortime: 'configureForTime',
  }
  activeDialog.value = dialogMap[kind]
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
    activeDialog.value = 'editExercise'
  }
}

function handleOpenQueue() {
  queueDrawerOpen.value = true
}

function handleQueueAddBlock() {
  queueDrawerOpen.value = false
  activeDialog.value = 'addBlock'
}
</script>

<template>
  <div class="h-full">
    <!-- Builder Mode -->
    <WorkoutBuilderMode
      v-if="isBuilderMode"
      @add-block="activeDialog = 'addBlock'"
      @edit-block="handleEditBlock"
    />

    <!-- Active Mode -->
    <WorkoutActiveMode
      v-if="isActiveMode"
      @end-workout="activeDialog = 'finish'"
      @cancel-workout="activeDialog = 'cancel'"
      @workout-complete="activeDialog = 'finish'"
      @open-queue="handleOpenQueue"
    />

    <!-- Dialogs (shared across modes) -->
    <WorkoutAddBlockDialog
      v-model:open="addBlockDialogOpen"
      @add-exercise="(id, name) => addExercise(id, name)"
      @add-timed-block="handleAddTimedBlock"
    />

    <WorkoutConfigureAmrapDialog
      :open="activeDialog === 'configureAmrap'"
      @update:open="activeDialog = $event ? 'configureAmrap' : null"
      @confirm="handleConfirmAmrap"
    />
    <WorkoutConfigureEmomDialog
      :open="activeDialog === 'configureEmom'"
      @update:open="activeDialog = $event ? 'configureEmom' : null"
      @confirm="handleConfirmEmom"
    />
    <WorkoutConfigureTabataDialog
      :open="activeDialog === 'configureTabata'"
      @update:open="activeDialog = $event ? 'configureTabata' : null"
      @confirm="handleConfirmTabata"
    />
    <WorkoutConfigureForTimeDialog
      :open="activeDialog === 'configureForTime'"
      @update:open="activeDialog = $event ? 'configureForTime' : null"
      @confirm="handleConfirmForTime"
    />

    <WorkoutEditExerciseDialog
      v-if="selectedExerciseData"
      v-model:open="editExerciseDialogOpen"
      :exercise="selectedExerciseData"
      @save="handleSaveExercise"
    />

    <WorkoutFinishDialog
      :open="activeDialog === 'finish'"
      @update:open="activeDialog = $event ? 'finish' : null"
      @confirm="handleConfirmFinish"
    />

    <WorkoutCancelDialog
      :open="activeDialog === 'cancel'"
      @update:open="activeDialog = $event ? 'cancel' : null"
      @confirm="handleConfirmCancel"
    />

    <!-- Queue Drawer (active mode) -->
    <WorkoutQueueDrawer v-model:open="queueDrawerOpen" @add-block="handleQueueAddBlock" />
  </div>
</template>
