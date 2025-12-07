import { onScopeDispose, ref, type Ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { getActiveWorkoutRepository, getWorkoutsRepository } from '@/db'
import { dbToWorkout, workoutToDb } from '@/db/converters'
import { tryCatch } from '@/lib/tryCatch'
import type { Workout } from './useWorkout'
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

// Track the startedAt timestamp for the current workout session
let currentWorkoutStartedAt: number | null = null

/**
 * Composable for managing workout persistence to IndexedDB.
 * Handles auto-save, loading, and completing workouts.
 */
export function useWorkoutPersistence(workout: Ref<Workout>) {
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
    workout,
    () => {
      if (isInitialized.value) {
        hasUnsavedChanges.value = true
      }
    },
    { deep: true },
  )

  // Auto-save on changes (debounced)
  watchDebounced(
    workout,
    async (newWorkout) => {
      // Skip save if scope is disposed (component unmounted)
      // The debounced callback can fire after unmount due to setTimeout timing
      if (isDisposed) return
      if (!isInitialized.value) return

      // No blocks means no active workout to save
      if (newWorkout.blocks.length === 0) {
        await getActiveWorkoutRepository().clear()
        currentWorkoutStartedAt = null
        hasUnsavedChanges.value = false
        return
      }

      persistenceState.value = { status: 'saving' }

      const dbWorkout = workoutToDb(newWorkout, currentWorkoutStartedAt ?? undefined)
      const [saveError] = await tryCatch(getActiveWorkoutRepository().save(dbWorkout))

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
   * Load the active workout from the database.
   * Returns null if no active workout exists.
   */
  async function loadActiveWorkout(): Promise<Workout | null> {
    persistenceState.value = { status: 'loading' }

    const [loadError, dbWorkout] = await tryCatch(getActiveWorkoutRepository().get())

    if (loadError) {
      persistenceState.value = { status: 'error', error: loadError }
      return null
    }

    persistenceState.value = { status: 'idle' }

    if (dbWorkout) {
      currentWorkoutStartedAt = dbWorkout.startedAt
      return dbToWorkout(dbWorkout)
    }
    return null
  }

  /**
   * Check if an active workout exists in the database.
   */
  async function hasActiveWorkout(): Promise<boolean> {
    return getActiveWorkoutRepository().exists()
  }

  /**
   * Discard the active workout without saving to history.
   */
  async function discardActiveWorkout(): Promise<void> {
    await getActiveWorkoutRepository().clear()
    currentWorkoutStartedAt = null
    hasUnsavedChanges.value = false
  }

  /**
   * Complete the active workout and save to history.
   * Returns the completed workout for navigation to summary.
   */
  async function completeWorkout(notes = ''): Promise<DbCompletedWorkout | null> {
    const dbWorkout = await getActiveWorkoutRepository().get()
    if (!dbWorkout) return null

    const completed = await getWorkoutsRepository().completeWorkout(dbWorkout, notes)
    currentWorkoutStartedAt = null
    hasUnsavedChanges.value = false
    return completed
  }

  /**
   * Start a new workout session.
   * Call this when creating a fresh workout (not resuming).
   */
  function startNewWorkoutSession(): void {
    currentWorkoutStartedAt = Date.now()
    isInitialized.value = true
  }

  /**
   * Mark persistence as initialized (for resumed workouts).
   */
  function markInitialized(): void {
    isInitialized.value = true
  }

  /**
   * Force save the current workout state immediately.
   */
  async function saveNow(): Promise<void> {
    if (workout.value.blocks.length === 0) return

    persistenceState.value = { status: 'saving' }

    const dbWorkout = workoutToDb(workout.value, currentWorkoutStartedAt ?? undefined)
    const [saveError] = await tryCatch(getActiveWorkoutRepository().save(dbWorkout))

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
    loadActiveWorkout,
    hasActiveWorkout,
    discardActiveWorkout,
    completeWorkout,
    startNewWorkoutSession,
    markInitialized,
    saveNow,
  }
}
