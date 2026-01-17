import { page, userEvent } from '../helpers/locator'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { expectElement, expectPoll } from '../helpers/assertions'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('AddBlockDialog - Desktop Viewport Clipping', () => {
  beforeEach(async () => {
    await setupIntegrationTest()
    // Set viewport to desktop size that triggers the clipping bug
    // At 720px height with sm:max-h-[85vh], dialog max-height is ~612px
    // which isn't enough for all 5 block buttons (4 timed + cardio)
    await page.viewport(1280, 720)
  })

  afterEach(cleanupIntegrationTest)

  it('all timed block options are visible and clickable at 1280x720 viewport', async () => {
    const { getByRole, common, navigateTo, cleanup } = await createTestApp()

    // Navigate to Create Template page
    await navigateTo({ name: RouteNames.CreateTemplate })
    await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

    // Click add block button to open dialog
    await userEvent.click(getByRole('button', { name: /add/i }))
    await common.waitForDialog()

    // Switch to Timed Blocks tab
    await userEvent.click(getByRole('tab', { name: /timed/i }))

    // BUG VERIFICATION: Assert all block options are visible (not just in DOM)
    // toBeVisible() checks actual visibility in viewport - catches clipping
    await expect.element(page.getByText('AMRAP')).toBeVisible()
    await expect.element(page.getByText('EMOM')).toBeVisible()
    await expect.element(page.getByText('Tabata')).toBeVisible()
    await expect.element(page.getByText('For Time')).toBeVisible()
    await expect.element(page.getByText('Cardio')).toBeVisible()

    // Verify "For Time" is clickable (would timeout if outside viewport)
    await userEvent.click(page.getByText('For Time'))
    await common.waitForDialog() // Config dialog opens

    // Close the config dialog
    await userEvent.click(page.getByRole('button', { name: /close/i }))
    await common.waitForDialogClose()

    // Re-open AddBlockDialog to test Cardio
    await userEvent.click(getByRole('button', { name: /add/i }))
    await common.waitForDialog()
    await userEvent.click(getByRole('tab', { name: /timed/i }))

    // Verify "Cardio" is also clickable
    await userEvent.click(page.getByText('Cardio'))
    await common.waitForDialog() // Cardio config dialog opens

    cleanup()
  })

  it('scrolls to reveal hidden block options when they are outside viewport', async () => {
    const { getByRole, common, navigateTo, cleanup } = await createTestApp()

    // Use an even smaller viewport to definitely trigger clipping
    await page.viewport(1024, 600)

    await navigateTo({ name: RouteNames.CreateTemplate })
    await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

    await userEvent.click(getByRole('button', { name: /add/i }))
    await common.waitForDialog()
    await userEvent.click(getByRole('tab', { name: /timed/i }))

    // The last items (For Time, Cardio) should still be accessible
    // Either by being visible or by scrolling within the dialog
    const forTimeButton = page.getByText('For Time')
    const cardioButton = page.getByText('Cardio')

    // These should be visible - if they're not, the dialog needs scrolling
    await expect.element(forTimeButton).toBeVisible()
    await expect.element(cardioButton).toBeVisible()

    cleanup()
  })
})
