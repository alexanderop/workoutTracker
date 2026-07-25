import type { DbHabit, DbHabitEntry, HabitKind, HabitSchedule } from '@/db/schema'
import { generateId } from '@/db/generateId'
import { getStartOfDay } from '@/lib/date'

const DEFAULT_SCHEDULE: HabitSchedule = { type: 'daily' }
const DEFAULT_KIND: HabitKind = { type: 'binary' }

export function createDbHabit(overrides: Partial<DbHabit> = {}): DbHabit {
  return {
    id: generateId(),
    name: 'Drink water',
    icon: null,
    description: null,
    accent: 'purple',
    schedule: DEFAULT_SCHEDULE,
    kind: DEFAULT_KIND,
    autoLink: null,
    archivedAt: null,
    orderIndex: 0,
    createdAt: Date.now(),
    ...overrides,
  }
}

export function createDbHabitEntry(overrides: Partial<DbHabitEntry> = {}): DbHabitEntry {
  return {
    id: generateId(),
    habitId: generateId(),
    date: getStartOfDay(),
    value: 1,
    recordedAt: Date.now(),
    ...overrides,
  }
}

/**
 * Create a habit entry for a specific date.
 */
export function createDbHabitEntryForDate(
  habitId: string,
  date: Date,
  overrides: Partial<DbHabitEntry> = {},
): DbHabitEntry {
  return createDbHabitEntry({
    habitId,
    date: getStartOfDay(date),
    recordedAt: date.getTime(),
    ...overrides,
  })
}

/**
 * Create entries for consecutive days starting at `startDate`.
 * `values[i]` is the entry value recorded on day `i`; `null` skips that day
 * (no entry created), for modeling gaps in a streak.
 */
export function createDbHabitEntriesForDays(
  habitId: string,
  startDate: Date,
  values: ReadonlyArray<number | null>,
): Array<DbHabitEntry> {
  const entries: Array<DbHabitEntry> = []
  for (const [index, value] of values.entries()) {
    if (value === null) continue
    const date = new Date(startDate)
    date.setDate(date.getDate() + index)
    entries.push(createDbHabitEntryForDate(habitId, date, { value }))
  }
  return entries
}
