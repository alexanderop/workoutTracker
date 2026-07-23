import { page } from 'vitest/browser'
import type { CommonPO } from './CommonPO'

export type NewFoodInput = {
  name: string
  grams: string
  calories: string
  protein: string
  carbs: string
  fat: string
}

/** Switch the open food dialog from its search surface to the create-food form. */
export async function startCreateFood(): Promise<void> {
  await page.getByRole('button', { name: 'Create a new food' }).click()
}

/** Drive the open food dialog through create mode: fill the form and submit. */
export async function logNewFood(common: CommonPO, input: NewFoodInput): Promise<void> {
  await startCreateFood()
  await page.getByLabelText('Food name').fill(input.name)
  await page.getByLabelText('Serving (g)').fill(input.grams)
  await page.getByLabelText('Calories').fill(input.calories)
  await page.getByLabelText('Protein (g)').fill(input.protein)
  await page.getByLabelText('Carbs (g)').fill(input.carbs)
  await page.getByLabelText('Fat (g)').fill(input.fat)
  await page.getByRole('button', { name: 'Add to diary' }).click()
  await common.waitForDialogClose()
}
