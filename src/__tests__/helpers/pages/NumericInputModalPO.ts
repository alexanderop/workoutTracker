import { expect } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { flushPromises } from '@vue/test-utils'

/**
 * Page Object for the NumericInputModal component.
 * Handles interactions with the fullscreen numeric input modal.
 */
export class NumericInputModalPO {
  /**
   * Gets the modal dialog locator.
   */
  private getDialog() {
    return page.getByRole('dialog')
  }

  /**
   * Waits for the modal to be visible.
   */
  async waitForOpen(): Promise<void> {
    await expect.element(this.getDialog()).toBeVisible()
  }

  /**
   * Waits for the modal to be hidden.
   */
  async waitForClose(): Promise<void> {
    await expect.element(this.getDialog()).not.toBeInTheDocument()
    await flushPromises()
  }

  /**
   * Gets the current displayed value from the wheel picker.
   */
  async getCurrentValue(): Promise<number> {
    const selectedOption = page.getByRole('option', { selected: true })
    const element = await selectedOption.element()
    const text = element.textContent ?? '0'
    // Remove any unit suffix (e.g., "100 kg" -> "100")
    const numericPart = text.trim().split(/\s/)[0]
    return parseFloat(numericPart ?? '0')
  }

  /**
   * Enters a value using the numeric keypad.
   * Clears the current value first, then types the new value.
   */
  async enterValue(value: number): Promise<void> {
    // Clear current value by clicking backspace multiple times
    const backspaceButton = page.getByRole('button', { name: /backspace/i })
    for (let i = 0; i < 5; i++) {
      await userEvent.click(backspaceButton)
    }

    // Type each digit
    const digits = String(value).split('')
    for (const digit of digits) {
      if (digit === '.') continue // Skip decimal for now - keypad handles integers
      const digitButton = page.getByRole('button', { name: new RegExp(`^${digit}$`) })
      await userEvent.click(digitButton)
    }
  }

  /**
   * Uses the steppers to adjust the value.
   */
  async stepUp(large = false): Promise<void> {
    const pattern = large ? /increment by.*\d+/i : /increment by.*\d+/i
    const buttons = page.getByRole('button', { name: pattern })
    // Get the appropriate button (small or large increment)
    const allButtons = await buttons.all()
    const buttonIndex = large ? allButtons.length - 1 : allButtons.length - 2
    if (allButtons[buttonIndex]) {
      await userEvent.click(allButtons[buttonIndex])
    }
  }

  async stepDown(large = false): Promise<void> {
    const pattern = /decrement by/i
    const buttons = page.getByRole('button', { name: pattern })
    const allButtons = await buttons.all()
    const buttonIndex = large ? 0 : 1
    if (allButtons[buttonIndex]) {
      await userEvent.click(allButtons[buttonIndex])
    }
  }

  /**
   * Clicks the Done button to confirm the value.
   */
  async clickDone(): Promise<void> {
    const doneButton = page.getByRole('button', { name: /done/i })
    await userEvent.click(doneButton)
  }

  /**
   * Clicks the Cancel button to discard changes.
   */
  async clickCancel(): Promise<void> {
    const cancelButton = page.getByRole('button', { name: /cancel/i })
    await userEvent.click(cancelButton)
  }

  /**
   * Gets the modal title to verify the type.
   */
  async getTitle(): Promise<string> {
    const title = page.getByRole('heading', { level: 2 })
    const element = await title.element()
    return element.textContent?.trim() ?? ''
  }

  /**
   * Checks if the modal is currently visible.
   */
  isVisible(): boolean {
    const dialog = this.getDialog().query()
    return dialog !== null
  }

  /**
   * Enters a value and confirms with Done.
   */
  async enterValueAndConfirm(value: number): Promise<void> {
    await this.enterValue(value)
    await this.clickDone()
  }
}
