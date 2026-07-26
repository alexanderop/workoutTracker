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
