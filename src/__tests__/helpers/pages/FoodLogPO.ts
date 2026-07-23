import { page } from 'vitest/browser'
import { expect } from 'vitest'
import type { CommonPO } from './CommonPO'
import { logNewFood, type NewFoodInput } from './foodDialog'

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

  async logNewFood(input: NewFoodInput): Promise<void> {
    await logNewFood(this.common, input)
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
