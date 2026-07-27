import { describe, expect, it } from 'vitest'
import { parseBarcodeLookup, parseFoodSearch } from '@/features/nutrition/lib/openFoodFacts'

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
    expect(parseBarcodeLookup({ status: 2, product: { product_name: 'Oats' } })).toEqual({
      status: 'error',
    })
    expect(
      parseBarcodeLookup({ product: { nutriments: { 'energy-kcal_100g': 'not a number' } } }),
    ).toEqual({ status: 'error' })
    expect(parseBarcodeLookup({ product: { nutriments: { fat_100g: Infinity } } })).toEqual({
      status: 'error',
    })
  })
})

describe('parseFoodSearch', () => {
  const skyr = {
    code: '5760466045612',
    product_name: 'Skyr Natural',
    brands: 'Arla',
    serving_quantity: 150,
    nutriments: {
      'energy-kcal_100g': 63,
      proteins_100g: 10.6,
      carbohydrates_100g: 4,
      fat_100g: 0.2,
    },
  }

  it('maps Search-a-licious hits to staged-ready foods', () => {
    expect(parseFoodSearch({ hits: [skyr], count: 1 })).toEqual({
      status: 'ok',
      foods: [
        {
          id: '5760466045612',
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
      ],
    })
  })

  it('reads the legacy search endpoint, which keys the same products as `products`', () => {
    expect(parseFoodSearch({ products: [skyr], count: 1 })).toMatchObject({
      status: 'ok',
      foods: [{ name: 'Skyr Natural' }],
    })
  })

  it('is empty, not an error, when the query matched nothing', () => {
    expect(parseFoodSearch({ hits: [], count: 0 })).toEqual({ status: 'ok', foods: [] })
  })

  it('skips one malformed hit rather than blanking the page', () => {
    const result = parseFoodSearch({
      hits: [{ product_name: 'Broken', nutriments: { fat_100g: 'not a number' } }, skyr],
    })

    expect(result).toMatchObject({ status: 'ok', foods: [{ name: 'Skyr Natural' }] })
  })

  it('drops hits that cannot be logged — no name, or no nutrition data at all', () => {
    const result = parseFoodSearch({
      hits: [
        { code: '1', product_name: '  ', nutriments: { 'energy-kcal_100g': 63 } },
        { code: '2', product_name: 'Name only' },
        { code: '3', product_name: 'All zeroes', nutriments: { 'energy-kcal_100g': 0 } },
      ],
    })

    expect(result).toEqual({ status: 'ok', foods: [] })
  })

  it('keeps a hit whose only figure is a macro, so kcal-less entries stay loggable', () => {
    expect(
      parseFoodSearch({
        hits: [{ product_name: 'Protein powder', nutriments: { proteins_100g: 80 } }],
      }),
    ).toMatchObject({
      status: 'ok',
      foods: [{ id: 'off-0', name: 'Protein powder' }],
    })
  })

  it('reports an error for a response that is not a search result', () => {
    expect(parseFoodSearch('nonsense')).toEqual({ status: 'error' })
    expect(parseFoodSearch({ error: 'rate limited' })).toEqual({ status: 'error' })
  })
})
