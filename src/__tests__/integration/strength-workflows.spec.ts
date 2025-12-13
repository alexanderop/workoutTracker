import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Strength Workflows', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Set Completion', () => {
    it('advances to the next set after completing a set', async () => {
      const { builder, workout, common, user, getByRole, queryByText, cleanup } = await createTestApp()

      // Click "Start New Workout" on home page to start a new workout
      await user.click(getByRole('button', { name: /start new workout/i }))

      // We should now be on the workout builder page
      // Add an exercise by clicking "Add First Block"
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      common.assertDialogClosed()

      // Start the workout (transition from builder to active mode)
      await builder.startWorkout()

      // Verify we're on set 1 of 3 (wait for active workout UI)
      await waitFor(() => {
        expect(queryByText('1/3')).toBeTruthy()
      })

      // Fill and complete the first set
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify the UI advanced to set 2 of 3 (this would have failed before the fix)
      await waitFor(() => {
        expect(queryByText('2/3')).toBeTruthy()
      })

      // Verify the completed set appears in the history
      expect(queryByText(/100kg × 8/)).toBeTruthy()

      cleanup()
    })

    it('displays strength block UI and allows completing all sets', async () => {
      const { builder, workout, user, queryByRole, queryByText, getByRole, cleanup } = await createTestApp()

      // Setup: add strength block and start workout
      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()

      // Verify initial UI state (grouped assertions)
      await waitFor(() => {
        expect(queryByRole('heading', { name: /bench press/i })).toBeTruthy()
      })
      expect(queryByText('Strength')).toBeTruthy()
      expect(queryByText('1/3')).toBeTruthy()

      // Fill and complete the first set
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })

      // Verify advancement to set 2
      await waitFor(() => {
        expect(queryByText('2/3')).toBeTruthy()
      })

      // Verify the completed set appears in the history
      expect(queryByText(/80kg × 10/)).toBeTruthy()

      // Complete set 2 (values should be pre-filled from set 1)
      await user.click(getByRole('button', { name: /complete set/i }))

      // Verify advancement to set 3
      await waitFor(() => {
        expect(queryByText('3/3')).toBeTruthy()
      })

      // Complete set 3
      await user.click(getByRole('button', { name: /complete set/i }))

      // Verify all three sets appear in the history
      await waitFor(() => {
        const completedSets = screen.queryAllByText(/80kg × 10/)
        expect(completedSets.length).toBe(3)
      })

      cleanup()
    })
  })

  describe('Value Prefilling', () => {
    it('prefills values from previous set when advancing', async () => {
      const { builder, workout, queryByRole, queryByText, cleanup } = await createTestApp()

      await builder.addStrengthBlock('Squat')
      await builder.startWorkout()

      // Wait for UI to be ready
      await waitFor(() => {
        expect(queryByRole('heading', { name: /squat/i })).toBeTruthy()
      })

      // Fill and complete first set with specific values
      await workout.fillCardSetAndComplete({ weight: '100', reps: '5', rir: '1' })

      // Wait for advancement to set 2
      await waitFor(() => {
        expect(queryByText('2/3')).toBeTruthy()
      })

      // Get fresh references to inputs for set 2
      const weightInput2 = screen.getByRole('spinbutton', { name: /weight/i })
      const repsInput2 = screen.getByRole('spinbutton', { name: /reps$/i })

      // Verify prefilled values in next set
      expect(weightInput2).toHaveProperty('value', '100')
      expect(repsInput2).toHaveProperty('value', '5')

      cleanup()
    })
  })
})
