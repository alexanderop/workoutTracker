import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { startOfDay, subDays } from 'date-fns'
import { db } from '@/db'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createDbCompletedWorkout } from '../factories/dbWorkout.factory'

/**
 * Integration tests for the workout streak card and activity heatmap on Home.
 */
describe('Activity Streak & Heatmap (Home)', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  async function seedWorkoutsOnDays(
    offsetsFromToday: ReadonlyArray<number>,
    workoutsPerDay = 1,
  ): Promise<void> {
    const today = startOfDay(new Date())
    const entries = offsetsFromToday.flatMap((offset) => {
      const day = subDays(today, offset)
      return Array.from({ length: workoutsPerDay }, (_, index) =>
        createDbCompletedWorkout({
          completedAt: day.getTime() + index * 60_000,
          startedAt: day.getTime() - 3_600_000 + index * 60_000,
        }),
      )
    })
    await db.workouts.bulkAdd(entries)
  }

  it('shows a 5 day streak and preserved longest streak', async () => {
    // A 14-day streak ending 30 days ago (longest historical), and current 5 days including today
    const longestOffsets = Array.from({ length: 14 }, (_, index) => 30 + index)
    const currentOffsets = [0, 1, 2, 3, 4]
    await seedWorkoutsOnDays([...longestOffsets, ...currentOffsets])

    const { navigateTo, cleanup } = await createTestApp()
    await navigateTo({ name: RouteNames.History })
    await navigateTo({ name: RouteNames.Home })

    await expect.element(page.getByText('5 day streak')).toBeVisible()
    await expect.element(page.getByText('Longest: 14 days')).toBeVisible()

    cleanup()
  })

  it('still shows a 5 day streak when today has no workout yet', async () => {
    // Workouts on days 1..5 (yesterday to 5 days ago), nothing today
    await seedWorkoutsOnDays([1, 2, 3, 4, 5])

    const { navigateTo, cleanup } = await createTestApp()
    await navigateTo({ name: RouteNames.History })
    await navigateTo({ name: RouteNames.Home })

    await expect.element(page.getByText('5 day streak')).toBeVisible()

    cleanup()
  })

  it('shows start-new-streak prompt when the streak broke but longest remains', async () => {
    // Streak ended 2 days ago: days 2..6 trained, today and yesterday empty
    await seedWorkoutsOnDays([2, 3, 4, 5, 6])

    const { navigateTo, cleanup } = await createTestApp()
    await navigateTo({ name: RouteNames.History })
    await navigateTo({ name: RouteNames.Home })

    await expect.element(page.getByText('Start a new streak')).toBeVisible()
    await expect.element(page.getByText('Longest: 5 days')).toBeVisible()

    cleanup()
  })

  it('renders different intensity cells for heavy vs light days', async () => {
    // 1 workout 5 days ago, 4 workouts 6 days ago
    await seedWorkoutsOnDays([5], 1)
    await seedWorkoutsOnDays([6], 4)

    const { navigateTo, cleanup } = await createTestApp()
    await navigateTo({ name: RouteNames.History })
    await navigateTo({ name: RouteNames.Home })

    await expect.element(page.getByTestId('activity-heatmap')).toBeVisible()

    const lightCells = await page.getByTestId('heatmap-cell-intensity-1').all()
    const heavyCells = await page.getByTestId('heatmap-cell-intensity-4').all()
    expect(lightCells.length).toBeGreaterThan(0)
    expect(heavyCells.length).toBeGreaterThan(0)

    cleanup()
  })

  it('shows empty state with start CTA when user has never trained', async () => {
    const { navigateTo, cleanup } = await createTestApp()
    await navigateTo({ name: RouteNames.History })
    await navigateTo({ name: RouteNames.Home })

    await expect.element(page.getByTestId('activity-heatmap-empty')).toBeVisible()
    await expect
      .element(page.getByTestId('activity-heatmap-empty').getByText('No workouts yet'))
      .toBeVisible()
    await expect
      .element(page.getByRole('button', { name: /start your first workout/i }))
      .toBeVisible()
    // Streak card should be hidden for never-trained users
    expect(await page.getByTestId('streak-card').query()).toBeNull()

    cleanup()
  })
})
