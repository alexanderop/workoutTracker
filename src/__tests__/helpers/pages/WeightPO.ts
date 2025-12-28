import { page, userEvent } from 'vitest/browser'
import { expect } from 'vitest'
import type { CommonPO } from './CommonPO'

/**
 * Page Object for the weight tracking view.
 * Provides methods to add, view, and delete weight entries.
 */
export class WeightPO {
  constructor(private common: CommonPO) {}

  /**
   * Navigates to the weight view.
   */
  async navigateTo(): Promise<void> {
    await page.getByRole('button', { name: /weight/i }).click()
    await this.common.waitForRoute(/^\/weight$/)
  }

  /**
   * Enters a weight value in the input field.
   * @param value - The weight value to enter
   */
  async enterWeight(value: string): Promise<void> {
    const input = page.getByRole('spinbutton', { name: /weight/i })
    await userEvent.clear(input)
    await userEvent.fill(input, value)
  }

  /**
   * Clicks the save button to save the current weight entry.
   */
  async clickSave(): Promise<void> {
    const saveButton = page.getByRole('button', { name: /save/i })
    await userEvent.click(saveButton)
  }

  /**
   * Convenience method to add a weight entry.
   * Enters the weight and saves it.
   * @param weight - The weight value to add
   */
  async addEntry(weight: string): Promise<void> {
    await this.enterWeight(weight)
    await this.clickSave()
  }

  /**
   * Selects a time range tab for the chart.
   * @param range - The time range to select
   */
  async selectTimeRange(range: '7D' | '30D' | '90D' | 'All'): Promise<void> {
    const tab = page.getByRole('tab', { name: range })
    await userEvent.click(tab)
  }

  /**
   * Gets a weight entry from the history list.
   * @param weight - The weight value to find (e.g. "75.5 kg")
   */
  getHistoryEntry(weight: string) {
    return page.getByText(weight)
  }

  /**
   * Waits for the stats card to display the current weight.
   * @param weight - The expected weight value
   */
  async expectCurrentWeight(weight: string): Promise<void> {
    await expect.element(page.getByText(weight)).toBeVisible()
  }

  /**
   * Clicks the delete button for a weight entry by index.
   * Does NOT confirm the deletion - use confirmDelete() after.
   * @param index - The index of the entry (0 = most recent)
   */
  async clickDeleteButton(index: number = 0): Promise<void> {
    const deleteButtons = page.getByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons.nth(index))
    await this.common.waitForDialog()
  }

  /**
   * Confirms the delete action in the confirmation dialog.
   */
  async confirmDelete(): Promise<void> {
    await userEvent.click(this.common.getDialogButton('Delete'))
    await this.common.waitForDialogClose()
  }

  /**
   * Cancels the delete action in the confirmation dialog.
   */
  async cancelDelete(): Promise<void> {
    const cancelButton = page.getByRole('button', { name: /cancel/i })
    await userEvent.click(cancelButton)
    await this.common.waitForDialogClose()
  }

  /**
   * Gets the empty state message locator.
   */
  getEmptyState() {
    return page.getByText(/start tracking/i)
  }

  /**
   * Gets the "no entries" message locator.
   */
  getNoEntriesMessage() {
    return page.getByText(/no weight entries/i)
  }

  /**
   * Gets the chart container locator.
   */
  getChart() {
    return page.getByRole('region', { name: /trend/i })
  }
}
