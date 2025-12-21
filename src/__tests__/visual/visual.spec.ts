import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getCustomExercisesRepository, getWorkoutsRepository } from '@/db'
import { RouteNames } from '@/router'
import { dbWorkoutBuilder } from '../factories'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Visual Regression', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Home Page', () => {
    it('matches screenshot on initial load', async () => {
      const { cleanup } = await createTestApp()
      await expect(page.getByTestId('app')).toMatchScreenshot('home-initial')
      cleanup()
    })
  })

  describe('Workout Builder', () => {
    it('matches screenshot in builder mode', async () => {
      const { builder, cleanup } = await createTestApp()
      await builder.navigateTo()
      await expect(page.getByTestId('app')).toMatchScreenshot('builder-empty')
      cleanup()
    })

    it('matches screenshot with strength block added', async () => {
      const { builder, cleanup } = await createTestApp()
      await builder.addStrengthBlock('Squat')
      await expect(page.getByTestId('app')).toMatchScreenshot('builder-with-block')
      cleanup()
    })
  })

  describe('Active Workout', () => {
    it('matches screenshot in active mode with strength block', async () => {
      const { builder, cleanup } = await createTestApp()
      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()
      await expect(page.getByTestId('app')).toMatchScreenshot('active-strength')
      cleanup()
    })
  })

  describe('Settings Page', () => {
    it('matches screenshot on settings page', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()
      await expect(page.getByTestId('app')).toMatchScreenshot('settings')
      cleanup()
    })

    it('matches screenshot with dark mode enabled', async () => {
      const { common, getByTestId, cleanup } = await createTestApp()
      await common.navigateToSettings()

      const themeToggle = getByTestId('theme-toggle')
      await userEvent.click(themeToggle)

      await expect(page.getByTestId('app')).toMatchScreenshot('settings-dark-mode')
      cleanup()
    })
  })

  describe('Exercises Page', () => {
    it('matches screenshot on exercises page', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToExercises()
      await expect(page.getByTestId('app')).toMatchScreenshot('exercises')
      cleanup()
    })
  })

  describe('Workouts Page', () => {
    it('matches screenshot on workouts page', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToWorkouts()
      await expect(page.getByTestId('app')).toMatchScreenshot('workouts')
      cleanup()
    })
  })

  describe('Exercise Progress Charts', () => {
    it('shows charts when user has 2 workouts with improvement', async () => {
      // Create test app first so exercises are seeded
      const { navigateTo, cleanup } = await createTestApp()

      // Get a real seeded exercise ID
      const exercises = await getCustomExercisesRepository().getAll()
      const benchPress = exercises.find((e) => e.name === 'Bench Press')!
      const exerciseId = benchPress.id

      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const today = Date.now()

      // First workout - one week ago, 60kg
      const workout1 = dbWorkoutBuilder()
        .withName('Week 1 Workout')
        .withTimestamps(oneWeekAgo, oneWeekAgo + 3600000)
        .withExerciseAndSets(
          [
            { kg: '60', reps: '8', status: 'completed' },
            { kg: '60', reps: '8', status: 'completed' },
            { kg: '60', reps: '6', status: 'completed' },
          ],
          { exerciseDefinitionId: exerciseId, name: 'Bench Press' },
        )
        .build()

      // Second workout - today, improved to 65kg
      const workout2 = dbWorkoutBuilder()
        .withName('Week 2 Workout')
        .withTimestamps(today - 3600000, today)
        .withExerciseAndSets(
          [
            { kg: '65', reps: '8', status: 'completed' },
            { kg: '65', reps: '8', status: 'completed' },
            { kg: '65', reps: '7', status: 'completed' },
          ],
          { exerciseDefinitionId: exerciseId, name: 'Bench Press' },
        )
        .build()

      await getWorkoutsRepository().add(workout1)
      await getWorkoutsRepository().add(workout2)

      // Navigate to exercise progress view using the consistent helper
      await navigateTo({ name: RouteNames.ExerciseProgress, params: { id: exerciseId } })

      // Wait for the exercise name heading to appear first (proves route loaded)
      await expect.element(page.getByRole('heading', { name: 'Bench Press' })).toBeVisible()

      // Then wait for charts to render (loading -> success state)
      await expect.element(page.getByText(/estimated 1rm/i)).toBeVisible()

      // Allow chart animations to settle
      await new Promise((r) => setTimeout(r, 300))

      await expect(page.getByTestId('app')).toMatchScreenshot('exercise-progress-charts')
      cleanup()
    })
  })
})
