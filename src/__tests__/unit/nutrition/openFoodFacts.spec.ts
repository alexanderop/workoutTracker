import { describe, expect, it } from 'vitest'
import {
  openFoodFactsAdapter,
  parseBarcodeLookup,
  parseFoodSearch,
} from '@/features/nutrition/lib/openFoodFacts'

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

/**
 * The fixtures below are trimmed captures of what the two Open Food Facts
 * search backends actually answer with, unknown keys and all. The hand-written
 * hits above share one made-up product shape, which is how a search that
 * returned zero rows against the real API went unnoticed: both backends were
 * asserted with the *same* `brands` spelling, and only one of them uses it.
 */
describe('parseFoodSearch against captured Open Food Facts responses', () => {
  it('maps a legacy /cgi/search.pl page, which spells brands as one string', () => {
    const result = parseFoodSearch({
      count: 3992,
      page: 1,
      page_count: 200,
      page_size: 20,
      skip: 0,
      products: [
        {
          code: '3329770077003',
          product_name: 'Skyr nature 0%',
          brands: 'Yoplait',
          serving_quantity: 100,
          nutriments: {
            'energy-kcal_100g': 57,
            'energy-kj_100g': 243,
            energy_100g: 243,
            proteins_100g: 9.5,
            carbohydrates_100g: 4,
            fat_100g: 0.2,
            salt_100g: 0.1,
            sugars_100g: 4,
          },
        },
        {
          code: '6111246721261',
          product_name: 'Fromage Blanc Nature',
          brands: 'Milky Food Professional',
          serving_quantity: 100,
          nutriments: { 'energy-kcal_100g': 159, proteins_100g: 5 },
        },
      ],
    })

    expect(result).toMatchObject({
      status: 'ok',
      foods: [
        { id: '3329770077003', name: 'Skyr nature 0%', brand: 'Yoplait', servingGrams: 100 },
        { id: '6111246721261', name: 'Fromage Blanc Nature', brand: 'Milky Food Professional' },
      ],
    })
  })

  it('maps a Search-a-licious page, which spells brands as an array', () => {
    const result = parseFoodSearch({
      hits: [
        {
          code: '8710624358174',
          product_name: 'Skyr naturel',
          brands: ['Skyr'],
          nutriments: {
            'energy-kcal_100g': 62,
            proteins_100g: 11,
            carbohydrates_100g: 4,
            fat_100g: 0.200000002980232,
          },
        },
        {
          code: '5690845001987',
          product_name: 'Skyr Moka',
          // Multiple brands, unpadded first and padded rest, as OFF stores them.
          brands: ['Skyr', ' Isey Skyr'],
          nutriments: { 'energy-kcal_100g': 79, proteins_100g: 9.5 },
        },
      ],
      count: 1929,
      page: 1,
      page_size: 20,
      aggregations: null,
      is_count_exact: true,
    })

    expect(result).toMatchObject({
      status: 'ok',
      foods: [
        { id: '8710624358174', name: 'Skyr naturel', brand: 'Skyr' },
        { id: '5690845001987', name: 'Skyr Moka', brand: 'Skyr' },
      ],
    })
  })

  it('leaves a hit with no brand at all unbranded rather than dropping it', () => {
    expect(
      parseFoodSearch({ hits: [{ product_name: 'Oats', nutriments: { proteins_100g: 13 } }] }),
    ).toMatchObject({ status: 'ok', foods: [{ name: 'Oats', brand: null }] })
    expect(
      parseFoodSearch({
        hits: [{ product_name: 'Oats', brands: [], nutriments: { proteins_100g: 13 } }],
      }),
    ).toMatchObject({ status: 'ok', foods: [{ name: 'Oats', brand: null }] })
  })
})

describe('openFoodFactsAdapter.searchUrl', () => {
  /**
   * The regression this pins. Search used to point at
   * `search.openfoodfacts.org` (Search-a-licious), which answers cross-origin
   * requests with `Access-Control-Allow-Credentials` and no
   * `Access-Control-Allow-Origin`, so the browser discarded every response
   * before the app could read it and the online section could only ever render
   * "Open Food Facts is unreachable".
   *
   * Tying the two URLs together is the point: `productUrl` is the lookup the
   * barcode scanner has always used successfully, which makes its host the one
   * demonstrably configured to answer this app. Search has to share it.
   */
  it('searches the same host the working barcode lookup uses', () => {
    const search = new URL(openFoodFactsAdapter.searchUrl('skyr'))

    expect(search.origin).toBe(new URL(openFoodFactsAdapter.productUrl('3329770077003')).origin)
    expect(search.origin).toBe('https://world.openfoodfacts.org')
  })

  it('asks the CGI for a JSON free-text search instead of its HTML page', () => {
    const url = new URL(openFoodFactsAdapter.searchUrl('skyr protein'))

    expect(url.pathname).toBe('/cgi/search.pl')
    // `json` is what makes the body parseable at all, and without
    // `search_simple`/`action` the CGI ignores the terms and answers with the
    // unfiltered product list -- which reads as "search is broken" just as much
    // as an empty section does.
    expect(Object.fromEntries(url.searchParams)).toEqual({
      search_terms: 'skyr protein',
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '20',
      fields: 'code,product_name,brands,serving_quantity,nutriments',
    })
  })

  it('encodes a query rather than letting it rewrite the other parameters', () => {
    const url = new URL(openFoodFactsAdapter.searchUrl('a&page_size=500&json=0#frag'))

    expect(url.searchParams.get('search_terms')).toBe('a&page_size=500&json=0#frag')
    expect(url.searchParams.get('page_size')).toBe('20')
    expect(url.searchParams.get('json')).toBe('1')
    expect(url.hash).toBe('')
  })
})
