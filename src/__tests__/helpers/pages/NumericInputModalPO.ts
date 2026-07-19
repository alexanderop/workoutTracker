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
   * Gets the current displayed value from the value display.
   */
  async getCurrentValue(): Promise<number> {
    const valueDisplay = page.getByRole('status', { name: /current value/i })
    const element = await valueDisplay.findElement()
    const text = element.textContent ?? '0'
    // Remove any unit suffix (e.g., "100 kg" -> "100")
    const numericPart = text.trim().split(/\s/, 1)[0] ?? ''
    return numericPart ? Number.parseFloat(numericPart) : 0
  }

  /**
   * Selects a preset value by clicking on it.
   */
  async selectPreset(value: number): Promise<void> {
    const presetButton = page.getByRole('option', { name: new RegExp(`^${value}`) })
    await userEvent.click(presetButton)
  }

  /**
   * Gets the decimal button locator.
   */
  getDecimalButton() {
    return page.getByRole('button', { name: /add decimal point/i })
  }

  /**
   * Clicks the decimal button.
   */
  async clickDecimal(): Promise<void> {
    const button = this.getDecimalButton()
    await userEvent.click(button)
  }

  /**
   * Checks if the decimal button is visible.
   */
  isDecimalButtonVisible(): boolean {
    const button = this.getDecimalButton().query()
    return button !== null
  }

  /**
   * Gets the decimal separator character displayed on the decimal button.
   */
  async getDecimalSeparator(): Promise<string> {
    const button = this.getDecimalButton()
    const element = await button.findElement()
    return element.textContent?.trim() ?? ''
  }

  /**
   * Enters a value using the numeric keypad.
   * Clears the current value first, then types the new value.
   * Supports decimals by clicking the decimal button when '.' is encountered.
   */
  async enterValue(value: number): Promise<void> {
    // Clear current value by clicking backspace multiple times
    const backspaceButton = page.getByRole('button', { name: /backspace/i })
    for (let index = 0; index < 5; index++) {
      await userEvent.click(backspaceButton)
    }

    // Type each digit, handling decimals
    const digits = [...String(value)]
    for (const digit of digits) {
      if (digit === '.') {
        // Click decimal button
        await this.clickDecimal()
        continue
      }
      const digitButton = page.getByRole('button', { name: new RegExp(`^${digit}$`) })
      await userEvent.click(digitButton)
    }
  }

  /**
   * Clicks the Confirm button (checkmark) to confirm the value.
   */
  async clickConfirm(): Promise<void> {
    const confirmButton = page.getByRole('button', { name: /confirm value/i })
    await userEvent.click(confirmButton)
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
    const element = await title.findElement()
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
   * Enters a value and confirms.
   */
  async enterValueAndConfirm(value: number): Promise<void> {
    await this.enterValue(value)
    await this.clickConfirm()
  }
}
