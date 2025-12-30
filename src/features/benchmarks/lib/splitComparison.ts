import type { DbCompletedWorkout } from '@/db/schema'

/**
 * Comparison data for a single split time.
 */
export type SplitComparison = {
  currentSplit: number // Current split time in seconds
  pbSplit: number // PB split time in seconds
  delta: number // Difference in seconds (negative = faster, positive = slower)
  isFaster: boolean // True if current split is faster than PB
}

/**
 * Find the workout that matches the PB time.
 * Pure function - no state dependencies.
 */
export function findPbWorkout(
  workouts: ReadonlyArray<DbCompletedWorkout>,
  targetBenchmarkId: string,
  pbTime: number
): DbCompletedWorkout | null {
  for (const workout of workouts) {
    if (workout.benchmarkId !== targetBenchmarkId) continue

    for (const block of workout.blocks) {
      if (block.kind === 'fortime' && block.result?.completed && Math.abs(block.result.completionTime - pbTime) < 0.1) {
          return workout
        }
    }
  }
  return null
}

/**
 * Extract split times from a completed workout.
 * Pure function - no state dependencies.
 */
export function extractSplitTimes(workout: DbCompletedWorkout): ReadonlyArray<number> {
  for (const block of workout.blocks) {
    if (block.kind === 'fortime' && block.result?.splitTimes) {
      return block.result.splitTimes
    }
  }
  return []
}

/**
 * Compare current split time to PB split time.
 * Pure function - no state dependencies.
 *
 * @param pbSplitTimes - Array of PB split times
 * @param exerciseIndex - 0-based index of the exercise that was just completed
 * @param currentSplit - Current split time in seconds
 * @returns Comparison data, or null if no PB split exists for this index
 */
export function getComparison(
  pbSplitTimes: ReadonlyArray<number> | null,
  exerciseIndex: number,
  currentSplit: number
): SplitComparison | null {
  if (!pbSplitTimes || exerciseIndex >= pbSplitTimes.length) {
    return null
  }

  const pbSplit = pbSplitTimes[exerciseIndex]
  if (pbSplit === undefined) {
    return null
  }

  const delta = currentSplit - pbSplit

  return {
    currentSplit,
    pbSplit,
    delta,
    isFaster: delta < 0,
  }
}
