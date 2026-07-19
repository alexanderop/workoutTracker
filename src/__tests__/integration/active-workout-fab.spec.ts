import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'

const getActiveFab = () => page.getByRole('button', { name: /return to active workout/i })

describe('Active Workout FAB', () => {
  describe('Visibility', () => {
    it('hides FAB on ActiveWorkout page', async ({ createTestApp }) => {
      const { builder, workout, common } = await createTestApp()

      // Start a workout
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()
      await builder.startWorkout()

      // Wait for active mode to fully render
      await workout.waitForTableVisible()

      // Verify FAB is NOT visible on active workout page
      await expect.element(getActiveFab()).not.toBeInTheDocument()
    })

    it('shows FAB on multiple pages when workout is active', async ({ createTestApp }) => {
      const { builder, common, navigateTo } = await createTestApp()

      // Start a workout
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()
      await builder.startWorkout()

      // Wait for active mode, then navigate away via router (more reliable than UI)
      await expect.element(page.getByRole('table')).toBeVisible()
      await navigateTo({ name: RouteNames.Exercises })

      // FAB should be visible on exercises page
      await expect.element(getActiveFab()).toBeInViewport({ ratio: 1 })

      // Check FAB on Settings page
      await navigateTo({ name: RouteNames.Settings })
      await expect.element(getActiveFab()).toBeVisible()

      // Check FAB on Workouts (history) page
      await navigateTo({ name: RouteNames.Workouts })
      await expect.element(getActiveFab()).toBeVisible()
    })
  })

  describe('Timer Display', () => {
    it('displays elapsed time in correct format', async ({ createTestApp }) => {
      const { builder, common, navigateTo } = await createTestApp()

      // Start a workout
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()
      await builder.startWorkout()

      // Wait for active mode, then navigate away via router
      await expect.element(page.getByRole('table')).toBeVisible()
      await navigateTo({ name: RouteNames.Exercises })

      // Verify FAB shows time in m:ss format
      const fab = getActiveFab()
      await expect.element(fab).toBeVisible()

      // Check timer format (should be like "0:XX" at start)
      await expect
        .poll(async () => {
          const fabElement = await fab.element()
          const timerText = fabElement.textContent?.trim()
          // Timer format: m:ss or mm:ss (e.g., "0:05", "1:30", "12:45")
          return timerText?.match(/^\d+:\d{2}$/) !== null
        })
        .toBe(true)
    })
  })

  describe('Navigation', () => {
    it('navigates back to active workout when clicked', async ({ createTestApp }) => {
      const { builder, common, navigateTo, router } = await createTestApp()

      // Start a workout
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()
      await builder.startWorkout()

      // Wait for active mode, then navigate away via router
      await expect.element(page.getByRole('table')).toBeVisible()
      await navigateTo({ name: RouteNames.Exercises })
      expect(router.currentRoute.value.name).toBe(RouteNames.Exercises)

      // Click FAB to return to workout
      await userEvent.click(getActiveFab())

      // Should navigate back to active workout
      await expect.poll(() => router.currentRoute.value.path).toBe('/workout/active')

      // Should be in active mode (table visible)
      await expect.element(page.getByRole('table')).toBeVisible()
    })
  })

  describe('Workout Lifecycle', () => {
    it('disappears when workout is cancelled', async ({ createTestApp }) => {
      const { builder, workout, common, navigateTo } = await createTestApp()

      // Start a workout
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()
      await builder.startWorkout()

      // Wait for active mode, navigate to exercises to see FAB
      await expect.element(page.getByRole('table')).toBeVisible()
      await navigateTo({ name: RouteNames.Exercises })
      await expect.element(getActiveFab()).toBeVisible()

      // Click FAB to navigate back to workout
      await userEvent.click(getActiveFab())
      await expect.element(page.getByRole('table')).toBeVisible()

      // Open menu and cancel workout
      await expect.poll(() => workout.getMenuTrigger()).toBeTruthy()
      await userEvent.click(await workout.getMenuTrigger())
      await expect.element(page.getByRole('menuitem', { name: /cancel workout/i })).toBeVisible()
      await page.getByRole('menuitem', { name: /cancel workout/i }).click()

      // Confirm cancel
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Delete Workout'))

      // Should be at home, FAB should be gone
      await common.waitForRoute(/^\/$/)
      await expect.element(getActiveFab()).not.toBeInTheDocument()
    })

    it('disappears when workout is completed', async ({ createTestApp }) => {
      const { builder, workout, common, navigateTo } = await createTestApp()

      // Start a workout
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()
      await builder.startWorkout()

      // Complete a set first (required to finish)
      await workout.fillCardSetAndComplete({ weight: '80', reps: '8', rir: '2' })

      // Navigate to exercises to verify FAB is there
      await navigateTo({ name: RouteNames.Exercises })
      await expect.element(getActiveFab()).toBeVisible()

      // Click FAB to navigate back and finish workout
      await userEvent.click(getActiveFab())
      await workout.endWorkoutAndNavigateToSummary()

      // FAB should be gone after workout is completed
      await expect.element(getActiveFab()).not.toBeInTheDocument()
    })
  })
})
