import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Workout Set Completion', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Set Completion Flow', () => {
    it('completes set and shows completed badge', async () => {
      const { builder, workout, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      await expect.poll(() => workout.isSetCompleted(0)).toBe(true)

      cleanup()
    })

    it('pre-fills next set with values from completed set', async () => {
      const { builder, workout, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      await expect.poll(async () => {
        const activeSet = await workout.getActiveSet()
        if (!activeSet) return null
        return await activeSet.getValues()
      }).toEqual({ weight: '100', reps: '8', rir: '2' })

      cleanup()
    })

    it('can complete multiple sets in sequence', async () => {
      const { builder, workout, cleanup } = await createTestApp()

      // Setup workout with 2 blocks (so completing first block doesn't end workout)
      await builder.setupStrengthWorkoutAndStart(['Bench Press', 'Deadlift'])

      // Complete first two sets and verify
      await workout.completeMultipleSets(2, { weight: '100', reps: '8', rir: '2' })
      await expect.poll(() => workout.getCompletedSetCount()).toBe(2)

      // Complete third set (pre-filled values, just click button)
      await page.getByRole('button', { name: /mark set 3 complete/i }).click()

      // After completing all sets in block 1, app auto-advances to block 2
      await expect.element(page.getByText(/block 2 of 2/i)).toBeVisible()

      cleanup()
    })

    it('auto-advances to next block when all sets are complete', async () => {
      const { builder, workout, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press', 'Deadlift'])
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Complete all 3 sets in first block
      await workout.completeMultipleSets(3, { weight: '80', reps: '10', rir: '2' })

      // Verify we auto-advanced to block 2 of 2
      await expect.element(page.getByText(/block 2 of 2/i)).toBeVisible()
      await expect.element(page.getByText('Deadlift')).toBeInTheDocument()

      cleanup()
    })

    it('can end workout and see completion screen', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })
      await expect.poll(() => workout.isSetCompleted(0)).toBe(true)

      // Open menu and end workout
      await expect.poll(() => workout.getMenuTrigger()).toBeTruthy()
      await userEvent.click(await workout.getMenuTrigger())

      await expect.element(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
      await page.getByRole('menuitem', { name: /end workout/i }).click()

      // Confirm finish workout dialog
      await common.waitForDialog()
      const nameInput = page.getByRole('textbox', { name: /workout name/i })
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'Test Complete')
      await userEvent.click(common.getDialogButton('Finish Workout'))

      await expect.element(page.getByText(/workout complete/i)).toBeVisible()

      cleanup()
    })
  })

  describe('Rest Timer Integration', () => {
    it('shows rest timer in footer after completing a set', async () => {
      const { builder, workout, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify rest timer appears in footer (look for a timer display)
      await expect.poll(() => {
        // eslint-disable-next-line no-restricted-syntax -- Finding timer element by CSS class
        const timerElements = document.querySelectorAll('.font-mono.tabular-nums')
        return Array.from(timerElements).some((el) =>
          el.textContent?.match(/^\d+:\d{2}$/),
        )
      }, { timeout: 2000 }).toBe(true)

      cleanup()
    })
  })

  describe('Data Persistence', () => {
    it('completed set values persist after navigating away and back', async () => {
      const { builder, workout, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press', 'Deadlift'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })
      await expect.poll(() => workout.isSetCompleted(0)).toBe(true)

      // Navigate to block 2 and back to block 1
      await userEvent.click(await workout.getFooterButton('next'))
      await expect.element(page.getByText(/block 2 of 2/i)).toBeVisible()

      await userEvent.click(await workout.getFooterButton('prev'))
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Verify completed set is still visible
      await expect.poll(() => workout.getCompletedSetCount()).toBeGreaterThan(0)

      cleanup()
    })

    it('workout state survives returning to builder and resuming', async () => {
      const { builder, workout, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })
      await expect.poll(() => workout.isSetCompleted(0)).toBe(true)

      // Go back to builder mode
      await page.getByRole('button', { name: /go back/i }).click()
      await expect.element(page.getByRole('button', { name: /resume workout/i })).toBeVisible()

      // Resume the workout
      await page.getByRole('button', { name: /resume workout/i }).click()

      // Verify we're back in active mode and completed set is preserved
      await expect.element(page.getByRole('timer')).toBeVisible()
      await expect.element(page.getByRole('table')).toBeVisible()
      await expect.poll(() => workout.getCompletedSetCount()).toBeGreaterThan(0)

      cleanup()
    })
  })
})
