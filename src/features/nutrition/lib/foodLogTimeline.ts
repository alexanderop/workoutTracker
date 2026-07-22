import type { DbFoodNutrients, DbNutritionDiaryEntry, MealKind } from '@/db/schema'
import { getLocalDateKey, totalDiaryNutrients } from './nutritionCalculations'

/**
 * Hour an entry falls back to when its logged-at moment happened on a
 * different calendar day than the diary day it belongs to (back-logging a
 * past day): the timeline still needs a plausible slot for it.
 */
const MEAL_FALLBACK_HOUR: Record<MealKind, number> = {
  breakfast: 8,
  lunch: 12,
  snack: 15,
  dinner: 18,
}

/** First/last hour the timeline always renders, even with no entries. */
export const TIMELINE_START_HOUR = 7
export const TIMELINE_END_HOUR = 21

/** True when the entry was logged live on its own diary day. */
export function isLoggedOnDiaryDay(entry: DbNutritionDiaryEntry): boolean {
  return getLocalDateKey(new Date(entry.loggedAt)) === entry.localDate
}

/** Timeline hour slot (0-23) for a diary entry. */
export function timelineHour(entry: DbNutritionDiaryEntry): number {
  return isLoggedOnDiaryDay(entry)
    ? new Date(entry.loggedAt).getHours()
    : MEAL_FALLBACK_HOUR[entry.meal]
}

export type FoodLogHourGroup = {
  hour: number
  entries: ReadonlyArray<DbNutritionDiaryEntry>
  totals: DbFoodNutrients
}

/** Diary entries bucketed into hour groups, both levels in chronological order. */
export function groupEntriesByHour(
  entries: ReadonlyArray<DbNutritionDiaryEntry>,
): ReadonlyArray<FoodLogHourGroup> {
  const byHour = new Map<number, Array<DbNutritionDiaryEntry>>()
  for (const entry of entries) {
    const hour = timelineHour(entry)
    const group = byHour.get(hour) ?? []
    group.push(entry)
    byHour.set(hour, group)
  }
  return [...byHour]
    .toSorted(([hourA], [hourB]) => hourA - hourB)
    .map(([hour, hourEntries]) => {
      const sorted = [...hourEntries].toSorted((a, b) => a.loggedAt - b.loggedAt)
      return { hour, entries: sorted, totals: totalDiaryNutrients(sorted) }
    })
}

/**
 * Every hour slot the timeline should render: the default waking range,
 * stretched to include any out-of-range entries.
 */
export function timelineHours(groups: ReadonlyArray<FoodLogHourGroup>): ReadonlyArray<number> {
  const first = Math.min(TIMELINE_START_HOUR, ...groups.map((group) => group.hour))
  const last = Math.max(TIMELINE_END_HOUR, ...groups.map((group) => group.hour))
  return Array.from({ length: last - first + 1 }, (_, index) => first + index)
}

/** Meal preselected when adding food from a given hour slot. */
export function mealForHour(hour: number): MealKind {
  if (hour < 5) return 'snack'
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 17) return 'snack'
  if (hour < 22) return 'dinner'
  return 'snack'
}

/** Local-date key shifted by whole calendar days (DST-safe: date math, not ms math). */
export function shiftLocalDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  return getLocalDateKey(new Date(year, month - 1, day + days))
}

/** Date object at local midnight for a local-date key. */
export function dateFromLocalDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** The Monday-based week (7 local-date keys) containing `dateKey`. */
export function weekLocalDateKeys(dateKey: string): ReadonlyArray<string> {
  const date = dateFromLocalDateKey(dateKey)
  const mondayOffset = (date.getDay() + 6) % 7
  return Array.from({ length: 7 }, (_, index) =>
    getLocalDateKey(
      new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset + index),
    ),
  )
}
