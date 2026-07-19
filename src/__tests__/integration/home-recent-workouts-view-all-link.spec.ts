import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { seedCompletedWorkout } from '../helpers/dbAssertions'
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
  it('links to history even when there are no recent workouts', async ({ createTestApp }) => {
    const { router } = await createTestApp()

    // Confirm we're looking at the empty state, not a loading flash
    await expect.element(page.getByText(/no workouts yet/i)).toBeVisible()

    // Exact match: the Habits home card added below Recent Workouts also has
    // its own "View all" link (accessible name "View all habits"), so an
    // unanchored /view all/i regex now matches two buttons on this page.
    const viewAllLink = page.getByRole('button', { name: 'View all', exact: true })
    await expect.element(viewAllLink).toBeVisible()

    await userEvent.click(viewAllLink)
    await expect.poll(() => router.currentRoute.value.name).toBe(RouteNames.History)
  })

  it('links to history when recent workouts exist', async ({ createTestApp }) => {
    const workout = databaseWorkoutBuilder().withName('Morning Workout').withStrengthBlock().build()
    await seedCompletedWorkout(workout)

    const { router } = await createTestApp()
    await expect.element(page.getByText('Morning Workout')).toBeVisible()

    // Exact match: the Habits home card added below Recent Workouts also has
    // its own "View all" link (accessible name "View all habits"), so an
    // unanchored /view all/i regex now matches two buttons on this page.
    const viewAllLink = page.getByRole('button', { name: 'View all', exact: true })
    await expect.element(viewAllLink).toBeVisible()

    await userEvent.click(viewAllLink)
    await expect.poll(() => router.currentRoute.value.name).toBe(RouteNames.History)
  })
})
