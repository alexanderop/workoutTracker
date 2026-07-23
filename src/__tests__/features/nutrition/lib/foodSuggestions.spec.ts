import { describe, expect, it } from 'vitest'
import type { DbFood, DbNutritionDiaryEntry } from '@/db/schema'
import {
  filterFoods,
  latestFoods,
  quickAddGrams,
  timePickFoods,
} from '@/features/nutrition/lib/foodSuggestions'

function makeFood(
  id: string,
  overrides: Partial<Pick<DbFood, 'name' | 'brand' | 'defaultServingGrams'>> = {},
): DbFood {
  return {
    id,
    name: overrides.name ?? id,
    brand: overrides.brand ?? null,
    nutrientsPer100Grams: { calories: 100, proteinGrams: 10, carbohydrateGrams: 20, fatGrams: 5 },
    defaultServingName: null,
    defaultServingGrams: overrides.defaultServingGrams ?? null,
    favorite: false,
    archivedAt: null,
    createdAt: 1,
    updatedAt: 1,
    lastUsedAt: null,
  }
}

function makeEntry(
  id: string,
  overrides: Partial<Pick<DbNutritionDiaryEntry, 'foodId' | 'grams' | 'loggedAt'>> = {},
): DbNutritionDiaryEntry {
  return {
    id,
    localDate: '2026-07-22',
    meal: 'breakfast',
    foodId: overrides.foodId === undefined ? id : overrides.foodId,
    grams: overrides.grams ?? 100,
    foodSnapshot: {
      name: id,
      brand: null,
      nutrientsPer100Grams: { calories: 100, proteinGrams: 10, carbohydrateGrams: 20, fatGrams: 5 },
    },
    loggedAt: overrides.loggedAt ?? new Date(2026, 6, 22, 9, 15).getTime(),
    updatedAt: 1,
  }
}

describe('filterFoods', () => {
  const oats = makeFood('oats', { name: 'Rolled Oats' })
  const yogurt = makeFood('yogurt', { name: 'Greek Yogurt', brand: 'Fage' })
  const banana = makeFood('banana', { name: 'Banana' })

  it('matches name substrings case-insensitively', () => {
    expect(filterFoods([oats, yogurt, banana], 'OATS')).toEqual([oats])
    expect(filterFoods([oats, yogurt, banana], 'an')).toEqual([banana])
  })

  it('matches brand substrings', () => {
    expect(filterFoods([oats, yogurt, banana], 'fage')).toEqual([yogurt])
  })

  it('returns an empty array for blank or whitespace queries', () => {
    expect(filterFoods([oats, yogurt], '')).toEqual([])
    expect(filterFoods([oats, yogurt], ' '.repeat(3))).toEqual([])
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterFoods([oats, yogurt], 'pizza')).toEqual([])
  })

  it('preserves the incoming order of foods', () => {
    const granola = makeFood('granola', { name: 'Oat Granola' })
    expect(filterFoods([granola, oats], 'oat')).toEqual([granola, oats])
  })
})

