import { page, userEvent } from 'vitest/browser'
import { beforeEach, describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'

describe('AddBlockDialog - Desktop Viewport Clipping', () => {
  beforeEach(async () => {
    // Set viewport to desktop size that triggers the clipping bug
    // At 720px height with sm:max-h-[85vh], dialog max-height is ~612px
    // which isn't enough for all 5 block buttons (4 timed + cardio)
    await page.viewport(1280, 720)
  })

  it('all timed block options are visible and clickable at 1280x720 viewport', async ({
    createTestApp,
  }) => {
    const { getByRole, common, navigateTo } = await createTestApp()

    // Navigate to Create Template page
    await navigateTo({ name: RouteNames.CreateTemplate })
    await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

    // Click add block button to open dialog
    await userEvent.click(getByRole('button', { name: /add block/i }))
    await common.waitForDialog()

    // Switch to Timed Blocks tab
    await userEvent.click(getByRole('tab', { name: /timed/i }))

    // Every option must be fully inside the viewport, not merely rendered in the DOM.
    await expect.element(page.getByText('AMRAP')).toBeInViewport({ ratio: 1 })
    await expect.element(page.getByText('EMOM')).toBeInViewport({ ratio: 1 })
    await expect.element(page.getByText('Tabata')).toBeInViewport({ ratio: 1 })
    await expect.element(page.getByText('For Time')).toBeInViewport({ ratio: 1 })
    await expect.element(page.getByText('Cardio')).toBeInViewport({ ratio: 1 })

    // Verify "For Time" is clickable (would timeout if outside viewport)
    await userEvent.click(page.getByText('For Time'))
    await common.waitForDialog() // Config dialog opens

    // Close the config dialog
    await userEvent.click(page.getByRole('button', { name: /close/i }))
    await common.waitForDialogClose()

    // Re-open AddBlockDialog to test Cardio
    await userEvent.click(getByRole('button', { name: /add block/i }))
    await common.waitForDialog()
    await userEvent.click(getByRole('tab', { name: /timed/i }))

    // Verify "Cardio" is also clickable
    await userEvent.click(page.getByText('Cardio'))
    await common.waitForDialog() // Cardio config dialog opens
  })

  it('scrolls to reveal hidden block options when they are outside viewport', async ({
    createTestApp,
  }) => {
    const { getByRole, common, navigateTo } = await createTestApp()

    // Use an even smaller viewport to definitely trigger clipping
    await page.viewport(1024, 600)

    await navigateTo({ name: RouteNames.CreateTemplate })
    await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

    await userEvent.click(getByRole('button', { name: /add block/i }))
    await common.waitForDialog()
    await userEvent.click(getByRole('tab', { name: /timed/i }))

    // The last items must remain reachable through the dialog's own scrolling.
    const forTimeButton = page.getByRole('button', { name: /for time/i })
    const cardioButton = page.getByRole('button', { name: /cardio/i })

    await userEvent.wheel(page.getByRole('dialog'), { direction: 'down', times: 5 })
    await expect.element(cardioButton).toBeInViewport({ ratio: 1 })
    await userEvent.click(cardioButton)
    await expect.element(page.getByRole('heading', { name: /configure cardio/i })).toBeInViewport()

    // Reopen and prove the neighboring option is independently actionable.
    await userEvent.click(page.getByRole('button', { name: /close/i }))
    await common.waitForDialogClose()
    await userEvent.click(getByRole('button', { name: /add block/i }))
    await common.waitForDialog()
    await userEvent.click(getByRole('tab', { name: /timed/i }))
    await userEvent.wheel(page.getByRole('dialog'), { direction: 'down', times: 5 })
    await expect.element(forTimeButton).toBeInViewport({ ratio: 1 })
    await userEvent.click(forTimeButton)
    await expect
      .element(page.getByRole('heading', { name: /configure for time/i }))
      .toBeInViewport()
  })
})
