/**
 * Shared fixtures for the habitStats unit specs. Extracted so
 * `habitStats.spec.ts` and `habitStatsEdges.spec.ts` share one definition
 * instead of two verbatim copies.
 */
import type { DbHabitEntry } from '@/db/schema'
import { startOfDay } from '@/features/habits/lib/habitStats'
import { createDbHabitEntry } from '@/__tests__/factories'

export function entryOn(habitId: string, day: number, value = 1): DbHabitEntry {
  return createDbHabitEntry({ habitId, date: day, value })
}

/**
 * Local start-of-day timestamps for `offsets` days after `base`, via calendar
 * (not millisecond) arithmetic -- used by the DST regression tests, which need
 * dates on either side of a transition.
 */
export function localDays(base: Date, offsets: ReadonlyArray<number>): Array<number> {
  return offsets.map((offset) => {
    const date = new Date(base)
    date.setDate(date.getDate() + offset)
    return startOfDay(date.getTime())
  })
}
