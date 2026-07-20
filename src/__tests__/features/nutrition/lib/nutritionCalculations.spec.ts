import { describe, expect, it } from 'vitest'
import type { DbNutritionDiaryEntry } from '@/db/schema'
import {
  caloriesFromMacros,
  DEFAULT_MACRO_PERCENTS,
  macroGramsFromPercents,
  macroPercentsFromGrams,
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

  it('computes calories from macro grams at 4/4/9 kcal per gram', () => {
    expect(caloriesFromMacros({ proteinGrams: 200, carbohydrateGrams: 240, fatGrams: 70 })).toBe(
      2390,
    )
    expect(caloriesFromMacros({ proteinGrams: 0, carbohydrateGrams: 0, fatGrams: 0 })).toBe(0)
  })

  it('converts a percentage split of calories into macro grams', () => {
    expect(macroGramsFromPercents(2600, { protein: 50, carbohydrate: 30, fat: 20 })).toEqual({
      proteinGrams: 325,
      carbohydrateGrams: 195,
      fatGrams: 58,
    })
  })

  it('derives integer macro percentages from grams that always sum to 100', () => {
    const percents = macroPercentsFromGrams({
      proteinGrams: 160,
      carbohydrateGrams: 240,
      fatGrams: 70,
    })
    expect(percents.protein + percents.carbohydrate + percents.fat).toBe(100)
    expect(percents).toEqual({ protein: 29, carbohydrate: 43, fat: 28 })
  })

  it('round-trips grams through percentages exactly', () => {
    const grams = { proteinGrams: 325, carbohydrateGrams: 195, fatGrams: 58 }
    const percents = macroPercentsFromGrams(grams)
    const roundTripped = macroGramsFromPercents(caloriesFromMacros(grams), percents)
    expect(roundTripped).toEqual(grams)
  })

  it('falls back to a default split when all macros are zero', () => {
    expect(macroPercentsFromGrams({ proteinGrams: 0, carbohydrateGrams: 0, fatGrams: 0 })).toEqual(
      DEFAULT_MACRO_PERCENTS,
    )
  })
})
