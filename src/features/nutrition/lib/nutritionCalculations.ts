import type { DbFoodNutrients, DbNutritionDiaryEntry, DbNutritionTargets } from '@/db/schema'

export const DEFAULT_NUTRITION_TARGETS: DbNutritionTargets = {
  calories: 2200,
  proteinGrams: 160,
  carbohydrateGrams: 240,
  fatGrams: 70,
}

export type MacroGrams = Pick<DbNutritionTargets, 'proteinGrams' | 'carbohydrateGrams' | 'fatGrams'>

export type MacroPercents = {
  protein: number
  carbohydrate: number
  fat: number
}

const MACRO_KCAL_PER_GRAM = {
  protein: 4,
  carbohydrate: 4,
  fat: 9,
} as const

export const DEFAULT_MACRO_PERCENTS: MacroPercents = { protein: 30, carbohydrate: 40, fat: 30 }

export function caloriesFromMacros(macros: MacroGrams): number {
  return Math.round(
    macros.proteinGrams * MACRO_KCAL_PER_GRAM.protein +
      macros.carbohydrateGrams * MACRO_KCAL_PER_GRAM.carbohydrate +
      macros.fatGrams * MACRO_KCAL_PER_GRAM.fat,
  )
}

export function macroGramsFromPercents(calories: number, percents: MacroPercents): MacroGrams {
  const gramsFor = (percent: number, kcalPerGram: number) =>
    Math.round((calories * percent) / 100 / kcalPerGram)
  return {
    proteinGrams: gramsFor(percents.protein, MACRO_KCAL_PER_GRAM.protein),
    carbohydrateGrams: gramsFor(percents.carbohydrate, MACRO_KCAL_PER_GRAM.carbohydrate),
    fatGrams: gramsFor(percents.fat, MACRO_KCAL_PER_GRAM.fat),
  }
}

export function macroPercentsFromGrams(macros: MacroGrams): MacroPercents {
  const kcal: Record<keyof MacroPercents, number> = {
    protein: macros.proteinGrams * MACRO_KCAL_PER_GRAM.protein,
    carbohydrate: macros.carbohydrateGrams * MACRO_KCAL_PER_GRAM.carbohydrate,
    fat: macros.fatGrams * MACRO_KCAL_PER_GRAM.fat,
  }
  const total = kcal.protein + kcal.carbohydrate + kcal.fat
  if (total <= 0) return { ...DEFAULT_MACRO_PERCENTS }

  // Largest-remainder rounding so the integer percentages always sum to 100.
  const shares = (['protein', 'carbohydrate', 'fat'] as const).map((key) => {
    const exact = (kcal[key] / total) * 100
    const floor = Math.floor(exact)
    return { key, floor, remainder: exact - floor }
  })
  let leftover = 100 - shares.reduce((sum, share) => sum + share.floor, 0)
  for (const share of [...shares].toSorted((a, b) => b.remainder - a.remainder)) {
    if (leftover <= 0) break
    share.floor += 1
    leftover -= 1
  }
  const result: MacroPercents = { protein: 0, carbohydrate: 0, fat: 0 }
  for (const share of shares) result[share.key] = share.floor
  return result
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
