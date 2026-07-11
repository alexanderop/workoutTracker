/**
 * Integration tests for ExerciseProgressView
 *
 * Tests verify user-facing exercise progress functionality:
 * - PR cards display with calculated stats
 * - Empty state when no history exists
 * - Navigation from exercises list
 */
import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { getWorkoutsRepository, getCustomExercisesRepository } from '@/db'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories/dbWorkout.factory'
import { createDbSet as createDatabaseSet } from '../factories/dbSet.factory'

describe('ExerciseProgressView', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('with workout history', () => {
    it('displays PR cards with max weight when history exists', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Get the ID of a seeded exercise (Bench Press)
      const exercises = await getCustomExercisesRepository().getAll()
      const benchPress = exercises.find((e) => e.name === 'Bench Press')!

      // Create a workout with Bench Press history
      const workout = databaseWorkoutBuilder()
        .withName('Push Day')
        .withExerciseAndSets(
          [
            createDatabaseSet({ kg: '100', reps: '5', status: 'completed' }),
            createDatabaseSet({ kg: '90', reps: '8', status: 'completed' }),
          ],
          { exerciseDefinitionId: benchPress.id, name: 'Bench Press' },
        )
        .build()
      await getWorkoutsRepository().add(workout)

      // Navigate to exercise progress
      await navigateTo({ name: RouteNames.ExerciseProgress, params: { id: benchPress.id } })

      // Should show exercise name in header
      await expect.element(page.getByRole('heading', { name: 'Bench Press' })).toBeVisible()

      // Should display max weight PR card
      await expect.element(page.getByText('100 kg')).toBeVisible()

      cleanup()
    })

    it('displays estimated 1RM in PR cards', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const exercises = await getCustomExercisesRepository().getAll()
      const benchPress = exercises.find((e) => e.name === 'Bench Press')!

      // Create workout with 100kg x 5 reps (e1RM ~112.5kg via Brzycki, rounds to 113)
      const workout = databaseWorkoutBuilder()
        .withExerciseAndSets([createDatabaseSet({ kg: '100', reps: '5', status: 'completed' })], {
          exerciseDefinitionId: benchPress.id,
          name: 'Bench Press',
        })
        .build()
      await getWorkoutsRepository().add(workout)

      await navigateTo({ name: RouteNames.ExerciseProgress, params: { id: benchPress.id } })

      // Should show estimated 1RM (Brzycki: 100 * 36 / (37 - 5) = 112.5, rounded to 113)
      await expect.element(page.getByText('113 kg')).toBeVisible()

      cleanup()
    })

    it('displays max volume PR with tonnage format', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const exercises = await getCustomExercisesRepository().getAll()
      const benchPress = exercises.find((e) => e.name === 'Bench Press')!

      // Create workout with high volume: 3 sets of 80kg x 10 = 2400kg
      const workout = databaseWorkoutBuilder()
        .withExerciseAndSets(
          [
            createDatabaseSet({ kg: '80', reps: '10', status: 'completed' }),
            createDatabaseSet({ kg: '80', reps: '10', status: 'completed' }),
            createDatabaseSet({ kg: '80', reps: '10', status: 'completed' }),
          ],
          { exerciseDefinitionId: benchPress.id, name: 'Bench Press' },
        )
        .build()
      await getWorkoutsRepository().add(workout)

      await navigateTo({ name: RouteNames.ExerciseProgress, params: { id: benchPress.id } })

      // Volume 2400kg should display as "2.4t" in the PR card
      // Use first() since the value also appears in chart axis labels
      await expect.element(page.getByText('2.4t').first()).toBeVisible()

      cleanup()
    })

    it('falls back to the name from workout history when the exercise is not in the library', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // A workout logged against an exercise id that no longer exists in the
      // exercises table (e.g. deleted custom exercise) — the view should still
      // resolve the display name from the workout history itself.
      const workout = databaseWorkoutBuilder()
        .withName('Legacy Session')
        .withExerciseAndSets([createDatabaseSet({ kg: '60', reps: '12', status: 'completed' })], {
          exerciseDefinitionId: 'legacy-exercise-id',
          name: 'Zercher Squat',
        })
        .build()
      await getWorkoutsRepository().add(workout)

      await navigateTo({
        name: RouteNames.ExerciseProgress,
        params: { id: 'legacy-exercise-id' },
      })

      await expect.element(page.getByRole('heading', { name: 'Zercher Squat' })).toBeVisible()
      await expect.element(page.getByText('60 kg')).toBeVisible()

      cleanup()
    })
  })

  describe('empty state', () => {
    it('shows empty state when no workout history exists', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const exercises = await getCustomExercisesRepository().getAll()
      const benchPress = exercises.find((e) => e.name === 'Bench Press')!

      // Navigate without adding any workouts
      await navigateTo({ name: RouteNames.ExerciseProgress, params: { id: benchPress.id } })

      // Should show exercise name in header
      await expect.element(page.getByRole('heading', { name: 'Bench Press' })).toBeVisible()

      // Should show empty state message
      await expect.element(page.getByText(/no history yet/i)).toBeVisible()

      cleanup()
    })
  })

  describe('navigation', () => {
    it('navigates from exercises list to progress view', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.Exercises })

      // Click on Bench Press in the list
      await userEvent.click(page.getByText('Bench Press', { exact: true }))

      // Should navigate to exercise progress view
      await expect.element(page.getByRole('heading', { name: 'Bench Press' })).toBeVisible()

      // Should NOT show "Unknown Exercise"
      await expect.element(page.getByText('Unknown Exercise')).not.toBeInTheDocument()

      cleanup()
    })
  })
})
