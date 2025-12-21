import { type Ref } from 'vue'
import { getActiveWorkoutRepository, getWorkoutsRepository } from '@/db'
import { dbToWorkout, workoutToDb } from '@/db/converters'
import { tryCatch } from '@/lib/tryCatch'
import { createPersistenceCore, type PersistenceState } from '@/composables/persistence/createPersistenceCore'
import type { Workout } from './useWorkout'
import type { DbCompletedWorkout } from '@/db/schema'

// Track the startedAt timestamp for the current workout session
let currentWorkoutStartedAt: number | null = null

/**
 * Composable for managing workout persistence to IndexedDB.
 * Handles auto-save, loading, and completing workouts.
 */
export function useWorkoutPersistence(workout: Ref<Workout>) {
  const repo = getActiveWorkoutRepository()

  const core = createPersistenceCore({
    source: workout,
    toDb: () => workoutToDb(workout.value, currentWorkoutStartedAt ?? undefined),
    fromDb: dbToWorkout,
    repository: {
      get: () => repo.get(),
      save: (db) => repo.save(db),
      clear: () => repo.clear(),
      exists: () => repo.exists(),
    },
    isEmpty: (w) => w.blocks.length === 0,
  })

  /**
   * Load the active workout from the database.
   * Returns null if no active workout exists.
   */
  async function loadActiveWorkout(): Promise<Workout | null> {
    const loaded = await core.load()

    if (loaded) {
      // Get the startedAt from the database
      const [, dbWorkout] = await tryCatch(repo.get())
      if (dbWorkout) {
        currentWorkoutStartedAt = dbWorkout.startedAt
      }
    }

    return loaded
  }

  /**
   * Check if an active workout exists in the database.
   */
  async function hasActiveWorkout(): Promise<boolean> {
    return core.exists()
  }

  /**
   * Discard the active workout without saving to history.
   */
  async function discardActiveWorkout(): Promise<void> {
    await core.discard()
    currentWorkoutStartedAt = null
  }

  /**
   * Complete the active workout and save to history.
   * Sets mode to 'completed' before persisting to ensure the final state is captured.
   * Returns the completed workout for navigation to summary.
   */
  async function completeWorkout(notes = ''): Promise<DbCompletedWorkout | null> {
    const [getError, dbWorkout] = await tryCatch(repo.get())

    if (getError) {
      core.persistenceState.value = { status: 'error', error: getError }
      return null
    }

    if (!dbWorkout) return null

    // Set mode to 'completed' before persisting to DB
    dbWorkout.mode = 'completed'

    const [completeError, completed] = await tryCatch(
      getWorkoutsRepository().completeWorkout(dbWorkout, notes),
    )

    if (completeError) {
      core.persistenceState.value = { status: 'error', error: completeError }
      return null
    }

    currentWorkoutStartedAt = null
    core.hasUnsavedChanges.value = false
    return completed
  }

  /**
   * Start a new workout session.
   * Call this when creating a fresh workout (not resuming).
   */
  function startNewWorkoutSession(): void {
    currentWorkoutStartedAt = Date.now()
    core.markInitialized()
  }

  return {
    // State from core
    persistenceState: core.persistenceState,
    hasUnsavedChanges: core.hasUnsavedChanges,
    isInitialized: core.isInitialized,

    // Workout-specific methods
    loadActiveWorkout,
    hasActiveWorkout,
    discardActiveWorkout,
    completeWorkout,
    startNewWorkoutSession,
    markInitialized: core.markInitialized,
    saveNow: core.saveNow,
  }
}

// Re-export PersistenceState for consumers
export type { PersistenceState }
