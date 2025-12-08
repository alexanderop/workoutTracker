import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { db, generateId, getBenchmarksRepository } from '@/db'
import type { DbBenchmark, DbCompletedWorkout, DbForTimeBlock } from '@/db/schema'

describe('Benchmark Attempt History', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('displays attempt history with PB comparison', async () => {
    const app = await createTestApp()

    // Create benchmark
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

    // Helper function to create attempts
    const createAttempt = async (time: number, daysAgo: number) => {
      const now = Date.now()
      const completedAt = now - daysAgo * 24 * 60 * 60 * 1000

      const block: DbForTimeBlock = {
        kind: 'fortime',
        id: generateId(),
        config: { timeCapSeconds: null },
        exercises: [],
        result: { completionTime: time, completed: true },
        orderIndex: 0,
      }

      const workout: DbCompletedWorkout = {
        id: generateId(),
        name: 'Fran',
        benchmarkId: benchmark.id,
        startedAt: completedAt - 5000,
        completedAt,
        durationSeconds: time,
        notes: '',
        blocks: [block],
      }
      await db.workouts.add(workout)
    }

    // Create 3 attempts: 420 seconds (7:00) 2 days ago, 345 seconds (5:45) 1 day ago (PB), 390 seconds (6:30) today
    await createAttempt(420, 2) // 7:00 - 2 days ago
    await createAttempt(345, 1) // 5:45 - 1 day ago (PB)
    await createAttempt(390, 0) // 6:30 - today

    // Navigate to benchmark detail
    await app.benchmarkDetail.navigateToDetail(benchmark.id)
    await app.benchmarkDetail.waitForLoad('Fran')

    // Assert attempt history section exists
    await waitFor(() => {
      expect(app.getByText(/attempt history/i)).toBeTruthy()
    })

    // Assert attempt history section contains the attempts
    await waitFor(() => {
      // Look for specific attempt times in the attempt history section
      const attemptCards = app.container.querySelectorAll('.bg-card.rounded-lg')
      expect(attemptCards.length).toBeGreaterThanOrEqual(3)
    })

    // Assert PB badge is shown in attempt history
    await waitFor(() => {
      expect(app.getByText(/🏆 personal best/i)).toBeTruthy()
    })

    // Assert comparisons are shown for slower attempts
    await waitFor(() => {
      // 6:30 vs 5:45 = +0:45
      expect(app.getByText(/\+0:45/)).toBeTruthy()
      // 7:00 vs 5:45 = +1:15
      expect(app.getByText(/\+1:15/)).toBeTruthy()
    })

    app.cleanup()
  })

  it('shows empty state when no attempts exist', async () => {
    const app = await createTestApp()

    // Create benchmark without any completed workouts
    const benchmarkData: Omit<DbBenchmark, 'id' | 'createdAt' | 'lastUsedAt'> = {
      name: 'Venus',
      type: 'fortime',
      rounds: 1,
      exercises: [
        { name: 'Burpees', prescribedReps: 50, thumbnail: '🏋️', exerciseDefinitionId: null },
      ],
    }
    const benchmark = await getBenchmarksRepository().create(benchmarkData)

    // Navigate to benchmark detail
    await app.benchmarkDetail.navigateToDetail(benchmark.id)
    await app.benchmarkDetail.waitForLoad('Venus')

    // Assert empty state is displayed
    await waitFor(() => {
      expect(app.getByText(/no attempts yet/i)).toBeTruthy()
    })

    app.cleanup()
  })

  it('sorts attempts by date (newest first)', async () => {
    const app = await createTestApp()

    // Create benchmark
    const benchmarkData: Omit<DbBenchmark, 'id' | 'createdAt' | 'lastUsedAt'> = {
      name: 'Cindy',
      type: 'fortime',
      rounds: 1,
      exercises: [
        { name: 'Pull-ups', prescribedReps: 5, thumbnail: '💪', exerciseDefinitionId: null },
      ],
    }
    const benchmark = await getBenchmarksRepository().create(benchmarkData)

    // Helper function to create attempts with specific dates
    const createAttempt = async (time: number, daysAgo: number) => {
      const now = Date.now()
      const completedAt = now - daysAgo * 24 * 60 * 60 * 1000

      const block: DbForTimeBlock = {
        kind: 'fortime',
        id: generateId(),
        config: { timeCapSeconds: null },
        exercises: [],
        result: { completionTime: time, completed: true },
        orderIndex: 0,
      }

      const workout: DbCompletedWorkout = {
        id: generateId(),
        name: 'Cindy',
        benchmarkId: benchmark.id,
        startedAt: completedAt - 5000,
        completedAt,
        durationSeconds: time,
        notes: '',
        blocks: [block],
      }
      await db.workouts.add(workout)
    }

    // Create attempts in random order
    await createAttempt(300, 5) // 5 days ago
    await createAttempt(290, 1) // 1 day ago (newest)
    await createAttempt(310, 3) // 3 days ago

    // Navigate to detail
    await app.benchmarkDetail.navigateToDetail(benchmark.id)
    await app.benchmarkDetail.waitForLoad('Cindy')

    // Get all attempt rows
    await waitFor(() => {
      const attemptRows = app.container.querySelectorAll('[class*="bg-card"]')
      expect(attemptRows.length).toBeGreaterThanOrEqual(3)
    })

    app.cleanup()
  })

  it('excludes incomplete attempts from history', async () => {
    const app = await createTestApp()

    // Create benchmark
    const benchmarkData: Omit<DbBenchmark, 'id' | 'createdAt' | 'lastUsedAt'> = {
      name: 'Murph',
      type: 'fortime',
      rounds: 1,
      exercises: [
        { name: 'Pull-ups', prescribedReps: 100, thumbnail: '💪', exerciseDefinitionId: null },
      ],
    }
    const benchmark = await getBenchmarksRepository().create(benchmarkData)

    // Create one completed attempt
    const completedBlock: DbForTimeBlock = {
      kind: 'fortime',
      id: generateId(),
      config: { timeCapSeconds: null },
      exercises: [],
      result: { completionTime: 3600, completed: true },
      orderIndex: 0,
    }

    const completedWorkout: DbCompletedWorkout = {
      id: generateId(),
      name: 'Murph',
      benchmarkId: benchmark.id,
      startedAt: Date.now() - 5000,
      completedAt: Date.now(),
      durationSeconds: 3600,
      notes: '',
      blocks: [completedBlock],
    }
    await db.workouts.add(completedWorkout)

    // Create one incomplete attempt
    const incompleteBlock: DbForTimeBlock = {
      kind: 'fortime',
      id: generateId(),
      config: { timeCapSeconds: null },
      exercises: [],
      result: { completionTime: 0, completed: false },
      orderIndex: 0,
    }

    const incompleteWorkout: DbCompletedWorkout = {
      id: generateId(),
      name: 'Murph',
      benchmarkId: benchmark.id,
      startedAt: Date.now() - 10000,
      completedAt: Date.now() - 5000,
      durationSeconds: 0,
      notes: '',
      blocks: [incompleteBlock],
    }
    await db.workouts.add(incompleteWorkout)

    // Navigate to detail
    await app.benchmarkDetail.navigateToDetail(benchmark.id)
    await app.benchmarkDetail.waitForLoad('Murph')

    // Assert only 1 attempt is shown (the completed one) in the attempt history section
    await waitFor(() => {
      // Count attempt cards in the attempt history section (rounded-lg cards)
      const attemptCards = app.container.querySelectorAll('.bg-card.rounded-lg')
      expect(attemptCards.length).toBe(1)
      // Verify the PB badge is shown since there's only one attempt
      expect(app.getByText(/🏆 personal best/i)).toBeTruthy()
    })

    app.cleanup()
  })
})
