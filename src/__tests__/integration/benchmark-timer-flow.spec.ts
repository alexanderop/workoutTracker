import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createTestApp } from '../helpers/createTestApp'
import { getBenchmarksRepository } from '@/db'
import type { DbBenchmark } from '@/db/schema'

describe('Benchmark Timer Flow', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Start workout with timer', () => {
    it('starts timer at 00:00 when starting benchmark workout', async () => {
      // Create "Venus" benchmark (For Time)
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

      // Wait for active mode to initialize (benchmark name appears as title)
      await waitFor(() => {
        expect(screen.getByText('Venus')).toBeTruthy()
      })

      // Verify timer starts at 0:00 or 0:01 (allow for startup delay)
      await waitFor(() => {
        expect(screen.getByText(/⏱ 0:0[0-1]/)).toBeTruthy()
      })

      app.cleanup()
    })
  })

  describe('Timer display and updates', () => {
    it('displays timer prominently and updates every second', async () => {
      // Create "Fran" benchmark
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

      // Verify navigation to active workout (builder mode)
      expect(app.router.currentRoute.value.path).toBe('/workout/active')

      // Click "Start Workout" button to enter active mode
      const startButton = await waitFor(() =>
        screen.getByRole('button', { name: /start workout/i }),
      )
      await app.user.click(startButton)

      // Wait for active mode to initialize (benchmark name appears as title)
      await waitFor(() => {
        expect(screen.getByText('Fran')).toBeTruthy()
      })

      // Verify initial timer display (0:00 or 0:01)
      await waitFor(() => {
        expect(screen.getByText(/⏱ 0:0[0-1]/)).toBeTruthy()
      })

      // Wait for timer to increment (prove it's counting)
      await waitFor(
        () => {
          expect(screen.getByText(/⏱ 0:0[2-4]/)).toBeTruthy()
        },
        { timeout: 5000 },
      )

      app.cleanup()
    })
  })

  describe('Timer continues during workout', () => {
    it('timer continues counting during workout interactions', async () => {
      // Create benchmark with timed block
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

      // Verify navigation to active workout (builder mode)
      expect(app.router.currentRoute.value.path).toBe('/workout/active')

      // Click "Start Workout" button to enter active mode
      const startButton = await waitFor(() =>
        screen.getByRole('button', { name: /start workout/i }),
      )
      await app.user.click(startButton)

      // Wait for active mode to initialize (benchmark name appears as title)
      await waitFor(() => {
        expect(screen.getByText('Cindy')).toBeTruthy()
      })

      // Capture initial timer value
      const initialTimer = await waitFor(() => screen.getByText(/⏱ 0:0\d/))
      const initialTime = initialTimer.textContent

      // Wait 2-3 seconds - timer should continue counting
      await waitFor(
        () => {
          const currentTimer = screen.queryByText(/⏱ 0:0\d/)
          expect(currentTimer?.textContent).not.toBe(initialTime)
        },
        { timeout: 4000 },
      )

      app.cleanup()
    })
  })
})
