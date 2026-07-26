import { page } from 'vitest/browser'
import { expect } from 'vitest'
import type { CommonPO } from './CommonPO'

export class NutritionDashboardPO {
  constructor(private common: CommonPO) {}

  get dashboard() {
    return page.getByTestId('nutrition-dashboard')
  }

  async openMeal(meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'): Promise<void> {
    await this.dashboard.getByRole('button', { name: new RegExp(`^${meal}`) }).click()
    await this.common.waitForDialog()
  }

  // Logging itself lives on FoodLogPO: both entry points open the same sheet,
  // and a second copy of those steps here would drift from it.

  async expectFood(name: string): Promise<void> {
    await expect.element(this.dashboard.getByText(name, { exact: true })).toBeVisible()
  }
}
