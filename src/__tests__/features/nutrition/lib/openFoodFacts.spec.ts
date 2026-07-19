import { describe, expect, it } from 'vitest'
import { parseBarcodeLookup } from '@/features/nutrition/lib/openFoodFacts'

describe('parseBarcodeLookup', () => {
  it('maps a full Open Food Facts product to a scanned food', () => {
    const result = parseBarcodeLookup({
      status: 1,
      product: {
        product_name: 'Skyr Natural',
        brands: 'Arla, Arla Foods',
        nutriments: {
          'energy-kcal_100g': 63,
          proteins_100g: 10.6,
          carbohydrates_100g: 4,
          fat_100g: 0.2,
        },
      },
    })

    expect(result).toEqual({
      status: 'found',
      food: {
        name: 'Skyr Natural',
        brand: 'Arla',
        nutrientsPer100Grams: {
          calories: 63,
          proteinGrams: 10.6,
          carbohydrateGrams: 4,
          fatGrams: 0.2,
        },
      },
    })
  })

  it('defaults missing nutrients to zero and missing brand to null', () => {
    const result = parseBarcodeLookup({
      status: 1,
      product: {
        product_name: 'Mystery snack',
        nutriments: { 'energy-kcal_100g': 200 },
      },
    })

    expect(result).toEqual({
      status: 'found',
      food: {
        name: 'Mystery snack',
        brand: null,
        nutrientsPer100Grams: {
          calories: 200,
          proteinGrams: 0,
          carbohydrateGrams: 0,
          fatGrams: 0,
        },
      },
    })
  })

  it('reports not-found when the product is missing or status is zero', () => {
    expect(parseBarcodeLookup({ status: 0 })).toEqual({ status: 'not-found' })
    expect(parseBarcodeLookup({ status: 1 })).toEqual({ status: 'not-found' })
  })

  it('reports not-found for a product without a name and without nutriments', () => {
    expect(parseBarcodeLookup({ status: 1, product: { brands: 'Arla' } })).toEqual({
      status: 'not-found',
    })
  })

  it('reports an error for a malformed response', () => {
    expect(parseBarcodeLookup('nonsense')).toEqual({ status: 'error' })
    expect(parseBarcodeLookup({ product: { nutriments: { 'energy-kcal_100g': 'NaN' } } })).toEqual({
      status: 'error',
    })
  })
})
