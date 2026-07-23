import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { getNutritionRepository } from '@/db'
import { getLocalDateKey } from '@/features/nutrition/lib/nutritionCalculations'

describe('Nutrition dashboard', () => {
  it('logs a reusable food, updates daily totals, and persists across navigation', async ({
    createTestApp,
  }) => {
    const { navigateTo, nutrition } = await createTestApp()

    await expect.element(nutrition.dashboard).toBeVisible()
    await nutrition.openMeal('Breakfast')
    await nutrition.logNewFood({
      name: 'Greek yogurt',
      grams: '200',
      calories: '180',
      protein: '20',
      carbs: '12',
      fat: '4',
    })

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

  it('computes the calorie goal from macro grams and saves the derived total', async ({
    createTestApp,
  }) => {
    const { nutrition } = await createTestApp()

    await nutrition.openGoals()
    await nutrition.setGoalMacroGrams({ protein: '200', carbs: '240', fat: '70' })
    await nutrition.expectGoalCalories(2390)
    await nutrition.saveGoals()

    await expect
      .poll(async () => getNutritionRepository().observeDay(getLocalDateKey()).get())
      .toMatchObject({
        goal: { calories: 2390, proteinGrams: 200, carbohydrateGrams: 240, fatGrams: 70 },
      })
  })

  it('converts a percentage split of calories into macro gram goals', async ({ createTestApp }) => {
    const { nutrition } = await createTestApp()

    await nutrition.openGoals()
    await nutrition.switchGoalsMode('%')
    await nutrition.setGoalPercents({ calories: '2600', protein: '50', carbs: '30', fat: '20' })
    await nutrition.saveGoals()

    await expect
      .poll(async () => getNutritionRepository().observeDay(getLocalDateKey()).get())
      .toMatchObject({
        goal: { calories: 2600, proteinGrams: 325, carbohydrateGrams: 195, fatGrams: 58 },
      })
  })
})
