/**
 * Pure function for building the GitHub-style contribution grid used by
 * HabitHistoryGrid.vue. Kept separate from `habitStats.ts` (Phase 1,
 * untouched) even though it shares its conventions -- Monday-start weeks,
 * start-of-day timestamps -- so Phase 1's file stays exactly as delivered.
 *
 * No DB imports, same Functional Core split as habitStats.ts.
 */
import { addDays, addWeeks, startOfWeek, subWeeks } from 'date-fns'
import { isEntryComplete, startOfDay } from './habitStats'
import type { DbHabit, DbHabitEntry } from '@/db/schema'

const WEEK_STARTS_ON = 1 // Monday, matches habitStats.ts's convention

/**
 * Calendar-aware day/week stepping, matching habitStats.ts's approach.
 *
 * Entry dates are LOCAL start-of-day timestamps. Stepping by a fixed
 * 24h/168h millisecond amount is wrong across a DST transition -- a local
 * day is 23h or 25h long there, so a millisecond step lands an hour off the
 * neighboring day's start-of-day key and map lookups silently miss. Instead
 * we step the calendar day/week via `date-fns` (which operates on the
 * `Date`'s local fields, not raw milliseconds) and re-normalize through
 * {@link startOfDay} every step, so each result is always an exact,
 * lookup-able start-of-day key.
 */
function nextDay(day: number): number {
  return startOfDay(addDays(new Date(day), 1).getTime())
}

function previousWeek(weekStart: number): number {
  return startOfDay(subWeeks(new Date(weekStart), 1).getTime())
}

function nextWeek(weekStart: number): number {
  return startOfDay(addWeeks(new Date(weekStart), 1).getTime())
}

export type HabitGridDay = {
  /** Start-of-day timestamp. */
  date: number
  /** Whether an entry exists and satisfies the habit's completion condition. */
  complete: boolean
  /** Whether any entry (complete or not) exists for this day. */
  hasEntry: boolean
  /** True for days after `today` -- rendered but not interactive. */
  isFuture: boolean
  isToday: boolean
}

/** One Monday-Sunday column of the grid. */
export type HabitGridWeek = ReadonlyArray<HabitGridDay>

/**
 * Build a grid of `weeksCount` Monday-start weeks ending on the week
 * containing `today`, oldest week first.
 */
export function buildHabitGrid(
  habit: Readonly<DbHabit>,
  entries: ReadonlyArray<DbHabitEntry>,
  weeksCount: number,
  today: number,
): ReadonlyArray<HabitGridWeek> {
  const todayDay = startOfDay(today)
  const entryByDay = new Map(entries.map((entry) => [entry.date, entry]))

  const currentWeekStart = startOfDay(
    startOfWeek(todayDay, { weekStartsOn: WEEK_STARTS_ON }).getTime(),
  )
  let firstWeekStart = currentWeekStart
  for (let i = 0; i < weeksCount - 1; i++) {
    firstWeekStart = previousWeek(firstWeekStart)
  }

  const weeks: Array<HabitGridWeek> = []
  let weekStart = firstWeekStart
  for (let week = 0; week < weeksCount; week++) {
    const days: Array<HabitGridDay> = []
    let date = weekStart
    for (let day = 0; day < 7; day++) {
      const entry = entryByDay.get(date)
      days.push({
        date,
        complete: entry !== undefined && isEntryComplete(habit, entry),
        hasEntry: entry !== undefined,
        isFuture: date > todayDay,
        isToday: date === todayDay,
      })
      date = nextDay(date)
    }
    weeks.push(days)
    weekStart = nextWeek(weekStart)
  }

  return weeks
}
