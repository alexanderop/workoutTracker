import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { NumericInputModalPO } from '../helpers/pages/NumericInputModalPO'
import { mockTouchDevice, restoreMatchMedia } from '../helpers/mockTouchDevice'

describe('NumericKeypad (Touch Device)', () => {
  beforeEach(async () => {
    mockTouchDevice()
    await setupIntegrationTest()
  })
  afterEach(async () => {
    await cleanupIntegrationTest()
    restoreMatchMedia()
  })

  const modalPO = new NumericInputModalPO()

  describe('Fresh start behavior (calculator-style)', () => {
    it('first digit replaces existing value instead of appending', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Open the weight modal and set initial value via keypad
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Enter 70 via keypad and confirm
      await modalPO.enterValueAndConfirm(70)
      await modalPO.waitForClose()

      // Reopen the modal - should show 70
      await weightTrigger.click()
      await modalPO.waitForOpen()

      const initialValue = await modalPO.getCurrentValue()
      expect(initialValue).toBe(70)

      // Type "8" - should REPLACE 70 with 8, not append to make 708
      await userEvent.click(page.getByRole('button', { name: /^8$/ }))

      const newValue = await modalPO.getCurrentValue()
      expect(newValue).toBe(8) // Not 708!

      cleanup()
    })

    it('subsequent digits append after first digit replaces', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Set initial value via keypad
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()
      await modalPO.enterValueAndConfirm(70)
      await modalPO.waitForClose()

      // Reopen
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Type "8" (replaces), then "5" (appends)
      await userEvent.click(page.getByRole('button', { name: /^8$/ }))
      await userEvent.click(page.getByRole('button', { name: /^5$/ }))

      const value = await modalPO.getCurrentValue()
      expect(value).toBe(85) // First replaced, second appended

      cleanup()
    })

    it('backspace edits existing value instead of replacing', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Set initial value to 75 via keypad
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()
      await modalPO.enterValueAndConfirm(75)
      await modalPO.waitForClose()

      // Reopen
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Backspace should delete last digit of 75, leaving 7
      await userEvent.click(page.getByRole('button', { name: /backspace/i }))

      const value = await modalPO.getCurrentValue()
      expect(value).toBe(7) // Edited from 75, not fresh start

      cleanup()
    })

    it('decimal as first input starts with "0."', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Set initial value via keypad
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()
      await modalPO.enterValueAndConfirm(70)
      await modalPO.waitForClose()

      // Reopen
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Click decimal first - should start fresh with "0."
      await modalPO.clickDecimal()
      await userEvent.click(page.getByRole('button', { name: /^5$/ }))

      const value = await modalPO.getCurrentValue()
      expect(value).toBe(0.5) // Started fresh with decimal

      cleanup()
    })
  })

  describe('Keypad digit buttons', () => {
    it('updates value when tapping digit button', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Open the weight modal
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Clear any existing value
      const backspaceButton = page.getByRole('button', { name: /backspace/i })
      for (let i = 0; i < 5; i++) {
        await userEvent.click(backspaceButton)
      }

      // Tap digit "5"
      const digit5 = page.getByRole('button', { name: /^5$/ })
      await userEvent.click(digit5)

      // Verify value display shows 5
      const currentValue = await modalPO.getCurrentValue()
      expect(currentValue).toBe(5)

      cleanup()
    })

    it('appends digits to build multi-digit numbers', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Open the weight modal
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Clear any existing value
      const backspaceButton = page.getByRole('button', { name: /backspace/i })
      for (let i = 0; i < 5; i++) {
        await userEvent.click(backspaceButton)
      }

      // Tap "1" then "0" then "0" to make 100
      await userEvent.click(page.getByRole('button', { name: /^1$/ }))
      await userEvent.click(page.getByRole('button', { name: /^0$/ }))
      await userEvent.click(page.getByRole('button', { name: /^0$/ }))

      // Verify value display shows 100
      const currentValue = await modalPO.getCurrentValue()
      expect(currentValue).toBe(100)

      cleanup()
    })

    it('backspace removes last digit', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Open the weight modal
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Clear and enter 123
      const backspaceButton = page.getByRole('button', { name: /backspace/i })
      for (let i = 0; i < 5; i++) {
        await userEvent.click(backspaceButton)
      }

      await userEvent.click(page.getByRole('button', { name: /^1$/ }))
      await userEvent.click(page.getByRole('button', { name: /^2$/ }))
      await userEvent.click(page.getByRole('button', { name: /^3$/ }))

      // Verify it's 123
      expect(await modalPO.getCurrentValue()).toBe(123)

      // Backspace once
      await userEvent.click(backspaceButton)

      // Verify it's now 12
      expect(await modalPO.getCurrentValue()).toBe(12)

      cleanup()
    })

    it('keypad value persists after confirm', async () => {
      const { builder, workout, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Open weight modal and enter value via keypad
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Enter 85 via keypad
      await modalPO.enterValue(85)

      // Confirm
      await modalPO.clickConfirm()
      await modalPO.waitForClose()

      // Verify value was saved
      const set = await workout.getSet(0)
      const values = await set.getValues()
      expect(values.weight).toBe('85')

      cleanup()
    })
  })
})
