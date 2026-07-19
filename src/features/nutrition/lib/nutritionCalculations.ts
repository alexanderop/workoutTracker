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
