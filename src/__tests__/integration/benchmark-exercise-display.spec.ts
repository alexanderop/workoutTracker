import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createTestApp } from '../helpers/createTestApp'
import { getBenchmarksRepository } from '@/db'
import type { DbBenchmark } from '@/db/schema'

describe('Benchmark Exercise Display', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Display current exercise on start', () => {
    it('displays first exercise with name, reps, and counter when starting benchmark', async () => {
      // Create benchmark with 3 exercises
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Test Benchmark',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Push-ups',
            prescribedReps: 10,
            thumbnail: '💪',
          },
          {
            exerciseDefinitionId: null,
            name: 'Squats',
            prescribedReps: 15,
            thumbnail: '🦵',
          },
          {
            exerciseDefinitionId: null,
            name: 'Pull-ups',
            prescribedReps: 5,
            thumbnail: '🏋️',
          },
        ],
      })

      const app = await createTestApp()

      // Navigate to benchmark detail page and start workout
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickStartWorkout()

      // Verify navigation to active workout (builder mode)
      expect(app.router.currentRoute.value.path).toBe('/workout/active')

      // Click "Start Workout" button to enter active mode
      const startButton = await waitFor(() =>
        screen.getByRole('button', { name: /start workout/i }),
      )
      await app.user.click(startButton)

      // Wait for active mode to initialize
      await waitFor(() => {
        expect(screen.getByText('Test Benchmark')).toBeTruthy()
      })

      // Verify exercise name is displayed
      expect(screen.getByRole('heading', { name: /push-ups/i })).toBeTruthy()

      // Verify prescribed reps are displayed
      expect(screen.getByText('10')).toBeTruthy()
      expect(screen.getByText(/reps/i)).toBeTruthy()

      // Verify exercise counter shows "Exercise 1 of 3"
      expect(screen.getByText(/exercise 1 of 3/i)).toBeTruthy()

      app.cleanup()
    })

    it('displays first exercise on start with activeExerciseIndex at 0', async () => {
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Quick Test',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Burpees',
            prescribedReps: 20,
            thumbnail: '🤸',
          },
          {
            exerciseDefinitionId: null,
            name: 'Sit-ups',
            prescribedReps: 30,
            thumbnail: '🧘',
          },
        ],
      })

      const app = await createTestApp()

      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickStartWorkout()

      const startButton = await waitFor(() =>
        screen.getByRole('button', { name: /start workout/i }),
      )
      await app.user.click(startButton)

      // Wait for active mode
      await waitFor(() => {
        expect(screen.getByText('Quick Test')).toBeTruthy()
      })

      // Verify first exercise displays
      expect(screen.getByRole('heading', { name: /burpees/i })).toBeTruthy()
      expect(screen.getByText(/exercise 1 of 2/i)).toBeTruthy()

      app.cleanup()
    })
  })

  describe('Progress indicator shows position', () => {
    it('renders progress dots with correct states', async () => {
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Progress Test',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Exercise 1',
            prescribedReps: 10,
            thumbnail: '1️⃣',
          },
          {
            exerciseDefinitionId: null,
            name: 'Exercise 2',
            prescribedReps: 10,
            thumbnail: '2️⃣',
          },
          {
            exerciseDefinitionId: null,
            name: 'Exercise 3',
            prescribedReps: 10,
            thumbnail: '3️⃣',
          },
          {
            exerciseDefinitionId: null,
            name: 'Exercise 4',
            prescribedReps: 10,
            thumbnail: '4️⃣',
          },
        ],
      })

      const app = await createTestApp()

      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickStartWorkout()

      const startButton = await waitFor(() =>
        screen.getByRole('button', { name: /start workout/i }),
      )
      await app.user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Progress Test')).toBeTruthy()
      })

      // Verify all 4 progress dots exist (one for each exercise)
      await waitFor(() => {
        expect(screen.getByLabelText(/exercise 1 of 4, active/i)).toBeTruthy()
        expect(screen.getByLabelText(/exercise 2 of 4, upcoming/i)).toBeTruthy()
        expect(screen.getByLabelText(/exercise 3 of 4, upcoming/i)).toBeTruthy()
        expect(screen.getByLabelText(/exercise 4 of 4, upcoming/i)).toBeTruthy()
      })

      app.cleanup()
    })
  })

  describe('Navigate to next exercise', () => {
    it('updates exercise display when clicking Next Exercise button', async () => {
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Navigation Test',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'First Exercise',
            prescribedReps: 12,
            thumbnail: '🥇',
          },
          {
            exerciseDefinitionId: null,
            name: 'Second Exercise',
            prescribedReps: 18,
            thumbnail: '🥈',
          },
          {
            exerciseDefinitionId: null,
            name: 'Third Exercise',
            prescribedReps: 6,
            thumbnail: '🥉',
          },
        ],
      })

      const app = await createTestApp()

      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickStartWorkout()

      const startButton = await waitFor(() =>
        screen.getByRole('button', { name: /start workout/i }),
      )
      await app.user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Navigation Test')).toBeTruthy()
      })

      // Verify first exercise is displayed
      expect(screen.getByRole('heading', { name: /first exercise/i })).toBeTruthy()
      expect(screen.getByText('12')).toBeTruthy()
      expect(screen.getByText(/exercise 1 of 3/i)).toBeTruthy()

      // Click "Done" button (advances to next exercise)
      const nextButton = await waitFor(() =>
        screen.getByRole('button', { name: /done/i }),
      )
      await app.user.click(nextButton)

      // Wait for UI to update to second exercise
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /second exercise/i })).toBeTruthy()
      })

      // Verify second exercise details
      expect(screen.getByText('18')).toBeTruthy()
      expect(screen.getByText(/exercise 2 of 3/i)).toBeTruthy()

      // Verify progress dots updated (dot 1 completed, dot 2 active)
      expect(screen.getByLabelText(/exercise 1 of 3, completed/i)).toBeTruthy()
      expect(screen.getByLabelText(/exercise 2 of 3, active/i)).toBeTruthy()
      expect(screen.getByLabelText(/exercise 3 of 3, upcoming/i)).toBeTruthy()

      app.cleanup()
    })
  })

  describe('Navigate through all exercises', () => {
    it('navigates through all exercises in sequence and updates UI correctly', async () => {
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Sequential Test',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Alpha',
            prescribedReps: 5,
            thumbnail: '🅰️',
          },
          {
            exerciseDefinitionId: null,
            name: 'Beta',
            prescribedReps: 10,
            thumbnail: '🅱️',
          },
          {
            exerciseDefinitionId: null,
            name: 'Gamma',
            prescribedReps: 15,
            thumbnail: '🔬',
          },
        ],
      })

      const app = await createTestApp()

      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickStartWorkout()

      const startButton = await waitFor(() =>
        screen.getByRole('button', { name: /start workout/i }),
      )
      await app.user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Sequential Test')).toBeTruthy()
      })

      // Exercise 1: Alpha
      expect(screen.getByRole('heading', { name: /alpha/i })).toBeTruthy()
      expect(screen.getByText('5')).toBeTruthy()
      expect(screen.getByText(/exercise 1 of 3/i)).toBeTruthy()

      // Navigate to Exercise 2
      let nextButton = await waitFor(() =>
        screen.getByRole('button', { name: /done/i }),
      )
      await app.user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /beta/i })).toBeTruthy()
      })

      // Exercise 2: Beta
      expect(screen.getByText('10')).toBeTruthy()
      expect(screen.getByText(/exercise 2 of 3/i)).toBeTruthy()
      expect(screen.getByLabelText(/exercise 1 of 3, completed/i)).toBeTruthy()
      expect(screen.getByLabelText(/exercise 2 of 3, active/i)).toBeTruthy()

      // Navigate to Exercise 3
      // Wait for transition animation to complete before clicking again
      await new Promise(resolve => setTimeout(resolve, 900))
      nextButton = await waitFor(() =>
        screen.getByRole('button', { name: /done/i }),
      )
      await app.user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /gamma/i })).toBeTruthy()
      })

      // Exercise 3: Gamma
      expect(screen.getByText('15')).toBeTruthy()
      expect(screen.getByText(/exercise 3 of 3/i)).toBeTruthy()
      expect(screen.getByLabelText(/exercise 1 of 3, completed/i)).toBeTruthy()
      expect(screen.getByLabelText(/exercise 2 of 3, completed/i)).toBeTruthy()
      expect(screen.getByLabelText(/exercise 3 of 3, active/i)).toBeTruthy()

      app.cleanup()
    })
  })

  describe('Complete workout after last exercise', () => {
    it('completes the workout when finishing the last exercise', async () => {
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Completion Test',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Only Exercise',
            prescribedReps: 25,
            thumbnail: '⚡',
          },
        ],
      })

      const app = await createTestApp()

      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickStartWorkout()

      const startButton = await waitFor(() =>
        screen.getByRole('button', { name: /start workout/i }),
      )
      await app.user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Completion Test')).toBeTruthy()
      })

      // Verify the only exercise is displayed
      expect(screen.getByRole('heading', { name: /only exercise/i })).toBeTruthy()
      expect(screen.getByText('25')).toBeTruthy()
      expect(screen.getByText(/exercise 1 of 1/i)).toBeTruthy()

      // For the last exercise, button shows "Done" instead of "Next Exercise"
      const doneButton = await waitFor(() =>
        screen.getByRole('button', { name: /done/i }),
      )
      await app.user.click(doneButton)

      // Wait for animations and completion screen to appear
      await new Promise(resolve => setTimeout(resolve, 1000))

      // After completing the last exercise, the completion screen should appear
      await waitFor(
        () => {
          expect(screen.getByText(/workout complete/i)).toBeTruthy()
          expect(screen.getByRole('button', { name: /view details/i })).toBeTruthy()
        },
        { timeout: 3000 },
      )

      app.cleanup()
    })
  })
})
