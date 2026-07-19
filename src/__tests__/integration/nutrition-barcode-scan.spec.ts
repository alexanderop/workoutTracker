import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getNutritionRepository } from '@/db'
import { getLocalDateKey } from '@/features/nutrition/lib/nutritionCalculations'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

const NUTELLA_BARCODE = '3017620422003'

const OPEN_FOOD_FACTS_RESPONSE = {
  status: 1,
  product: {
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
}

class FakeBarcodeDetector {
  detect(): Promise<Array<{ rawValue: string }>> {
    return Promise.resolve([{ rawValue: NUTELLA_BARCODE }])
  }
}

function createFakeCameraStream(): MediaStream {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 240
  canvas.getContext('2d')?.fillRect(0, 0, canvas.width, canvas.height)
  return canvas.captureStream(10)
}

const ORIGINAL_DETECTOR: unknown = Reflect.get(globalThis, 'BarcodeDetector')

function restoreDetector() {
  if (ORIGINAL_DETECTOR === undefined) {
    Reflect.deleteProperty(globalThis, 'BarcodeDetector')
    return
  }
  Reflect.set(globalThis, 'BarcodeDetector', ORIGINAL_DETECTOR)
}

describe('Nutrition barcode scan', () => {
  beforeEach(async () => {
    await setupIntegrationTest()
    Reflect.set(globalThis, 'BarcodeDetector', FakeBarcodeDetector)
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(createFakeCameraStream())
    const realFetch = globalThis.fetch.bind(globalThis)
    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const url = new URL(String(input), globalThis.location.href)
      if (url.hostname === 'world.openfoodfacts.org') {
        return Promise.resolve(Response.json(OPEN_FOOD_FACTS_RESPONSE))
      }
      return realFetch(input, init)
    })
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    restoreDetector()
    await cleanupIntegrationTest()
  })

  it('scans a barcode, prefills the serving from the product, and saves the brand', async () => {
    const { nutrition, cleanup } = await createTestApp()

    await expect.element(nutrition.dashboard).toBeVisible()
    await nutrition.openMeal('Snacks')
    await page.getByRole('button', { name: 'Scan barcode' }).click()

    // The fake detector reports the barcode on the first poll; the mocked
    // Open Food Facts lookup then prefills a 15 g serving.
    await expect.element(page.getByLabelText('Food name'), { timeout: 5000 }).toHaveValue('Nutella')
    await expect.element(page.getByLabelText('Brand (optional)')).toHaveValue('Ferrero')
    await expect.element(page.getByLabelText('Serving (g)')).toHaveValue(15)
    await expect.element(page.getByLabelText('Calories')).toHaveValue(81)
    await expect.element(page.getByLabelText('Protein (g)')).toHaveValue(0.9)
    await expect.element(page.getByLabelText('Carbs (g)')).toHaveValue(8.6)
    await expect.element(page.getByLabelText('Fat (g)')).toHaveValue(4.6)

    await page.getByRole('button', { name: 'Add to diary' }).click()
    await expect
      .poll(async () => getNutritionRepository().observeDay(getLocalDateKey()).get())
      .toMatchObject({
        foods: [{ name: 'Nutella', brand: 'Ferrero', defaultServingGrams: 15 }],
        diaryEntries: [{ meal: 'snack', grams: 15 }],
      })

    cleanup()
  })
})
