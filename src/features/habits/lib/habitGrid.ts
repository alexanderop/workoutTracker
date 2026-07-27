import { addDays, addWeeks, endOfMonth, isSameMonth, startOfMonth, subWeeks } from 'date-fns'
import type { DbHabit, DbHabitEntry } from '@/db/schema'
import { startOfDay, startOfWeekDay } from './habitStats'

const DASHBOARD_WEEKS = 16

type HabitDayVisualState = 'future' | 'empty' | 'partial' | 'complete'

export type HabitGridDay = {
  date: number
  value: number
  state: HabitDayVisualState
  isToday: boolean
  /** Compatibility fields for the existing history-grid component. */
  complete: boolean
  hasEntry: boolean
  isFuture: boolean
}

export type HabitGridWeek = ReadonlyArray<HabitGridDay>

function nextDay(day: number): number {
  return startOfDay(addDays(new Date(day), 1).getTime())
}

function previousWeek(weekStart: number): number {
  return startOfDay(subWeeks(new Date(weekStart), 1).getTime())
}

function nextWeek(weekStart: number): number {
  return startOfDay(addWeeks(new Date(weekStart), 1).getTime())
}

function visualState(
  habit: Readonly<DbHabit>,
  value: number,
  isFuture: boolean,
): HabitDayVisualState {
  if (isFuture) return 'future'
  if (value <= 0) return 'empty'
  if (habit.kind.type === 'binary' || value >= habit.kind.target) return 'complete'
  return 'partial'
}

function createDay(
  habit: Readonly<DbHabit>,
  entryByDay: ReadonlyMap<number, DbHabitEntry>,
  date: number,
  today: number,
): HabitGridDay {
  const value = entryByDay.get(date)?.value ?? 0
  const state = visualState(habit, value, date > today)
  return {
    date,
    value,
    state,
    isToday: date === today,
    complete: state === 'complete',
    hasEntry: value > 0,
    isFuture: state === 'future',
  }
}

export function buildHabitGrid(
  habit: Readonly<DbHabit>,
  entries: ReadonlyArray<DbHabitEntry>,
  weeksCount: number,
  referenceDay: number,
): ReadonlyArray<HabitGridWeek> {
  const today = startOfDay(referenceDay)
  const entryByDay = new Map(entries.map((entry) => [startOfDay(entry.date), entry]))
  let firstWeekStart = startOfWeekDay(today)
  for (let index = 1; index < weeksCount; index += 1) firstWeekStart = previousWeek(firstWeekStart)

  const weeks: Array<HabitGridWeek> = []
  let weekStart = firstWeekStart
  for (let weekIndex = 0; weekIndex < weeksCount; weekIndex += 1) {
    const days: Array<HabitGridDay> = []
    let date = weekStart
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      days.push(createDay(habit, entryByDay, date, today))
      date = nextDay(date)
    }
    weeks.push(days)
    weekStart = nextWeek(weekStart)
  }
  return weeks
}

export function buildCompactHabitGrid(
  habit: Readonly<DbHabit>,
  entries: ReadonlyArray<DbHabitEntry>,
  referenceDay: number,
): ReadonlyArray<HabitGridWeek> {
  return buildHabitGrid(habit, entries, DASHBOARD_WEEKS, referenceDay)
}

/** A month-grid day also knows whether it belongs to the month being shown. */
type HabitMonthDay = HabitGridDay & { readonly inMonth: boolean }
export type HabitMonthWeek = ReadonlyArray<HabitMonthDay>

/**
 * The calendar month containing `referenceDay`, padded out to whole Monday-to-
 * Sunday weeks.
 *
 * Same weeks-of-days shape as {@link buildHabitGrid}, but anchored to a month
 * rather than to a trailing window, because its one consumer (the tile grid)
 * renders each week as a *row* under a "Jul 2026" caption. A trailing 6-week
 * window laid out that way is not a month -- its first row starts mid-June --
 * so the caption would be labelling something it doesn't describe.
 *
 * The padding days either side carry their real history rather than being
 * blanks, so the first and last rows are still full weeks; `inMonth` is what
 * lets the grid dim them so the month still reads as a month.
 *
 * Length is 4 to 6 weeks depending on where the month falls, so callers must
 * not assume a fixed row count.
 */
export function buildHabitMonthGrid(
  habit: Readonly<DbHabit>,
  entries: ReadonlyArray<DbHabitEntry>,
  referenceDay: number,
): ReadonlyArray<HabitMonthWeek> {
  const today = startOfDay(referenceDay)
  const entryByDay = new Map(entries.map((entry) => [startOfDay(entry.date), entry]))
  const monthStart = startOfMonth(new Date(referenceDay))
  const lastDayOfMonth = startOfDay(endOfMonth(monthStart).getTime())

  const weeks: Array<HabitMonthWeek> = []
  let weekStart = startOfWeekDay(monthStart.getTime())
  while (weekStart <= lastDayOfMonth) {
    const days: Array<HabitMonthDay> = []
    let date = weekStart
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      days.push({
        ...createDay(habit, entryByDay, date, today),
        inMonth: isSameMonth(date, monthStart),
      })
      date = nextDay(date)
    }
    weeks.push(days)
    weekStart = nextWeek(weekStart)
  }
  return weeks
}
