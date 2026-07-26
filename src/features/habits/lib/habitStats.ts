/**
 * Pure statistics functions for habit tracking.
 *
 * No DB imports -- everything here operates on already-loaded habits and
 * entries, following the Functional Core / Imperative Shell split used
 * elsewhere (see src/features/benchmarks/lib, src/features/weight/lib).
 * Composables/components own fetching data and calling `Date.now()`; these
 * functions just crunch numbers.
 */
import { addDays, addWeeks, startOfWeek, subDays, subWeeks } from 'date-fns'
import { getStartOfDay } from '@/lib/date'
import type { DbHabit, DbHabitEntry } from '@/db/schema'

/**
 * Weeks start on Monday, matching the app-wide convention
 * (see src/composables/useWorkoutCalendar.ts).
 */
const WEEK_STARTS_ON = 1

/**
 * Normalize an arbitrary millisecond timestamp to its start-of-day
 * timestamp, matching the convention `DbHabitEntry.date` is stored under.
 * Thin wrapper around the shared {@link getStartOfDay} (which takes a
 * `Date`) so callers in this module can work directly with the raw
 * millisecond timestamps entries and "today" arguments use.
 */
export function startOfDay(timestampMs: number): number {
  return getStartOfDay(new Date(timestampMs))
}

/**
 * Start-of-day timestamp for the Monday that starts the week containing
 * `timestampMs`.
 *
 * Exported because every surface that lines something up with a habit week --
 * the grid builder, the compact rows' date header -- has to start it on the
 * same day as this module does. A second local `startOfWeek(..., { weekStartsOn })`
 * is a copy of `WEEK_STARTS_ON` waiting to disagree with this one.
 */
export function startOfWeekDay(timestampMs: number): number {
  return startOfDay(startOfWeek(timestampMs, { weekStartsOn: WEEK_STARTS_ON }).getTime())
}

/**
 * Calendar-aware day stepping.
 *
 * Entry dates are LOCAL start-of-day timestamps. Stepping by a fixed
 * 24h/168h millisecond amount is wrong across a DST transition -- a local
 * day is 23h or 25h long there, so a millisecond step lands an hour off the
 * neighboring day's start-of-day key and map lookups silently miss. Instead
 * we step the calendar day via `date-fns` (which operates on the `Date`'s
 * local fields, not raw milliseconds) and re-normalize through
 * {@link startOfDay}/{@link startOfWeekDay} every step, so each result is
 * always an exact, lookup-able start-of-day/start-of-week key.
 */
function previousDay(day: number): number {
  return startOfDay(subDays(new Date(day), 1).getTime())
}

function nextDay(day: number): number {
  return startOfDay(addDays(new Date(day), 1).getTime())
}

function previousWeek(weekStart: number): number {
  return startOfWeekDay(subWeeks(new Date(weekStart), 1).getTime())
}

function nextWeek(weekStart: number): number {
  return startOfWeekDay(addWeeks(new Date(weekStart), 1).getTime())
}

/**
 * Whether a single entry satisfies its habit's completion condition.
 * - binary habits: any recorded value >= 1 counts as done (guards against a
 *   stray `0` entry existing rather than being cleared).
 * - quantity habits: the value must reach the configured target.
 */
export function isEntryComplete(habit: Readonly<DbHabit>, entry: Readonly<DbHabitEntry>): boolean {
  if (habit.kind.type === 'binary') return entry.value >= 1
  return entry.value >= habit.kind.target
}

/** Day timestamp -> entry, for O(1) day lookups. Last entry wins on duplicate days. */
function toEntryByDay(entries: ReadonlyArray<DbHabitEntry>): ReadonlyMap<number, DbHabitEntry> {
  return new Map(entries.map((entry) => [entry.date, entry]))
}

function isDayComplete(
  habit: Readonly<DbHabit>,
  entryByDay: ReadonlyMap<number, DbHabitEntry>,
  day: number,
): boolean {
  const entry = entryByDay.get(day)
  return entry !== undefined && isEntryComplete(habit, entry)
}

/** Count of complete days within the Mon-Sun week starting at `weekStart`. */
function countCompleteDaysInWeek(
  habit: Readonly<DbHabit>,
  entryByDay: ReadonlyMap<number, DbHabitEntry>,
  weekStart: number,
): number {
  let count = 0
  let day = weekStart
  for (let i = 0; i < 7; i++) {
    if (isDayComplete(habit, entryByDay, day)) count += 1
    day = nextDay(day)
  }
  return count
}

// ============================================
// Streaks
// ============================================

/**
 * Current streak, counted backwards from `today`.
 *
 * - Daily habits: consecutive complete days. **Grace day**: if `today`
 *   itself has no entry (or an incomplete one), that alone does not break
 *   the streak -- the day isn't over yet. The streak is then measured
 *   through yesterday. A gap on any earlier day still ends the streak.
 * - Weekly habits: consecutive Mon-Sun weeks that reached
 *   `targetDaysPerWeek`. The current, still-in-progress week is always
 *   excluded from the count (in either direction) -- it hasn't finished, so
 *   it can neither extend nor break the streak yet.
 * - No entries at all -> `0`.
 */
