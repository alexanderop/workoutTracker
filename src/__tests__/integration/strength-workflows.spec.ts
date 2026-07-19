import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'

describe('Strength Workflows', () => {
  describe('Set Completion', () => {
    it('builds a strength block, prefills later sets, and completes the block', async ({
      createTestApp,
    }) => {
      const { builder, workout, common, getByRole, getByText } = await createTestApp()

      // Click "Start New Workout" on home page to start a new workout
      await userEvent.click(getByRole('button', { name: /start new workout/i }))

      // We should now be on the workout builder page
      // Add an exercise by clicking "Add First Block"
      await userEvent.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      expect(common.isDialogOpen()).toBe(false)

      // Start the workout (transition from builder to active mode)
      await builder.startWorkout()

      // Wait for table to render
      await expect.element(page.getByRole('table')).toBeVisible()
      await expect.element(getByRole('heading', { name: /bench press/i })).toBeVisible()
      await expect.element(getByText('Strength')).toBeVisible()

      // Fill and complete the first set
      await workout.fillCardSetAndComplete({ weight: '100', reps: '5', rir: '1' })

      // Verify the first set shows completed state (inputs disabled)
      await expect.poll(() => workout.isSetCompleted(0)).toBe(true)

      // The next set is prefilled from the completed set.
      await expect
        .poll(async () => (await workout.getActiveSet())?.getValues())
        .toEqual({
          weight: '100',
          reps: '5',
          rir: '1',
        })

      // Complete set 2 (values should be pre-filled from set 1)
      await userEvent.click(getByRole('button', { name: /mark set 2 complete/i }))

      // Verify 2 sets completed before final set (table still visible)
      await expect.poll(() => workout.getCompletedSetCount()).toBe(2)

      // Complete set 3 - this triggers workout completion dialog for single-block workouts
      await userEvent.click(getByRole('button', { name: /mark set 3 complete/i }))

      // Verify completion dialog appears (table is hidden behind dialog)
      await common.waitForDialog()
    })
  })
})
