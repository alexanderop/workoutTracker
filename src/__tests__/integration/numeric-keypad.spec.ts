import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { NumericInputModalPO } from '../helpers/pages/NumericInputModalPO'
import { mockTouchDevice, restoreMatchMedia } from '../helpers/mockTouchDevice'

describe('NumericKeypad (Touch Device)', () => {
  beforeEach(() => {
    mockTouchDevice()
  })
  afterEach(() => {
    restoreMatchMedia()
  })

  const modalPO = new NumericInputModalPO()

  describe('Fresh start behavior (calculator-style)', () => {
    it('replaces first input, appends later digits, edits with backspace, and starts decimals at zero', async ({
      createTestApp,
    }) => {
      const { builder } = await createTestApp()

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

      // The next digit appends after the first digit replaced the old value.
      await userEvent.click(page.getByRole('button', { name: /^5$/ }))

      const appendedValue = await modalPO.getCurrentValue()
      expect(appendedValue).toBe(85) // First replaced, second appended

      // Cancel keeps 70, then establish 75 as the next committed starting value.
      await modalPO.clickCancel()
      await modalPO.waitForClose()
      await weightTrigger.click()
      await modalPO.waitForOpen()
      await modalPO.enterValueAndConfirm(75)
      await modalPO.waitForClose()

      // Reopen
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Backspace should delete last digit of 75, leaving 7
      await userEvent.click(page.getByRole('button', { name: /backspace/i }))

      const backspacedValue = await modalPO.getCurrentValue()
      expect(backspacedValue).toBe(7) // Edited from 75, not fresh start

      // Cancel keeps 75 so reopening still starts from an existing value.
      await modalPO.clickCancel()
      await modalPO.waitForClose()
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Click decimal first - should start fresh with "0."
      await modalPO.clickDecimal()
      await userEvent.click(page.getByRole('button', { name: /^5$/ }))

      const decimalValue = await modalPO.getCurrentValue()
      expect(decimalValue).toBe(0.5) // Started fresh with decimal
    })
  })

  describe('Keypad digit buttons', () => {
    it('builds single- and multi-digit values and removes the last digit', async ({
      createTestApp,
    }) => {
      const { builder } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Open the weight modal
      const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
      await weightTrigger.click()
      await modalPO.waitForOpen()

      // Clear any existing value
      const backspaceButton = page.getByRole('button', { name: /backspace/i })
      for (const _ of Array.from({ length: 5 })) {
        await userEvent.click(backspaceButton)
      }

      // Tap digit "5"
      const digit5 = page.getByRole('button', { name: /^5$/ })
      await userEvent.click(digit5)

      // Verify value display shows 5
      const currentValue = await modalPO.getCurrentValue()
      expect(currentValue).toBe(5)

      // Clear again, then build a multi-digit value.
      for (const _ of Array.from({ length: 5 })) {
        await userEvent.click(backspaceButton)
      }

      // Tap "1" then "0" then "0" to make 100
      await userEvent.click(page.getByRole('button', { name: /^1$/ }))
      await userEvent.click(page.getByRole('button', { name: /^0$/ }))
      await userEvent.click(page.getByRole('button', { name: /^0$/ }))

      // Verify value display shows 100
      expect(await modalPO.getCurrentValue()).toBe(100)

      // Clear and enter 123
      for (const _ of Array.from({ length: 5 })) {
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
    })

    it('keypad value persists after confirm', async ({ createTestApp }) => {
      const { builder, workout } = await createTestApp()

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
    })
  })
})
