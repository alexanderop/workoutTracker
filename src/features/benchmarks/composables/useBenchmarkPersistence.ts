import { onScopeDispose, ref, type Ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { getActiveBenchmarkWorkoutRepository } from '@/db'
import { benchmarkWorkoutToDb, dbToBenchmarkWorkout } from '@/db/converters'
import { tryCatch } from '@/lib/tryCatch'
import type { BenchmarkWorkout } from '@/types/benchmark'
import type { DbCompletedWorkout } from '@/db/schema'

const AUTO_SAVE_DEBOUNCE_MS = 1000

/**
 * Persistence state using discriminated union for type safety.
 */
type PersistenceState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'saving' }
  | { status: 'error'; error: Error }

/**
 * Composable for managing benchmark workout persistence to IndexedDB.
 * Handles auto-save, loading, completing, and discarding benchmark workouts.
 */
export function useBenchmarkPersistence(benchmarkWorkout: Ref<BenchmarkWorkout>) {
  const persistenceState = ref<PersistenceState>({ status: 'idle' })
  const hasUnsavedChanges = ref(false)
  const isInitialized = ref(false)

  // Track if the composable scope is disposed (component unmounted)
  // This prevents pending debounced callbacks from writing stale data
  let isDisposed = false

  onScopeDispose(() => {
    isDisposed = true
  })

  // Track changes for unsaved indicator
  watch(
    benchmarkWorkout,
    () => {
      if (isInitialized.value) {
        hasUnsavedChanges.value = true
      }
    },
    { deep: true },
  )

  // Auto-save on changes (debounced)
  watchDebounced(
    benchmarkWorkout,
    async (newWorkout) => {
      // Skip save if scope is disposed (component unmounted)
      if (isDisposed) return
      if (!isInitialized.value) return

      // No blocks means no active benchmark to save
      if (newWorkout.blocks.length === 0) {
        await getActiveBenchmarkWorkoutRepository().delete()
        hasUnsavedChanges.value = false
        return
      }

      persistenceState.value = { status: 'saving' }

      const dbWorkout = benchmarkWorkoutToDb(newWorkout)
      const [saveError] = await tryCatch(getActiveBenchmarkWorkoutRepository().save(dbWorkout))

      if (saveError) {
        persistenceState.value = { status: 'error', error: saveError }
        return
      }

      hasUnsavedChanges.value = false
      persistenceState.value = { status: 'idle' }
    },
    { debounce: AUTO_SAVE_DEBOUNCE_MS, deep: true },
  )

  /**
   * Load the active benchmark workout from the database.
   * Returns null if no active benchmark exists.
   */
  async function loadActiveBenchmark(): Promise<BenchmarkWorkout | null> {
    persistenceState.value = { status: 'loading' }

    const [loadError, dbWorkout] = await tryCatch(getActiveBenchmarkWorkoutRepository().load())

    if (loadError) {
      persistenceState.value = { status: 'error', error: loadError }
      return null
    }

    persistenceState.value = { status: 'idle' }

    if (dbWorkout) {
      return dbToBenchmarkWorkout(dbWorkout)
    }
    return null
  }

  /**
   * Check if an active benchmark workout exists in the database.
   */
  async function hasActiveBenchmark(): Promise<boolean> {
    return getActiveBenchmarkWorkoutRepository().exists()
  }

  /**
   * Discard the active benchmark without saving to history.
   */
  async function discardActiveBenchmark(): Promise<void> {
    await getActiveBenchmarkWorkoutRepository().delete()
    hasUnsavedChanges.value = false
  }

  /**
   * Complete the benchmark workout and save to history.
   * Converts to a completed workout with benchmarkId for personal best tracking.
   * Returns the completed workout for navigation to summary.
   */
  async function completeBenchmark(): Promise<DbCompletedWorkout | null> {
    const dbBenchmark = await getActiveBenchmarkWorkoutRepository().load()
    if (!dbBenchmark) return null

    // Convert benchmark workout to completed workout format
    const completed = await getActiveBenchmarkWorkoutRepository().complete(dbBenchmark)
    hasUnsavedChanges.value = false
    return completed
  }

  /**
   * Mark persistence as initialized.
   * Call this after loading or creating a new benchmark.
   */
  function markInitialized(): void {
    isInitialized.value = true
  }

  /**
   * Force save the current benchmark state immediately.
   */
  async function saveNow(): Promise<void> {
    if (benchmarkWorkout.value.blocks.length === 0) return

    persistenceState.value = { status: 'saving' }

    const dbWorkout = benchmarkWorkoutToDb(benchmarkWorkout.value)
    const [saveError] = await tryCatch(getActiveBenchmarkWorkoutRepository().save(dbWorkout))

    if (saveError) {
      persistenceState.value = { status: 'error', error: saveError }
      return
    }

    hasUnsavedChanges.value = false
    persistenceState.value = { status: 'idle' }
  }

  return {
    persistenceState,
    hasUnsavedChanges,
    isInitialized,
    loadActiveBenchmark,
    hasActiveBenchmark,
    discardActiveBenchmark,
    completeBenchmark,
    markInitialized,
    saveNow,
  }
}
