import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfDay,
  startOfWeek,
  subMonths,
} from 'date-fns'
import type { DbCompletedWorkout } from '@/db/schema'
import type { HeatmapCell, HeatmapGrid, HeatmapIntensity } from '../types/streak'

const MONTHS_DEFAULT = 6

/**
 * Map raw workout counts to an intensity bucket 0..4.
 */
export function intensityForCount(count: number): HeatmapIntensity {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count === 3) return 3
  return 4
}

/**
 * Bucket workouts by yyyy-MM-dd.
 */
function groupWorkoutCountsByDay(workouts: ReadonlyArray<DbCompletedWorkout>): Map<string, number> {
  const counts = new Map<string, number>()
  for (const workout of workouts) {
    const key = format(startOfDay(new Date(workout.completedAt)), 'yyyy-MM-dd')
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

/**
 * Build a 7-row heatmap grid covering roughly the last `months` months.
 *
 * The range is aligned to whole weeks (Monday start) so the grid is a clean
 * rectangle of 7 rows × N weeks. Cells outside the trailing range (future
 * days in the final week) are marked `inRange: false`.
 */
export function buildHeatmap(
  workouts: ReadonlyArray<DbCompletedWorkout>,
  today: Date = startOfDay(new Date()),
  months: number = MONTHS_DEFAULT,
): HeatmapGrid {
  const rangeEnd = endOfWeek(today, { weekStartsOn: 1 })
  const rangeStart = startOfWeek(subMonths(today, months), { weekStartsOn: 1 })
  const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
  const counts = groupWorkoutCountsByDay(workouts)

  const weeks: Array<Array<HeatmapCell>> = []
  let currentWeek: Array<HeatmapCell> = []
  let totalWorkouts = 0

  for (const day of allDays) {
    const dateKey = format(day, 'yyyy-MM-dd')
    const count = counts.get(dateKey) ?? 0
    const isFuture = differenceInCalendarDays(day, today) > 0
    const isBeforeRange = differenceInCalendarDays(day, rangeStart) < 0
    const inRange = !isFuture && !isBeforeRange
    const effectiveCount = inRange ? count : 0
    totalWorkouts += effectiveCount

    const cell: HeatmapCell = {
      date: day,
      dateKey,
      count: effectiveCount,
      intensity: intensityForCount(effectiveCount),
      inRange,
    }
    currentWeek.push(cell)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  return {
    weeks,
    rangeStart,
    rangeEnd,
    totalWorkouts,
  }
}
