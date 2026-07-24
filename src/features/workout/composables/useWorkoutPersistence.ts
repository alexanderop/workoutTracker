import { type Ref } from 'vue'
import { getActiveWorkoutRepository, getHabitsRepository, getWorkoutsRepository } from '@/db'
import { dbToWorkout, workoutToDb } from '@/db/converters'
import { tryCatch } from '@/lib/tryCatch'
import { autoLinkWorkoutCompletion } from '@/lib/habits/autoLinkWorkout'
import { createPersistenceCore } from '@/composables/persistence/createPersistenceCore'
import type { Workout } from '@/types/workout'
import type { DbCompletedWorkout } from '@/db/schema'

// Track the startedAt timestamp for the current workout session
let currentWorkoutStartedAt: number | null = null

/**
 * Reset the workout persistence module state.
 * Used in tests to ensure clean state between test files.
 */
export function resetWorkoutPersistence(): void {
  currentWorkoutStartedAt = null
}

/**
 * Composable for managing workout persistence to IndexedDB.
 * Handles auto-save, loading, and completing workouts.
 */
export function useWorkoutPersistence(workout: Ref<Workout>) {
  const repo = getActiveWorkoutRepository()
  // Reads go through the live query's `get()` (same underlying query as
  // `repo.get()`), but this composable deliberately never calls `subscribe()`:
  // the active workout is mutated on nearly every keystroke while a workout
  // is in progress, and `createPersistenceCore` below already owns writing
  // `workout` to the repository (debounced). Applying live snapshots onto
  // that in-memory working copy here would fight the debounced auto-save and
  // could clobber newer local edits with a stale, already-superseded value.
  const activeWorkoutQuery = repo.observe()

  const core = createPersistenceCore({
    source: workout,
    toDb: () => workoutToDb(workout.value, currentWorkoutStartedAt ?? undefined),
    fromDb: dbToWorkout,
    repository: {
      get: () => activeWorkoutQuery.get(),
      save: (database) => repo.save(database),
      clear: () => repo.clear(),
      exists: () => repo.exists(),
    },
    isEmpty: (w) => w.blocks.length === 0,
    // A completed workout lives in history, not in the active-workout draft.
    // completeWorkout() below deletes the draft in the same transaction that
    // writes history; without this gate the mode-change mutation that shows
    // the completion screen re-triggers the debounced auto-save and
    // resurrects the deleted draft, causing a phantom "Resume Workout?"
    // prompt on the next app start.
    shouldPersist: (w) => w.mode !== 'completed',
  })

  /**
   * Load the active workout from the database.
   * Returns null if no active workout exists.
   */
  async function loadActiveWorkout(): Promise<Workout | null> {
    const loaded = await core.load()

    if (loaded) {
      // Get the startedAt from the database
      const [, databaseWorkout] = await tryCatch(activeWorkoutQuery.get())
      if (databaseWorkout) {
        currentWorkoutStartedAt = databaseWorkout.startedAt
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
   * @param notes - Optional notes for the workout
   * @param durationOverrideSeconds - Optional duration override in seconds. If provided, completedAt is back-calculated.
   */
  async function completeWorkout(
    notes = '',
    durationOverrideSeconds?: number,
  ): Promise<DbCompletedWorkout | null> {
    const [getError, databaseWorkout] = await tryCatch(activeWorkoutQuery.get())

    if (getError) {
      core.setError(getError)
      return null
    }

    if (!databaseWorkout) return null

    // Set mode to 'completed' before persisting to DB
    databaseWorkout.mode = 'completed'

    const [completeError, completed] = await tryCatch(
      getWorkoutsRepository().completeWorkout(databaseWorkout, notes, durationOverrideSeconds),
    )

    if (completeError) {
      core.setError(completeError)
      return null
    }

    // Auto-link workout-linked habits (see src/lib/habits/autoLinkWorkout.ts).
    // Best-effort bookkeeping for a different feature -- a broken habits
    // table must never block or fail workout completion, which is why this
    // is isolated behind tryCatch and merely logged rather than propagated.
    const [autoLinkError] = await tryCatch(
      autoLinkWorkoutCompletion(getHabitsRepository(), completed.completedAt),
    )
    if (autoLinkError) {
      console.error('[useWorkoutPersistence] Failed to auto-link habits:', autoLinkError)
    }

    currentWorkoutStartedAt = null
    core.markSaved()
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
