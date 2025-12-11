import { onMounted, ref } from 'vue'
import { getActiveBenchmarkWorkoutRepository, getBenchmarksRepository } from '@/db'
import { dbToBenchmarkWorkout } from '@/db/converters'
import { restoreBenchmarkWorkout } from '@/features/benchmarks/state/benchmarkState'
import { tryCatch } from '@/lib/tryCatch'
import type { DbActiveBenchmarkWorkout, DbBenchmark, DbForTimeBlock } from '@/db/schema'
import type { BenchmarkFormExercise } from './useBenchmarkForm'

// ============================================
// Types
// ============================================

type BenchmarkDetailState =
  | { status: 'loading' }
  | { status: 'success'; benchmark: DbBenchmark; personalBest: number | null }
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

    const repo = getBenchmarksRepository()
    const [error, loaded] = await tryCatch(repo.getById(benchmarkId))

    if (error) {
      state.value = { status: 'error', error }
      return
    }

    if (!loaded) {
      state.value = { status: 'not-found' }
      return
    }

    // Load personal best
    const [pbError, pb] = await tryCatch(repo.getPersonalBest(benchmarkId))
    const personalBest = pbError ? null : pb

    state.value = { status: 'success', benchmark: loaded, personalBest }
  }

  async function startWorkout(): Promise<boolean> {
    if (state.value.status !== 'success' || isStarting.value) return false

    isStarting.value = true
    const [error, activeWorkout] = await tryCatch(
      getBenchmarksRepository().startFromBenchmark(state.value.benchmark.id),
    )

    if (error || !activeWorkout.benchmarkId) {
      isStarting.value = false
      return false
    }

    // Convert DbActiveWorkout to DbActiveBenchmarkWorkout format
    const dbBenchmarkWorkout: DbActiveBenchmarkWorkout = {
      id: 'current-benchmark',
      name: activeWorkout.name,
      benchmarkId: activeWorkout.benchmarkId,
      blocks: activeWorkout.blocks.filter((b): b is DbForTimeBlock => b.kind === 'fortime'),
      selectedBlockIndex: activeWorkout.selectedBlockIndex,
      activeExerciseIndex: activeWorkout.activeExerciseIndex ?? 0,
      startedAt: activeWorkout.startedAt,
      lastModifiedAt: Date.now(),
      globalTimerStartedAt: activeWorkout.globalTimerStartedAt ?? Date.now(),
      mode: 'builder',
    }

    // Save to active benchmark repository (not regular workout repository)
    await getActiveBenchmarkWorkoutRepository().save(dbBenchmarkWorkout)

    // Convert to in-memory format and restore to benchmark singleton state
    const inMemoryWorkout = dbToBenchmarkWorkout(dbBenchmarkWorkout)
    restoreBenchmarkWorkout(inMemoryWorkout)

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
