import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { ensureHTMLElement } from '../helpers/domHelpers'

// A headless browser's viewport has no address bar or home-indicator safe
// area, so the full 390x844 CSS viewport is usable. Real mobile Safari/Chrome
// chrome (collapsed toolbar + safe areas) reliably eats ~140-150px of that,
// leaving ~700px of actual usable height - the number the original UX review
// was based on. We apply that same realistic budget here so the test catches
// what a real device would show, not just what a chrome-less headless
// viewport happens to fit.
const USABLE_MOBILE_VIEWPORT_HEIGHT = 700

/**
 * Regression coverage for the weight page trio UX finding: on small phones the
 * entry form used to push the trend chart and history list below the fold,
 * forcing a scroll before the user could see any of their data.
 */
describe('Weight Page - Mobile Viewport Layout', () => {
  beforeEach(async () => {
    await setupIntegrationTest()
    // iPhone 12 mini-class viewport - the smallest common target for this app
    await page.viewport(390, 844)
  })

  afterEach(cleanupIntegrationTest)

  it('keeps the trend chart within the realistic usable viewport at 390x844', async () => {
    const { navigateTo, weight, cleanup } = await createTestApp()

    await navigateTo({ name: RouteNames.Weight })
    await weight.addEntry('80')

    const trendHeading = page.getByText('Weight Trend', { exact: true })
    await expect.element(trendHeading).toBeVisible()

    const element = ensureHTMLElement(await trendHeading.element())
    const rect = element.getBoundingClientRect()
    expect(rect.top).toBeLessThan(USABLE_MOBILE_VIEWPORT_HEIGHT)

    cleanup()
  })

  it('keeps the history list within reach on the realistic usable viewport at 390x844', async () => {
    const { navigateTo, weight, cleanup } = await createTestApp()

    await navigateTo({ name: RouteNames.Weight })
    await weight.addEntry('80')

    const historyHeading = page.getByText('History', { exact: true })
    await expect.element(historyHeading).toBeVisible()

    const element = ensureHTMLElement(await historyHeading.element())
    const rect = element.getBoundingClientRect()
    expect(rect.top).toBeLessThan(USABLE_MOBILE_VIEWPORT_HEIGHT)

    cleanup()
  })
})
