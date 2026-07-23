import { page } from 'vitest/browser'
import { expect } from 'vitest'
import type { CommonPO } from './CommonPO'
import { logNewFood, type NewFoodInput } from './foodDialog'

export class NutritionDashboardPO {
  constructor(private common: CommonPO) {}

  get dashboard() {
    return page.getByTestId('nutrition-dashboard')
  }

  async openMeal(meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'): Promise<void> {
    await this.dashboard.getByRole('button', { name: new RegExp(`^${meal}`) }).click()
    await this.common.waitForDialog()
  }

  async logNewFood(input: NewFoodInput): Promise<void> {
    await logNewFood(this.common, input)
  }

  async expectFood(name: string): Promise<void> {
    await expect.element(this.dashboard.getByText(name, { exact: true })).toBeVisible()
  }
}
