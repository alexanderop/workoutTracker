import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import {
  createForTimeBenchmark,
  startBenchmarkWorkout,
  completeExercise,
  completeAllExercises,
  createCompletedAttempt,
  waitForCompletionScreen,
  getWorkoutsRepository,
} from './helpers/benchmarkHelpers'

describe('Benchmark Results', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Completion', () => {
    it('displays completion screen with final time', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await completeAllExercises(2)

      await waitForCompletionScreen()
      expect((await page.getByText('Fran').all()).length).toBeGreaterThan(0)
      expect((await page.getByText(/\d+:\d{2}/).all()).length).toBeGreaterThan(0)

      app.cleanup()
    })

    it('saves completed workout with duration', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await completeAllExercises(2)

      // Wait for completion screen
      await waitForCompletionScreen()

      // Navigate to summary to trigger save
      await page.getByRole('button', { name: /view details/i }).click()
      await expect.poll(() => app.router.currentRoute.value.name).toBe('WorkoutSummary')

      // Verify workout saved with non-zero duration (proves timer was running and stopped)
      const workouts = await getWorkoutsRepository().getHistory()
      expect(workouts).toHaveLength(1)
      expect(workouts[0]?.durationSeconds).toBeGreaterThan(0)

      app.cleanup()
    })

    it('saves workout to database with benchmarkId', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await completeAllExercises(2)

      await page.getByRole('button', { name: /view details/i }).click()
      await expect.poll(() => app.router.currentRoute.value.name).toBe('WorkoutSummary')

      const workoutHeaders = await getWorkoutsRepository().getHistory()
      expect(workoutHeaders).toHaveLength(1)
      expect(workoutHeaders[0]?.benchmarkId).toBe(benchmark.id)

      // Get full workout with blocks
      const workout = await getWorkoutsRepository().getById(workoutHeaders[0]!.id)
      const block = workout?.blocks[0]
      expect(block?.kind).toBe('fortime')
      if (block?.kind === 'fortime') {
        expect(block.result?.completed).toBe(true)
        expect(block.result?.completionTime).toBeGreaterThan(0)
      }

      app.cleanup()
    })
  })

  describe('Personal Best Tracking', () => {
    it('saves first attempt as PB', async () => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 60)

      const app = await createTestApp()
      await app.benchmarks.navigateToTab()

      await expect.element(page.getByText('PB: 1:00')).toBeVisible()

      await app.benchmarks.clickBenchmarkCard('Fran')
      await app.benchmarkDetail.waitForLoad('Fran')
      await expect.poll(async () => (await page.getByText(/personal best/i).all()).length).toBeGreaterThan(0)

      app.cleanup()
    })

    it('updates PB when faster time is achieved', async () => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 90, 5)
      await createCompletedAttempt(benchmark.id, 60, 2)
      await createCompletedAttempt(benchmark.id, 45, 0)

      const app = await createTestApp()
      await app.benchmarks.navigateToTab()
      await expect.element(page.getByText('PB: 0:45')).toBeVisible()

      app.cleanup()
    })

    it('keeps existing PB when slower time is completed', async () => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 60, 2)
      await createCompletedAttempt(benchmark.id, 90, 0)

      const app = await createTestApp()
      await app.benchmarks.navigateToTab()
      await expect.element(page.getByText('PB: 1:00')).toBeVisible()

      app.cleanup()
    })

    it('displays split time comparison to PB during workout', async () => {
      const benchmark = await createForTimeBenchmark({
        name: 'Fran',
        exercises: [
          { name: 'Thrusters', reps: 21 },
          { name: 'Pull-ups', reps: 21 },
        ]
      })
      await createCompletedAttempt(benchmark.id, 180, 5, [90])

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)
      await expect.element(page.getByText('Thrusters')).toBeVisible()
      await completeExercise()
      await expect.element(page.getByText('Pull-ups')).toBeVisible()

      await expect.poll(async () => {
        const hasSplit = await page.getByText(/split/i).query() !== null
        const hasComparison = await page.getByText(/[+-]\d+:\d{2}|[+-]\d+s/i).query() !== null
        const hasPace = await page.getByText(/ahead|behind|on pace/i).query() !== null
        return hasSplit || hasComparison || hasPace
      }).toBe(true)

      app.cleanup()
    })
  })
})
