import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Unit Display', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('displays weight in lbs when user changes unit preference', async () => {
    const { user, getByRole, queryByRole, queryByText, navigateTo, common, builder, cleanup } =
      await createTestApp()

    // Start a workout and add a strength block
    await user.click(getByRole('button', { name: /get started/i }))
    await user.click(getByRole('button', { name: /add first block/i }))
    await common.waitForDialog()
    await user.click(common.getDialogButton('Bench Press'))
    common.assertDialogClosed()

    // Start workout
    await builder.startWorkout()

    // Verify weight unit shows 'kg' by default
    expect(queryByText(/kg$/)).toBeTruthy()

    // Navigate to settings
    await navigateTo({ name: RouteNames.Settings })

    // Find and click the 'lbs' toggle option (button with aria-label "Pounds")
    const lbsButton = getByRole('button', { name: /pounds/i })
    await user.click(lbsButton)

    // Navigate back to workout
    await navigateTo({ name: RouteNames.ActiveWorkout })

    // Wait for the workout view to render
    await waitFor(() => {
      expect(queryByRole('spinbutton', { name: /weight/i })).toBeTruthy()
    })

    // Verify weight unit now shows 'lbs'
    expect(queryByText(/lbs$/)).toBeTruthy()

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
    await user.click(getByRole('button', { name: /get started/i }))

    // Add a strength block
    await user.click(getByRole('button', { name: /add first block/i }))
    await common.waitForDialog()
    await user.click(common.getDialogButton('Bench Press'))
    common.assertDialogClosed()

    // Start workout
    await builder.startWorkout()

    // Wait for active mode
    await waitFor(() => {
      expect(queryByText(/block 1 of 1/i)).toBeTruthy()
    })

    // Verify weight unit shows 'lbs' after preference change
    expect(queryByText(/lbs$/)).toBeTruthy()

    // Enter weight in lbs (220 lbs ≈ 100 kg, stored internally as kg)
    await workout.fillCardSetAndComplete({ weight: '220', reps: '8', rir: '2' })

    // Verify we advanced to set 2
    await waitFor(() => {
      expect(queryByText('2/3')).toBeTruthy()
    })

    // Verify completed set shows in lbs format
    await waitFor(() => {
      expect(queryByText(/220lbs × 8/)).toBeTruthy()
    })

    cleanup()
  })
})
