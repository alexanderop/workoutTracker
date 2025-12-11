import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Workout Set Completion', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Set Completion Flow', () => {
    it('completes set and shows completed badge', async () => {
      const { builder, workout, common, user, getByRole, getByText, queryByText, cleanup } =
        await createTestApp()

      // Setup: Create workout with strength block
      await user.click(getByRole('button', { name: /get started/i }))
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Start workout
      await builder.startWorkout()

      // Verify we start at set 1/3
      await waitFor(() => {
        expect(queryByText('1/3')).toBeTruthy()
      })

      // Action: Fill and complete first set
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Assert: Badge appears showing completed set
      await waitFor(() => {
        expect(queryByText(/100kg × 8/)).toBeTruthy()
      })

      // Assert: Counter advances to 2/3
      expect(getByText('2/3')).toBeTruthy()

      cleanup()
    })

    it('pre-fills next set with values from completed set', async () => {
      const { builder, workout, common, user, getByRole, queryByText, cleanup } = await createTestApp()

      // Setup workout
      await user.click(getByRole('button', { name: /get started/i }))
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()
      await builder.startWorkout()

      // Complete first set with specific values
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify set 2/3 is active
      await waitFor(() => {
        expect(queryByText('2/3')).toBeTruthy()
      })

      // Check that inputs are pre-filled with previous set's values
      const weightInput = getByRole('spinbutton', { name: /weight/i })
      const repsInput = getByRole('spinbutton', { name: /reps$/i })
      const rirInput = getByRole('spinbutton', { name: /reps in reserve/i })

      if (!(weightInput instanceof HTMLInputElement)) {
        throw new Error('Weight input is not an HTMLInputElement')
      }
      if (!(repsInput instanceof HTMLInputElement)) {
        throw new Error('Reps input is not an HTMLInputElement')
      }
      if (!(rirInput instanceof HTMLInputElement)) {
        throw new Error('RIR input is not an HTMLInputElement')
      }

      expect(weightInput.value).toBe('100')
      expect(repsInput.value).toBe('8')
      expect(rirInput.value).toBe('2')

      cleanup()
    })

    it('can complete multiple sets in sequence', async () => {
      const { builder, workout, common, user, getByRole, queryByText, cleanup } = await createTestApp()

      // Setup workout
      await user.click(getByRole('button', { name: /get started/i }))
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()
      await builder.startWorkout()

      // Complete first set
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify first completion badge appears and we're on set 2/3
      await waitFor(() => {
        expect(queryByText(/100kg × 8/)).toBeTruthy()
      })
      expect(queryByText('2/3')).toBeTruthy()

      // Complete second set
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify we're on set 3/3
      await waitFor(() => {
        expect(queryByText('3/3')).toBeTruthy()
      })

      // Complete third set
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // All sets completed - verify all badges visible
      await waitFor(() => {
        // Should have multiple completed badges (the completion text appears multiple times)
        const badges = document.querySelectorAll('[class*="bg-primary"]')
        expect(badges.length).toBeGreaterThanOrEqual(3)
      })

      cleanup()
    })

    it('auto-advances to next block when all sets are complete', async () => {
      const { builder, workout, common, user, getByRole, queryByText, cleanup } = await createTestApp()

      // Setup workout with TWO strength blocks
      await user.click(getByRole('button', { name: /get started/i }))

      // Add first block
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add second block
      await user.click(getByRole('button', { name: /add block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()

      // Start workout
      await builder.startWorkout()

      // Verify we're on block 1 of 2
      await waitFor(() => {
        expect(queryByText(/block 1 of 2/i)).toBeTruthy()
      })

      // Complete all 3 sets in first block
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })

      // Verify we auto-advanced to block 2 of 2
      await waitFor(() => {
        expect(queryByText(/block 2 of 2/i)).toBeTruthy()
      })

      // Verify we're on Deadlift block
      expect(queryByText('Deadlift')).toBeTruthy()

      cleanup()
    })

    it('can end workout and see completion screen', async () => {
      const { builder, workout, common, user, getByRole, queryByText, queryByRole, cleanup } =
        await createTestApp()

      // Setup workout with ONE strength block
      await user.click(getByRole('button', { name: /get started/i }))
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      await builder.startWorkout()

      // Complete just the first set
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify we completed a set
      await waitFor(() => {
        expect(queryByText(/100kg × 8/)).toBeTruthy()
      })

      // Open menu and end workout
      await waitFor(() => {
        expect(workout.getMenuTrigger()).toBeTruthy()
      })
      await user.click(workout.getMenuTrigger())

      await waitFor(() => {
        expect(queryByRole('menuitem', { name: /end workout/i })).toBeTruthy()
      })
      await user.click(getByRole('menuitem', { name: /end workout/i }))

      // Confirm finish workout dialog
      await common.waitForDialog()
      const nameInput = getByRole('textbox', { name: /workout name/i })
      await user.clear(nameInput)
      await user.type(nameInput, 'Test Complete')
      await user.click(common.getDialogButton('Finish Workout'))

      // Wait for completion screen
      await waitFor(() => {
        expect(queryByText(/workout complete/i)).toBeTruthy()
      })

      cleanup()
    })
  })

  describe('Rest Timer Integration', () => {
    it('shows rest timer in footer after completing a set', async () => {
      const { builder, workout, common, user, getByRole, cleanup } = await createTestApp()

      // Setup workout
      await user.click(getByRole('button', { name: /get started/i }))
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()
      await builder.startWorkout()

      // Complete first set
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify rest timer appears in footer (look for a timer display)
      // The rest timer should be visible with a counting time display
      await waitFor(
        () => {
          // Look for timer digits format (M:SS)
          const timerElements = document.querySelectorAll('.font-mono.tabular-nums')
          const hasRestTimer = Array.from(timerElements).some((el) =>
            el.textContent?.match(/^\d+:\d{2}$/),
          )
          expect(hasRestTimer).toBe(true)
        },
        { timeout: 2000 },
      )

      cleanup()
    })
  })

  describe('Data Persistence', () => {
    it('completed set values persist after navigating away and back', async () => {
      const { builder, workout, common, user, getByRole, queryByText, cleanup } =
        await createTestApp()

      // Setup workout with two blocks
      await user.click(getByRole('button', { name: /get started/i }))

      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      await user.click(getByRole('button', { name: /add block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()

      // Start workout
      await builder.startWorkout()

      // Complete a set on block 1
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify badge shows completed set
      await waitFor(() => {
        expect(queryByText(/100kg × 8/)).toBeTruthy()
      })

      // Navigate to block 2
      await user.click(workout.getFooterButton('next'))
      await waitFor(() => {
        expect(queryByText(/block 2 of 2/i)).toBeTruthy()
      })

      // Navigate back to block 1
      await user.click(workout.getFooterButton('prev'))
      await waitFor(() => {
        expect(queryByText(/block 1 of 2/i)).toBeTruthy()
      })

      // Verify completed set is still visible
      expect(queryByText(/100kg × 8/)).toBeTruthy()

      cleanup()
    })

    it('workout state survives returning to builder and resuming', async () => {
      const { builder, workout, common, user, getByRole, queryByText, queryByRole, cleanup } =
        await createTestApp()

      // Setup workout
      await user.click(getByRole('button', { name: /get started/i }))
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Start and complete a set
      await builder.startWorkout()
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify badge exists
      await waitFor(() => {
        expect(queryByText(/100kg × 8/)).toBeTruthy()
      })

      // Go back to builder mode
      const backButton = document.querySelector('header button')
      if (!(backButton instanceof HTMLElement)) {
        throw new Error('Back button not found')
      }
      await user.click(backButton)

      // Wait for builder mode with Resume button
      await waitFor(() => {
        expect(queryByRole('button', { name: /resume workout/i })).toBeTruthy()
      })

      // Resume the workout
      await user.click(getByRole('button', { name: /resume workout/i }))

      // Verify we're back in active mode and completed set is preserved
      await waitFor(() => {
        expect(queryByRole('timer')).toBeTruthy()
      })

      // Completed set should still be visible
      expect(queryByText(/100kg × 8/)).toBeTruthy()

      cleanup()
    })
  })
})
