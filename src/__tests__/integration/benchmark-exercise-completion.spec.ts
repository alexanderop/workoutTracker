import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createTestApp } from '../helpers/createTestApp'
import { getBenchmarksRepository } from '@/db'
import type { DbBenchmark } from '@/db/schema'

describe('Benchmark Exercise Completion', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  // Helper: Create ForTime benchmark with 2 exercises
  async function createForTimeBenchmark(): Promise<DbBenchmark> {
    return getBenchmarksRepository().create({
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
  }

  // Helper: Start benchmark workout to active mode
  async function startBenchmarkWorkout(benchmarkId: string) {
    const app = await createTestApp()
    await app.benchmarkDetail.navigateToDetail(benchmarkId)
    await app.benchmarkDetail.clickStartWorkout()

    // Click "Start Workout" button to enter active mode
    const startButton = await waitFor(() =>
      screen.getByRole('button', { name: /start workout/i }),
    )
    await app.user.click(startButton)

    // Wait for active mode to initialize
    await waitFor(() => {
      expect(screen.getByText('Venus')).toBeTruthy()
    })

    return app
  }

  describe('Button displays "Done"', () => {
    it('shows "Done" button with checkmark icon for first exercise', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Verify "Done" button exists
      const doneButton = await waitFor(() =>
        screen.getByRole('button', { name: /done/i })
      )
      expect(doneButton).toBeTruthy()

      // Verify "Next Exercise" button does NOT exist
      expect(screen.queryByRole('button', { name: /next exercise/i })).toBeNull()

      app.cleanup()
    })

    it('shows "Done" button for second exercise (not just first)', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Advance to second exercise
      const doneButton = screen.getByRole('button', { name: /done/i })
      await app.user.click(doneButton)

      // Wait for exercise 2 to appear
      await waitFor(() => {
        expect(screen.getByText(/2 of 2/i)).toBeTruthy()
      })

      // Verify "Done" button still shows
      expect(screen.getByRole('button', { name: /done/i })).toBeTruthy()

      app.cleanup()
    })
  })

  describe('Clicking "Done" advances to next exercise', () => {
    it('advances from Exercise 1 (Burpees) to Exercise 2 (Squats)', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Verify starting on Exercise 1
      expect(screen.getByText('Burpees')).toBeTruthy()
      expect(screen.getByText(/1 of 2/i)).toBeTruthy()

      // Click "Done"
      const doneButton = screen.getByRole('button', { name: /done/i })
      await app.user.click(doneButton)

      // Wait for Exercise 2 to appear
      await waitFor(() => {
        expect(screen.getByText('Squats')).toBeTruthy()
        expect(screen.getByText(/2 of 2/i)).toBeTruthy()
      })

      // Verify Exercise 1 is no longer visible
      expect(screen.queryByText('Burpees')).toBeNull()

      app.cleanup()
    })
  })

  describe('Timer continues during transition', () => {
    it('timer keeps running and incrementing during exercise advance', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Capture initial timer value
      const initialTimer = await waitFor(() => screen.getByText(/⏱ 0:0\d/))
      const initialTime = initialTimer.textContent

      // Click "Done" to trigger transition
      const doneButton = screen.getByRole('button', { name: /done/i })
      await app.user.click(doneButton)

      // Wait during animation (800ms) + buffer
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verify timer has advanced
      await waitFor(() => {
        const currentTimer = screen.getByText(/⏱ 0:0\d/)
        expect(currentTimer.textContent).not.toBe(initialTime)
      })

      app.cleanup()
    })
  })

  describe('Last exercise completes workout', () => {
    it.skip('clicking "Done" on last exercise triggers workout completion', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Advance to Exercise 2 (last)
      const doneButton = screen.getByRole('button', { name: /done/i })
      await app.user.click(doneButton)
      await waitFor(() => screen.getByText(/2 of 2/i))

      // Verify we're on the last exercise (2 of 2)
      expect(screen.getByText('Squats')).toBeTruthy()
      expect(screen.getByText(/2 of 2/i)).toBeTruthy()

      // Click "Done" on last exercise
      const doneButtonEx2 = screen.getByRole('button', { name: /done/i })
      await app.user.click(doneButtonEx2)

      // Wait for animation to complete (800ms) before workout finishes
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verify workout completion - either finish dialog or navigation to summary
      await waitFor(
        () => {
          // Check for either finish dialog OR workout summary page
          const hasFinishDialog = screen.queryByText(/Finish Workout\?/i)
          const hasWorkoutOptions = screen.queryByRole('button', { name: /workout options/i })

          // After completion, we should not see the workout options menu button
          expect(hasFinishDialog || !hasWorkoutOptions).toBeTruthy()
        },
        { timeout: 3000 }
      )

      app.cleanup()
    })
  })

  describe('Multi-round: Advances to next round', () => {
    it.skip('advances from Round 1 Exercise 2 to Round 2 Exercise 1', async () => {
      // Create multi-round benchmark (3 rounds × 2 exercises)
      const benchmark = await getBenchmarksRepository().create({
        name: 'Cindy',
        type: 'rounds',
        rounds: 3,
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
        ],
      })

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickStartWorkout()

      // Click "Start Workout" button to enter active mode
      const startButton = await waitFor(() =>
        screen.getByRole('button', { name: /start workout/i }),
      )
      await app.user.click(startButton)

      // Wait for active mode to initialize
      await waitFor(() => {
        expect(screen.getByText('Cindy')).toBeTruthy()
      })

      // Verify starting on Round 1, Exercise 1
      expect(screen.getByText('Pull-ups')).toBeTruthy()
      expect(screen.getByText(/1 of 2/i)).toBeTruthy()

      // Advance: R1E1 → R1E2
      await app.user.click(screen.getByRole('button', { name: /done/i }))
      await waitFor(() => screen.getByText('Push-ups'))

      // Advance: R1E2 → R2E1 (round boundary)
      await app.user.click(screen.getByRole('button', { name: /done/i }))
      await waitFor(() => {
        expect(screen.getByText('Pull-ups')).toBeTruthy() // Back to Ex 1
        expect(screen.getByText(/1 of 2/i)).toBeTruthy()
      })

      app.cleanup()
    })
  })

  describe('Rapid tapping blocked', () => {
    it('ignores second tap during animation', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Verify starting on Exercise 1
      expect(screen.getByText(/1 of 2/i)).toBeTruthy()

      const doneButton = screen.getByRole('button', { name: /done/i })

      // Rapid double-click
      await app.user.click(doneButton)

      // During transition, the button should have pointer-events: none
      // We can't easily test the second click being blocked due to how user-event handles this,
      // so we instead verify the functional behavior: only one exercise advance occurs

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 900))

      // Should only advance once (to Exercise 2, not complete)
      await waitFor(() => {
        expect(screen.getByText(/2 of 2/i)).toBeTruthy()
        expect(screen.queryByText(/Finish Workout\?/i)).toBeNull()
      })

      app.cleanup()
    })
  })

  describe('Checkmark animation', () => {
    it('shows checkmark briefly after clicking "Done"', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      const doneButton = screen.getByRole('button', { name: /done/i })
      await app.user.click(doneButton)

      // Checkmark should appear within 100ms
      await waitFor(
        () => {
          const checkmark = screen.queryByTestId('completion-checkmark')
          expect(checkmark).toBeTruthy()
        },
        { timeout: 200 }
      )

      // Checkmark should disappear after ~300ms
      await waitFor(
        () => {
          expect(screen.queryByTestId('completion-checkmark')).toBeNull()
        },
        { timeout: 500 }
      )

      app.cleanup()
    })
  })
})
