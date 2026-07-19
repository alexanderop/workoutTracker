import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { getNutritionRepository } from '@/db'
import { getLocalDateKey } from '@/features/nutrition/lib/nutritionCalculations'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Nutrition dashboard', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('logs a reusable food, updates daily totals, and persists across navigation', async () => {
    const { navigateTo, nutrition, cleanup } = await createTestApp()

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

    cleanup()
  })
})
