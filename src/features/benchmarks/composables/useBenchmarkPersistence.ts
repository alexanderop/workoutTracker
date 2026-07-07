import { type Ref } from 'vue'
import { getActiveBenchmarkWorkoutRepository } from '@/db'
import { benchmarkWorkoutToDb, dbToBenchmarkWorkout } from '@/db/converters'
import { tryCatch } from '@/lib/tryCatch'
import { createPersistenceCore } from '@/composables/persistence/createPersistenceCore'
import type { BenchmarkWorkout } from '@/types/benchmark'
import type { DbCompletedWorkout } from '@/db/schema'

/**
 * Composable for managing benchmark workout persistence to IndexedDB.
 * Handles auto-save, loading, completing, and discarding benchmark workouts.
 */
export function useBenchmarkPersistence(benchmarkWorkout: Ref<BenchmarkWorkout>) {
  const repo = getActiveBenchmarkWorkoutRepository()

  const core = createPersistenceCore({
    source: benchmarkWorkout,
    toDb: () => benchmarkWorkoutToDb(benchmarkWorkout.value),
    fromDb: dbToBenchmarkWorkout,
    repository: {
      get: () => repo.load(),
      save: (database) => repo.save(database),
      clear: () => repo.delete(),
      exists: () => repo.exists(),
    },
    isEmpty: (w) => w.blocks.length === 0,
  })

  /**
   * Load the active benchmark workout from the database.
   * Returns null if no active benchmark exists.
   */
  async function loadActiveBenchmark(): Promise<BenchmarkWorkout | null> {
    return core.load()
  }

  /**
   * Check if an active benchmark workout exists in the database.
   */
  async function hasActiveBenchmark(): Promise<boolean> {
    return core.exists()
  }

  /**
   * Discard the active benchmark without saving to history.
   */
  async function discardActiveBenchmark(): Promise<void> {
    await core.discard()
  }

  /**
   * Complete the benchmark workout and save to history.
   * Converts to a completed workout with benchmarkId for personal best tracking.
   * Returns the completed workout for navigation to summary.
   */
  async function completeBenchmark(): Promise<DbCompletedWorkout | null> {
    const [loadError, databaseBenchmark] = await tryCatch(repo.load())

    if (loadError) {
      core.setError(loadError)
      return null
    }

    if (!databaseBenchmark) return null

    // Convert benchmark workout to completed workout format
    const [completeError, completed] = await tryCatch(repo.complete(databaseBenchmark))

    if (completeError) {
      core.setError(completeError)
      return null
    }

    core.markSaved()
    return completed
  }

  return {
    // State from core
    persistenceState: core.persistenceState,
    hasUnsavedChanges: core.hasUnsavedChanges,
    isInitialized: core.isInitialized,

    // Benchmark-specific methods
    loadActiveBenchmark,
    hasActiveBenchmark,
    discardActiveBenchmark,
    completeBenchmark,
    markInitialized: core.markInitialized,
    saveNow: core.saveNow,
  }
}
