import { page } from 'vitest/browser'
import { expect } from 'vitest'
import type { CommonPO } from './CommonPO'

/**
 * Drives the food-logging sheet: mode tabs over a staging basket, committed
 * in one write. Staging is deliberately separate from committing here --
 * "three foods, one commit" is the behaviour the sheet exists for, and a
 * helper that always did both would make it untestable.
 */
export class FoodLogPO {
  constructor(private common: CommonPO) {}

  get timeline() {
    return page.getByTestId('food-log-timeline')
  }

  get totals() {
    return page.getByTestId('food-log-totals')
  }

  get basket() {
    return page.getByTestId('food-basket-tray')
  }

  get searchResults() {
    return page.getByTestId('food-search-results')
  }

  /** The Open Food Facts section below the library results. */
  get onlineSection() {
    return page.getByTestId('food-search-online')
  }

  get onlineResults() {
    return page.getByTestId('food-search-online-results')
  }

  async openAddFood(): Promise<void> {
    await page.getByRole('button', { name: 'Add food', exact: true }).click()
    await this.common.waitForDialog()
  }

  async selectTab(name: 'Search' | 'Scan' | 'Quick' | 'Custom'): Promise<void> {
    await page.getByRole('button', { name, exact: true }).click()
  }

  async search(query: string): Promise<void> {
    await page.getByLabelText('Search foods').fill(query)
  }

  /** Stages a food already in the library; leaves the sheet open. */
  async stageFood(name: string): Promise<void> {
    await page.getByRole('button', { name: `Add ${name}`, exact: true }).click()
  }

  /** Creates a reusable food and stages it; leaves the sheet open. */
  async stageCustomFood(input: {
    name: string
    grams: string
    calories: string
    protein: string
    carbs: string
    fat: string
    brand?: string
  }): Promise<void> {
    await this.selectTab('Custom')
    await page.getByLabelText('Food name').fill(input.name)
    if (input.brand !== undefined) await page.getByLabelText('Brand (optional)').fill(input.brand)
    await page.getByLabelText('Serving (g)').fill(input.grams)
    await page.getByLabelText('Calories').fill(input.calories)
    await page.getByLabelText('Protein (g)').fill(input.protein)
    await page.getByLabelText('Carbs (g)').fill(input.carbs)
    await page.getByLabelText('Fat (g)').fill(input.fat)
    await page.getByRole('button', { name: 'Create and add' }).click()
  }

  /** Stages macros with no food behind them; leaves the sheet open. */
  async stageQuickAdd(input: {
    calories: string
    protein?: string
    carbs?: string
    fat?: string
  }): Promise<void> {
    await this.selectTab('Quick')
    await page.getByLabelText('Calories').fill(input.calories)
    if (input.protein !== undefined) await page.getByLabelText('Protein (g)').fill(input.protein)
    if (input.carbs !== undefined) await page.getByLabelText('Carbs (g)').fill(input.carbs)
    if (input.fat !== undefined) await page.getByLabelText('Fat (g)').fill(input.fat)
    await page.getByRole('button', { name: 'Add to basket' }).click()
  }

  /** The confirmation panel the scan flow opens before anything is staged. */
  get portionPanel() {
    return page.getByTestId('food-portion-panel')
  }

  /** Fills the amount field on the portion confirmation panel. */
  async setPortionAmount(value: string): Promise<void> {
    await page.getByLabelText('Amount').fill(value)
  }

  /** Switches the portion unit; the labels mirror the toggle buttons. */
  async selectPortionUnit(unit: 'g' | 'serving'): Promise<void> {
    await this.portionPanel.getByRole('button', { name: unit, exact: true }).click()
  }

  /** Confirms the portion panel, staging the food into the basket. */
  async confirmPortion(): Promise<void> {
    await this.portionPanel.getByRole('button', { name: 'Add', exact: true }).click()
  }

  /** Opens a staged item's editor and types an exact gram amount. */
  async setStagedGrams(name: string, grams: string): Promise<void> {
    await page.getByRole('button', { name: `Adjust ${name}`, exact: true }).click()
    await page.getByLabelText('Grams').fill(grams)
  }

  /** Opens the grams stepper for a staged item and taps it `steps` times. */
  async adjustStaged(name: string, steps: number): Promise<void> {
    await page.getByRole('button', { name: `Adjust ${name}`, exact: true }).click()
    const label = steps < 0 ? 'Less' : 'More'
    for (let taken = 0; taken < Math.abs(steps); taken++) {
      await page.getByRole('button', { name: label, exact: true }).click()
    }
  }

  async commitBasket(count: number): Promise<void> {
    await page.getByRole('button', { name: `Log (${count})` }).click()
    await this.common.waitForDialogClose()
  }

  /** Stage one library food and commit it — the common single-item path. */
  async logExistingFood(name: string): Promise<void> {
    await this.stageFood(name)
    await this.commitBasket(1)
  }

  async expectEntry(name: string): Promise<void> {
    await expect.element(this.timeline.getByText(name, { exact: true })).toBeVisible()
  }

  async goToPreviousDay(): Promise<void> {
    await page.getByRole('button', { name: 'Previous day' }).click()
  }

  async goToNextDay(): Promise<void> {
    await page.getByRole('button', { name: 'Next day' }).click()
  }
}
