import { describe, expect, it } from 'vitest'
import { portionGrams, targetImpactPercents } from '@/features/nutrition/lib/foodPortion'
import { scaleNutrients } from '@/features/nutrition/lib/nutritionCalculations'

const PER_100_GRAMS = { calories: 539, proteinGrams: 6.3, carbohydrateGrams: 57.5, fatGrams: 30.9 }
const GOAL = { calories: 2500, proteinGrams: 160, carbohydrateGrams: 240, fatGrams: 70 }

describe('portionGrams', () => {
  it('passes a gram amount straight through', () => {
    expect(portionGrams(250, 'grams', 15)).toBe(250)
  })

  it('multiplies servings by the serving size', () => {
    expect(portionGrams(2, 'serving', 15)).toBe(30)
  })

  it('supports fractional servings', () => {
    expect(portionGrams(0.5, 'serving', 15)).toBe(7.5)
  })

  it('cannot resolve servings when the product has no serving size', () => {
    expect(portionGrams(1, 'serving', null)).toBeNull()
  })

  it('rejects amounts that make no portion', () => {
    expect(portionGrams(0, 'grams', 15)).toBeNull()
    expect(portionGrams(-5, 'grams', 15)).toBeNull()
    expect(portionGrams(NaN, 'grams', 15)).toBeNull()
  })

  it('rejects a nonsensical serving size instead of producing 0 g', () => {
    expect(portionGrams(1, 'serving', 0)).toBeNull()
  })
})

describe('targetImpactPercents', () => {
  it('reports what share of each daily target the portion consumes', () => {
    // 100 g of the fixture: 539 kcal of 2500 → 22 %, 6.3 g of 160 g → 4 %,
    // 57.5 g of 240 g → 24 %, 30.9 g of 70 g → 44 %.
    expect(targetImpactPercents(scaleNutrients(PER_100_GRAMS, 100), GOAL)).toEqual({
      calories: 22,
      proteinGrams: 4,
      carbohydrateGrams: 24,
      fatGrams: 44,
    })
  })

  it('follows the scaled portion', () => {
    expect(targetImpactPercents(scaleNutrients(PER_100_GRAMS, 15), GOAL).calories).toBe(3)
  })

  it('can exceed 100 % — the ring clamps, the number does not', () => {
    expect(targetImpactPercents(scaleNutrients(PER_100_GRAMS, 500), GOAL).fatGrams).toBe(221)
  })

  it('reports 0 for a macro whose target is unset', () => {
    const impact = targetImpactPercents(scaleNutrients(PER_100_GRAMS, 100), {
      ...GOAL,
      fatGrams: 0,
    })
    expect(impact.fatGrams).toBe(0)
  })
})
