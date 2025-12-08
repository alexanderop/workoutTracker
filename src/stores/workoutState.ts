import { ref } from 'vue'
import type { Workout } from '@/types/workout'

function createInitialWorkout(): Workout {
  return {
    id: 1,
    name: 'New Workout',
    blocks: [],
    selectedBlockIndex: -1,
    startedAt: Date.now(),
    mode: 'builder',
    activeSetIndex: null,
    activeExerciseIndex: null,
    benchmarkId: null,
    globalTimerStartedAt: null,
  }
}

// Singleton state - shared across all components
const workout = ref<Workout>(createInitialWorkout())

/**
 * Reset the workout to initial empty state.
 */
export function resetWorkout(): void {
  workout.value = createInitialWorkout()
}

/**
 * Restore a workout from saved state (used for resuming from DB).
 */
export function restoreWorkout(savedWorkout: Workout): void {
  workout.value = savedWorkout
}

/**
 * Get the raw workout ref for persistence layer.
 */
export function getWorkoutRef() {
  return workout
}
