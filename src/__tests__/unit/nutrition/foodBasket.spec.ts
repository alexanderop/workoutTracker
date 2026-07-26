import { describe, expect, it } from 'vitest'
import {
  buildCommit,
  isAdjustable,
  stagedTotals,
  type StagedItem,
} from '@/features/nutrition/lib/foodBasket'
import type { DbFoodNutrients } from '@/db/schema'

const SKYR: DbFoodNutrients = {
  calories: 60,
  proteinGrams: 11,
  carbohydrateGrams: 3.5,
  fatGrams: 0.2,
}

function sequentialIds(): () => string {
  let next = 0
  return () => `id-${++next}`
}

const OPTIONS = {
  localDate: '2026-07-26',
  meal: 'lunch',
  now: 1_700_000_000_000,
  servingName: 'serving',
} as const

const libraryItem: StagedItem = {
  source: 'library',
  foodId: 'food-skyr',
  stageId: 's1',
  name: 'Skyr',
  brand: 'Arla',
  nutrientsPer100Grams: SKYR,
  grams: 400,
}

const newItem: StagedItem = {
  source: 'new',
  stageId: 's2',
  name: 'Nutella',
  brand: 'Ferrero',
  nutrientsPer100Grams: {
    calories: 539,
    proteinGrams: 6.3,
    carbohydrateGrams: 57.5,
    fatGrams: 30.9,
  },
  grams: 15,
}

const quickItem: StagedItem = {
  source: 'quick',
  stageId: 's3',
  name: 'Restaurant',
  brand: null,
  nutrientsPer100Grams: { calories: 650, proteinGrams: 45, carbohydrateGrams: 30, fatGrams: 20 },
  grams: 100,
}

describe('stagedTotals', () => {
  it('scales each item to its grams and sums them', () => {
    expect(stagedTotals([libraryItem, quickItem])).toEqual({
      calories: 60 * 4 + 650,
      proteinGrams: 11 * 4 + 45,
      carbohydrateGrams: 3.5 * 4 + 30,
      fatGrams: 0.2 * 4 + 20,
    })
  })

  it('is zero for an empty basket', () => {
    expect(stagedTotals([])).toEqual({
      calories: 0,
      proteinGrams: 0,
      carbohydrateGrams: 0,
      fatGrams: 0,
    })
  })
})

describe('isAdjustable', () => {
  it('allows grams edits for library and new foods, but not for a quick add', () => {
    expect(isAdjustable(libraryItem)).toBe(true)
    expect(isAdjustable(newItem)).toBe(true)
    expect(isAdjustable(quickItem)).toBe(false)
  })
})

describe('buildCommit', () => {
  it('writes an entry only for a library food, pointing at it', () => {
    const { foods, entries } = buildCommit([libraryItem], {
      ...OPTIONS,
      newId: sequentialIds(),
    })

    expect(foods).toEqual([])
    expect(entries).toEqual([
      {
        id: 'id-1',
        localDate: '2026-07-26',
        meal: 'lunch',
        foodId: 'food-skyr',
        grams: 400,
        foodSnapshot: { name: 'Skyr', brand: 'Arla', nutrientsPer100Grams: SKYR },
        loggedAt: OPTIONS.now,
        updatedAt: OPTIONS.now,
      },
    ])
  })

  it('creates a reusable food for a new item and links the entry to it', () => {
    const { foods, entries } = buildCommit([newItem], { ...OPTIONS, newId: sequentialIds() })

    expect(foods).toEqual([
      {
        id: 'id-1',
        name: 'Nutella',
        brand: 'Ferrero',
        nutrientsPer100Grams: newItem.nutrientsPer100Grams,
        defaultServingName: 'serving',
        defaultServingGrams: 15,
        favorite: false,
        archivedAt: null,
        createdAt: OPTIONS.now,
        updatedAt: OPTIONS.now,
        lastUsedAt: OPTIONS.now,
      },
    ])
    expect(entries[0]).toMatchObject({ id: 'id-2', foodId: 'id-1', grams: 15 })
  })

  it('leaves the library untouched for a quick add', () => {
    const { foods, entries } = buildCommit([quickItem], { ...OPTIONS, newId: sequentialIds() })

    expect(foods).toEqual([])
    expect(entries[0]).toMatchObject({
      foodId: null,
      grams: 100,
      foodSnapshot: { name: 'Restaurant', brand: null },
    })
  })

  it('stamps every item in the basket with the same meal, date and timestamp', () => {
    const { entries } = buildCommit([libraryItem, newItem, quickItem], {
      ...OPTIONS,
      newId: sequentialIds(),
    })

    expect(entries).toHaveLength(3)
    for (const entry of entries) {
      expect(entry.meal).toBe('lunch')
      expect(entry.localDate).toBe('2026-07-26')
      expect(entry.loggedAt).toBe(OPTIONS.now)
    }
  })

  it('gives every produced row a distinct id', () => {
    const { foods, entries } = buildCommit([libraryItem, newItem, quickItem], {
      ...OPTIONS,
      newId: sequentialIds(),
    })

    const ids = [...foods.map((food) => food.id), ...entries.map((entry) => entry.id)]
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('produces nothing for an empty basket', () => {
    expect(buildCommit([], OPTIONS)).toEqual({ foods: [], entries: [] })
  })
})
