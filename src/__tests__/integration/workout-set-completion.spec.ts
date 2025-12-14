import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Workout Set Completion', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Set Completion Flow', () => {
    it('completes set and shows completed badge', async () => {
      const { builder, workout, common, getByRole, cleanup } = await createTestApp()

      // Setup: Create workout with strength block
      await userEvent.click(getByRole('button', { name: /start new workout/i }))
      await userEvent.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Start workout
      await builder.startWorkout()

      // Verify table renders with sets
      await screen.findByRole('table')

      // Action: Fill and complete first set
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Assert: First row shows completed state (inputs disabled)
      await waitFor(() => {
        expect(workout.isSetCompleted(0)).toBe(true)
      })

      cleanup()
    })

    it('pre-fills next set with values from completed set', async () => {
      const { builder, workout, common, getByRole, cleanup } = await createTestApp()

      // Setup workout
      await userEvent.click(getByRole('button', { name: /start new workout/i }))
      await userEvent.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()
      await builder.startWorkout()

      // Wait for table to render
      await screen.findByRole('table')

      // Complete first set with specific values
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Check that the next active row's inputs are pre-filled with previous set's values
      await waitFor(() => {
        const inputs = workout.getActiveRowInputs()
        expect(inputs).toBeTruthy()
        expect(inputs?.weight.value).toBe('100')
        expect(inputs?.reps.value).toBe('8')
        expect(inputs?.rir.value).toBe('2')
      })

      cleanup()
    })

    it('can complete multiple sets in sequence', async () => {
      const { builder, workout, common, getByRole, queryByText, cleanup } = await createTestApp()

      // Setup workout with 2 blocks (so completing first block doesn't end workout)
      await userEvent.click(getByRole('button', { name: /start new workout/i }))
      await userEvent.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add second block to prevent app from ending after completing first block
      await userEvent.click(getByRole('button', { name: /add block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()

      await builder.startWorkout()

      // Wait for table to render
      await screen.findByRole('table')

      // Complete first set and verify
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })
      await waitFor(() => {
        expect(workout.isSetCompleted(0)).toBe(true)
      })

      // Complete second set and verify
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })
      await waitFor(() => {
        expect(workout.getCompletedSetCount()).toBe(2)
      })

      // Complete third set (pre-filled values, just click button)
      await userEvent.click(getByRole('button', { name: /mark set 3 complete/i }))

      // After completing all sets in block 1, app auto-advances to block 2
      await waitFor(() => {
        expect(queryByText(/block 2 of 2/i)).toBeTruthy()
      })

      cleanup()
    })

    it('auto-advances to next block when all sets are complete', async () => {
      const { builder, workout, common, getByRole, queryByText, cleanup } = await createTestApp()

      // Setup workout with TWO strength blocks
      await userEvent.click(getByRole('button', { name: /start new workout/i }))

      // Add first block
      await userEvent.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add second block
      await userEvent.click(getByRole('button', { name: /add block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Deadlift'))
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
      const { builder, workout, common, getByRole, queryByText, queryByRole, cleanup } =
        await createTestApp()

      // Setup workout with ONE strength block
      await userEvent.click(getByRole('button', { name: /start new workout/i }))
      await userEvent.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      await builder.startWorkout()

      // Wait for table to render
      await screen.findByRole('table')

      // Complete just the first set
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify we completed a set using Page Object method
      await waitFor(() => {
        expect(workout.isSetCompleted(0)).toBe(true)
      })

      // Open menu and end workout
      await waitFor(() => {
        expect(workout.getMenuTrigger()).toBeTruthy()
      })
      await userEvent.click(workout.getMenuTrigger())

      await waitFor(() => {
        expect(queryByRole('menuitem', { name: /end workout/i })).toBeTruthy()
      })
      await userEvent.click(getByRole('menuitem', { name: /end workout/i }))

      // Confirm finish workout dialog
      await common.waitForDialog()
      const nameInput = getByRole('textbox', { name: /workout name/i })
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'Test Complete')
      await userEvent.click(common.getDialogButton('Finish Workout'))

      // Wait for completion screen
      await waitFor(() => {
        expect(queryByText(/workout complete/i)).toBeTruthy()
      })

      cleanup()
    })
  })

  describe('Rest Timer Integration', () => {
    it('shows rest timer in footer after completing a set', async () => {
      const { builder, workout, common, getByRole, cleanup } = await createTestApp()

      // Setup workout
      await userEvent.click(getByRole('button', { name: /start new workout/i }))
      await userEvent.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
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
      const { builder, workout, common, getByRole, queryByText, cleanup } =
        await createTestApp()

      // Setup workout with two blocks
      await userEvent.click(getByRole('button', { name: /start new workout/i }))

      await userEvent.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      await userEvent.click(getByRole('button', { name: /add block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()

      // Start workout
      await builder.startWorkout()

      // Wait for table to render
      await screen.findByRole('table')

      // Complete a set on block 1
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify set is completed using Page Object method
      await waitFor(() => {
        expect(workout.isSetCompleted(0)).toBe(true)
      })

      // Navigate to block 2
      await userEvent.click(workout.getFooterButton('next'))
      await waitFor(() => {
        expect(queryByText(/block 2 of 2/i)).toBeTruthy()
      })

      // Navigate back to block 1
      await userEvent.click(workout.getFooterButton('prev'))
      await waitFor(() => {
        expect(queryByText(/block 1 of 2/i)).toBeTruthy()
      })

      // Verify completed set is still visible
      expect(workout.getCompletedSetCount()).toBeGreaterThan(0)

      cleanup()
    })

    it('workout state survives returning to builder and resuming', async () => {
      const { builder, workout, common, getByRole, queryByRole, cleanup } =
        await createTestApp()

      // Setup workout
      await userEvent.click(getByRole('button', { name: /start new workout/i }))
      await userEvent.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Start and complete a set
      await builder.startWorkout()

      // Wait for table to render
      await screen.findByRole('table')

      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify set is completed using Page Object method
      await waitFor(() => {
        expect(workout.isSetCompleted(0)).toBe(true)
      })

      // Go back to builder mode
      await userEvent.click(getByRole('button', { name: /go back/i }))

      // Wait for builder mode with Resume button
      await waitFor(() => {
        expect(queryByRole('button', { name: /resume workout/i })).toBeTruthy()
      })

      // Resume the workout
      await userEvent.click(getByRole('button', { name: /resume workout/i }))

      // Verify we're back in active mode and completed set is preserved
      await waitFor(() => {
        expect(queryByRole('timer')).toBeTruthy()
      })

      // Completed set should still be visible
      await screen.findByRole('table')
      expect(workout.getCompletedSetCount()).toBeGreaterThan(0)

      cleanup()
    })
  })
})
