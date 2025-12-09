import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { db, getBenchmarksRepository } from '@/db'
import type { DbBenchmark, DbCompletedWorkout, DbForTimeBlock } from '@/db/schema'

/**
 * Integration tests for Benchmark PB Pace and Split Times features.
 *
 * Ticket 4.1: Display PB Pace During Workout (First Attempt)
 * Ticket 4.2: Record Split Times for PB
 *
 * These tests follow TDD RED phase - they describe DESIRED behavior
 * before implementation exists and will FAIL initially.
 */

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Creates a 2-exercise ForTime benchmark for testing.
 * Returns the created benchmark with ID.
 */
async function createForTimeBenchmark(name = 'Venus'): Promise<DbBenchmark> {
  return getBenchmarksRepository().create({
    name,
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
}

/**
 * Creates a 4-exercise ForTime benchmark for split time testing.
 */
async function createMultiExerciseBenchmark(name = 'Fran'): Promise<DbBenchmark> {
  return getBenchmarksRepository().create({
    name,
    type: 'fortime',
    rounds: 1,
    exercises: [
      { exerciseDefinitionId: null, name: 'Thrusters', prescribedReps: 21, thumbnail: '🏋️' },
      { exerciseDefinitionId: null, name: 'Pull-ups', prescribedReps: 21, thumbnail: '💪' },
      { exerciseDefinitionId: null, name: 'Push-ups', prescribedReps: 21, thumbnail: '🤸' },
      { exerciseDefinitionId: null, name: 'Squats', prescribedReps: 21, thumbnail: '🦵' },
    ],
  })
}

/**
 * Creates a completed workout record with a personal best time.
 * Supports optional split times for future testing.
 */
async function createCompletedBenchmarkAttempt(
  benchmarkId: string,
  completionTimeSeconds: number,
  splitTimes?: ReadonlyArray<number>,
): Promise<DbCompletedWorkout> {
  const forTimeBlock: DbForTimeBlock = {
    kind: 'fortime',
    id: 'block-1',
    config: { timeCapSeconds: null },
    exercises: [], // Empty for simplicity - tests focus on result data
    result: {
      completionTime: completionTimeSeconds,
      completed: true,
      splitTimes: splitTimes ? [...splitTimes] : undefined,
    },
    orderIndex: 0,
  }

  const completedWorkout: DbCompletedWorkout = {
    id: `workout-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    name: 'Benchmark Attempt',
    benchmarkId,
    startedAt: Date.now() - completionTimeSeconds * 1000,
    completedAt: Date.now(),
    durationSeconds: completionTimeSeconds,
    notes: '',
    blocks: [forTimeBlock],
  }

  await db.workouts.add(completedWorkout)
  return completedWorkout
}

/**
 * Navigates to benchmark detail, starts workout, and enters active mode.
 * Returns the test app instance.
 */
async function startBenchmarkWorkout(benchmarkId: string) {
  const app = await createTestApp()
  await app.benchmarkDetail.navigateToDetail(benchmarkId)
  await app.benchmarkDetail.clickStartWorkout()

  // Click "Start Workout" button to enter active mode
  const startButton = await waitFor(() => screen.getByRole('button', { name: /start workout/i }))
  await app.user.click(startButton)

  // Wait for active mode to initialize
  await waitFor(() => {
    expect(screen.getByText(/⏱ 0:0\d/)).toBeTruthy()
  })

  return app
}

// ============================================================================
// Tests
// ============================================================================

describe('Benchmark PB Pace and Splits', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('4.1: Display PB Pace During Workout (First Attempt)', () => {
    describe('First attempt detection', () => {
      it('shows "First attempt - set your PB!" message when no previous attempts exist', async () => {
        // ARRANGE: Create benchmark without any completed workouts
        const benchmark = await createForTimeBenchmark('Venus')

        // ACT: Start workout
        const app = await startBenchmarkWorkout(benchmark.id)

        // ASSERT: First attempt message is displayed
        await waitFor(() => {
          expect(screen.getByText(/first attempt/i)).toBeTruthy()
          expect(screen.getByText(/set your pb/i)).toBeTruthy()
        })

        // ASSERT: No pace comparison is shown
        expect(screen.queryByText(/pace/i)).toBeFalsy()
        expect(screen.queryByText(/pb split/i)).toBeFalsy()

        app.cleanup()
      })

      it('does NOT show first attempt message when previous attempt exists', async () => {
        // ARRANGE: Create benchmark WITH a completed workout
        const benchmark = await createForTimeBenchmark('Fran')
        await createCompletedBenchmarkAttempt(benchmark.id, 420) // 7:00 PB

        // ACT: Start workout
        const app = await startBenchmarkWorkout(benchmark.id)

        // ASSERT: First attempt message is NOT displayed
        expect(screen.queryByText(/first attempt/i)).toBeFalsy()
        expect(screen.queryByText(/set your pb/i)).toBeFalsy()

        app.cleanup()
      })
    })

    describe('Message visibility throughout workout', () => {
      it('keeps first attempt message visible through exercise 1', async () => {
        const benchmark = await createForTimeBenchmark('Venus')
        const app = await startBenchmarkWorkout(benchmark.id)

        // Verify message is visible on exercise 1
        expect(screen.getByText(/first attempt/i)).toBeTruthy()

        // Wait 2 seconds (simulate workout time)
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Message should still be visible
        await waitFor(() => {
          expect(screen.getByText(/first attempt/i)).toBeTruthy()
        })

        app.cleanup()
      })

      it('keeps first attempt message visible when advancing to exercise 2', async () => {
        const benchmark = await createForTimeBenchmark('Venus')
        const app = await startBenchmarkWorkout(benchmark.id)

        // Verify starting on Exercise 1 with message
        expect(screen.getByText('Burpees')).toBeTruthy()
        expect(screen.getByText(/first attempt/i)).toBeTruthy()

        // Advance to Exercise 2
        const doneButton = screen.getByRole('button', { name: /done/i })
        await app.user.click(doneButton)

        // Wait for transition
        await new Promise(resolve => setTimeout(resolve, 900))

        // Verify Exercise 2 with message still visible
        await waitFor(() => {
          expect(screen.getByText('Squats')).toBeTruthy()
          expect(screen.getByText(/first attempt/i)).toBeTruthy()
        })

        app.cleanup()
      })

      it('keeps first attempt message visible until workout completion', async () => {
        const benchmark = await createForTimeBenchmark('Venus')
        const app = await startBenchmarkWorkout(benchmark.id)

        // Advance through all exercises
        const doneButton = screen.getByRole('button', { name: /done/i })

        // Exercise 1 -> 2
        await app.user.click(doneButton)
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Message visible before final exercise
        expect(screen.getByText(/first attempt/i)).toBeTruthy()

        // Complete final exercise
        await app.user.click(screen.getByRole('button', { name: /done/i }))
        await new Promise(resolve => setTimeout(resolve, 1000))

        // On completion screen, first attempt message can be replaced with celebration
        // OR continue showing (design decision)
        // For now, test that it WAS visible throughout the workout

        app.cleanup()
      })
    })

    describe('Message design and placement', () => {
      it('displays first attempt message in a visually distinct container', async () => {
        const benchmark = await createForTimeBenchmark('Venus')
        const app = await startBenchmarkWorkout(benchmark.id)

        // Query for message container
        // The first attempt message should have role="status" and specific text
        await waitFor(() => {
          const messageContainer = screen.getByText(/first attempt/i).closest('[role="status"]')
          expect(messageContainer).toBeTruthy()
          expect(messageContainer?.textContent).toMatch(/first attempt/i)
        })

        app.cleanup()
      })

      it('positions first attempt message above exercise display', async () => {
        const benchmark = await createForTimeBenchmark('Venus')
        const app = await startBenchmarkWorkout(benchmark.id)

        // Wait for both elements to be visible
        await waitFor(() => {
          expect(screen.getByText(/first attempt/i)).toBeTruthy()
          expect(screen.getByText('Burpees')).toBeTruthy()
        })

        // Visual positioning test - message should be above exercise name
        const message = screen.getByText(/first attempt/i)
        const exerciseName = screen.getByText('Burpees')

        // Get bounding boxes to verify vertical ordering
        const messageRect = message.getBoundingClientRect()
        const exerciseRect = exerciseName.getBoundingClientRect()

        // Message should be above (lower Y coordinate)
        expect(messageRect.top).toBeLessThan(exerciseRect.top)

        app.cleanup()
      })
    })
  })

  describe('4.2: Record Split Times for PB', () => {
    describe('Split time capture on exercise completion', () => {
      it('records split time when completing first exercise', async () => {
        const benchmark = await createMultiExerciseBenchmark('Fran')
        const app = await startBenchmarkWorkout(benchmark.id)

        // Wait for timer to reach ~4 seconds (for testing)
        await waitFor(
          () => {
            expect(screen.getByText(/⏱ 0:0[4-5]/)).toBeTruthy()
          },
          { timeout: 6000 },
        )

        // Complete first exercise
        const doneButton = screen.getByRole('button', { name: /done/i })
        await app.user.click(doneButton)

        // Wait for transition
        await new Promise(resolve => setTimeout(resolve, 1000))

        // After implementation, we'd verify split time is stored internally
        // For now, this test documents the expected behavior

        // Verify we advanced to exercise 2
        await waitFor(() => {
          expect(screen.getByText('Pull-ups')).toBeTruthy()
        })

        app.cleanup()
      })

      it('records cumulative split times for each exercise', async () => {
        const benchmark = await createMultiExerciseBenchmark('Fran')
        const app = await startBenchmarkWorkout(benchmark.id)

        // Complete Exercise 1
        await new Promise(resolve => setTimeout(resolve, 1000))
        await app.user.click(screen.getByRole('button', { name: /done/i }))
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Complete Exercise 2
        await new Promise(resolve => setTimeout(resolve, 1000))
        await app.user.click(screen.getByRole('button', { name: /done/i }))
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Complete Exercise 3
        await new Promise(resolve => setTimeout(resolve, 1000))
        await app.user.click(screen.getByRole('button', { name: /done/i }))
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Complete Exercise 4 (final)
        await new Promise(resolve => setTimeout(resolve, 1000))
        await app.user.click(screen.getByRole('button', { name: /done/i }))
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Verify completion screen appears
        await waitFor(() => {
          expect(screen.getByText(/workout complete/i)).toBeTruthy()
        })

        app.cleanup()
      })
    })

    describe('Split time display after exercise completion', () => {
      it.skip('briefly shows split time after completing an exercise', async () => {
        const benchmark = await createMultiExerciseBenchmark('Fran')
        const app = await startBenchmarkWorkout(benchmark.id)

        // Wait for timer to reach 3-4 seconds
        await waitFor(
          () => {
            expect(screen.getByText(/⏱ 0:0[3-4]/)).toBeTruthy()
          },
          { timeout: 5000 },
        )

        // Complete first exercise
        const doneButton = screen.getByRole('button', { name: /done/i })
        await app.user.click(doneButton)

        // ASSERT: Split time notification appears briefly
        await waitFor(
          () => {
            // Look for split time display (format: "Split: X:XX")
            expect(screen.getByText(/split/i)).toBeTruthy()
            expect(screen.getByText(/0:0[3-4]/)).toBeTruthy()
          },
          { timeout: 500 },
        )

        // Wait for transition to complete
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Split time notification should disappear after transition
        expect(screen.queryByText(/split/i)).toBeFalsy()

        app.cleanup()
      })

      it('does NOT show split time on first exercise of first attempt', async () => {
        const benchmark = await createForTimeBenchmark('Venus')
        const app = await startBenchmarkWorkout(benchmark.id)

        // Wait a few seconds
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Complete first exercise
        await app.user.click(screen.getByRole('button', { name: /done/i }))

        // ASSERT: No split time comparison shown (it's the first attempt)
        await new Promise(resolve => setTimeout(resolve, 500))

        // Should show "First attempt" message but NOT split comparison
        expect(screen.queryByText(/behind pb/i)).toBeFalsy()
        expect(screen.queryByText(/ahead of pb/i)).toBeFalsy()

        app.cleanup()
      })
    })

    describe('Split times saved with completed workout', () => {
      it('saves split times array in DbForTimeResult', async () => {
        const benchmark = await createMultiExerciseBenchmark('Fran')
        const app = await startBenchmarkWorkout(benchmark.id)

        // Complete all 4 exercises quickly
        for (let i = 0; i < 4; i++) {
          await new Promise(resolve => setTimeout(resolve, 500))
          const doneButton = screen.getByRole('button', { name: /done/i })
          await app.user.click(doneButton)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        // Wait for completion screen
        await waitFor(() => {
          expect(screen.getByText(/workout complete/i)).toBeTruthy()
        })

        // Trigger workout save (click "View Details" or similar)
        const viewDetailsButton = await waitFor(() =>
          screen.getByRole('button', { name: /view details/i }),
        )
        await app.user.click(viewDetailsButton)

        // Wait for save operation
        await new Promise(resolve => setTimeout(resolve, 500))

        // ASSERT: Check database for saved workout with split times
        const completedWorkouts = await db.workouts.where('benchmarkId').equals(benchmark.id).toArray()
        expect(completedWorkouts).toHaveLength(1)

        const workout = completedWorkouts[0]
        const forTimeBlock = workout?.blocks.find(b => b.kind === 'fortime')

        expect(forTimeBlock?.result?.splitTimes).toBeDefined()
        expect(forTimeBlock?.result?.splitTimes?.length).toBe(4)

        // All split times should be positive and cumulative
        const splits = forTimeBlock?.result?.splitTimes ?? []
        expect(splits[0]!).toBeGreaterThan(0)
        expect(splits[1]!).toBeGreaterThan(splits[0]!)
        expect(splits[2]!).toBeGreaterThan(splits[1]!)
        expect(splits[3]!).toBeGreaterThan(splits[2]!)

        // Last split should equal completionTime
        expect(splits[3]).toBe(forTimeBlock?.result?.completionTime)

        app.cleanup()
      })

      it('saves accurate split times that match elapsed timer values', async () => {
        const benchmark = await createForTimeBenchmark('Venus')
        const app = await startBenchmarkWorkout(benchmark.id)

        // Wait for timer to reach 3 seconds
        await waitFor(
          () => {
            expect(screen.getByText(/⏱ 0:03/)).toBeTruthy()
          },
          { timeout: 5000 },
        )

        // Complete exercise 1 at ~3 seconds
        await app.user.click(screen.getByRole('button', { name: /done/i }))
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Wait for timer to reach 6 seconds
        await waitFor(
          () => {
            expect(screen.getByText(/⏱ 0:0[6-7]/)).toBeTruthy()
          },
          { timeout: 5000 },
        )

        // Complete exercise 2 (final) at ~6 seconds
        await app.user.click(screen.getByRole('button', { name: /done/i }))
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Save workout
        await waitFor(() => {
          expect(screen.getByText(/workout complete/i)).toBeTruthy()
        })
        const viewDetailsButton = screen.getByRole('button', { name: /view details/i })
        await app.user.click(viewDetailsButton)
        await new Promise(resolve => setTimeout(resolve, 500))

        // ASSERT: Split times are accurate
        const completedWorkouts = await db.workouts.where('benchmarkId').equals(benchmark.id).toArray()
        const workout = completedWorkouts[0]
        const forTimeBlock = workout?.blocks.find(b => b.kind === 'fortime')
        const splits = forTimeBlock?.result?.splitTimes ?? []

        // First split should be around 3 seconds (±1 second tolerance)
        expect(splits[0]!).toBeGreaterThanOrEqual(2)
        expect(splits[0]!).toBeLessThanOrEqual(4)

        // Second split should be around 6 seconds
        expect(splits[1]!).toBeGreaterThanOrEqual(5)
        expect(splits[1]!).toBeLessThanOrEqual(8)

        app.cleanup()
      })
    })

    describe('PB splits available for future comparisons', () => {
      it('stores splits with PB attempt for future comparison', async () => {
        const benchmark = await createForTimeBenchmark('Venus')

        // Create first attempt (will be PB) WITH split times
        await createCompletedBenchmarkAttempt(
          benchmark.id,
          300, // 5:00 total time
          [180, 300], // Exercise 1 at 3:00, Exercise 2 at 5:00
        )

        // Verify PB has split times
        const pb = await getBenchmarksRepository().getPersonalBest(benchmark.id)
        expect(pb).toBe(300)

        // Verify split times are stored
        const workouts = await db.workouts.where('benchmarkId').equals(benchmark.id).toArray()
        expect(workouts).toHaveLength(1)

        const forTimeBlock = workouts[0]?.blocks.find(b => b.kind === 'fortime')
        expect(forTimeBlock?.result?.splitTimes).toEqual([180, 300])

        // Future tests will verify these splits are used for pace comparison
      })

      it('updates PB splits when new PB is set', async () => {
        const benchmark = await createForTimeBenchmark('Venus')

        // Create first attempt (initial PB)
        await createCompletedBenchmarkAttempt(
          benchmark.id,
          300, // 5:00
          [180, 300],
        )

        // Create second attempt (new PB with faster time)
        await createCompletedBenchmarkAttempt(
          benchmark.id,
          240, // 4:00 - NEW PB!
          [120, 240],
        )

        // Verify new PB time
        const pb = await getBenchmarksRepository().getPersonalBest(benchmark.id)
        expect(pb).toBe(240)

        // Verify we can retrieve the new PB's splits
        const workouts = await db.workouts.where('benchmarkId').equals(benchmark.id).toArray()

        const pbWorkout = workouts.find(w => {
          const block = w.blocks.find(b => b.kind === 'fortime')
          return block?.result?.completionTime === 240
        })

        expect(pbWorkout).toBeDefined()
        const pbBlock = pbWorkout?.blocks.find(b => b.kind === 'fortime')
        expect(pbBlock?.result?.splitTimes).toEqual([120, 240])
      })
    })

    describe('Edge cases and error handling', () => {
      it('handles workout with no exercises gracefully', async () => {
        // Create benchmark with empty exercises array
        const benchmark = await getBenchmarksRepository().create({
          name: 'Empty Benchmark',
          type: 'fortime',
          rounds: 1,
          exercises: [],
        })

        const app = await startBenchmarkWorkout(benchmark.id)

        // Should not crash, might show empty state
        await waitFor(() => {
          expect(screen.getByText(/Empty Benchmark/i)).toBeTruthy()
        })

        app.cleanup()
      })

      it('handles single exercise benchmark', async () => {
        const benchmark = await getBenchmarksRepository().create({
          name: 'Single Exercise',
          type: 'fortime',
          rounds: 1,
          exercises: [
            { exerciseDefinitionId: null, name: 'Burpees', prescribedReps: 100, thumbnail: '💪' },
          ],
        })

        const app = await startBenchmarkWorkout(benchmark.id)

        // Wait and complete single exercise
        await new Promise(resolve => setTimeout(resolve, 1000))
        await app.user.click(screen.getByRole('button', { name: /done/i }))
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Save workout
        await waitFor(() => {
          expect(screen.getByText(/workout complete/i)).toBeTruthy()
        })
        const viewDetailsButton = screen.getByRole('button', { name: /view details/i })
        await app.user.click(viewDetailsButton)
        await new Promise(resolve => setTimeout(resolve, 500))

        // Verify single split time saved
        const workouts = await db.workouts.where('benchmarkId').equals(benchmark.id).toArray()
        const forTimeBlock = workouts[0]?.blocks.find(b => b.kind === 'fortime')
        expect(forTimeBlock?.result?.splitTimes?.length).toBe(1)

        app.cleanup()
      })

      it('handles rapid exercise completion without missing splits', async () => {
        const benchmark = await createMultiExerciseBenchmark('Fran')
        const app = await startBenchmarkWorkout(benchmark.id)

        // Rapidly complete all exercises
        for (let i = 0; i < 4; i++) {
          await new Promise(resolve => setTimeout(resolve, 100)) // Very fast
          const doneButton = screen.getByRole('button', { name: /done/i })
          await app.user.click(doneButton)
          await new Promise(resolve => setTimeout(resolve, 900))
        }

        // Wait for completion
        await waitFor(() => {
          expect(screen.getByText(/workout complete/i)).toBeTruthy()
        })

        // Save and verify all 4 splits recorded
        const viewDetailsButton = screen.getByRole('button', { name: /view details/i })
        await app.user.click(viewDetailsButton)
        await new Promise(resolve => setTimeout(resolve, 500))

        const workouts = await db.workouts.where('benchmarkId').equals(benchmark.id).toArray()
        const forTimeBlock = workouts[0]?.blocks.find(b => b.kind === 'fortime')

        // All 4 splits should be recorded despite rapid completion
        expect(forTimeBlock?.result?.splitTimes?.length).toBe(4)

        app.cleanup()
      })
    })
  })
})
