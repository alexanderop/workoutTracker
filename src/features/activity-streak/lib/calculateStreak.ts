import { format, startOfDay, subDays } from 'date-fns'
import type { DbCompletedWorkout } from '@/db/schema'
import type { StreakInfo } from '../types/streak'

/**
 * Build a set of unique yyyy-MM-dd date keys for every workout.
 */
function buildTrainedDayKeys(workouts: ReadonlyArray<DbCompletedWorkout>): Set<string> {
  const keys = new Set<string>()
  for (const workout of workouts) {
    keys.add(format(startOfDay(new Date(workout.completedAt)), 'yyyy-MM-dd'))
  }
  return keys
}

/**
 * Walk back from `from` while the date is present in `trainedDays`.
 */
function countConsecutiveBackwards(trainedDays: Set<string>, from: Date): number {
  let count = 0
  let cursor = startOfDay(from)
  while (trainedDays.has(format(cursor, 'yyyy-MM-dd'))) {
    count += 1
    cursor = subDays(cursor, 1)
  }
  return count
}

/**
 * Compute the longest run of consecutive trained days.
 */
function computeLongestStreak(trainedDays: Set<string>): number {
  if (trainedDays.size === 0) return 0
  const sortedKeys = [...trainedDays].toSorted()
  let longest = 1
  let current = 1

  for (let index = 1; index < sortedKeys.length; index += 1) {
    const previousKey = sortedKeys[index - 1]!
    const currentKey = sortedKeys[index]!
    const previousDate = new Date(previousKey)
    const currentDate = new Date(currentKey)
    const diffMs = currentDate.getTime() - previousDate.getTime()
    const diffDays = Math.round(diffMs / 86_400_000)
    current = diffDays === 1 ? current + 1 : 1
    if (current > longest) longest = current
  }
  return longest
}

/**
 * Calculate current and longest workout streaks from completed workouts.
 *
 * Rules:
 * - If today has a workout, current streak includes today.
 * - If today has no workout yet, the streak is counted starting from yesterday
 *   (today "not yet worked out" does NOT break the streak).
 * - If yesterday also has no workout, current streak is 0.
 */
export function calculateStreak(
  workouts: ReadonlyArray<DbCompletedWorkout>,
  today: Date = startOfDay(new Date()),
): StreakInfo {
  const trainedDays = buildTrainedDayKeys(workouts)
  if (trainedDays.size === 0) {
    return { current: 0, longest: 0, hasEverTrained: false }
  }

  const todayKey = format(today, 'yyyy-MM-dd')
  const startFrom = trainedDays.has(todayKey) ? today : subDays(today, 1)
  const current = countConsecutiveBackwards(trainedDays, startFrom)
  const longest = computeLongestStreak(trainedDays)

  return {
    current,
    longest: Math.max(longest, current),
    hasEverTrained: true,
  }
}
