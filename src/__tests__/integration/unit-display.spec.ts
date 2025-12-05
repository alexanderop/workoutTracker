import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/features/workout/composables/useAppInitialization'
import { resetWorkout } from '@/features/workout/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

describe('Unit Display', () => {
  beforeEach(async () => {
    resetInitState()
    await resetDatabase()
  })

  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.style.cssText = ''
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
  })

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
    await navigateTo('/settings')

    // Find and click the 'lbs' toggle option (button with aria-label "Pounds")
    const lbsButton = screen.getByRole('button', { name: /pounds/i })
    await user.click(lbsButton)

    // Navigate back to workout
    await navigateTo('/workout/active')

    // Wait for the workout view to render
    await waitFor(() => {
      expect(queryByRole('spinbutton', { name: /weight/i })).toBeTruthy()
    })

    // Verify weight unit now shows 'lbs'
    expect(queryByText(/lbs$/)).toBeTruthy()

    cleanup()
  })

  it('converts and displays weight correctly when switching units', async () => {
    const { user, getByRole, queryByText, navigateTo, common, builder, cleanup } =
      await createTestApp()

    // Navigate to settings first and switch to lbs
    await navigateTo('/settings')
    const lbsButton = screen.getByRole('button', { name: /pounds/i })
    await user.click(lbsButton)

    // Navigate to home and start workout
    await navigateTo('/')
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
    const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
    const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
    const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })
    await user.type(weightInput, '220')
    await user.type(repsInput, '8')
    await user.type(rirInput, '2')

    // Complete the set
    await user.click(getByRole('button', { name: /complete set/i }))

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
