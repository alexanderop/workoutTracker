import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Strength Workflows', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Set Completion', () => {
    it('advances to the next set after completing a set', async () => {
      const { builder, workout, common, getByRole, cleanup } = await createTestApp()

      // Click "Start New Workout" on home page to start a new workout
      await userEvent.click(getByRole('button', { name: /start new workout/i }))

      // We should now be on the workout builder page
      // Add an exercise by clicking "Add First Block"
      await userEvent.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await userEvent.click(await common.getDialogButton('Bench Press'))
      expect(common.isDialogOpen()).toBe(false)

      // Start the workout (transition from builder to active mode)
      await builder.startWorkout()

      // Wait for table to render
      await expect.element(page.getByRole('table')).toBeVisible()

      // Fill and complete the first set
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify the first set shows completed state (inputs disabled)
      await expect.poll(() => workout.isSetCompleted(0)).toBe(true)

      cleanup()
    })

    it('displays strength block UI and allows completing all sets', async () => {
      const { builder, workout, common, queryByRole, queryByText, getByRole, cleanup } =
        await createTestApp()

      // Setup: add strength block and start workout
      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()

      // Verify initial UI state (table renders)
      await expect.element(page.getByRole('table')).toBeVisible()
      expect(queryByRole('heading', { name: /bench press/i })).toBeTruthy()
      expect(queryByText('Strength')).toBeTruthy()

      // Fill and complete the first set
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })

      // Complete set 2 (values should be pre-filled from set 1)
      await userEvent.click(getByRole('button', { name: /mark set 2 complete/i }))

      // Verify 2 sets completed before final set (table still visible)
      await expect.poll(() => workout.getCompletedSetCount()).toBe(2)

      // Complete set 3 - this triggers workout completion dialog for single-block workouts
      await userEvent.click(getByRole('button', { name: /mark set 3 complete/i }))

      // Verify completion dialog appears (table is hidden behind dialog)
      await common.waitForDialog()

      cleanup()
    })
  })

  describe('Value Prefilling', () => {
    it('prefills values from previous set when advancing', async () => {
      const { builder, workout, queryByRole, cleanup } = await createTestApp()

      await builder.addStrengthBlock('Squat')
      await builder.startWorkout()

      // Wait for table to render
      await expect.element(page.getByRole('table')).toBeVisible()
      expect(queryByRole('heading', { name: /squat/i })).toBeTruthy()

      // Fill and complete first set with specific values
      await workout.fillCardSetAndComplete({ weight: '100', reps: '5', rir: '1' })

      // Verify prefilled values in next set using SetRowPO
      await expect
        .poll(async () => {
          const activeSet = await workout.getActiveSet()
          if (!activeSet) return null
          const values = await activeSet.getValues()
          return values.weight
        })
        .toBe('100')
      const activeSet = await workout.getActiveSet()
      const values = await activeSet!.getValues()
      expect(values.reps).toBe('5')

      cleanup()
    })
  })
})
