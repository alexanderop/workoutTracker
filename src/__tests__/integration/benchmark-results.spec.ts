/* eslint-disable vitest/no-conditional-in-test, vitest/no-conditional-expect -- A result card is intentionally optional before it is created. */
import { page } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import {
  createForTimeBenchmark,
  startBenchmarkWorkout,
  completeExercise,
  completeAllExercises,
  createCompletedAttempt,
  waitForCompletionScreen,
  getWorkoutsRepository as getWorkoutsRepo,
} from './helpers/benchmarkHelpers'

describe('Benchmark Results', () => {
  describe('Completion', () => {
    it('displays completion screen with final time', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark()
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await completeAllExercises(2)

      await waitForCompletionScreen()
      expect((await page.getByText('Fran').all()).length).toBeGreaterThan(0)
      expect((await page.getByText(/\d+:\d{2}/).all()).length).toBeGreaterThan(0)
    })

    it('stops timer on completion', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark()
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await completeAllExercises(2)

      const captured: { completionTime: string | null } = { completionTime: null }
      await expect
        .poll(async () => {
          const element = await page.getByText(/\d+:\d{2}/).element()
          if (element.classList.contains('text-6xl')) {
            captured.completionTime = element.textContent
            return captured.completionTime
          }
          return null
        })
        .toBeTruthy()

      // A stopped clock must remain stable across real native timer ticks. Poll
      // until that observation window has elapsed instead of sleeping a buffer.
      const verificationStartedAt = performance.now()
      await expect
        .poll(
          async () => {
            const currentElement = await page.getByText(/\d+:\d{2}/).element()
            const currentTime = currentElement.classList.contains('text-6xl')
              ? currentElement.textContent
              : null
            return (
              performance.now() - verificationStartedAt >= 2000 &&
              currentTime === captured.completionTime
            )
          },
          { timeout: 3000 },
        )
        .toBe(true)
    })

    it('saves workout to database with benchmarkId', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark()
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await completeAllExercises(2)

      await page.getByRole('button', { name: /view details/i }).click()
      await expect.poll(() => app.router.currentRoute.value.name).toBe('WorkoutSummary')

      const workouts = await getWorkoutsRepo().getHistory()
      expect(workouts).toHaveLength(1)
      expect(workouts[0]?.benchmarkId).toBe(benchmark.id)

      const block = workouts[0]?.blocks[0]
      expect(block?.kind).toBe('fortime')
      if (block?.kind === 'fortime') {
        expect(block.result?.completed).toBe(true)
        expect(block.result?.completionTime).toBeGreaterThan(0)
      }
    })
  })

  describe('Personal Best Tracking', () => {
    it('saves first attempt as PB', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 60)

      const app = await createTestApp()
      await app.benchmarks.navigateToTab()

      await expect.element(page.getByText('PB: 1:00')).toBeVisible()

      await app.benchmarks.clickBenchmarkCard('Fran')
      await app.benchmarkDetail.waitForLoad('Fran')
      await expect
        .poll(async () => (await page.getByText(/personal best/i).all()).length)
        .toBeGreaterThan(0)
    })

    it('updates PB when faster time is achieved', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 90, 5)
      await createCompletedAttempt(benchmark.id, 60, 2)
      await createCompletedAttempt(benchmark.id, 45, 0)

      const app = await createTestApp()
      await app.benchmarks.navigateToTab()
      await expect.element(page.getByText('PB: 0:45')).toBeVisible()
    })

    it('keeps existing PB when slower time is completed', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 60, 2)
      await createCompletedAttempt(benchmark.id, 90, 0)

      const app = await createTestApp()
      await app.benchmarks.navigateToTab()
      await expect.element(page.getByText('PB: 1:00')).toBeVisible()
    })

    it('displays split time comparison to PB during workout', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark({
        name: 'Fran',
        exercises: [
          { name: 'Thrusters', reps: 21 },
          { name: 'Pull-ups', reps: 21 },
        ],
      })
      await createCompletedAttempt(benchmark.id, 180, 5, [90])

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)
      await expect.element(page.getByText('Thrusters')).toBeVisible()
      await completeExercise()
      await expect.element(page.getByText('Pull-ups')).toBeVisible()

      await expect
        .poll(async () => {
          const hasSplit = (await page.getByText(/split/i).query()) !== null
          const hasComparison = (await page.getByText(/[+-]\d+:\d{2}|[+-]\d+s/i).query()) !== null
          const hasPace = (await page.getByText(/ahead|behind|on pace/i).query()) !== null
          return hasSplit || hasComparison || hasPace
        })
        .toBe(true)
    })

    it('shows minimum time as PB when multiple attempts exist', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 90, 5) // slowest
      await createCompletedAttempt(benchmark.id, 45, 3) // fastest (PB)
      await createCompletedAttempt(benchmark.id, 60, 0) // most recent

      const app = await createTestApp()
      await app.benchmarks.navigateToTab()

      // Must show fastest (45s), not slowest (90s) or most recent (60s)
      await expect.element(page.getByText('PB: 0:45')).toBeVisible()
    })

    it('marks only the fastest attempt as PB in history', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 90, 5)
      await createCompletedAttempt(benchmark.id, 45, 3) // This should be PB
      await createCompletedAttempt(benchmark.id, 60, 0)

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Fran')

      // Only the fastest attempt carries the trophy badge in attempt history
      const pbBadges = await page.getByTestId('app-icon-trophy').all()
      expect(pbBadges).toHaveLength(1)
    })

    it('shows "ahead" when current split is faster than PB split', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Exercise 1', reps: 10 },
          { name: 'Exercise 2', reps: 10 },
        ],
      })
      // PB with 60s first split
      await createCompletedAttempt(benchmark.id, 120, 5, [60, 60])

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)

      // Complete first exercise quickly (faster than 60s PB split)
      await completeExercise()

      // Should show "ahead" indicator since we completed much faster than 60s
      await expect.element(page.getByText(/ahead/i)).toBeVisible()
    })

    it('shows split comparison at last exercise index', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Exercise 1', reps: 10 },
          { name: 'Exercise 2', reps: 10 },
        ],
      })
      // PB with splits for both exercises
      await createCompletedAttempt(benchmark.id, 120, 5, [60, 60])

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)

      // Complete first exercise - now on second (last) exercise
      await completeExercise()

      // Verify we're on the second exercise
      await expect.element(page.getByRole('heading', { name: 'Exercise 2' })).toBeVisible()

      // Split comparison should work at last index (tests >= vs > bounds check)
      // Look for "ahead" or "behind" text which indicates split comparison is working
      await expect.element(page.getByText(/ahead|behind/i)).toBeVisible()
    })

    it('handles multiple attempts with equal times correctly', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 60, 5)
      await createCompletedAttempt(benchmark.id, 60, 0) // Same time, more recent

      const app = await createTestApp()
      await app.benchmarks.navigateToTab()

      // PB should show 60s (both attempts have equal best time)
      await expect.element(page.getByText('PB: 1:00')).toBeVisible()
    })
  })
})
