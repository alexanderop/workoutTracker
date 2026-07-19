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

  async expectFood(name: string): Promise<void> {
    await expect.element(this.dashboard.getByText(name)).toBeVisible()
  }
}
