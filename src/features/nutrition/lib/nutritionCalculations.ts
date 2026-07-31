import type { DbFoodNutrients, DbNutritionDiaryEntry, DbNutritionTargets } from '@/db/schema'

export const DEFAULT_NUTRITION_TARGETS: DbNutritionTargets = {
  calories: 2200,
  proteinGrams: 160,
  carbohydrateGrams: 240,
  fatGrams: 70,
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function scaleNutrients(nutrients: DbFoodNutrients, grams: number): DbFoodNutrients {
  const factor = grams / 100
  return {
    calories: nutrients.calories * factor,
    proteinGrams: nutrients.proteinGrams * factor,
    carbohydrateGrams: nutrients.carbohydrateGrams * factor,
    fatGrams: nutrients.fatGrams * factor,
  }
}

export function totalDiaryNutrients(
  entries: ReadonlyArray<DbNutritionDiaryEntry>,
): DbFoodNutrients {
  return entries.reduce<DbFoodNutrients>(
    (total, entry) => {
      const nutrients = scaleNutrients(entry.foodSnapshot.nutrientsPer100Grams, entry.grams)
      return {
        calories: total.calories + nutrients.calories,
        proteinGrams: total.proteinGrams + nutrients.proteinGrams,
        carbohydrateGrams: total.carbohydrateGrams + nutrients.carbohydrateGrams,
        fatGrams: total.fatGrams + nutrients.fatGrams,
      }
    },
    { calories: 0, proteinGrams: 0, carbohydrateGrams: 0, fatGrams: 0 },
  )
}

/**
 * Local-date keys for the last `days` calendar days, oldest first.
 */
export function lastNLocalDateKeys(days: number, from = new Date()): Array<string> {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(from)
    date.setDate(date.getDate() - (days - 1 - index))
    return getLocalDateKey(date)
  })
}

/**
 * Total calories per day across `dateKeys`, aligned oldest-first, for a
 * trend sparkline. Days with no entries are `0`.
 */
export function caloriesByLocalDate(
  entries: ReadonlyArray<DbNutritionDiaryEntry>,
  dateKeys: ReadonlyArray<string>,
): Array<number> {
  const caloriesByDate = new Map<string, number>()
  for (const entry of entries) {
    const { calories } = scaleNutrients(entry.foodSnapshot.nutrientsPer100Grams, entry.grams)
    caloriesByDate.set(entry.localDate, (caloriesByDate.get(entry.localDate) ?? 0) + calories)
  }
  return dateKeys.map((key) => Math.round(caloriesByDate.get(key) ?? 0))
}

export type BudgetSegments = {
  /** Width of the already-logged segment, in percent of the bar. */
  readonly committedPct: number
  /** Width of the staged-but-uncommitted segment, drawn after `committedPct`. */
  readonly stagedPct: number
  /** Where the target sits on the bar. Below 100 exactly when over target. */
  readonly tickPct: number
  readonly overflow: boolean
}

/**
 * Lay out a macro budget bar so going over target stays legible.
 *
 * The bar scales to `max(committed + staged, target)` and carries a tick at
 * the target rather than clamping at it. A clamped bar renders 2210/2200 and
 * 4000/2200 identically — it saturates exactly when the staged-vs-committed
 * split is trying to answer "how much does this basket cost me?".
 *
 * `useNutritionDay.calorieProgress` deliberately still clamps: it feeds a
 * conic-gradient ring and a `Progress` primitive, both 0-100 by contract, and
 * a ring has nowhere to grow past its own circumference.
 */
export function budgetSegments(committed: number, staged: number, target: number): BudgetSegments {
  const total = Math.max(0, committed) + Math.max(0, staged)
  if (target <= 0) {
    return { committedPct: 0, stagedPct: 0, tickPct: 0, overflow: total > 0 }
  }
  const scale = Math.max(total, target)
  return {
    committedPct: (Math.max(0, committed) / scale) * 100,
    stagedPct: (Math.max(0, staged) / scale) * 100,
    tickPct: (target / scale) * 100,
    overflow: total > target,
  }
}

/**
 * Macro display order and chart-color slot, shared by every macro read-out
 * (budget bars, portion rings) so two components cannot disagree on which
 * color means which macro. Both color forms are spelled out literally: the
 * class form because Tailwind's scanner only sees literal class names, the
 * var form for inline gradients.
 */
export const MACRO_DISPLAY = [
  { key: 'calories', colorClass: 'bg-chart-1', colorVar: 'var(--chart-1)' },
  { key: 'proteinGrams', colorClass: 'bg-chart-2', colorVar: 'var(--chart-2)' },
  { key: 'fatGrams', colorClass: 'bg-chart-4', colorVar: 'var(--chart-4)' },
  { key: 'carbohydrateGrams', colorClass: 'bg-chart-5', colorVar: 'var(--chart-5)' },
] as const satisfies ReadonlyArray<{
  key: keyof DbNutritionTargets
  colorClass: string
  colorVar: string
}>

export function nutrientsPer100Grams(
  nutrientsForServing: DbFoodNutrients,
  servingGrams: number,
): DbFoodNutrients {
  const factor = 100 / servingGrams
  return {
    calories: nutrientsForServing.calories * factor,
    proteinGrams: nutrientsForServing.proteinGrams * factor,
    carbohydrateGrams: nutrientsForServing.carbohydrateGrams * factor,
    fatGrams: nutrientsForServing.fatGrams * factor,
  }
}
