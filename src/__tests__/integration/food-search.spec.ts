import { describe, expect } from 'vitest'
import { page } from 'vitest/browser'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { generateId, getNutritionRepository } from '@/db'
import type { DbFood } from '@/db/schema'
import { getLocalDateKey } from '@/features/nutrition/lib/nutritionCalculations'

function foodFixture(overrides: Partial<DbFood> & { name: string }): DbFood {
  const now = Date.now()
  return {
    id: generateId(),
    brand: null,
    nutrientsPer100Grams: { calories: 264, proteinGrams: 19, carbohydrateGrams: 1, fatGrams: 21 },
    defaultServingName: 'serving',
    defaultServingGrams: 150,
    favorite: false,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
    ...overrides,
  }
}

async function seedLoggedFood(food: DbFood, loggedAt: number): Promise<void> {
  const repository = getNutritionRepository()
  await repository.addFood(food)
  await repository.addDiaryEntry({
    id: generateId(),
    localDate: getLocalDateKey(),
    meal: 'snack',
    foodId: food.id,
    grams: 100,
    foodSnapshot: {
      name: food.name,
      brand: food.brand,
      nutrientsPer100Grams: food.nutrientsPer100Grams,
    },
    loggedAt,
    updatedAt: loggedAt,
  })
}

describe('Food search and quick add', () => {
  it('filters the library as the user types and logs a food with one tap', async ({
    createTestApp,
  }) => {
    const { navigateTo, foodLog } = await createTestApp()
    const repository = getNutritionRepository()
    const feta = foodFixture({ name: 'Feta', brand: 'Salakis' })
    await repository.addFood(feta)
    await repository.addFood(foodFixture({ name: 'Oats' }))

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()

    const search = page.getByLabelText('Search for a food')
    await search.fill('fet')
    await expect.element(page.getByRole('button', { name: 'Log Feta' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Log Oats' })).not.toBeInTheDocument()

    await page.getByRole('button', { name: 'Log Feta' }).click()
    await expect
      .poll(async () => getNutritionRepository().observeDay(getLocalDateKey()).get())
      .toMatchObject({
        diaryEntries: [{ foodId: feta.id, grams: 150, foodSnapshot: { name: 'Feta' } }],
      })
    // The surface stays open so more foods can be logged in one visit.
    await expect.element(search).toBeVisible()
  })

  it('shows the latest section and toggles favorites from a row', async ({ createTestApp }) => {
    const { navigateTo, foodLog } = await createTestApp()
    // Logged 3 hours ago: recent enough for "Latest", outside the time-picks window.
    await seedLoggedFood(foodFixture({ name: 'Feta' }), Date.now() - 3 * 60 * 60 * 1000)

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()

    const latest = page.getByTestId('food-section-latest')
    await expect.element(latest.getByText('Feta', { exact: true })).toBeVisible()
    await expect.element(page.getByTestId('food-section-favorites')).not.toBeInTheDocument()

    await latest.getByRole('button', { name: 'Favorite Feta' }).click()
    const favorites = page.getByTestId('food-section-favorites')
    await expect.element(favorites.getByText('Feta', { exact: true })).toBeVisible()

    await favorites.getByRole('button', { name: 'Unfavorite Feta' }).click()
    await expect.element(page.getByTestId('food-section-favorites')).not.toBeInTheDocument()
  })

  it('suggests foods logged around the current time of day', async ({ createTestApp }) => {
    const { navigateTo, foodLog } = await createTestApp()
    await seedLoggedFood(foodFixture({ name: 'Feta' }), Date.now())

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()

    await expect
      .element(page.getByTestId('food-section-picks').getByText('Feta', { exact: true }))
      .toBeVisible()
  })

  it('offers to create a new food when nothing matches the search', async ({ createTestApp }) => {
    const { navigateTo, foodLog } = await createTestApp()

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()

    await page.getByLabelText('Search for a food').fill('Dragonfruit')
    await expect.element(page.getByText('No foods match your search.')).toBeVisible()

    await page.getByRole('button', { name: "Create 'Dragonfruit'" }).click()
    await expect.element(page.getByLabelText('Food name')).toHaveValue('Dragonfruit')
  })

  it('lets the user adjust the portion before logging via the food row', async ({
    createTestApp,
  }) => {
    const { navigateTo, foodLog } = await createTestApp()
    const feta = foodFixture({ name: 'Feta' })
    await getNutritionRepository().addFood(feta)

    await navigateTo({ name: RouteNames.FoodLog })
    await foodLog.openAddFood()

    await page.getByLabelText('Search for a food').fill('Feta')
    await page.getByText('Feta', { exact: true }).click()

    await expect.element(page.getByLabelText('Serving (g)')).toHaveValue(150)
    await page.getByLabelText('Serving (g)').fill('80')
    await page.getByRole('button', { name: 'Add to diary' }).click()

    await expect
      .poll(async () => getNutritionRepository().observeDay(getLocalDateKey()).get())
      .toMatchObject({
        diaryEntries: [{ foodId: feta.id, grams: 80 }],
      })
  })
})
