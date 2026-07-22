import { page } from 'vitest/browser'
import { expect } from 'vitest'
import type { CommonPO } from './CommonPO'

export class FoodLogPO {
  constructor(private common: CommonPO) {}

  get timeline() {
    return page.getByTestId('food-log-timeline')
  }

  get totals() {
    return page.getByTestId('food-log-totals')
  }

  async openAddFood(): Promise<void> {
    await page.getByRole('button', { name: 'Add food', exact: true }).click()
    await this.common.waitForDialog()
  }

  async logNewFood(input: {
    name: string
    grams: string
    calories: string
    protein: string
    carbs: string
    fat: string
  }): Promise<void> {
    await page.getByLabelText('Food name').fill(input.name)
    await page.getByLabelText('Serving (g)').fill(input.grams)
    await page.getByLabelText('Calories').fill(input.calories)
    await page.getByLabelText('Protein (g)').fill(input.protein)
    await page.getByLabelText('Carbs (g)').fill(input.carbs)
    await page.getByLabelText('Fat (g)').fill(input.fat)
    await page.getByRole('button', { name: 'Add to diary' }).click()
    await this.common.waitForDialogClose()
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
