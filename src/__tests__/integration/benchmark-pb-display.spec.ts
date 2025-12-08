import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { db, getBenchmarksRepository } from '@/db'
import type { DbBenchmark, DbCompletedWorkout, DbForTimeBlock } from '@/db/schema'

describe('Benchmark PB Display', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('PB on benchmark list', () => {
    it('shows PB when user has completed a benchmark', async () => {
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

      // Create a completed workout for this benchmark with a PB time of 14:45 (885 seconds)
      const forTimeBlock: DbForTimeBlock = {
        kind: 'fortime',
        id: 'block-1',
        config: { timeCapSeconds: null },
        exercises: [
          {
            id: 'ex-1',
            name: 'Burpees',
            prescribedReps: 50,
            load: null,
            thumbnail: '🏋️',
          },
          {
            id: 'ex-2',
            name: 'Pull-ups',
            prescribedReps: 50,
            load: null,
            thumbnail: '💪',
          },
        ],
        result: {
          completionTime: 885,
          completed: true,
        },
        orderIndex: 0,
      }

      const completedWorkout: DbCompletedWorkout = {
        id: 'workout-1',
        name: 'Venus',
        benchmarkId: benchmark.id,
        startedAt: Date.now() - 5000,
        completedAt: Date.now(),
        durationSeconds: 885, // 14 minutes 45 seconds
        notes: '',
        blocks: [forTimeBlock],
      }
      await db.workouts.add(completedWorkout)

      // Navigate to benchmarks tab
      await app.benchmarks.navigateToTab()

      // Wait for benchmark card to appear
      await waitFor(() => {
        expect(app.getByText('Venus')).toBeTruthy()
      })

      // Assert PB is displayed as "14:45"
      await waitFor(() => {
        expect(app.getByText(/PB: 14:45/i)).toBeTruthy()
      })

      app.cleanup()
    })

    it('shows "No PB yet" when user has never completed a benchmark', async () => {
      const app = await createTestApp()

      // Create a benchmark without any completed workouts
      const benchmarkData: Omit<DbBenchmark, 'id' | 'createdAt' | 'lastUsedAt'> = {
        name: 'Venus',
        type: 'fortime',
        rounds: 1,
        exercises: [
          { name: 'Burpees', prescribedReps: 50, thumbnail: '🏋️', exerciseDefinitionId: null },
        ],
      }
      await getBenchmarksRepository().create(benchmarkData)

      // Navigate to benchmarks tab
      await app.benchmarks.navigateToTab()

      // Wait for benchmark card to appear
      await waitFor(() => {
        expect(app.getByText('Venus')).toBeTruthy()
      })

      // Assert "No PB yet" is displayed
      await waitFor(() => {
        expect(app.getByText(/No PB yet/i)).toBeTruthy()
      })

      app.cleanup()
    })

    it('shows best time when multiple completions exist', async () => {
      const app = await createTestApp()

      // Create a benchmark
      const benchmarkData: Omit<DbBenchmark, 'id' | 'createdAt' | 'lastUsedAt'> = {
        name: 'Fran',
        type: 'fortime',
        rounds: 1,
        exercises: [
          { name: 'Thrusters', prescribedReps: 21, thumbnail: '🏋️', exerciseDefinitionId: null },
          { name: 'Pull-ups', prescribedReps: 21, thumbnail: '💪', exerciseDefinitionId: null },
        ],
      }
      const benchmark = await getBenchmarksRepository().create(benchmarkData)

      // Create multiple completed workouts for this benchmark
      const block1: DbForTimeBlock = {
        kind: 'fortime',
        id: 'block-1',
        config: { timeCapSeconds: null },
        exercises: [],
        result: { completionTime: 420, completed: true },
        orderIndex: 0,
      }

      const workout1: DbCompletedWorkout = {
        id: 'workout-1',
        name: 'Fran',
        benchmarkId: benchmark.id,
        startedAt: Date.now() - 15000,
        completedAt: Date.now() - 10000,
        durationSeconds: 420, // 7:00
        notes: '',
        blocks: [block1],
      }

      const block2: DbForTimeBlock = {
        kind: 'fortime',
        id: 'block-2',
        config: { timeCapSeconds: null },
        exercises: [],
        result: { completionTime: 345, completed: true },
        orderIndex: 0,
      }

      const workout2: DbCompletedWorkout = {
        id: 'workout-2',
        name: 'Fran',
        benchmarkId: benchmark.id,
        startedAt: Date.now() - 5000,
        completedAt: Date.now(),
        durationSeconds: 345, // 5:45 - This is the PB
        notes: '',
        blocks: [block2],
      }

      await db.workouts.add(workout1)
      await db.workouts.add(workout2)

      // Navigate to benchmarks tab
      await app.benchmarks.navigateToTab()

      // Wait for benchmark card to appear
      await waitFor(() => {
        expect(app.getByText('Fran')).toBeTruthy()
      })

      // Assert PB shows the best (lowest) time: 5:45
      await waitFor(() => {
        expect(app.getByText(/PB: 5:45/i)).toBeTruthy()
      })

      app.cleanup()
    })
  })

  describe('PB on benchmark detail page', () => {
    it('shows PB prominently on detail page when user has completed the benchmark', async () => {
      const app = await createTestApp()

      // Create a benchmark
      const benchmarkData: Omit<DbBenchmark, 'id' | 'createdAt' | 'lastUsedAt'> = {
        name: 'Cindy',
        type: 'fortime',
        rounds: 1,
        exercises: [
          { name: 'Pull-ups', prescribedReps: 5, thumbnail: '💪', exerciseDefinitionId: null },
          { name: 'Push-ups', prescribedReps: 10, thumbnail: '🏋️', exerciseDefinitionId: null },
          { name: 'Air Squats', prescribedReps: 15, thumbnail: '🦵', exerciseDefinitionId: null },
        ],
      }
      const benchmark = await getBenchmarksRepository().create(benchmarkData)

      // Create a completed workout with PB time
      const block: DbForTimeBlock = {
        kind: 'fortime',
        id: 'block-1',
        config: { timeCapSeconds: null },
        exercises: [],
        result: { completionTime: 1200, completed: true },
        orderIndex: 0,
      }

      const completedWorkout: DbCompletedWorkout = {
        id: 'workout-1',
        name: 'Cindy',
        benchmarkId: benchmark.id,
        startedAt: Date.now() - 5000,
        completedAt: Date.now(),
        durationSeconds: 1200, // 20:00
        notes: '',
        blocks: [block],
      }
      await db.workouts.add(completedWorkout)

      // Navigate to benchmark detail page
      await app.benchmarkDetail.navigateToDetail(benchmark.id)

      // Wait for page to load
      await waitFor(() => {
        expect(app.getByText('Cindy')).toBeTruthy()
      })

      // Assert PB is displayed prominently
      await waitFor(() => {
        expect(app.getByText(/PERSONAL BEST/i)).toBeTruthy()
        expect(app.getByText(/20:00/)).toBeTruthy()
      })

      app.cleanup()
    })

    it('does not show PB section when user has never completed the benchmark', async () => {
      const app = await createTestApp()

      // Create a benchmark without any completed workouts
      const benchmarkData: Omit<DbBenchmark, 'id' | 'createdAt' | 'lastUsedAt'> = {
        name: 'Murph',
        type: 'fortime',
        rounds: 1,
        exercises: [
          { name: 'Pull-ups', prescribedReps: 100, thumbnail: '💪', exerciseDefinitionId: null },
        ],
      }
      const benchmark = await getBenchmarksRepository().create(benchmarkData)

      // Navigate to benchmark detail page
      await app.benchmarkDetail.navigateToDetail(benchmark.id)

      // Wait for page to load
      await waitFor(() => {
        expect(app.getByText('Murph')).toBeTruthy()
      })

      // Assert PB section is not displayed
      expect(app.queryByText(/PERSONAL BEST/i)).toBeFalsy()

      app.cleanup()
    })
  })
})
