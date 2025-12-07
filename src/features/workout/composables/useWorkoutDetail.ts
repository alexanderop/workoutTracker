import { computed, onMounted, ref } from 'vue'
import { getWorkoutsRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import type { DbCompletedWorkout, DbSet, DbStrengthBlock, DbWorkoutBlock } from '@/db/schema'
import { isDbStrengthBlock } from '@/db/schema'

// ============================================
// Types
// ============================================

type WorkoutDetailState =
  | { status: 'loading' }
  | { status: 'success'; workout: DbCompletedWorkout }
  | { status: 'not-found' }
  | { status: 'error'; error: Error }

export type WorkoutStats = {
  duration: number
  exerciseCount: number
  setCount: number
  totalWeight: number
  timedBlockCount: number
  totalRounds: number
}

// ============================================
// Pure Functions (Functional Core)
// ============================================

/**
 * Extracts all completed sets from strength blocks.
 */
function getCompletedSets(blocks: ReadonlyArray<DbWorkoutBlock>): ReadonlyArray<DbSet> {
  return blocks
    .filter(isDbStrengthBlock)
    .flatMap((block) => block.sets.filter((set) => set.status === 'completed'))
}

/**
 * Gets all strength blocks from a workout.
 */
function getStrengthBlocks(blocks: ReadonlyArray<DbWorkoutBlock>): ReadonlyArray<DbStrengthBlock> {
  return blocks.filter(isDbStrengthBlock)
}

/**
 * Calculates total weight lifted from a list of sets.
 * Weight = sum of (kg × reps) for each set.
 */
function calculateTotalWeight(sets: ReadonlyArray<DbSet>): number {
  const total = sets.reduce((sum, set) => {
    const kg = Number.parseFloat(set.kg) || 0
    const reps = Number.parseFloat(set.reps) || 0
    return sum + kg * reps
  }, 0)
  return Math.round(total)
}

/**
 * Counts total rounds from AMRAP blocks.
 */
function countTotalRounds(blocks: ReadonlyArray<DbWorkoutBlock>): number {
  return blocks.reduce((total, block) => {
    if (block.kind === 'amrap' && block.result) {
      return total + block.result.rounds
    }
    return total
  }, 0)
}

/**
 * Counts timed blocks in a workout.
 */
function countTimedBlocks(blocks: ReadonlyArray<DbWorkoutBlock>): number {
  return blocks.filter((block) => block.kind !== 'strength').length
}

/**
 * Computes workout statistics from a completed workout.
 */
function computeWorkoutStats(workout: DbCompletedWorkout): WorkoutStats {
  const strengthBlocks = getStrengthBlocks(workout.blocks)
  const completedSets = getCompletedSets(workout.blocks)

  return {
    duration: workout.durationSeconds,
    exerciseCount: strengthBlocks.length,
    setCount: completedSets.length,
    totalWeight: calculateTotalWeight(completedSets),
    timedBlockCount: countTimedBlocks(workout.blocks),
    totalRounds: countTotalRounds(workout.blocks),
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
  timedBlockCount: 0,
  totalRounds: 0,
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
    const [error, workout] = await tryCatch(getWorkoutsRepository().getById(workoutId))

    if (error) {
      state.value = { status: 'error', error }
      return
    }

    if (!workout) {
      state.value = { status: 'not-found' }
      return
    }

    state.value = { status: 'success', workout }
  }

  // Lifecycle Hooks
  onMounted(() => {
    loadWorkout()
  })

  return { state, stats, loadWorkout }
}