describe('timePickFoods', () => {
  const oats = makeFood('oats')
  const yogurt = makeFood('yogurt')
  const banana = makeFood('banana')
  const foods = [oats, yogurt, banana]
  const nineAm = new Date(2026, 6, 22, 9, 0)

  it('counts within-window entries across different dates and ranks by frequency', () => {
    const entries = [
      makeEntry('a', { foodId: 'yogurt', loggedAt: new Date(2026, 6, 20, 8, 30).getTime() }),
      makeEntry('b', { foodId: 'oats', loggedAt: new Date(2026, 6, 20, 9, 10).getTime() }),
      makeEntry('c', { foodId: 'oats', loggedAt: new Date(2026, 6, 21, 8, 45).getTime() }),
    ]

    expect(timePickFoods(foods, entries, nineAm)).toEqual([oats, yogurt])
  })

  it('breaks frequency ties by most recent loggedAt', () => {
    const entries = [
      makeEntry('a', { foodId: 'oats', loggedAt: new Date(2026, 6, 20, 9, 0).getTime() }),
      makeEntry('b', { foodId: 'yogurt', loggedAt: new Date(2026, 6, 21, 9, 0).getTime() }),
    ]

    expect(timePickFoods(foods, entries, nineAm)).toEqual([yogurt, oats])
  })

  it('treats the window as circular across midnight', () => {
    const quarterPastMidnight = new Date(2026, 6, 22, 0, 15)
    const entries = [
      makeEntry('a', { foodId: 'oats', loggedAt: new Date(2026, 6, 20, 23, 30).getTime() }),
    ]

    expect(timePickFoods(foods, entries, quarterPastMidnight)).toEqual([oats])
  })

  it('excludes entries outside the window', () => {
    const entries = [
      makeEntry('a', { foodId: 'oats', loggedAt: new Date(2026, 6, 21, 12, 0).getTime() }),
      // Exactly one minute past the 90-minute window.
      makeEntry('b', { foodId: 'yogurt', loggedAt: new Date(2026, 6, 21, 10, 31).getTime() }),
    ]

    expect(timePickFoods(foods, entries, nineAm)).toEqual([])
  })

  it('ignores entries with null or unknown foodId', () => {
    const entries = [
      makeEntry('a', { foodId: null, loggedAt: nineAm.getTime() }),
      makeEntry('b', { foodId: 'deleted-food', loggedAt: nineAm.getTime() }),
    ]

    expect(timePickFoods(foods, entries, nineAm)).toEqual([])
  })

  it('respects the limit', () => {
    const entries = [
      makeEntry('a', { foodId: 'oats', loggedAt: nineAm.getTime() }),
      makeEntry('b', { foodId: 'oats', loggedAt: nineAm.getTime() }),
      makeEntry('c', { foodId: 'yogurt', loggedAt: nineAm.getTime() }),
      makeEntry('d', { foodId: 'banana', loggedAt: nineAm.getTime() }),
    ]

    expect(timePickFoods(foods, entries, nineAm, 2)).toEqual([oats, yogurt])
  })

  it('returns an empty array for no entries', () => {
    expect(timePickFoods(foods, [], nineAm)).toEqual([])
  })
})

describe('latestFoods', () => {
  const oats = makeFood('oats')
  const yogurt = makeFood('yogurt')
  const banana = makeFood('banana')
  const foods = [oats, yogurt, banana]

  it('returns distinct foods newest first', () => {
    const entries = [
      makeEntry('a', { foodId: 'oats', loggedAt: 100 }),
      makeEntry('b', { foodId: 'yogurt', loggedAt: 300 }),
      makeEntry('c', { foodId: 'oats', loggedAt: 200 }),
    ]

    expect(latestFoods(foods, entries)).toEqual([yogurt, oats])
  })

  it('respects the limit', () => {
    const entries = [
      makeEntry('a', { foodId: 'oats', loggedAt: 100 }),
      makeEntry('b', { foodId: 'yogurt', loggedAt: 200 }),
      makeEntry('c', { foodId: 'banana', loggedAt: 300 }),
    ]

    expect(latestFoods(foods, entries, 2)).toEqual([banana, yogurt])
  })

  it('skips entries with null or unknown foodId', () => {
    const entries = [
      makeEntry('a', { foodId: null, loggedAt: 300 }),
      makeEntry('b', { foodId: 'deleted-food', loggedAt: 200 }),
      makeEntry('c', { foodId: 'oats', loggedAt: 100 }),
    ]

    expect(latestFoods(foods, entries)).toEqual([oats])
  })
})

describe('quickAddGrams', () => {
  it('prefers the default serving grams', () => {
    const food = makeFood('oats', { defaultServingGrams: 40 })
    const entries = [makeEntry('a', { foodId: 'oats', grams: 80, loggedAt: 100 })]

    expect(quickAddGrams(food, entries)).toBe(40)
  })

  it('falls back to the most recent entry grams for this food', () => {
    const food = makeFood('oats')
    const entries = [
      makeEntry('a', { foodId: 'oats', grams: 50, loggedAt: 100 }),
      makeEntry('b', { foodId: 'yogurt', grams: 250, loggedAt: 300 }),
      makeEntry('c', { foodId: 'oats', grams: 60, loggedAt: 200 }),
    ]

    expect(quickAddGrams(food, entries)).toBe(60)
  })

  it('falls back to 100 with no default serving and no entries', () => {
    expect(quickAddGrams(makeFood('oats'), [])).toBe(100)
  })
})
