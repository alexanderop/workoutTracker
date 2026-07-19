import { page } from 'vitest/browser'
import { beforeEach, describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'

/**
 * Regression coverage for the weight page trio UX finding: on small phones the
 * entry form used to push the trend chart and history list below the fold,
 * forcing a scroll before the user could see any of their data.
 */
describe('Weight Page - Mobile Viewport Layout', () => {
  beforeEach(async () => {
    // Model the documented usable mobile area directly. Browser-mode viewports
    // do not include mobile browser chrome or safe-area insets.
    await page.viewport(390, 700)
  })

  it('keeps the trend chart within the 390x700 usable viewport', async ({ createTestApp }) => {
    const { navigateTo, weight } = await createTestApp()

    await navigateTo({ name: RouteNames.Weight })
    await weight.addEntry('80')

    const trendHeading = page.getByText('Weight Trend', { exact: true })
    await expect.element(trendHeading).toBeInViewport()
  })

  it('keeps the history list within the 390x700 usable viewport', async ({ createTestApp }) => {
    const { navigateTo, weight } = await createTestApp()

    await navigateTo({ name: RouteNames.Weight })
    await weight.addEntry('80')

    const historyHeading = page.getByText('History', { exact: true })
    await expect.element(historyHeading).toBeInViewport()
  })
})
