import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { NumericInputModalPO } from '../helpers/pages/NumericInputModalPO'
import { mockTouchDevice, restoreMatchMedia } from '../helpers/mockTouchDevice'

describe('Numeric Input Modal (Touch Device)', () => {
  beforeEach(async () => {
    mockTouchDevice()
    await setupIntegrationTest()
  })
  afterEach(async () => {
    await cleanupIntegrationTest()
    restoreMatchMedia()
  })

  const modalPO = new NumericInputModalPO()

  describe('Modal Input Flow', () => {
    it('opens modal when tapping weight input on touch device', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Tap the weight trigger button
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()

      // Modal should open
      await modalPO.waitForOpen()
      const title = await modalPO.getTitle()
      expect(title).toBe('Weight')

      cleanup()
    })

    it('can complete a set using modal input', async () => {
      const { builder, workout, cleanup } = await createTestApp()

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

      cleanup()
    })

    it('canceling modal preserves original value', async () => {
      const { builder, workout, cleanup } = await createTestApp()

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

      cleanup()
    })

    it('shows correct unit label in weight modal', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Open weight modal
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Check for unit label in the selected preset (inside the dialog)
      await expect.element(page.getByTestId('preset-selected').getByText('kg')).toBeVisible()

      await modalPO.clickCancel()
      cleanup()
    })

    it('shows barbell plate hint with correct plate description', async () => {
      const { builder, cleanup } = await createTestApp()

      // Bench Press is a barbell exercise
      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Open weight modal
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Enter 60kg (= 20kg bar + 2x20kg plates)
      await modalPO.enterValue(60)

      // Barbell plate hint should show correct plate configuration
      const barbellHint = page.getByRole('img', { name: /barbell with 20kg/i })
      await expect.element(barbellHint).toBeVisible()

      await modalPO.clickCancel()
      cleanup()
    })

    it('does not show barbell plate hint for non-barbell exercises', async () => {
      const { builder, cleanup } = await createTestApp()

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
      cleanup()
    })
  })

  describe('SetRowPO Integration', () => {
    it('SetRowPO.enterValues() works in modal mode', async () => {
      const { builder, workout, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Use the page object to fill values (should use modal internally)
      const set = await workout.getSet(0)
      await set.enterValues({ kg: 100, reps: 8, rir: 2 })

      // Verify values are set
      const values = await set.getValues()
      expect(values.weight).toBe('100')
      expect(values.reps).toBe('8')
      expect(values.rir).toBe('2')

      cleanup()
    })

    it('SetRowPO.fillAndComplete() works in modal mode', async () => {
      const { builder, workout, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Use the page object to fill and complete
      const set = await workout.getSet(0)
      await set.fillAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify set is completed
      await expect.poll(() => workout.isSetCompleted(0)).toBe(true)

      cleanup()
    })
  })
})
