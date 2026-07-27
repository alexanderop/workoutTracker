import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, vi } from 'vitest'
import { it } from '../helpers/integrationTest'
import { getNutritionRepository } from '@/db'
import { getLocalDateKey } from '@/features/nutrition/lib/nutritionCalculations'
import { openFoodFactsAdapter } from '@/features/nutrition/lib/openFoodFacts'
import type { MediaTrackCapabilitiesWithTorch } from '@/features/nutrition/lib/torch'

const NUTELLA_BARCODE = '3017620422003'

/**
 * The lookup path, taken from the adapter. Text search lives on the same host,
 * so a host-only match would have this spec answering searches with a product
 * body — a mock that stands in for more than the one call it was written for.
 */
const PRODUCT_PATH_PREFIX = new URL(openFoodFactsAdapter.productUrl(NUTELLA_BARCODE)).pathname

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

/** Never reports a barcode, so the scanner stays open for torch interaction. */
class SilentBarcodeDetector {
  detect(): Promise<Array<{ rawValue: string }>> {
    return Promise.resolve([])
  }
}

function createFakeCameraStream(): MediaStream {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 240
  canvas.getContext('2d')?.fillRect(0, 0, canvas.width, canvas.height)
  return canvas.captureStream(10)
}

function createFakeCameraStreamWithTorch(applyConstraints: MediaStreamTrack['applyConstraints']) {
  const stream = createFakeCameraStream()
  const track = stream.getVideoTracks()[0]
  if (!track) throw new Error('expected canvas.captureStream to produce a video track')
  const capabilities: MediaTrackCapabilitiesWithTorch = { torch: true }
  vi.spyOn(track, 'getCapabilities').mockReturnValue(capabilities)
  vi.spyOn(track, 'applyConstraints').mockImplementation(applyConstraints)
  return stream
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
    Reflect.set(globalThis, 'BarcodeDetector', FakeBarcodeDetector)
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(createFakeCameraStream())
    const realFetch = globalThis.fetch.bind(globalThis)
    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const url = new URL(String(input), globalThis.location.href)
      if (url.pathname === PRODUCT_PATH_PREFIX) {
        return Promise.resolve(Response.json(OPEN_FOOD_FACTS_RESPONSE))
      }
      return realFetch(input, init)
    })
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    restoreDetector()
  })

  it('scans a barcode straight into the basket and logs it to the tapped meal', async ({
    createTestApp,
  }) => {
    const { nutrition, foodLog } = await createTestApp()

    await expect.element(nutrition.dashboard).toBeVisible()
    await nutrition.openMeal('Snacks')
    await foodLog.selectTab('Scan')

    // The fake detector reports the barcode on the first poll; the mocked
    // Open Food Facts lookup supplies a 15 g serving. Nothing to confirm --
    // the barcode already answered every question a form would have asked.
    await expect.element(foodLog.basket.getByText('Nutella'), { timeout: 5000 }).toBeVisible()

    await foodLog.commitBasket(1)
    await expect
      .poll(async () => getNutritionRepository().observeDay(getLocalDateKey()).get())
      .toMatchObject({
        foods: [{ name: 'Nutella', brand: 'Ferrero', defaultServingGrams: 15 }],
        // The dashboard's tapped meal wins over the hour of day.
        diaryEntries: [{ meal: 'snack', grams: 15 }],
      })
  })

  it('lets the grams stepper correct a scanned serving without a keyboard', async ({
    createTestApp,
  }) => {
    const { nutrition, foodLog } = await createTestApp()

    await expect.element(nutrition.dashboard).toBeVisible()
    await nutrition.openMeal('Snacks')
    await foodLog.selectTab('Scan')
    await expect.element(foodLog.basket.getByText('Nutella'), { timeout: 5000 }).toBeVisible()

    await foodLog.adjustStaged('Nutella', 2)
    await foodLog.commitBasket(1)

    await expect
      .poll(async () => getNutritionRepository().observeDay(getLocalDateKey()).get())
      .toMatchObject({ diaryEntries: [{ grams: 35 }] })
  })

  it('does not show a flashlight toggle when the camera has no torch support', async ({
    createTestApp,
  }) => {
    Reflect.set(globalThis, 'BarcodeDetector', SilentBarcodeDetector)
    const { nutrition, foodLog } = await createTestApp()

    await expect.element(nutrition.dashboard).toBeVisible()
    await nutrition.openMeal('Snacks')
    await foodLog.selectTab('Scan')

    await expect.element(page.getByText('Point the camera')).toBeVisible()
    await expect
      .element(page.getByRole('button', { name: 'Toggle flashlight' }))
      .not.toBeInTheDocument()
  })

  it('toggles the flashlight on and off when applying the constraint succeeds', async ({
    createTestApp,
  }) => {
    Reflect.set(globalThis, 'BarcodeDetector', SilentBarcodeDetector)
    const applyConstraints = vi.fn().mockResolvedValue(undefined)
    const stream = createFakeCameraStreamWithTorch(applyConstraints)
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(stream)
    const { nutrition, foodLog } = await createTestApp()

    await expect.element(nutrition.dashboard).toBeVisible()
    await nutrition.openMeal('Snacks')
    await foodLog.selectTab('Scan')

    const torchButton = page.getByRole('button', { name: 'Toggle flashlight' })
    await expect.element(torchButton).toHaveAttribute('aria-pressed', 'false')

    await torchButton.click()
    await expect.element(torchButton).toHaveAttribute('aria-pressed', 'true')

    await torchButton.click()
    await expect.element(torchButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps the flashlight state unchanged when the browser rejects the torch constraint', async ({
    createTestApp,
  }) => {
    Reflect.set(globalThis, 'BarcodeDetector', SilentBarcodeDetector)
    const applyConstraints = vi.fn().mockRejectedValue(new Error('torch unsupported'))
    const stream = createFakeCameraStreamWithTorch(applyConstraints)
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(stream)
    const { nutrition, foodLog } = await createTestApp()

    await expect.element(nutrition.dashboard).toBeVisible()
    await nutrition.openMeal('Snacks')
    await foodLog.selectTab('Scan')

    const torchButton = page.getByRole('button', { name: 'Toggle flashlight' })
    await expect.element(torchButton).toHaveAttribute('aria-pressed', 'false')

    await torchButton.click()
    await expect.element(torchButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('ignores a torch toggle that resolves after the scanner was cancelled', async ({
    createTestApp,
  }) => {
    Reflect.set(globalThis, 'BarcodeDetector', SilentBarcodeDetector)
    const pendingConstraints = Promise.withResolvers<void>()
    const applyConstraints = vi.fn(() => pendingConstraints.promise)
    const stream = createFakeCameraStreamWithTorch(applyConstraints)
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(stream)
    const { nutrition, foodLog } = await createTestApp()

    await expect.element(nutrition.dashboard).toBeVisible()
    await nutrition.openMeal('Snacks')
    await foodLog.selectTab('Scan')

    const torchButton = page.getByRole('button', { name: 'Toggle flashlight' })
    await expect.element(torchButton).toBeVisible()
    // Fires toggleTorch(); applyConstraints stays pending until resolved below.
    await torchButton.click()
    await expect.poll(() => applyConstraints.mock.calls.length).toBe(1)

    // Cancelling drops back to the search tab, which unmounts the scanner.
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect.element(page.getByLabelText('Search foods')).toBeVisible()

    // Resolving after cancellation must not resurrect the toggle or throw.
    pendingConstraints.resolve()
    await expect
      .element(page.getByRole('button', { name: 'Toggle flashlight' }))
      .not.toBeInTheDocument()

    await foodLog.selectTab('Scan')
    await expect
      .element(page.getByRole('button', { name: 'Toggle flashlight' }))
      .toHaveAttribute('aria-pressed', 'false')
  })
})
