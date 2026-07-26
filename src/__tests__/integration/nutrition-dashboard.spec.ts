import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { getNutritionRepository } from '@/db'
import { getLocalDateKey } from '@/features/nutrition/lib/nutritionCalculations'

describe('Nutrition dashboard', () => {
  it('logs a reusable food, updates daily totals, and persists across navigation', async ({
    createTestApp,
  }) => {
    const { navigateTo, nutrition, foodLog } = await createTestApp()

    await expect.element(nutrition.dashboard).toBeVisible()
    await nutrition.openMeal('Breakfast')
    await foodLog.stageCustomFood({
      name: 'Greek yogurt',
      grams: '200',
      calories: '180',
      protein: '20',
      carbs: '12',
      fat: '4',
    })
    await foodLog.commitBasket(1)

    await nutrition.expectFood('Greek yogurt')
    await expect
      .poll(async () => getNutritionRepository().observeDay(getLocalDateKey()).get())
      .toMatchObject({
        foods: [{ name: 'Greek yogurt', defaultServingGrams: 200 }],
        diaryEntries: [{ meal: 'breakfast', grams: 200 }],
      })

    await navigateTo({ name: RouteNames.Settings })
    await navigateTo({ name: RouteNames.Home })
    await nutrition.expectFood('Greek yogurt')
  })

  it('shows how far past the calorie goal the day went, not a saturated ring', async ({
    createTestApp,
  }) => {
    const { nutrition, foodLog } = await createTestApp()

    await expect.element(nutrition.dashboard).toBeVisible()
    // The starter goal is 2200 kcal; 2500 puts the day 300 over.
    await nutrition.openMeal('Dinner')
    await foodLog.stageCustomFood({
      name: 'Feast',
      grams: '800',
      calories: '2500',
      protein: '90',
      carbs: '250',
      fat: '90',
    })
    await foodLog.commitBasket(1)

    await expect.element(nutrition.dashboard.getByText('kcal over')).toBeVisible()
    await expect.element(nutrition.dashboard.getByText('300', { exact: true })).toBeVisible()
    await expect.element(nutrition.dashboard.getByText('kcal left')).not.toBeInTheDocument()
  })
})