export function currentStreak(
  habit: Readonly<DbHabit>,
  entries: ReadonlyArray<DbHabitEntry>,
  today: number,
): number {
  const todayDay = startOfDay(today)
  const entryByDay = toEntryByDay(entries)

  if (habit.schedule.type === 'weekly') {
    return currentWeeklyStreak(habit, habit.schedule.targetDaysPerWeek, entryByDay, todayDay)
  }

  let streak = 0
  let cursor = todayDay
  let isToday = true

  for (;;) {
    if (isDayComplete(habit, entryByDay, cursor)) {
      streak += 1
      isToday = false
      cursor = previousDay(cursor)
      continue
    }
    // Grace: today not being done yet doesn't break the streak, it's simply
    // not counted (yet). Any earlier gap ends the scan.
    if (!isToday) break
    isToday = false
    cursor = previousDay(cursor)
  }

  return streak
}

function currentWeeklyStreak(
  habit: Readonly<DbHabit>,
  targetDaysPerWeek: number,
  entryByDay: ReadonlyMap<number, DbHabitEntry>,
  todayDay: number,
): number {
  const currentWeekStart = startOfWeekDay(todayDay)
  let streak = 0
  let weekCursor = previousWeek(currentWeekStart) // most recent fully-elapsed week

  while (countCompleteDaysInWeek(habit, entryByDay, weekCursor) >= targetDaysPerWeek) {
    streak += 1
    weekCursor = previousWeek(weekCursor)
  }

  return streak
}

/**
 * Longest streak ever recorded for a habit (not anchored to "today").
 * Every day/week in a run must independently satisfy the habit -- there is
 * no grace day here, unlike {@link currentStreak}'s treatment of "today".
 */
export function longestStreak(
  habit: Readonly<DbHabit>,
  entries: ReadonlyArray<DbHabitEntry>,
): number {
  if (entries.length === 0) return 0

  if (habit.schedule.type === 'weekly') {
    return longestWeeklyStreak(habit, habit.schedule.targetDaysPerWeek, entries)
  }

  const completeDays = new Set(
    entries.filter((entry) => isEntryComplete(habit, entry)).map((entry) => entry.date),
  )

  let longest = 0
  for (const day of completeDays) {
    if (completeDays.has(previousDay(day))) continue // not a run-start; counted from its own start
    let length = 0
    let cursor = day
    while (completeDays.has(cursor)) {
      length += 1
      cursor = nextDay(cursor)
    }
    longest = Math.max(longest, length)
  }

  return longest
}

function longestWeeklyStreak(
  habit: Readonly<DbHabit>,
  targetDaysPerWeek: number,
  entries: ReadonlyArray<DbHabitEntry>,
): number {
  const entryByDay = toEntryByDay(entries)

  const weekStarts = new Set(entries.map((entry) => startOfWeekDay(entry.date)))
  const completeWeeks = new Set(
    [...weekStarts].filter(
      (weekStart) => countCompleteDaysInWeek(habit, entryByDay, weekStart) >= targetDaysPerWeek,
    ),
  )

  let longest = 0
  for (const week of completeWeeks) {
    if (completeWeeks.has(previousWeek(week))) continue
    let length = 0
    let cursor = week
    while (completeWeeks.has(cursor)) {
      length += 1
      cursor = nextWeek(cursor)
    }
    longest = Math.max(longest, length)
  }

  return longest
}

// ============================================
// Completion rate & weekly progress
// ============================================

/**
 * Fraction (0..1) of days within the trailing `rangeDays`-day window ending
 * on `referenceDay` (inclusive) that are complete.
 *
 * This is a raw completed-day density, *not* schedule-adjusted: a weekly
 * habit with a 3x/week target is measured against all `rangeDays` calendar
 * days, not just its target days, so it cannot read as 100% just because it
 * hit every target day. Callers wanting a schedule-aware "on track this
 * week" figure should use {@link weeklyProgress} instead.
 *
 * `referenceDay` defaults to `Date.now()` for call-site convenience but can
 * be overridden to keep this pure and testable.
 * `rangeDays <= 0` returns `0` (no window to measure).
 */
export function completionRate(
  habit: Readonly<DbHabit>,
  entries: ReadonlyArray<DbHabitEntry>,
  rangeDays: number,
  referenceDay: number = Date.now(),
): number {
  if (rangeDays <= 0) return 0

  const entryByDay = toEntryByDay(entries)
  let day = startOfDay(referenceDay)

  let completeCount = 0
  for (let i = 0; i < rangeDays; i++) {
    if (isDayComplete(habit, entryByDay, day)) completeCount += 1
    day = previousDay(day)
  }

  return completeCount / rangeDays
}

/**
 * Days completed vs. target for the Mon-Sun week containing `weekStart`.
 * Daily habits are treated as a 7-day-per-week target (every day counts).
 */
export type WeeklyProgress = {
  completed: number
  target: number
}

export function weeklyProgress(
  habit: Readonly<DbHabit>,
  entries: ReadonlyArray<DbHabitEntry>,
  weekStart: number,
): WeeklyProgress {
  const entryByDay = toEntryByDay(entries)
  const normalizedWeekStart = startOfWeekDay(weekStart)
  const completed = countCompleteDaysInWeek(habit, entryByDay, normalizedWeekStart)
  const target = habit.schedule.type === 'weekly' ? habit.schedule.targetDaysPerWeek : 7

  return { completed, target }
}
