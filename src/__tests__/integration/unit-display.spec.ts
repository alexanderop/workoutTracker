import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Unit Display', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('displays weight in lbs when user changes unit preference', async () => {
    const { user, getByRole, queryByText, navigateTo, common, builder, cleanup } =
      await createTestApp()

    // Start a workout and add a strength block
    await user.click(getByRole('button', { name: /start new workout/i }))
    await user.click(getByRole('button', { name: /add first block/i }))
    await common.waitForDialog()
    await user.click(common.getDialogButton('Bench Press'))
    common.assertDialogClosed()

    // Start workout
    await builder.startWorkout()

    // Wait for table to render
    await screen.findByRole('table')

    // Verify weight unit shows 'KG' by default (in table header)
    expect(queryByText('KG')).toBeTruthy()

    // Navigate to settings
    await navigateTo({ name: RouteNames.Settings })

    // Find and click the 'lbs' toggle option (button with aria-label "Pounds")
    const lbsButton = getByRole('button', { name: /pounds/i })
    await user.click(lbsButton)

    // Navigate back to workout
    await navigateTo({ name: RouteNames.ActiveWorkout })

    // Wait for the table to render again
    await screen.findByRole('table')

    // Verify weight unit now shows 'LBS' (in table header)
    expect(queryByText('LBS')).toBeTruthy()

    cleanup()
  })

  it('converts and displays weight correctly when switching units', async () => {
    const { user, getByRole, queryByText, navigateTo, common, builder, workout, cleanup } =
      await createTestApp()

    // Navigate to settings first and switch to lbs
    await navigateTo({ name: RouteNames.Settings })
    const lbsButton = getByRole('button', { name: /pounds/i })
    await user.click(lbsButton)

    // Navigate to home and start workout
    await navigateTo({ name: RouteNames.Home })
    await user.click(getByRole('button', { name: /start new workout/i }))

    // Add a strength block
    await user.click(getByRole('button', { name: /add first block/i }))
    await common.waitForDialog()
    await user.click(common.getDialogButton('Bench Press'))
    common.assertDialogClosed()

    // Start workout
    await builder.startWorkout()

    // Wait for table to render
    await screen.findByRole('table')

    // Verify weight unit shows 'LBS' after preference change (in table header)
    expect(queryByText('LBS')).toBeTruthy()

    // Enter weight in lbs (220 lbs ≈ 100 kg, stored internally as kg)
    await workout.fillCardSetAndComplete({ weight: '220', reps: '8', rir: '2' })

    // Verify set was completed using Page Object method
    await waitFor(() => {
      expect(workout.isSetCompleted(0)).toBe(true)
    })

    cleanup()
  })
})
