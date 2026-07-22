import { describe, expect } from 'vitest'
import { page } from 'vitest/browser'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { getNutritionRepository } from '@/db'
import { getLocalDateKey } from '@/features/nutrition/lib/nutritionCalculations'

describe('Food log page', () => {
  it('logs a food onto the timeline and updates the daily totals', async ({ createTestApp }) => {
    const { navigateTo, foodLog } = await createTestApp()

    await navigateTo({ name: RouteNames.FoodLog })
    await expect.element(foodLog.timeline).toBeVisible()
    await expect.element(page.getByText('Today', { exact: true })).toBeVisible()

    await foodLog.openAddFood()
    await foodLog.logNewFood({
      name: 'Banana',
      grams: '120',
      calories: '107',
      protein: '1.3',
      carbs: '27',
      fat: '0.4',
    })

    await foodLog.expectEntry('Banana')
    await expect.element(foodLog.totals.getByText('107')).toBeVisible()
    await expect
      .poll(async () => getNutritionRepository().observeDay(getLocalDateKey()).get())
      .toMatchObject({
        diaryEntries: [{ grams: 120, foodSnapshot: { name: 'Banana' } }],
      })
  })

  it('reaches the food log from the quick-add sheet and the nutrition card', async ({
    createTestApp,
  }) => {
    const { navigateTo, foodLog, common } = await createTestApp()

    await page.getByRole('button', { name: 'Quick add' }).click()
    await common.waitForDialog()
    await page.getByRole('button', { name: 'Food Log' }).click()
    await expect.element(foodLog.timeline).toBeVisible()

    await navigateTo({ name: RouteNames.Home })
    await page.getByRole('button', { name: 'Open food log' }).click()
    await expect.element(foodLog.timeline).toBeVisible()
  })

  it('navigates between days and keeps entries scoped to their day', async ({ createTestApp }) => {
    const { navigateTo, foodLog } = await createTestApp()

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()
    await foodLog.logNewFood({
      name: 'Skyr',
      grams: '400',
      calories: '240',
      protein: '44',
      carbs: '14',
      fat: '1',
    })
    await foodLog.expectEntry('Skyr')

    await foodLog.goToPreviousDay()
    await expect.element(page.getByText('Nothing logged', { exact: false })).toBeVisible()
    await expect
      .element(foodLog.timeline.getByText('Skyr', { exact: true }))
      .not.toBeInTheDocument()

    await foodLog.goToNextDay()
    await foodLog.expectEntry('Skyr')
  })
})
