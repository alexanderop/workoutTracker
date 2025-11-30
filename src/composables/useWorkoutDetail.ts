import { computed, onMounted, ref } from 'vue'
import { workoutsRepository } from '@/db/repositories/workouts'
import type { DbCompletedWorkout, DbSet, DbWorkoutExercise } from '@/db/schema'

// ============================================
// Types
// ============================================

export type WorkoutDetailState =
  | { status: 'loading' }
  | { status: 'success'; workout: DbCompletedWorkout }
  | { status: 'not-found' }
  | { status: 'error'; error: Error }

export type WorkoutStats = {
  duration: number
  exerciseCount: number
  setCount: number
  totalWeight: number
}

// ============================================
// Pure Functions (Functional Core)
// ============================================

/**
 * Extracts all completed sets from a list of exercises.
 */
export function getCompletedSets(
  exercises: ReadonlyArray<DbWorkoutExercise>,
): ReadonlyArray<DbSet> {
  return exercises.flatMap((exercise) => exercise.sets.filter((set) => set.status === 'completed'))
}

/**
 * Calculates total weight lifted from a list of sets.
 * Weight = sum of (kg × reps) for each set.
 */
export function calculateTotalWeight(sets: ReadonlyArray<DbSet>): number {
  const total = sets.reduce((sum, set) => {
    const kg = Number.parseFloat(set.kg) || 0
    const reps = Number.parseFloat(set.reps) || 0
    return sum + kg * reps
  }, 0)
  return Math.round(total)
}

/**
 * Computes workout statistics from a completed workout.
 */
export function computeWorkoutStats(workout: DbCompletedWorkout): WorkoutStats {
  const completedSets = getCompletedSets(workout.exercises)

  return {
    duration: workout.durationSeconds,
    exerciseCount: workout.exercises.length,
    setCount: completedSets.length,
    totalWeight: calculateTotalWeight(completedSets),
  }
}

// ============================================
// Default Stats (for non-success states)
// ============================================

const DEFAULT_STATS: WorkoutStats = {
  duration: 0,
  exerciseCount: 0,
  setCount: 0,
  totalWeight: 0,
}

// ============================================
// Composable (Imperative Shell)
// ============================================

export function useWorkoutDetail(workoutId: string) {
  // Primary State
  const state = ref<WorkoutDetailState>({ status: 'loading' })

  // Computed - derived state
  const stats = computed<WorkoutStats>(() => {
    if (state.value.status !== 'success') {
      return DEFAULT_STATS
    }
    return computeWorkoutStats(state.value.workout)
  })

  // Methods
  async function loadWorkout() {
    state.value = { status: 'loading' }
    try {
      const workout = await workoutsRepository.getById(workoutId)
      if (!workout) {
        state.value = { status: 'not-found' }
        return
      }
      state.value = { status: 'success', workout }
    } catch (error) {
      state.value = {
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  // Lifecycle Hooks
  onMounted(() => {
    loadWorkout()
  })

  return { state, stats, loadWorkout }
}
