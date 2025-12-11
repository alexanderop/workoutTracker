<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/router'
import BenchmarkActiveMode from '@/features/benchmarks/components/BenchmarkActiveMode.vue'
import BenchmarkExerciseQueueDrawer from '@/features/benchmarks/components/BenchmarkExerciseQueueDrawer.vue'
import WorkoutFinishDialog from '@/features/workout/components/WorkoutFinishDialog.vue'
import WorkoutCancelDialog from '@/features/workout/components/WorkoutCancelDialog.vue'
import { useDialogState } from '@/composables/useDialogState'
import { useBenchmarkGlobalTimer } from '@/composables/timers/useBenchmarkGlobalTimer'
import { getBenchmarkWorkoutRef, resetBenchmarkWorkout, restoreBenchmarkWorkout } from '@/features/benchmarks/state/benchmarkState'
import { useBenchmarkPersistence } from '@/features/benchmarks/composables/useBenchmarkPersistence'
import { useBenchmarkMode } from '@/features/benchmarks/composables/useBenchmarkMode'
import { getRepositoryProvider } from '@/db/provider'

const router = useRouter()
const benchmarkWorkoutRef = getBenchmarkWorkoutRef()

// Initialize persistence
const {
  loadActiveBenchmark,
  hasActiveBenchmark,
  saveNow,
  completeBenchmark,
  discardActiveBenchmark,
} = useBenchmarkPersistence(benchmarkWorkoutRef)

// Initialize global timer for benchmark
const benchmarkTimer = useBenchmarkGlobalTimer()

// Get benchmark mode composable
const { enterActiveMode } = useBenchmarkMode()

onMounted(async () => {
  // Load saved benchmark if exists
  if (await hasActiveBenchmark()) {
    const savedWorkout = await loadActiveBenchmark()
    if (savedWorkout) {
      restoreBenchmarkWorkout(savedWorkout)

      // Enter active mode if not already (benchmarks skip builder mode)
      if (savedWorkout.mode !== 'active') {
        enterActiveMode()
      }

      // Restore timer from globalTimerStartedAt if in active mode
      if (savedWorkout.globalTimerStartedAt) {
        benchmarkTimer.initializeFromWorkout(savedWorkout.globalTimerStartedAt)
      }
    }
  }
})

// Watch for mode change to active and start timer
// This handles the case where a benchmark is started fresh (not loaded from DB)
watch(
  () => benchmarkWorkoutRef.value.mode,
  (mode) => {
    if (mode === 'active') {
      const globalTimerStartedAt = benchmarkWorkoutRef.value.globalTimerStartedAt
      if (globalTimerStartedAt && !benchmarkTimer.isRunning.value) {
        benchmarkTimer.initializeFromWorkout(globalTimerStartedAt)
      }
    }
  }
)

// Dialog state
type BenchmarkDialog = 'finish' | 'cancel'
const { createDialogModel, open: openDialog } = useDialogState<BenchmarkDialog>()

const finishDialogOpen = createDialogModel('finish')
const cancelDialogOpen = createDialogModel('cancel')
const queueDrawerOpen = ref(false)

// Benchmark type detection for queue drawer
const benchmarkType = computed<'fortime' | 'rounds'>(() => {
  // ForTime benchmarks have 1 block, Rounds benchmarks have multiple blocks
  return benchmarkWorkoutRef.value.blocks.length === 1 ? 'fortime' : 'rounds'
})

const firstBlockExercises = computed(() => {
  const firstBlock = benchmarkWorkoutRef.value.blocks[0]
  if (!firstBlock || firstBlock.kind !== 'fortime') return []
  return firstBlock.exercises
})

// Completion handler
async function handleConfirmFinish(name: string) {
  const workout = benchmarkWorkoutRef.value
  workout.name = name
  await saveNow()

  // Complete benchmark and save to completed workouts
  const completed = await completeBenchmark()

  if (completed) {
    resetBenchmarkWorkout()

    // Navigate to WorkoutSummary (reuse existing view)
    router.push({ name: RouteNames.WorkoutSummary, params: { id: completed.id } })

    // Update benchmark lastUsedAt timestamp
    const benchmarksRepo = getRepositoryProvider().benchmarks
    await benchmarksRepo.updateLastUsed(workout.benchmarkId)
    return
  }

  console.error('Failed to complete benchmark')
  router.push({ name: RouteNames.Home })
}

// Discard handler
async function handleConfirmCancel() {
  await discardActiveBenchmark()
  resetBenchmarkWorkout()
  router.push({ name: RouteNames.Workouts })
}

// Workout complete handler (auto-finish for benchmarks)
async function handleWorkoutComplete() {
  // For benchmarks, skip the naming dialog (name already set)
  await handleConfirmFinish(benchmarkWorkoutRef.value.name)
}

function handleOpenQueue() {
  queueDrawerOpen.value = true
}
</script>

<template>
  <div class="h-full">
    <!-- Active Mode -->
    <BenchmarkActiveMode
      @end-workout="openDialog('finish')"
      @cancel-workout="openDialog('cancel')"
      @workout-complete="handleWorkoutComplete"
      @open-queue="handleOpenQueue"
    />

    <!-- Dialogs -->
    <WorkoutFinishDialog
      v-model:open="finishDialogOpen"
      @confirm="handleConfirmFinish"
    />

    <WorkoutCancelDialog
      v-model:open="cancelDialogOpen"
      @confirm="handleConfirmCancel"
    />

    <!-- Benchmark Exercise Queue Drawer -->
    <BenchmarkExerciseQueueDrawer
      v-model:open="queueDrawerOpen"
      :benchmark-type="benchmarkType"
      :total-blocks="benchmarkWorkoutRef.blocks.length"
      :exercises="firstBlockExercises"
      :current-block-index="benchmarkWorkoutRef.selectedBlockIndex"
      :current-exercise-index="benchmarkWorkoutRef.activeExerciseIndex ?? 0"
    />
  </div>
</template>
