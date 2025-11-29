import { ref, type Ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { activeWorkoutRepository } from '@/db/repositories/activeWorkout'
import { workoutsRepository } from '@/db/repositories/workouts'
import { dbToWorkout, workoutToDb } from '@/db/converters'
import type { Workout } from './useWorkout'
import type { DbActiveWorkout } from '@/db/schema'

const AUTO_SAVE_DEBOUNCE_MS = 1000

/**
 * Persistence state using discriminated union for type safety.
 */
export type PersistenceState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'saving' }
  | { status: 'error', error: Error }

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
      if (!isInitialized.value) return

      // No exercises means no active workout to save
      if (newWorkout.exercises.length === 0) {
        await activeWorkoutRepository.clear()
        currentWorkoutStartedAt = null
        hasUnsavedChanges.value = false
        return
      }

      persistenceState.value = { status: 'saving' }
      try {
        const dbWorkout = workoutToDb(newWorkout, currentWorkoutStartedAt ?? undefined)
        await activeWorkoutRepository.save(dbWorkout)
        hasUnsavedChanges.value = false
        persistenceState.value = { status: 'idle' }
      }
      catch (error) {
        persistenceState.value = {
          status: 'error',
          error: error instanceof Error ? error : new Error('Save failed'),
        }
      }
    },
    { debounce: AUTO_SAVE_DEBOUNCE_MS, deep: true },
  )

  /**
   * Load the active workout from the database.
   * Returns null if no active workout exists.
   */
  async function loadActiveWorkout(): Promise<Workout | null> {
    persistenceState.value = { status: 'loading' }
    try {
      const dbWorkout = await activeWorkoutRepository.get()
      persistenceState.value = { status: 'idle' }

      if (dbWorkout) {
        currentWorkoutStartedAt = dbWorkout.startedAt
        return dbToWorkout(dbWorkout)
      }
      return null
    }
    catch (error) {
      persistenceState.value = {
        status: 'error',
        error: error instanceof Error ? error : new Error('Load failed'),
      }
      return null
    }
  }

  /**
   * Check if an active workout exists in the database.
   */
  async function hasActiveWorkout(): Promise<boolean> {
    return activeWorkoutRepository.exists()
  }

  /**
   * Discard the active workout without saving to history.
   */
  async function discardActiveWorkout(): Promise<void> {
    await activeWorkoutRepository.clear()
    currentWorkoutStartedAt = null
    hasUnsavedChanges.value = false
  }

  /**
   * Complete the active workout and save to history.
   */
  async function completeWorkout(notes = ''): Promise<void> {
    const dbWorkout = await activeWorkoutRepository.get()
    if (!dbWorkout) return

    await workoutsRepository.completeWorkout(dbWorkout, notes)
    currentWorkoutStartedAt = null
    hasUnsavedChanges.value = false
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
    if (workout.value.exercises.length === 0) return

    persistenceState.value = { status: 'saving' }
    try {
      const dbWorkout = workoutToDb(workout.value, currentWorkoutStartedAt ?? undefined)
      await activeWorkoutRepository.save(dbWorkout)
      hasUnsavedChanges.value = false
      persistenceState.value = { status: 'idle' }
    }
    catch (error) {
      persistenceState.value = {
        status: 'error',
        error: error instanceof Error ? error : new Error('Save failed'),
      }
    }
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

/**
 * Get the database active workout directly (for templates, etc.)
 */
export async function getDbActiveWorkout(): Promise<DbActiveWorkout | undefined> {
  return activeWorkoutRepository.get()
}
