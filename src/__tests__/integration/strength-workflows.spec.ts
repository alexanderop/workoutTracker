import { page, userEvent } from '../helpers/locator'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { expectElement, expectPoll } from '../helpers/assertions'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Strength Workflows', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Set Completion', () => {
    it('advances to the next set after completing a set', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      // Click "Start New Workout" on home page to start a new workout
      await page.getByRole('button', { name: /start new workout/i }).click()

      // We should now be on the workout builder page
      // Add an exercise by clicking "Add First Block"
      await page.getByRole('button', { name: /add first block/i }).click()
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Start the workout (transition from builder to active mode)
      await builder.startWorkout()

      // Wait for table to render
      await expectElement(page.getByRole('table')).toBeVisible()

      // Fill and complete the first set
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify the first set shows completed state (inputs disabled)
      await expectPoll(() => workout.isSetCompleted(0)).toBe(true)

      cleanup()
    })

    it('displays strength block UI and allows completing all sets', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      // Setup: add strength block and start workout
      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()

      // Verify initial UI state (table renders)
      await expectElement(page.getByRole('table')).toBeVisible()
      expect(page.getByRole('heading', { name: /bench press/i }).query()).toBeTruthy()
      expect(page.getByText('Strength').query()).toBeTruthy()

      // Fill and complete the first set
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })

      // Complete set 2 (values should be pre-filled from set 1)
      await page.getByRole('button', { name: /mark set 2 complete/i }).click()

      // Verify 2 sets completed before final set (table still visible)
      await expectPoll(() => workout.getCompletedSetCount()).toBe(2)

      // Complete set 3 - this triggers workout completion dialog for single-block workouts
      await page.getByRole('button', { name: /mark set 3 complete/i }).click()

      // Verify completion dialog appears (table is hidden behind dialog)
      await common.waitForDialog()

      cleanup()
    })
  })

  describe('Value Prefilling', () => {
    it('prefills values from previous set when advancing', async () => {
      const { builder, workout, cleanup } = await createTestApp()

      await builder.addStrengthBlock('Squat')
      await builder.startWorkout()

      // Wait for table to render
      await expectElement(page.getByRole('table')).toBeVisible()
      expect(page.getByRole('heading', { name: /squat/i }).query()).toBeTruthy()

      // Fill and complete first set with specific values
      await workout.fillCardSetAndComplete({ weight: '100', reps: '5', rir: '1' })

      // Verify prefilled values in next set using SetRowPO
      await expectPoll(async () => {
        const activeSet = await workout.getActiveSet()
        if (!activeSet) return null
        const values = await activeSet.getValues()
        return values.weight
      }).toBe('100')
      const activeSet = await workout.getActiveSet()
      const values = await activeSet!.getValues()
      expect(values.reps).toBe('5')

      cleanup()
    })
  })
})
