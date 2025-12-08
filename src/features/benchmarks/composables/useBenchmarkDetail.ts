import { onMounted, ref } from 'vue'
import { getActiveWorkoutRepository, getBenchmarksRepository } from '@/db'
import { dbToWorkout } from '@/db/converters'
import { restoreWorkout } from '@/stores/workoutState'
import { tryCatch } from '@/lib/tryCatch'
import type { DbBenchmark } from '@/db/schema'
import type { BenchmarkFormExercise } from './useBenchmarkForm'

// ============================================
// Types
// ============================================

type BenchmarkDetailState =
  | { status: 'loading' }
  | { status: 'success'; benchmark: DbBenchmark }
  | { status: 'not-found' }
  | { status: 'error'; error: Error }

type BenchmarkFormState = {
  name: string
  type: 'fortime' | 'rounds'
  rounds: number
  exercises: Array<BenchmarkFormExercise>
}

// ============================================
// Composable
// ============================================

export function useBenchmarkDetail(benchmarkId: string) {
  // Primary State
  const state = ref<BenchmarkDetailState>({ status: 'loading' })

  // Operation States
  const isStarting = ref(false)

  // Methods
  async function loadBenchmark(): Promise<void> {
    state.value = { status: 'loading' }

    const [error, loaded] = await tryCatch(getBenchmarksRepository().getById(benchmarkId))

    if (error) {
      state.value = { status: 'error', error }
      return
    }

    if (!loaded) {
      state.value = { status: 'not-found' }
      return
    }

    state.value = { status: 'success', benchmark: loaded }
  }

  async function startWorkout(): Promise<boolean> {
    if (state.value.status !== 'success' || isStarting.value) return false

    isStarting.value = true
    const [error, activeWorkout] = await tryCatch(
      getBenchmarksRepository().startFromBenchmark(state.value.benchmark.id),
    )

    if (error) {
      isStarting.value = false
      return false
    }

    // Save to active workout repository
    await getActiveWorkoutRepository().save(activeWorkout)

    // Convert to in-memory format and restore to singleton state
    const inMemoryWorkout = dbToWorkout(activeWorkout)
    restoreWorkout(inMemoryWorkout)

    isStarting.value = false
    return true
  }

  async function saveBenchmark(
    data: BenchmarkFormState,
  ): Promise<{ success: boolean; error: Error | null }> {
    const repo = getBenchmarksRepository()

    const [error] = await tryCatch(
      repo.update(benchmarkId, {
        name: data.name,
        type: data.type,
        rounds: data.rounds,
        exercises: data.exercises,
      }),
    )

    if (error) {
      return { success: false, error }
    }

    await loadBenchmark()
    return { success: true, error: null }
  }

  async function deleteBenchmark(): Promise<void> {
    if (state.value.status !== 'success') return
    await getBenchmarksRepository().delete(state.value.benchmark.id)
  }

  // Lifecycle Hooks
  onMounted(() => {
    loadBenchmark()
  })

  return {
    state,
    isStarting,
    startWorkout,
    loadBenchmark,
    saveBenchmark,
    deleteBenchmark,
  }
}
