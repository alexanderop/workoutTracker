import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { db, getBenchmarksRepository } from '@/db'
import type { DbBenchmark, DbCompletedWorkout, DbForTimeBlock } from '@/db/schema'

describe('Benchmark PB Celebration', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('New PB celebration', () => {
    it('shows celebration when user beats their PB', async () => {
      const app = await createTestApp()

      // Create a benchmark
      const benchmarkData: Omit<DbBenchmark, 'id' | 'createdAt' | 'lastUsedAt'> = {
        name: 'Venus',
        type: 'fortime',
        rounds: 1,
        exercises: [
          { name: 'Burpees', prescribedReps: 50, thumbnail: '🏋️', exerciseDefinitionId: null },
          { name: 'Pull-ups', prescribedReps: 50, thumbnail: '💪', exerciseDefinitionId: null },
        ],
      }
      const benchmark = await getBenchmarksRepository().create(benchmarkData)

      // Create existing PB completion: 15:30 (930 seconds)
      const existingPbBlock: DbForTimeBlock = {
        kind: 'fortime',
        id: 'block-1',
        config: { timeCapSeconds: null },
        exercises: [
          { id: 'ex-1', name: 'Burpees', prescribedReps: 50, load: null, thumbnail: '🏋️' },
          { id: 'ex-2', name: 'Pull-ups', prescribedReps: 50, load: null, thumbnail: '💪' },
        ],
        result: {
          completionTime: 930, // 15:30
          completed: true,
        },
        orderIndex: 0,
      }

      const existingWorkout: DbCompletedWorkout = {
        id: 'workout-existing',
        name: 'Venus',
        benchmarkId: benchmark.id,
        startedAt: Date.now() - 100000,
        completedAt: Date.now() - 95000,
        durationSeconds: 930,
        notes: '',
        blocks: [existingPbBlock],
      }
      await db.workouts.add(existingWorkout)

      // Start benchmark workout
      await app.benchmarks.navigateToTab()
      await app.benchmarks.clickBenchmarkCard('Venus')

      await waitFor(() => {
        expect(app.queryByText(/PB: 15:30/i)).toBeTruthy()
      })

      // Click Start Workout
      const startButton = app.getByRole('button', { name: /start workout/i })
      await app.user.click(startButton)

      // Wait for active mode
      await waitFor(() => {
        expect(app.router.currentRoute.value.path).toBe('/workout/active')
      })

      // Complete first exercise (Burpees)
      const nextButton = app.getByRole('button', { name: /next/i })
      await app.user.click(nextButton)

      // Wait for transition
      await waitFor(() => {
        expect(app.getByText('Pull-ups')).toBeTruthy()
      })

      // Complete second exercise (Pull-ups) - this should trigger completion screen
      await app.user.click(nextButton)

      // Wait for completion screen to appear
      await waitFor(
        () => {
          expect(app.getByText(/Workout Complete!/i)).toBeTruthy()
        },
        { timeout: 5000 },
      )

      // Assert celebration badge appears with "New PB!" message
      await waitFor(() => {
        expect(app.getByText(/🎉 New PB! 🎉/i)).toBeTruthy()
      })

      // Assert improvement time is shown
      // Note: The actual time difference depends on how long the test takes to execute
      // So we just check for the "faster" keyword
      await waitFor(() => {
        expect(app.getByText(/faster!/i)).toBeTruthy()
      })

      // Assert previous time is shown
      await waitFor(() => {
        expect(app.getByText(/Previous: 15:30/i)).toBeTruthy()
      })

      app.cleanup()
    })
  })

  describe('First PB celebration', () => {
    it('shows celebration for first-time completion', async () => {
      const app = await createTestApp()

      // Create a benchmark WITHOUT any completed workouts
      const benchmarkData: Omit<DbBenchmark, 'id' | 'createdAt' | 'lastUsedAt'> = {
        name: 'Fran',
        type: 'fortime',
        rounds: 1,
        exercises: [
          { name: 'Thrusters', prescribedReps: 21, thumbnail: '🏋️', exerciseDefinitionId: null },
        ],
      }
      await getBenchmarksRepository().create(benchmarkData)

      // Start benchmark workout
      await app.benchmarks.navigateToTab()
      await app.benchmarks.clickBenchmarkCard('Fran')

      // Verify no PB exists
      await waitFor(() => {
        expect(app.queryByText(/No PB yet/i)).toBeTruthy()
      })

      // Click Start Workout
      const startButton = app.getByRole('button', { name: /start workout/i })
      await app.user.click(startButton)

      // Wait for active mode
      await waitFor(() => {
        expect(app.router.currentRoute.value.path).toBe('/workout/active')
      })

      // Complete exercise
      const nextButton = app.getByRole('button', { name: /next/i })
      await app.user.click(nextButton)

      // Wait for completion screen
      await waitFor(
        () => {
          expect(app.getByText(/Workout Complete!/i)).toBeTruthy()
        },
        { timeout: 5000 },
      )

      // Assert "First PB set!" celebration appears
      await waitFor(() => {
        expect(app.getByText(/🎉 First PB set! 🎉/i)).toBeTruthy()
      })

      // Assert no "faster" or "previous" text (since it's the first completion)
      expect(app.queryByText(/faster/i)).toBeNull()
      expect(app.queryByText(/Previous:/i)).toBeNull()

      app.cleanup()
    })
  })

  describe('No celebration when PB not beaten', () => {
    it('does not show celebration badge when completion is slower than PB', async () => {
      const app = await createTestApp()

      // Create a benchmark
      const benchmarkData: Omit<DbBenchmark, 'id' | 'createdAt' | 'lastUsedAt'> = {
        name: 'Helen',
        type: 'fortime',
        rounds: 1,
        exercises: [{ name: 'Run', prescribedReps: 400, thumbnail: '🏃', exerciseDefinitionId: null }],
      }
      const benchmark = await getBenchmarksRepository().create(benchmarkData)

      // Create existing fast PB: 10:00 (600 seconds)
      const existingPbBlock: DbForTimeBlock = {
        kind: 'fortime',
        id: 'block-1',
        config: { timeCapSeconds: null },
        exercises: [{ id: 'ex-1', name: 'Run', prescribedReps: 400, load: null, thumbnail: '🏃' }],
        result: {
          completionTime: 600, // 10:00
          completed: true,
        },
        orderIndex: 0,
      }

      const existingWorkout: DbCompletedWorkout = {
        id: 'workout-fast',
        name: 'Helen',
        benchmarkId: benchmark.id,
        startedAt: Date.now() - 100000,
        completedAt: Date.now() - 95000,
        durationSeconds: 600,
        notes: '',
        blocks: [existingPbBlock],
      }
      await db.workouts.add(existingWorkout)

      // Start benchmark workout
      await app.benchmarks.navigateToTab()
      await app.benchmarks.clickBenchmarkCard('Helen')

      // Click Start Workout
      const startButton = app.getByRole('button', { name: /start workout/i })
      await app.user.click(startButton)

      // Wait for active mode
      await waitFor(() => {
        expect(app.router.currentRoute.value.path).toBe('/workout/active')
      })

      // Complete exercise
      const nextButton = app.getByRole('button', { name: /next/i })
      await app.user.click(nextButton)

      // Wait for completion screen
      await waitFor(
        () => {
          expect(app.getByText(/Workout Complete!/i)).toBeTruthy()
        },
        { timeout: 5000 },
      )

      // Assert NO celebration badge appears (slower completion won't beat 10:00)
      expect(app.queryByText(/🎉 New PB! 🎉/i)).toBeNull()
      expect(app.queryByText(/🎉 First PB set! 🎉/i)).toBeNull()

      // Completion time should still be displayed
      expect(app.queryByText(/Final Time/i)).toBeTruthy()

      app.cleanup()
    })
  })
})
