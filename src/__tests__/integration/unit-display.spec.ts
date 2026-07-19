import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'

describe('Unit Display', () => {
  it('displays weight in lbs when user changes unit preference', async ({ createTestApp }) => {
    const { navigateTo, common, builder } = await createTestApp()

    // Start a workout and add a strength block
    await page.getByRole('button', { name: /start new workout/i }).click()
    await page.getByRole('button', { name: /add first block/i }).click()
    await common.waitForDialog()
    await userEvent.click(common.getDialogButton('Bench Press'))
    expect(common.isDialogOpen()).toBe(false)

    // Start workout
    await builder.startWorkout()

    // Wait for table to render
    await expect.element(page.getByRole('table')).toBeVisible()

    // Verify weight unit shows 'KG' by default (in table header)
    await expect.element(page.getByText('KG')).toBeInTheDocument()

    // Navigate to settings
    await navigateTo({ name: RouteNames.Settings })

    // Find and click the 'lbs' toggle option (button with aria-label "Pounds")
    await page.getByRole('button', { name: /pounds/i }).click()

    // Navigate back to workout
    await navigateTo({ name: RouteNames.ActiveWorkout })

    // Wait for the table to render again
    await expect.element(page.getByRole('table')).toBeVisible()

    // Verify weight unit now shows 'LBS' (in table header)
    await expect.element(page.getByText('LBS')).toBeInTheDocument()
  })

  it('converts and displays weight correctly when switching units', async ({ createTestApp }) => {
    const { navigateTo, common, builder, workout } = await createTestApp()

    // Navigate to settings first and switch to lbs
    await navigateTo({ name: RouteNames.Settings })
    await page.getByRole('button', { name: /pounds/i }).click()

    // Navigate to home and start workout
    await navigateTo({ name: RouteNames.Home })
    await page.getByRole('button', { name: /start new workout/i }).click()

    // Add a strength block
    await page.getByRole('button', { name: /add first block/i }).click()
    await common.waitForDialog()
    await userEvent.click(common.getDialogButton('Bench Press'))
    expect(common.isDialogOpen()).toBe(false)

    // Start workout
    await builder.startWorkout()

    // Wait for table to render
    await expect.element(page.getByRole('table')).toBeVisible()

    // Verify weight unit shows 'LBS' after preference change (in table header)
    await expect.element(page.getByText('LBS')).toBeInTheDocument()

    // Enter weight in lbs (220 lbs ≈ 100 kg, stored internally as kg)
    await workout.fillCardSetAndComplete({ weight: '220', reps: '8', rir: '2' })

    // Verify set was completed using Page Object method
    await expect.poll(() => workout.isSetCompleted(0)).toBe(true)
  })
})
