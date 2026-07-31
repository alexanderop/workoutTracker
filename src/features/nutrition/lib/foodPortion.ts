import type { DbFoodNutrients, DbNutritionTargets } from '@/db/schema'
import { scaleNutrients } from './nutritionCalculations'

/** The two ways an amount can be typed into the portion panel. */
export type PortionUnit = 'grams' | 'serving'

/**
 * Grams a typed amount resolves to, or `null` when it cannot make a portion —
 * a non-positive amount, or servings of a product whose serving size is
 * unknown. `null` rather than a fallback: the Add button disables on it,
 * which is the honest answer where a silent 100 g would log made-up food.
 */
export function portionGrams(
  amount: number,
  unit: PortionUnit,
  servingGrams: number | null,
): number | null {
  if (!Number.isFinite(amount) || amount <= 0) return null
  if (unit === 'grams') return amount
  if (servingGrams === null || servingGrams <= 0) return null
  return amount * servingGrams
}

/**
 * Share of each daily target this portion consumes, as rounded percentages.
 * Deliberately unclamped — 221 % of the fat budget is the answer the user is
 * asking for; the ring drawing it clamps, the number does not. A macro with
 * no target reports 0: there is no budget to consume a share of.
 */
export function targetImpactPercents(
  nutrientsPer100Grams: DbFoodNutrients,
  grams: number,
  goal: DbNutritionTargets,
): DbFoodNutrients {
  const portion = scaleNutrients(nutrientsPer100Grams, grams)
  const share = (value: number, target: number): number =>
    target > 0 ? Math.round((value / target) * 100) : 0
  return {
    calories: share(portion.calories, goal.calories),
    proteinGrams: share(portion.proteinGrams, goal.proteinGrams),
    carbohydrateGrams: share(portion.carbohydrateGrams, goal.carbohydrateGrams),
    fatGrams: share(portion.fatGrams, goal.fatGrams),
  }
}
