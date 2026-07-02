import type { DbWeightEntry } from '@/db/schema'
import { generateId } from '@/db'
import { getStartOfDay } from '@/features/weight/lib/weightCalculations'

export function createDbWeightEntry(overrides: Partial<DbWeightEntry> = {}): DbWeightEntry {
  return {
    id: generateId(),
    weight: 75,
    date: getStartOfDay(),
    recordedAt: Date.now(),
    ...overrides,
  }
}

/**
 * Create a weight entry for a specific date.
 */
export function createDbWeightEntryForDate(
  date: Date,
  weight: number,
  overrides: Partial<DbWeightEntry> = {},
): DbWeightEntry {
  return createDbWeightEntry({
    weight,
    date: getStartOfDay(date),
    recordedAt: date.getTime(),
    ...overrides,
  })
}

/**
 * Create multiple weight entries for consecutive days.
 * Returns entries in chronological order (oldest first).
 */
export function createDbWeightEntriesForDays(
  startDate: Date,
  weights: Array<number>,
): Array<DbWeightEntry> {
  return weights.map((weight, index) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + index)
    return createDbWeightEntryForDate(date, weight)
  })
}
