import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { NumericInputModalPO } from '../helpers/pages/NumericInputModalPO'
import { mockTouchDevice, restoreMatchMedia } from '../helpers/mockTouchDevice'

describe('Locale-Aware Decimal Input', () => {
  beforeEach(async () => {
    mockTouchDevice()
    await setupIntegrationTest()
  })
  afterEach(async () => {
    await cleanupIntegrationTest()
    restoreMatchMedia()
  })

  const modalPO = new NumericInputModalPO()

  describe('German Locale (comma separator)', () => {
    // Given: User has German language selected
    // When: Opening weight input modal on touch device
    // Then: Keypad shows comma as decimal button

    it('shows comma as decimal separator on keypad', async () => {
      const { builder, cleanup } = await createTestApp()

      // Set German locale after app is created
      i18n.global.locale.value = 'de'

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Open weight modal
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Verify decimal button shows ","
      const decimalSeparator = await modalPO.getDecimalSeparator()
      expect(decimalSeparator).toBe(',')

      await modalPO.clickCancel()
      cleanup()
    })

    // Given: German locale with comma separator
    // When: User enters weight "70.5" via keypad (internally uses .)
    // Then: Weight is stored correctly as 70.5

    it('can enter decimal weight using keypad', async () => {
      const { builder, cleanup } = await createTestApp()

      // Set German locale after app is created
      i18n.global.locale.value = 'de'

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Open weight modal
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Enter 70.5 via keypad (enterValue handles decimal)
      await modalPO.enterValueAndConfirm(70.5)
      await modalPO.waitForClose()

      // Verify the weight was set (displayed as "70,5" in German locale)
      // The trigger button should now show the value
      await expect.element(weightTrigger).toHaveTextContent('70,5')

      cleanup()
    })

    // Given: German locale
    // When: Viewing a weight value of 70.5
    // Then: Display shows "70,5" (with comma)

    it('displays existing decimal weights with comma', async () => {
      const { builder, cleanup } = await createTestApp()

      // Set German locale after app is created
      i18n.global.locale.value = 'de'

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Set weight to 70.5 using modal
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()
      await modalPO.enterValueAndConfirm(70.5)
      await modalPO.waitForClose()

      // Re-open modal to see display
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Check that the value display shows comma format
      const valueDisplay = page.getByLabelText('Current value')
      await expect.element(valueDisplay).toHaveTextContent(/70,5/)

      await modalPO.clickCancel()
      cleanup()
    })
  })

  describe('English Locale (period separator)', () => {
    // Given: User has English language selected
    // When: Opening weight input modal
    // Then: Keypad shows period as decimal button

    it('shows period as decimal separator on keypad', async () => {
      const { builder, cleanup } = await createTestApp()

      // Set English locale (default, but explicit for clarity)
      i18n.global.locale.value = 'en'

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Open weight modal
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Verify decimal button shows "."
      const decimalSeparator = await modalPO.getDecimalSeparator()
      expect(decimalSeparator).toBe('.')

      await modalPO.clickCancel()
      cleanup()
    })

    // Given: English locale with period separator
    // When: User enters weight "70.5" via keypad
    // Then: Weight is stored correctly

    it('can enter decimal weight using period', async () => {
      const { builder, cleanup } = await createTestApp()

      // Set English locale
      i18n.global.locale.value = 'en'

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Open weight modal
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Enter 70.5 via keypad
      await modalPO.enterValueAndConfirm(70.5)
      await modalPO.waitForClose()

      // Verify the weight was set (displayed as "70.5" in English locale)
      await expect.element(weightTrigger).toHaveTextContent('70.5')

      cleanup()
    })
  })

  describe('Integer-Only Fields', () => {
    // Given: Reps input (allowDecimal: false)
    // When: Opening reps modal
    // Then: No decimal button is shown

    it('does not show decimal button for reps', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Open reps modal
      const repsTrigger = page.getByRole('button', { name: /reps for set 1/i })
      await repsTrigger.click()
      await modalPO.waitForOpen()

      // Verify no decimal button
      const hasDecimal = modalPO.isDecimalButtonVisible()
      expect(hasDecimal).toBe(false)

      await modalPO.clickCancel()
      cleanup()
    })

    // Given: RIR input (allowDecimal: false)
    // When: Opening RIR modal
    // Then: No decimal button is shown

    it('does not show decimal button for RIR', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Open RIR modal
      const rirTrigger = page.getByRole('button', { name: /reps in reserve for set 1/i })
      await rirTrigger.click()
      await modalPO.waitForOpen()

      // Verify no decimal button
      const hasDecimal = modalPO.isDecimalButtonVisible()
      expect(hasDecimal).toBe(false)

      await modalPO.clickCancel()
      cleanup()
    })
  })
})
