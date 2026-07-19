import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { NumericInputModalPO } from '../helpers/pages/NumericInputModalPO'
import { mockTouchDevice, restoreMatchMedia } from '../helpers/mockTouchDevice'

describe('Numeric Input Modal (Touch Device)', () => {
  beforeEach(() => {
    mockTouchDevice()
  })
  afterEach(() => {
    restoreMatchMedia()
  })

  const modalPO = new NumericInputModalPO()

  describe('Modal Input Flow', () => {
    it('opens modal when tapping weight input on touch device', async ({ createTestApp }) => {
      const { builder } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Tap the weight trigger button
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()

      // Modal should open
      await modalPO.waitForOpen()
      await expect.element(page.getByRole('button', { name: /confirm value/i })).toBeVisible()
      await expect.element(page.getByRole('button', { name: /cancel/i })).toBeVisible()
      const title = await modalPO.getTitle()
      expect(title).toBe('Weight')
    })

    it('shows correct unit label in weight modal', async ({ createTestApp }) => {
      const { builder } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Check for unit label in the selected preset (inside the dialog)
      await expect.element(page.getByTestId('preset-selected').getByText('kg')).toBeVisible()

      await modalPO.clickCancel()
    })

    it('shows barbell plate hint with correct plate description', async ({ createTestApp }) => {
      const { builder } = await createTestApp()

      // Bench Press is a barbell exercise
      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Enter 60kg (= 20kg bar + 2x20kg plates)
      await modalPO.enterValue(60)

      // Barbell plate hint should show correct plate configuration
      const barbellHint = page.getByRole('img', { name: /barbell with 20kg/i })
      await expect.element(barbellHint).toBeVisible()

      await modalPO.clickCancel()
    })

    it('can complete a set using modal input', async ({ createTestApp }) => {
      const { builder, workout } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Fill weight via modal
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()
      await modalPO.enterValueAndConfirm(100)
      await modalPO.waitForClose()

      // Fill reps via modal
      const repsTrigger = page.getByRole('button', { name: /reps for set 1/i })
      await repsTrigger.click()
      await modalPO.waitForOpen()
      await modalPO.enterValueAndConfirm(8)
      await modalPO.waitForClose()

      // Fill RIR via modal
      const rirTrigger = page.getByRole('button', { name: /reps in reserve for set 1/i })
      await rirTrigger.click()
      await modalPO.waitForOpen()
      await modalPO.enterValueAndConfirm(2)
      await modalPO.waitForClose()

      // Complete the set
      await page.getByRole('button', { name: /mark set 1 complete/i }).click()

      // Verify set is completed
      await expect.poll(() => workout.isSetCompleted(0)).toBe(true)
    })

    it('canceling modal preserves original value', async ({ createTestApp }) => {
      const { builder, workout } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // First, fill a value
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()
      await modalPO.enterValueAndConfirm(100)
      await modalPO.waitForClose()

      // Open modal again and enter different value
      await weightTrigger.click()
      await modalPO.waitForOpen()
      await modalPO.enterValue(999)

      // Cancel instead of confirm
      await modalPO.clickCancel()
      await modalPO.waitForClose()

      // Verify original value is preserved
      const set = await workout.getSet(0)
      const values = await set.getValues()
      expect(values.weight).toBe('100')
    })

    it('does not show barbell plate hint for non-barbell exercises', async ({ createTestApp }) => {
      const { builder } = await createTestApp()

      // Dumbbell Curl is a dumbbell exercise (not barbell)
      await builder.setupStrengthWorkoutAndStart(['Dumbbell Curl'])

      // Open weight modal
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Barbell plate hint should NOT be visible
      const barbellHint = page.getByRole('img', { name: /barbell/i })
      await expect.element(barbellHint).not.toBeInTheDocument()

      await modalPO.clickCancel()
    })
  })

  describe('SetRowPO Integration', () => {
    it('SetRowPO enters values and completes the set in modal mode', async ({ createTestApp }) => {
      const { builder, workout } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // fillAndComplete delegates to enterValues, so one journey exercises both
      // page-object contracts through all three touch modals.
      const set = await workout.getSet(0)
      await set.fillAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify values are set and the row is completed.
      const values = await set.getValues()
      expect(values.weight).toBe('100')
      expect(values.reps).toBe('8')
      expect(values.rir).toBe('2')
      await expect.poll(() => workout.isSetCompleted(0)).toBe(true)
    })
  })
})
