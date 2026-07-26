import { describe, expect } from 'vitest'
import { page } from 'vitest/browser'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { getNutritionRepository } from '@/db'
import { getLocalDateKey } from '@/features/nutrition/lib/nutritionCalculations'

describe('Food log page', () => {
  it('logs a custom food onto the timeline and updates the daily totals', async ({
    createTestApp,
  }) => {
    const { navigateTo, foodLog } = await createTestApp()

    await navigateTo({ name: RouteNames.FoodLog })
    await expect.element(foodLog.timeline).toBeVisible()
    await expect.element(page.getByText('Today', { exact: true })).toBeVisible()

    await foodLog.openAddFood()
    await foodLog.stageCustomFood({
      name: 'Banana',
      grams: '120',
      calories: '107',
      protein: '1.3',
      carbs: '27',
      fat: '0.4',
    })
    await foodLog.commitBasket(1)

    await foodLog.expectEntry('Banana')
    await expect.element(foodLog.totals.getByText('107')).toBeVisible()
    await expect
      .poll(async () => getNutritionRepository().observeDay(getLocalDateKey()).get())
      .toMatchObject({
        diaryEntries: [{ grams: 120, foodSnapshot: { name: 'Banana' } }],
      })
  })

  it('stages three foods across modes and commits them in one go', async ({ createTestApp }) => {
    const { navigateTo, foodLog } = await createTestApp()

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()

    // A custom food seeds the library, so the second helping can be staged
    // with a single tap and no keyboard at all.
    await foodLog.stageCustomFood({
      name: 'Skyr',
      grams: '200',
      calories: '120',
      protein: '22',
      carbs: '7',
      fat: '0.5',
    })
    await foodLog.stageQuickAdd({ calories: '650', protein: '45' })
    await expect.element(foodLog.basket.getByText('Skyr')).toBeVisible()
    await expect.element(foodLog.basket.getByText('Quick entry')).toBeVisible()

    await foodLog.commitBasket(2)

    await foodLog.expectEntry('Skyr')
    await foodLog.expectEntry('Quick entry')
    const snapshot = await getNutritionRepository().observeDay(getLocalDateKey()).get()
    expect(snapshot.diaryEntries).toHaveLength(2)
    // The quick add contributes macros without ever entering the library.
    expect(snapshot.diaryEntries.map((entry) => entry.foodId).filter((id) => id === null)).toEqual([
      null,
    ])
    expect(snapshot.foods.map((food) => food.name)).toEqual(['Skyr'])
  })

  it('finds a library food by search and stages it with one tap', async ({ createTestApp }) => {
    const { navigateTo, foodLog } = await createTestApp()

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()
    await foodLog.stageCustomFood({
      name: 'Hafermilch',
      grams: '250',
      calories: '115',
      protein: '2.5',
      carbs: '17',
      fat: '3.5',
    })
    await foodLog.commitBasket(1)

    await foodLog.openAddFood()
    await foodLog.search('hafer')
    await expect.element(foodLog.searchResults.getByText('Hafermilch')).toBeVisible()
    await foodLog.stageFood('Hafermilch')
    await foodLog.commitBasket(1)

    await expect
      .poll(async () => {
        const snapshot = await getNutritionRepository().observeDay(getLocalDateKey()).get()
        return snapshot.diaryEntries.length
      })
      .toBe(2)
  })

  it('keeps the basket when the sheet is closed and reopened', async ({ createTestApp }) => {
    const { navigateTo, foodLog, common } = await createTestApp()

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()
    await foodLog.stageQuickAdd({ calories: '300' })
    await expect.element(foodLog.basket.getByText('Quick entry')).toBeVisible()

    await page.getByRole('button', { name: 'Close', exact: true }).click()
    await common.waitForDialogClose()
    await foodLog.openAddFood()

    await expect.element(foodLog.basket.getByText('Quick entry')).toBeVisible()
  })

  it('adjusts a staged food with the grams stepper, no keyboard', async ({ createTestApp }) => {
    const { navigateTo, foodLog } = await createTestApp()

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()
    await foodLog.stageCustomFood({
      name: 'Reis',
      grams: '100',
      calories: '130',
      protein: '2.7',
      carbs: '28',
      fat: '0.3',
    })

    await foodLog.adjustStaged('Reis', 3)
    await foodLog.commitBasket(1)

    await expect
      .poll(async () => getNutritionRepository().observeDay(getLocalDateKey()).get())
      .toMatchObject({ diaryEntries: [{ grams: 130 }] })
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
    await foodLog.stageCustomFood({
      name: 'Skyr',
      grams: '400',
      calories: '240',
      protein: '44',
      carbs: '14',
      fat: '1',
    })
    await foodLog.commitBasket(1)
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
