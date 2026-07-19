import { describe, expect, it } from 'vitest'
import type { DbNutritionDiaryEntry } from '@/db/schema'
import {
  nutrientsPer100Grams,
  scaleNutrients,
  totalDiaryNutrients,
} from '@/features/nutrition/lib/nutritionCalculations'

function makeEntry(id: string, grams: number, caloriesPer100Grams: number): DbNutritionDiaryEntry {
  return {
    id,
    localDate: '2026-07-19',
    meal: 'breakfast',
    foodId: id,
    grams,
    foodSnapshot: {
      name: id,
      brand: null,
      nutrientsPer100Grams: {
        calories: caloriesPer100Grams,
        proteinGrams: 10,
        carbohydrateGrams: 20,
        fatGrams: 5,
      },
    },
    loggedAt: 1,
    updatedAt: 1,
  }
}

describe('nutrition calculations', () => {
  it('normalizes serving nutrients and scales them back without losing totals', () => {
    const per100 = nutrientsPer100Grams(
      { calories: 180, proteinGrams: 20, carbohydrateGrams: 12, fatGrams: 4 },
      200,
    )

    expect(scaleNutrients(per100, 200)).toEqual({
      calories: 180,
      proteinGrams: 20,
      carbohydrateGrams: 12,
      fatGrams: 4,
    })
  })

  it('totals multiple diary snapshots using each logged serving size', () => {
    expect(totalDiaryNutrients([makeEntry('a', 200, 100), makeEntry('b', 50, 300)])).toEqual({
      calories: 350,
      proteinGrams: 25,
      carbohydrateGrams: 50,
      fatGrams: 12.5,
    })
  })
})
