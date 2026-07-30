import { page, userEvent } from 'vitest/browser'
import { expect } from 'vitest'
import type { CommonPO } from './CommonPO'

/**
 * Page Object for the weight tracking view and the Scale Weight bottom sheet.
 * Provides methods to open the sheet, add/view/delete weight entries, and
 * navigate its embedded date picker.
 */
export class WeightPO {
  constructor(private common: CommonPO) {}

  /**
   * Navigates to the weight view through the quick-add sheet (the Weight
   * nav tab moved there when the center "+" button arrived).
   */
  async navigateTo(): Promise<void> {
    await this.common.openQuickAddSheet()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /weight history/i })
      .click()
    await this.common.waitForRoute(/^\/weight$/)
    await this.common.waitForDialogClose()
  }

  /**
   * Opens the Scale Weight sheet from the WeightView page's "Log weight" button.
   */
  async openSheet(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: 'Log weight', exact: true }))
    await this.common.waitForDialog()
  }

  /**
   * Enters a weight value in the sheet's Weight input.
   * @param value - The weight value to enter
   */
  async enterWeight(value: string): Promise<void> {
    const input = page.getByLabelText('Weight', { exact: true })
    await userEvent.fill(input, value)
  }

  /**
   * Enters a body fat percentage in the sheet's Body Fat input.
   * @param value - The body fat value to enter
   */
  async enterBodyFat(value: string): Promise<void> {
    const input = page.getByLabelText('Body Fat', { exact: true })
    await userEvent.fill(input, value)
  }

  /**
   * Clicks the sheet's Save button.
   */
  async clickSave(): Promise<void> {
    const saveButton = page.getByRole('button', { name: 'Save', exact: true })
    await userEvent.click(saveButton)
  }

  /**
   * Convenience method to add a weight entry through the Scale Weight sheet:
   * opens the sheet, enters the weight, and saves. Save either closes the
   * sheet immediately, or -- when the value deviates sharply from the
   * previous entry -- leaves it open with the outlier confirmation banner,
   * so this waits for either outcome rather than assuming the sheet always
   * closes. Callers driving the outlier flow inspect
   * `getOutlierConfirmBanner()` themselves afterward.
   * @param weight - The weight value to add
   */
  async addEntry(weight: string): Promise<void> {
    await this.openSheet()
    await this.enterWeight(weight)
    await this.clickSave()
    await expect
      .poll(() => !this.common.isDialogOpen() || this.getOutlierConfirmBanner().query() !== null)
      .toBe(true)
  }

  /**
   * Opens the sheet's calendar view by tapping the date label.
   */
  async openDatePicker(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: 'Change date' }))
    await expect.element(page.getByRole('group', { name: 'Select a date' })).toBeVisible()
  }

  /**
   * Finds a visible (current-month) calendar day cell by its day-of-month
   * number.
   * @param dayOfMonth - The day number to find (e.g. 15)
   */
  private findVisibleDayCell(dayOfMonth: number): HTMLElement {
    const selector = '[data-slot="calendar-cell-trigger"]:not([data-outside-view])'
    // eslint-disable-next-line no-restricted-syntax -- calendar day cells have no distinct accessible name to query by; `data-slot` plus the frozen `data-outside-view` attribute (set by reka-ui's CalendarCellTrigger, see WeightLogCalendar.vue) target the current month's cell without reconstructing the locale-formatted label
    const cells = [...document.querySelectorAll<HTMLElement>(selector)]
    const cell = cells.find((element) => element.textContent?.trim() === String(dayOfMonth))
    if (!cell) {
      throw new Error(`No visible calendar day cell found for day ${dayOfMonth}`)
    }
    return cell
  }

  /**
   * Clicks a day cell in the visible calendar month. Selectable days return
   * to the entry form for that date; days after today are disabled and
   * clicking them has no effect (the calendar stays open).
   * @param dayOfMonth - The day number to click (e.g. 15)
   */
  async pickDay(dayOfMonth: number): Promise<void> {
    this.findVisibleDayCell(dayOfMonth).click()
  }

  /**
   * Navigates the calendar to the previous month.
   */
  async goToPreviousMonth(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: 'Previous month' }))
  }

  /**
   * Selects today's date from the calendar and returns to the entry form.
   */
  async goToToday(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: 'Go to Today' }))
  }

  /**
   * Returns to the entry form from the calendar without changing the
   * selected date.
   */
  async goBackFromCalendar(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: 'Go Back' }))
  }

  /**
   * Deletes the entry for the currently selected date via the sheet's trash
   * button. Only enabled when an entry exists for that date.
   */
  async deleteSelectedDateEntry(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: 'Delete entry' }))
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

  /**
   * Gets the outlier confirmation banner shown when a new entry deviates
   * wildly from the previous one.
   */
  getOutlierConfirmBanner() {
    return page.getByRole('alert')
  }

  /**
   * Confirms saving an entry flagged as an outlier ("Save anyway").
   */
  async confirmOutlierSave(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: /save anyway/i }))
  }

  /**
   * Cancels saving an entry flagged as an outlier.
   */
  async cancelOutlierSave(): Promise<void> {
    await userEvent.click(page.getByRole('alert').getByRole('button', { name: /cancel/i }))
  }
}
