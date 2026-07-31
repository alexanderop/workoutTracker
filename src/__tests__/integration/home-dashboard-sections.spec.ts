import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { generateId, getWeightRepository } from '@/db'

const DAY_MS = 24 * 60 * 60 * 1000

async function seedWeightEntry(daysAgo: number, weight: number, bodyFatPct?: number) {
  await getWeightRepository().add({
    id: generateId(),
    weight,
    date: Date.now() - daysAgo * DAY_MS,
    recordedAt: Date.now() - daysAgo * DAY_MS,
    ...(bodyFatPct !== undefined && { bodyFatPct }),
  })
}

describe('Home dashboard sections', () => {
  it('renders the section headers and opens the food log from the calories tile', async ({
    createTestApp,
  }) => {
    const { router } = await createTestApp()

    await expect.element(page.getByRole('heading', { name: 'Insights & Analytics' })).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'Body Metrics' })).toBeVisible()

    await userEvent.click(page.getByRole('button', { name: /^Calories/ }))
    await expect.poll(() => router.currentRoute.value.name).toBe(RouteNames.FoodLog)
  })

  it('shows the latest weight and body fat in the Body Metrics tiles', async ({
    createTestApp,
  }) => {
    await seedWeightEntry(2, 83, 26)
    await seedWeightEntry(1, 82.5, 25.4)
    await seedWeightEntry(0, 82.1, 25)

    await createTestApp()

    const scaleTile = page.getByRole('button', { name: /^Scale Weight/ })
    await expect.element(scaleTile.getByText('82.1')).toBeVisible()

    const bodyFatTile = page.getByRole('button', { name: /^Body Fat/ })
    await expect.element(bodyFatTile.getByText('25.0')).toBeVisible()
  })

  it('opens the weight page from the Body Metrics See All link', async ({ createTestApp }) => {
    const { router } = await createTestApp()

    await userEvent.click(page.getByRole('button', { name: 'See all body metrics' }))
    await expect.poll(() => router.currentRoute.value.name).toBe(RouteNames.Weight)
  })

  it('shows a hint instead of a sparkline when a tile has no trend yet', async ({
    createTestApp,
  }) => {
    await createTestApp()

    await expect
      .element(page.getByRole('button', { name: /^Calories/ }).getByText('Not enough data yet'))
      .toBeVisible()
  })
})
