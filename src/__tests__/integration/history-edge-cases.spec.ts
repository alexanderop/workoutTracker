import { page } from '../helpers/locator'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { expectElement, expectPoll } from '../helpers/assertions'
import { db } from '@/db'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories'

/**
 * Integration tests for workout history edge cases.
 * Tests empty states, loading behavior, and error scenarios.
 */
describe('History Edge Cases', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Empty State', () => {
    it('displays empty state when no workout history exists', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Navigate to history with no workouts
      await navigateTo({ name: RouteNames.History })

      // Verify empty state is displayed
      await expect.element(page.getByText(/no workouts yet/i)).toBeVisible()

      cleanup()
    })

    it('empty state disappears when workout is added', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Start with empty state
      await navigateTo({ name: RouteNames.History })
      await expect.element(page.getByText(/no workouts yet/i)).toBeVisible()

      // Add a workout to database
      const workout = databaseWorkoutBuilder()
        .withName('New Workout')
        .withStrengthBlock()
        .build()
      await db.workouts.add(workout)

      // Navigate away and back to trigger reload
      await navigateTo({ name: RouteNames.Home })
      await navigateTo({ name: RouteNames.History })

      // Empty state should be gone, workout should be visible
      await expect.element(page.getByText(/no workouts yet/i)).not.toBeInTheDocument()
      await expect.element(page.getByText('New Workout')).toBeVisible()

      cleanup()
    })
  })

  describe('Month Grouping', () => {
    it('groups workouts by month correctly', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const now = Date.now()
      const oneMonthAgo = now - 31 * 24 * 60 * 60 * 1000
      const twoMonthsAgo = now - 62 * 24 * 60 * 60 * 1000

      // Add workouts in different months
      await db.workouts.bulkAdd([
        databaseWorkoutBuilder()
          .withName('Recent Workout')
          .withStrengthBlock()
          .withTimestamps(now - 3_600_000, now)
          .build(),
        databaseWorkoutBuilder()
          .withName('Last Month Workout')
          .withStrengthBlock()
          .withTimestamps(oneMonthAgo - 3_600_000, oneMonthAgo)
          .build(),
        databaseWorkoutBuilder()
          .withName('Two Months Ago')
          .withStrengthBlock()
          .withTimestamps(twoMonthsAgo - 3_600_000, twoMonthsAgo)
          .build(),
      ])

      await navigateTo({ name: RouteNames.History })

      // Verify all workouts are visible
      await expect.element(page.getByText('Recent Workout')).toBeVisible()
      await expect.element(page.getByText('Last Month Workout')).toBeVisible()
      await expect.element(page.getByText('Two Months Ago')).toBeVisible()

      // Verify there are multiple month headers (sections)
      // eslint-disable-next-line no-restricted-syntax -- Counting section headers
      const monthHeaders = document.querySelectorAll('h2.text-sm.uppercase')
      expect(monthHeaders.length).toBeGreaterThanOrEqual(2)

      cleanup()
    })

    it('displays most recent workouts first within a month', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const now = Date.now()
      const yesterday = now - 24 * 60 * 60 * 1000

      // Add workouts on different days in same month
      await db.workouts.bulkAdd([
        databaseWorkoutBuilder()
          .withName('Yesterday Workout')
          .withStrengthBlock()
          .withTimestamps(yesterday - 3_600_000, yesterday)
          .build(),
        databaseWorkoutBuilder()
          .withName('Today Workout')
          .withStrengthBlock()
          .withTimestamps(now - 3_600_000, now)
          .build(),
      ])

      await navigateTo({ name: RouteNames.History })

      // Wait for workouts to load
      await expect.element(page.getByText('Today Workout')).toBeVisible()
      await expect.element(page.getByText('Yesterday Workout')).toBeVisible()

      // Get workout cards
      const todayCard = await page.getByText('Today Workout').element()
      const yesterdayCard = await page.getByText('Yesterday Workout').element()

      // Today should be before yesterday in DOM order (most recent first)
      expect(
        todayCard.compareDocumentPosition(yesterdayCard) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()

      cleanup()
    })
  })

  describe('Workout Detail Navigation', () => {
    it('handles navigating to non-existent workout gracefully', async () => {
      const { navigateTo, router, cleanup } = await createTestApp()

      // Navigate directly to a non-existent workout
      await navigateTo({ name: RouteNames.WorkoutDetail, params: { id: 'non-existent-id' } })

      // Should show loading state first, then either error or redirect
      // The app should not crash
      await expect.poll(() => router.currentRoute.value.path).toContain('non-existent-id')

      // Verify no crash - page should render something
      await expect.element(page.getByRole('main')).toBeVisible()

      cleanup()
    })

    it('navigates back from workout detail to history', async () => {
      const { navigateTo, router, cleanup } = await createTestApp()

      // Add a workout
      const workout = databaseWorkoutBuilder()
        .withName('Test Workout')
        .withStrengthBlock()
        .build()
      await db.workouts.add(workout)

      // Navigate to history
      await navigateTo({ name: RouteNames.History })
      await expect.element(page.getByText('Test Workout')).toBeVisible()

      // Click on the workout
      await page.getByText('Test Workout').click()
      await expect.poll(() => router.currentRoute.value.path).toContain(workout.id)

      // Click back button
      const backButton = page.getByRole('button', { name: /back/i })
      await backButton.click()

      // Should navigate back to home (or history)
      await expect.poll(() => router.currentRoute.value.path).toBe('/')

      cleanup()
    })
  })

  describe('Workout Detail Display', () => {
    it('displays strength block details correctly', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const workout = databaseWorkoutBuilder()
        .withName('Strength Session')
        .withExerciseAndSets(
          [
            { kg: '100', reps: '5', rir: '2' },
            { kg: '100', reps: '5', rir: '2' },
            { kg: '100', reps: '5', rir: '2' },
          ],
          { name: 'Barbell Squat', equipment: 'barbell' },
        )
        .build()
      await db.workouts.add(workout)

      await navigateTo({ name: RouteNames.WorkoutDetail, params: { id: workout.id } })

      // Verify workout name displayed
      await expect.element(page.getByText('Strength Session')).toBeVisible()

      // Verify exercise name displayed
      await expect.element(page.getByText('Barbell Squat')).toBeVisible()

      cleanup()
    })

    it('displays multiple exercises in workout detail', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const workout = databaseWorkoutBuilder()
        .withName('Full Body Session')
        .withExerciseAndSets(
          [{ kg: '60', reps: '8', rir: '2' }],
          { name: 'Bench Press', equipment: 'barbell' },
        )
        .withExerciseAndSets(
          [{ kg: '100', reps: '5', rir: '2' }],
          { name: 'Squat', equipment: 'barbell' },
        )
        .build()
      await db.workouts.add(workout)

      await navigateTo({ name: RouteNames.WorkoutDetail, params: { id: workout.id } })

      // Verify workout name displayed
      await expect.element(page.getByText('Full Body Session')).toBeVisible()

      // Verify both exercises displayed
      await expect.element(page.getByText('Bench Press')).toBeVisible()
      await expect.element(page.getByText('Squat')).toBeVisible()

      cleanup()
    })
  })

  describe('Redo Workout', () => {
    it('shows redo button on completed workout detail', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const workout = databaseWorkoutBuilder()
        .withName('Completed Workout')
        .withStrengthBlock()
        .build()
      await db.workouts.add(workout)

      await navigateTo({ name: RouteNames.WorkoutDetail, params: { id: workout.id } })

      // Verify redo button is visible
      await expect.element(page.getByRole('button', { name: /redo/i })).toBeVisible()

      cleanup()
    })
  })
})
