import type { DbFood, DbNutritionDiaryEntry } from '@/db/schema'

/** Minutes either side of "now" that count as the same time-of-day window. */
export const TIME_PICK_WINDOW_MINUTES = 90

const MINUTES_PER_DAY = 24 * 60

/** Minutes since local midnight for a timestamp. */
function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

/** Circular time-of-day distance in minutes (23:30 and 00:30 are 60 min apart). */
function circularMinuteDistance(a: number, b: number): number {
  const linear = Math.abs(a - b)
  return Math.min(linear, MINUTES_PER_DAY - linear)
}

/**
 * Case-insensitive substring filter on food name or brand. A blank/whitespace
 * query returns an empty array (the caller shows suggestion sections instead).
 * Preserves the incoming order of `foods`.
 */
export function filterFoods(foods: ReadonlyArray<DbFood>, query: string): ReadonlyArray<DbFood> {
  const needle = query.trim().toLowerCase()
  if (needle === '') return []
  return foods.filter(
    (food) =>
      food.name.toLowerCase().includes(needle) ||
      (food.brand?.toLowerCase().includes(needle) ?? false),
  )
}

/**
 * Foods historically logged within ±TIME_PICK_WINDOW_MINUTES of `now`'s time
 * of day (on any date), ranked by how often, most frequent first; ties broken
 * by most recent loggedAt. The time-of-day distance is circular across
 * midnight. Entries whose foodId is null or not present in `foods` are
 * ignored. Returns at most `limit` foods.
 */
export function timePickFoods(
  foods: ReadonlyArray<DbFood>,
  entries: ReadonlyArray<DbNutritionDiaryEntry>,
  now: Date,
  limit = 5,
): ReadonlyArray<DbFood> {
  const foodsById = new Map(foods.map((food) => [food.id, food]))
  const nowMinutes = minutesOfDay(now)
  const stats = new Map<string, { count: number; latestLoggedAt: number }>()
  for (const entry of entries) {
    if (entry.foodId === null || !foodsById.has(entry.foodId)) continue
    const entryMinutes = minutesOfDay(new Date(entry.loggedAt))
    if (circularMinuteDistance(entryMinutes, nowMinutes) > TIME_PICK_WINDOW_MINUTES) continue
    const stat = stats.get(entry.foodId) ?? { count: 0, latestLoggedAt: 0 }
    stats.set(entry.foodId, {
      count: stat.count + 1,
      latestLoggedAt: Math.max(stat.latestLoggedAt, entry.loggedAt),
    })
  }
  return [...stats]
    .toSorted(([, a], [, b]) => b.count - a.count || b.latestLoggedAt - a.latestLoggedAt)
    .slice(0, limit)
    .flatMap(([foodId]) => foodsById.get(foodId) ?? [])
}

/** Most recently logged distinct foods, newest first, at most `limit`. Entries with null/unknown foodId are skipped. */
export function latestFoods(
  foods: ReadonlyArray<DbFood>,
  entries: ReadonlyArray<DbNutritionDiaryEntry>,
  limit = 10,
): ReadonlyArray<DbFood> {
  const foodsById = new Map(foods.map((food) => [food.id, food]))
  const picked: Array<DbFood> = []
  const seen = new Set<string>()
  for (const entry of [...entries].toSorted((a, b) => b.loggedAt - a.loggedAt)) {
    if (picked.length >= limit) break
    if (entry.foodId === null || seen.has(entry.foodId)) continue
    const food = foodsById.get(entry.foodId)
    if (!food) continue
    seen.add(entry.foodId)
    picked.push(food)
  }
  return picked
}

/** Grams of each food's most recent diary entry, in one pass over `entries`. */
export function latestGramsByFoodId(
  entries: ReadonlyArray<DbNutritionDiaryEntry>,
): ReadonlyMap<string, number> {
  const latest = new Map<string, { loggedAt: number; grams: number }>()
  for (const entry of entries) {
    if (entry.foodId === null) continue
    const current = latest.get(entry.foodId)
    if (current === undefined || entry.loggedAt > current.loggedAt) {
      latest.set(entry.foodId, { loggedAt: entry.loggedAt, grams: entry.grams })
    }
  }
  return new Map([...latest].map(([foodId, { grams }]) => [foodId, grams]))
}

/**
 * Grams a one-tap quick add should log for `food`: defaultServingGrams, else
 * the grams of the food's most recent diary entry, else 100. Callers ranking
 * many foods should build {@link latestGramsByFoodId} once and use this.
 */
export function quickAddGramsFrom(food: DbFood, latestGrams: ReadonlyMap<string, number>): number {
  return food.defaultServingGrams ?? latestGrams.get(food.id) ?? 100
}

/** Single-food convenience over {@link quickAddGramsFrom}. */
export function quickAddGrams(food: DbFood, entries: ReadonlyArray<DbNutritionDiaryEntry>): number {
  return quickAddGramsFrom(food, latestGramsByFoodId(entries))
}
