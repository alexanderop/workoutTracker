import { describe, expect, it } from 'vitest'
import { parseBarcodeLookup } from '@/features/nutrition/lib/openFoodFacts'

describe('parseBarcodeLookup', () => {
  it('maps a full Open Food Facts product to a scanned food', () => {
    const result = parseBarcodeLookup({
      status: 1,
      product: {
        product_name: 'Skyr Natural',
        brands: 'Arla, Arla Foods',
        serving_quantity: 150,
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
        servingGrams: 150,
        nutrientsPer100Grams: {
          calories: 63,
          proteinGrams: 10.6,
          carbohydrateGrams: 4,
          fatGrams: 0.2,
        },
      },
    })
  })

  it('accepts numeric strings, a legacy Open Food Facts quirk', () => {
    const result = parseBarcodeLookup({
      status: 1,
      product: {
        product_name: 'Oats',
        serving_quantity: '40',
        nutriments: { 'energy-kcal_100g': '372', proteins_100g: '13.5' },
      },
    })

    expect(result).toEqual({
      status: 'found',
      food: {
        name: 'Oats',
        brand: null,
        servingGrams: 40,
        nutrientsPer100Grams: {
          calories: 372,
          proteinGrams: 13.5,
          carbohydrateGrams: 0,
          fatGrams: 0,
        },
      },
    })
  })

  it('falls back to kilojoules when kcal is missing', () => {
    const result = parseBarcodeLookup({
      status: 1,
      product: {
        product_name: 'Rice cakes',
        nutriments: { energy_100g: 1616 },
      },
    })

    expect(result).toMatchObject({
      status: 'found',
      food: {
        nutrientsPer100Grams: expect.objectContaining({ calories: expect.closeTo(386.2, 1) }),
      },
    })
  })

  it('defaults missing serving, nutrients, and brand', () => {
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
        servingGrams: null,
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
    expect(
      parseBarcodeLookup({ product: { nutriments: { 'energy-kcal_100g': 'not a number' } } }),
    ).toEqual({ status: 'error' })
    expect(parseBarcodeLookup({ product: { nutriments: { fat_100g: Infinity } } })).toEqual({
      status: 'error',
    })
  })
})
