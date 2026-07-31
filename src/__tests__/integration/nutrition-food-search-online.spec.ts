import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, vi } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { getNutritionRepository } from '@/db'
import { getLocalDateKey } from '@/features/nutrition/lib/nutritionCalculations'
import { openFoodFactsAdapter } from '@/features/nutrition/lib/openFoodFacts'

/**
 * Asked of the adapter rather than written down here. A hardcoded host is what
 * let these tests stay green while search was broken for every real user: the
 * mock answered the host the spec named, the app requested a different one, and
 * nothing in between compared the two.
 */
const SEARCH_URL = new URL(openFoodFactsAdapter.searchUrl('probe'), globalThis.location.href)

const SEARCH_RESPONSE = {
  count: 1,
  products: [
    {
      code: '3017620422003',
      product_name: 'Nutella',
      brands: 'Ferrero, Ferrero Deutschland',
      serving_quantity: 15,
      nutriments: {
        'energy-kcal_100g': 539,
        proteins_100g: 6.3,
        carbohydrates_100g: 57.5,
        fat_100g: 30.9,
      },
    },
  ],
}

/**
 * True only for the search endpoint itself — matching on the URL's parts rather
 * than a substring, which would also match
 * `https://evil.example/?x=world.openfoodfacts.org`. The path matters as much
 * as the host: the barcode lookup lives on the same host, and a host-only test
 * would have these specs answering scans too.
 */
function isSearchRequest(input: unknown): boolean {
  const url = new URL(String(input), globalThis.location.href)
  return url.hostname === SEARCH_URL.hostname && url.pathname === SEARCH_URL.pathname
}

/** Routes only the Open Food Facts search host; everything else stays real. */
function mockSearch(respond: (url: URL) => Promise<Response>): void {
  const realFetch = globalThis.fetch.bind(globalThis)
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    if (isSearchRequest(input)) {
      return respond(new URL(String(input), globalThis.location.href))
    }
    return realFetch(input, init)
  })
}

describe('Food search against Open Food Facts', () => {
  beforeEach(() => {
    mockSearch(() => Promise.resolve(Response.json(SEARCH_RESPONSE)))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stages a product the library has never seen and commits it as a reusable food', async ({
    createTestApp,
  }) => {
    const { navigateTo, foodLog } = await createTestApp()

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()
    await foodLog.search('nutella')

    await expect
      .element(foodLog.onlineResults.getByText('Nutella'), { timeout: 5000 })
      .toBeVisible()
    await foodLog.stageFood('Nutella')
    await expect.element(foodLog.basket.getByText('Nutella')).toBeVisible()

    await foodLog.commitBasket(1)

    // `serving_quantity` decides the portion, exactly as it does for a scan.
    await expect
      .poll(async () => getNutritionRepository().observeDay(getLocalDateKey()).get())
      .toMatchObject({
        foods: [{ name: 'Nutella', brand: 'Ferrero', defaultServingGrams: 15 }],
        diaryEntries: [{ grams: 15 }],
      })
  })

  it('opens a portion panel from an online hit to pick the amount', async ({ createTestApp }) => {
    const { navigateTo, foodLog } = await createTestApp()

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()
    await foodLog.search('nutella')
    await expect
      .element(foodLog.onlineResults.getByText('Nutella'), { timeout: 5000 })
      .toBeVisible()

    // Tapping the row (not its plus button) asks "how much?" first.
    await foodLog.onlineResults.getByText('Nutella').click()
    await expect.element(foodLog.portionPanel.getByText('Nutella')).toBeVisible()

    await foodLog.selectPortionUnit('g')
    await foodLog.setPortionAmount('250')
    await foodLog.confirmPortion()
    await expect.element(foodLog.basket.getByText('Nutella')).toBeVisible()

    await foodLog.commitBasket(1)
    await expect
      .poll(async () => getNutritionRepository().observeDay(getLocalDateKey()).get())
      .toMatchObject({
        foods: [{ name: 'Nutella' }],
        diaryEntries: [{ grams: 250 }],
      })
  })

  it('opens the portion panel for a library food without creating a duplicate', async ({
    createTestApp,
  }) => {
    const { navigateTo, foodLog } = await createTestApp()

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()
    await foodLog.stageCustomFood({
      name: 'Nutella',
      brand: 'Ferrero',
      grams: '15',
      calories: '81',
      protein: '0.9',
      carbs: '8.6',
      fat: '4.6',
    })
    await foodLog.commitBasket(1)

    await foodLog.openAddFood()
    await foodLog.selectTab('Search')
    // The recents list offers the food; tapping the row opens the panel with
    // the library serving prefilled.
    await foodLog.searchResults.getByText('Nutella').click()
    await expect.element(foodLog.portionPanel.getByText('Nutella')).toBeVisible()

    await foodLog.setPortionAmount('3')
    await foodLog.confirmPortion()
    await foodLog.commitBasket(1)

    // Still one Nutella in the library; the new entry points at it.
    await expect
      .poll(async () => {
        const day = await getNutritionRepository().observeDay(getLocalDateKey()).get()
        return {
          foodCount: day.foods.length,
          grams: day.diaryEntries.map((entry) => entry.grams).toSorted((a, b) => a - b),
        }
      })
      .toEqual({ foodCount: 1, grams: [15, 45] })
  })

  it('does not offer a product the user already has a food for', async ({ createTestApp }) => {
    const { navigateTo, foodLog } = await createTestApp()

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()
    await foodLog.stageCustomFood({
      name: 'Nutella',
      brand: 'Ferrero',
      grams: '15',
      calories: '81',
      protein: '0.9',
      carbs: '8.6',
      fat: '4.6',
    })
    await foodLog.commitBasket(1)

    await foodLog.openAddFood()
    await foodLog.selectTab('Search')
    await foodLog.search('nutella')

    // The library row is the only Nutella offered; the remote hit for the same
    // name and brand is dropped rather than inviting a second copy.
    await expect.element(foodLog.searchResults.getByText('Nutella')).toBeVisible()
    await expect
      .element(foodLog.onlineSection.getByText('Nothing found online.'), { timeout: 5000 })
      .toBeVisible()
  })

  it('keeps the library searchable when Open Food Facts is unreachable', async ({
    createTestApp,
  }) => {
    const { navigateTo, foodLog } = await createTestApp()

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()
    await foodLog.stageCustomFood({
      name: 'Hafermilch',
      grams: '250',
      calories: '115',
      protein: '2.5',
      carbs: '17',
      fat: '3.8',
    })
    await foodLog.commitBasket(1)

    mockSearch(() => Promise.reject(new Error('offline')))

    await foodLog.openAddFood()
    await foodLog.selectTab('Search')
    await foodLog.search('hafer')

    // Local matches are instant and unaffected; the failure is one quiet line,
    // not an alert and not a blocked panel.
    await expect.element(foodLog.searchResults.getByText('Hafermilch')).toBeVisible()
    await expect
      .element(page.getByText('Open Food Facts is unreachable.', { exact: false }), {
        timeout: 5000,
      })
      .toBeVisible()
    await foodLog.stageFood('Hafermilch')
    await expect.element(foodLog.basket.getByText('Hafermilch')).toBeVisible()
  })

  it('leaves the network alone until the query is worth a round trip', async ({
    createTestApp,
  }) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { navigateTo, foodLog } = await createTestApp()

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()
    await foodLog.search('nu')

    await expect.element(foodLog.onlineSection).not.toBeInTheDocument()
    await expect
      .poll(() => fetchSpy.mock.calls.some((call) => isSearchRequest(call[0])))
      .toBe(false)
  })
})
