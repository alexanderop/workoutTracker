import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { seedCompletedWorkout } from '../helpers/dbAssertions'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories'

/**
 * UX review finding M1: `/history` was a real route with a clean empty state,
 * but nothing on Home linked to it — the "Recent Workouts" header wasn't a
 * link, and the button that did exist was hidden whenever the list was empty
 * (see src/components/RecentWorkoutsSection.vue). Only reachable by typing
 * the URL directly.
 *
 * Fix: the "View all" link is now always rendered, so History is reachable
 * from Home regardless of whether any workouts exist yet.
 */
describe('Home Recent Workouts View All Link', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('links to history even when there are no recent workouts', async () => {
    const { router, cleanup } = await createTestApp()

    // Confirm we're looking at the empty state, not a loading flash
    await expect.element(page.getByText(/no workouts yet/i)).toBeVisible()

    const viewAllLink = page.getByRole('button', { name: /view all/i })
    await expect.element(viewAllLink).toBeVisible()

    await userEvent.click(viewAllLink)
    await expect.poll(() => router.currentRoute.value.name).toBe(RouteNames.History)

    cleanup()
  })

  it('links to history when recent workouts exist', async () => {
    const workout = databaseWorkoutBuilder().withName('Morning Workout').withStrengthBlock().build()
    await seedCompletedWorkout(workout)

    const { router, cleanup } = await createTestApp()
    await expect.element(page.getByText('Morning Workout')).toBeVisible()

    const viewAllLink = page.getByRole('button', { name: /view all/i })
    await expect.element(viewAllLink).toBeVisible()

    await userEvent.click(viewAllLink)
    await expect.poll(() => router.currentRoute.value.name).toBe(RouteNames.History)

    cleanup()
  })
})
