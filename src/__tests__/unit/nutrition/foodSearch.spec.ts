import { describe, expect, it } from 'vitest'
import { normalizeForSearch, searchFoods } from '@/features/nutrition/lib/foodSearch'
import type { DbFood } from '@/db/schema'

function food(name: string, brand: string | null = null): DbFood {
  return {
    id: name,
    name,
    brand,
    nutrientsPer100Grams: { calories: 100, proteinGrams: 5, carbohydrateGrams: 10, fatGrams: 2 },
    defaultServingName: 'serving',
    defaultServingGrams: 100,
    favorite: false,
    archivedAt: null,
    createdAt: 0,
    updatedAt: 0,
    lastUsedAt: null,
  }
}

describe('normalizeForSearch', () => {
  it('folds case and accents', () => {
    expect(normalizeForSearch('Müsli')).toBe('musli')
    expect(normalizeForSearch('Crème Fraîche')).toBe('creme fraiche')
  })

  it('leaves ß alone — accent folding is not transliteration', () => {
    expect(normalizeForSearch('Weißbrot')).toBe('weißbrot')
  })
})

describe('searchFoods', () => {
  const library = [food('Skyr', 'Arla'), food('Müsli'), food('Banane'), food('Hafermilch', 'Oatly')]

  it('returns the library untouched for an empty or whitespace query', () => {
    expect(searchFoods(library, '')).toBe(library)
    expect(searchFoods(library, ' '.repeat(3))).toBe(library)
  })

  it('matches on name, ignoring case and accents', () => {
    expect(searchFoods(library, 'musli').map((f) => f.name)).toEqual(['Müsli'])
    expect(searchFoods(library, 'BANA').map((f) => f.name)).toEqual(['Banane'])
  })

  it('matches on brand', () => {
    expect(searchFoods(library, 'oatly').map((f) => f.name)).toEqual(['Hafermilch'])
  })

  it('returns nothing when neither name nor brand matches', () => {
    expect(searchFoods(library, 'zzz')).toEqual([])
  })

  it('preserves the input order, which is the repository lastUsedAt order', () => {
    expect(searchFoods(library, 'a').map((f) => f.name)).toEqual(['Skyr', 'Banane', 'Hafermilch'])
  })
})
