import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, it } from 'vitest'
import { expectElement, expectPoll } from '../helpers/assertions'
import { page, userEvent } from '../helpers/locator'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Isometric Exercise Workflow', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Given an isometric exercise (Plank)', () => {
    it('tracks duration instead of reps for a completed set', async () => {
      // Arrange: Start a new workout
      const { builder, common, workout, cleanup } = await createTestApp()

      // Act: Add an isometric exercise
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Plank'))
      await common.waitForDialogClose()

      // Act: Start the workout
      await builder.startWorkout()

      // Assert: Duration column header (SECS) is shown instead of Reps
      await expectElement(page.getByRole('table')).toBeVisible()
      const secsHeader = page.getByText('SECS')
      await expectElement(secsHeader).toBeVisible()

      // Assert: RIR column is NOT shown (isometric exercises hide it)
      const rirHeader = page.getByText('RIR')
      await expectElement(rirHeader).not.toBeInTheDocument()

      // Act: Fill in duration (60 seconds) for the first set
      const durationInput = page.getByRole('spinbutton', { name: /duration for set 1/i })
      await durationInput.fill('60')
      // Blur the input to commit the value
      await userEvent.tab()
      await flushPromises()

      // Act: Click the row complete button
      const completeButton = page.getByRole('button', { name: /mark set 1 complete/i })
      await completeButton.click()

      // Assert: First set shows completed state
      await expectPoll(() => workout.isSetCompleted(0)).toBe(true)

      cleanup()
    })

    it('shows weighted plank with both weight and duration inputs', async () => {
      // Arrange: Start a new workout
      const { builder, common, workout, cleanup } = await createTestApp()

      // Act: Add weighted plank (has weight + duration)
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Weighted Plank'))
      await common.waitForDialogClose()

      // Act: Start the workout
      await builder.startWorkout()
      await expectElement(page.getByRole('table')).toBeVisible()

      // Assert: Both weight and duration inputs are visible
      const weightInput = page.getByRole('spinbutton', { name: /weight for set 1/i })
      const durationInput = page.getByRole('spinbutton', { name: /duration for set 1/i })
      await expectElement(weightInput).toBeVisible()
      await expectElement(durationInput).toBeVisible()

      // Act: Fill in weight (10kg) and duration (45 seconds)
      await weightInput.fill('10')
      await durationInput.fill('45')

      // Act: Complete the set
      const completeButton = page.getByRole('button', { name: /mark set 1 complete/i })
      await completeButton.click()

      // Assert: First set shows completed state
      await expectPoll(() => workout.isSetCompleted(0)).toBe(true)

      cleanup()
    })
  })
})
