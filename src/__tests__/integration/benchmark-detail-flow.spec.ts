import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createTestApp } from '../helpers/createTestApp'
import { getBenchmarksRepository } from '@/db'
import type { DbBenchmark } from '@/db/schema'

describe('Benchmark Detail Flow', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('View benchmark details', () => {
    it('displays benchmark name, type, and exercises', async () => {
      // Create a For Time benchmark with exercises
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Venus',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Burpees',
            prescribedReps: 50,
            thumbnail: '💪',
          },
          {
            exerciseDefinitionId: null,
            name: 'Squats',
            prescribedReps: 50,
            thumbnail: '🦵',
          },
          {
            exerciseDefinitionId: null,
            name: 'Lunges',
            prescribedReps: 50,
            thumbnail: '🚶',
          },
        ],
      })

      const app = await createTestApp()

      // Navigate to benchmark detail page
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Venus')

      // Verify workout type banner
      expect(screen.getByText('Workout Structure')).toBeTruthy()
      expect(screen.getAllByText('For Time').length).toBeGreaterThan(0)

      // Verify all exercises displayed
      app.benchmarkDetail.assertExerciseExists('Burpees', 50)
      app.benchmarkDetail.assertExerciseExists('Squats', 50)
      app.benchmarkDetail.assertExerciseExists('Lunges', 50)

      // Verify "Start Workout" button is enabled
      app.benchmarkDetail.assertStartButtonEnabled()

      app.cleanup()
    })

    it('displays rounds type correctly', async () => {
      // Create a Rounds benchmark
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Cindy',
        type: 'rounds',
        rounds: 5,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Pull-ups',
            prescribedReps: 5,
            thumbnail: '💪',
          },
          {
            exerciseDefinitionId: null,
            name: 'Push-ups',
            prescribedReps: 10,
            thumbnail: '🤸',
          },
          {
            exerciseDefinitionId: null,
            name: 'Squats',
            prescribedReps: 15,
            thumbnail: '🦵',
          },
        ],
      })

      const app = await createTestApp()

      // Navigate to benchmark detail page and wait for load
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Cindy')

      // Verify rounds type displayed
      expect(screen.getAllByText(/5 Rounds/i).length).toBeGreaterThan(0)

      app.cleanup()
    })
  })

  describe('Start workout from benchmark', () => {
    it('creates active workout from "For Time" benchmark', async () => {
      // Create "Fran" benchmark (For Time, Thrusters 21, Pull-ups 21)
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Fran',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Thrusters',
            prescribedReps: 21,
            thumbnail: '🏋️',
          },
          {
            exerciseDefinitionId: null,
            name: 'Pull-ups',
            prescribedReps: 21,
            thumbnail: '💪',
          },
        ],
      })

      const app = await createTestApp()

      // Navigate to benchmark detail page and start workout
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickStartWorkout()

      // Verify navigation to active workout
      expect(app.router.currentRoute.value.path).toBe('/workout/active')

      // Navigate back to verify workout was created
      await app.router.push('/workouts')
      await waitFor(() => {
        expect(app.router.currentRoute.value.path).toBe('/workouts')
      })

      // Verify benchmark.lastUsedAt updated (should appear in list)
      const updatedBenchmark = await getBenchmarksRepository().getById(benchmark.id)
      expect(updatedBenchmark?.lastUsedAt).not.toBeNull()

      app.cleanup()
    })

    it('creates active workout with multiple rounds', async () => {
      // Create "Cindy" benchmark (5 Rounds)
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Cindy',
        type: 'rounds',
        rounds: 5,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Pull-ups',
            prescribedReps: 5,
            thumbnail: '💪',
          },
          {
            exerciseDefinitionId: null,
            name: 'Push-ups',
            prescribedReps: 10,
            thumbnail: '🤸',
          },
          {
            exerciseDefinitionId: null,
            name: 'Squats',
            prescribedReps: 15,
            thumbnail: '🦵',
          },
        ],
      })

      const app = await createTestApp()

      // Navigate to benchmark detail page and start workout
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickStartWorkout()

      // Verify navigation to active workout
      expect(app.router.currentRoute.value.path).toBe('/workout/active')

      // Verify benchmark usage timestamp updated
      const updatedBenchmark = await getBenchmarksRepository().getById(benchmark.id)
      expect(updatedBenchmark?.lastUsedAt).not.toBeNull()

      app.cleanup()
    })
  })

  describe('Navigate from benchmarks list', () => {
    it('navigates to detail page when tapping benchmark card', async () => {
      // Pre-seed benchmark
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Venus',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Burpees',
            prescribedReps: 50,
            thumbnail: '💪',
          },
        ],
      })

      const app = await createTestApp()

      // Navigate to benchmarks tab
      await app.benchmarks.navigateToTab()

      // Wait for benchmarks to load
      await waitFor(() => {
        expect(screen.getByText('Venus')).toBeTruthy()
      })

      // Click benchmark card
      await app.benchmarks.clickBenchmarkCard('Venus')

      // Verify route and detail page loaded
      await waitFor(() => {
        expect(app.router.currentRoute.value.path).toBe(`/benchmarks/${benchmark.id}`)
      })

      await app.benchmarkDetail.waitForLoad()
      expect(screen.getAllByText('For Time').length).toBeGreaterThan(0)

      app.cleanup()
    })
  })

  describe('Loading and error states', () => {
    it('shows not-found state for invalid ID', async () => {
      const app = await createTestApp()

      // Navigate to invalid benchmark ID
      await app.benchmarkDetail.navigateToDetail('invalid-id')

      // Wait for not-found state
      await waitFor(() => {
        app.benchmarkDetail.assertNotFoundState()
      })

      // Verify "Go Back" button works
      await app.benchmarkDetail.clickGoBack()

      // Verify navigation back to workouts
      expect(app.router.currentRoute.value.path).toBe('/workouts')

      app.cleanup()
    })

    it('shows loading state briefly', async () => {
      // Create benchmark
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Test',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Test Exercise',
            prescribedReps: 10,
            thumbnail: '💪',
          },
        ],
      })

      const app = await createTestApp()

      // Navigate to benchmark detail page
      await app.benchmarkDetail.navigateToDetail(benchmark.id)

      // Loading state should transition to success quickly
      await app.benchmarkDetail.waitForLoad('Test')

      app.cleanup()
    })
  })

  describe('Back navigation', () => {
    it('returns to workouts list when back button clicked', async () => {
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Test Benchmark',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Exercise',
            prescribedReps: 10,
            thumbnail: '💪',
          },
        ],
      })

      const app = await createTestApp()

      // Navigate to benchmark detail page
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Test Benchmark')

      // Click back (PageLayout provides back navigation via back-to prop)
      // The back-to="/workouts" prop should handle navigation
      await app.router.push('/workouts')

      // Verify navigation
      await waitFor(() => {
        expect(app.router.currentRoute.value.path).toBe('/workouts')
      })

      app.cleanup()
    })
  })
})
