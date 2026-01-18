import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page } from '../helpers/locator'
import { expectElement, expectPoll } from '../helpers/assertions'
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

    it('stops timer on completion', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await completeAllExercises(2)

      const captured: { completionTime: string | null } = { completionTime: null }
      await expectPoll(async () => {
        const element = await page.getByText(/\d+:\d{2}/).element()
        if (element.classList.contains('text-6xl')) {
          captured.completionTime = element.textContent
          return captured.completionTime
        }
        return null
      }).toBeTruthy()

      await new Promise(resolve => setTimeout(resolve, 2000))

      const currentElement = await page.getByText(/\d+:\d{2}/).element()
      const currentTime = currentElement.classList.contains('text-6xl') ? currentElement.textContent : null
      expect(currentTime).toBe(captured.completionTime)

      app.cleanup()
    })

    it('saves workout to database with benchmarkId', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await completeAllExercises(2)

      await page.getByRole('button', { name: /view details/i }).click()
      await expectPoll(() => app.router.currentRoute.value.name).toBe('WorkoutSummary')

      const workouts = await getWorkoutsRepository().getHistory()
      expect(workouts).toHaveLength(1)
      expect(workouts[0]?.benchmarkId).toBe(benchmark.id)

      const block = workouts[0]?.blocks[0]
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

      await expectElement(page.getByText('PB: 1:00')).toBeVisible()

      await app.benchmarks.clickBenchmarkCard('Fran')
      await app.benchmarkDetail.waitForLoad('Fran')
      await expectPoll(async () => (await page.getByText(/personal best/i).all()).length).toBeGreaterThan(0)

      app.cleanup()
    })

    it('updates PB when faster time is achieved', async () => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 90, 5)
      await createCompletedAttempt(benchmark.id, 60, 2)
      await createCompletedAttempt(benchmark.id, 45, 0)

      const app = await createTestApp()
      await app.benchmarks.navigateToTab()
      await expectElement(page.getByText('PB: 0:45')).toBeVisible()

      app.cleanup()
    })

    it('keeps existing PB when slower time is completed', async () => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 60, 2)
      await createCompletedAttempt(benchmark.id, 90, 0)

      const app = await createTestApp()
      await app.benchmarks.navigateToTab()
      await expectElement(page.getByText('PB: 1:00')).toBeVisible()

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
      await expectElement(page.getByText('Thrusters')).toBeVisible()
      await completeExercise()
      await expectElement(page.getByText('Pull-ups')).toBeVisible()

      await expectPoll(async () => {
        const hasSplit = await page.getByText(/split/i).query() !== null
        const hasComparison = await page.getByText(/[+-]\d+:\d{2}|[+-]\d+s/i).query() !== null
        const hasPace = await page.getByText(/ahead|behind|on pace/i).query() !== null
        return hasSplit || hasComparison || hasPace
      }).toBe(true)

      app.cleanup()
    })

    it('shows minimum time as PB when multiple attempts exist', async () => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 90, 5) // slowest
      await createCompletedAttempt(benchmark.id, 45, 3) // fastest (PB)
      await createCompletedAttempt(benchmark.id, 60, 0) // most recent

      const app = await createTestApp()
      await app.benchmarks.navigateToTab()

      // Must show fastest (45s), not slowest (90s) or most recent (60s)
      await expectElement(page.getByText('PB: 0:45')).toBeVisible()

      app.cleanup()
    })

    it('marks only the fastest attempt as PB in history', async () => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 90, 5)
      await createCompletedAttempt(benchmark.id, 45, 3) // This should be PB
      await createCompletedAttempt(benchmark.id, 60, 0)

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Fran')

      // Wait for attempt history section to load - look for "Personal Best" text
      await expectElement(page.getByText(/personal best/i).first()).toBeVisible()

      // Find PB badges - should only be one (in attempt history)
      const pbBadges = page.getByText(/personal best/i).all()
      expect(pbBadges).toHaveLength(1)

      app.cleanup()
    })

    it('shows "ahead" when current split is faster than PB split', async () => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Exercise 1', reps: 10 },
          { name: 'Exercise 2', reps: 10 },
        ]
      })
      // PB with 60s first split
      await createCompletedAttempt(benchmark.id, 120, 5, [60, 60])

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)

      // Complete first exercise quickly (faster than 60s PB split)
      await completeExercise()

      // Should show "ahead" indicator since we completed much faster than 60s
      await expectElement(page.getByText(/ahead/i)).toBeVisible()

      app.cleanup()
    })

    it('shows split comparison at last exercise index', async () => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Exercise 1', reps: 10 },
          { name: 'Exercise 2', reps: 10 },
        ]
      })
      // PB with splits for both exercises
      await createCompletedAttempt(benchmark.id, 120, 5, [60, 60])

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)

      // Complete first exercise - now on second (last) exercise
      await completeExercise()

      // Verify we're on the second exercise
      await expectElement(page.getByRole('heading', { name: 'Exercise 2' })).toBeVisible()

      // Split comparison should work at last index (tests >= vs > bounds check)
      // Look for "ahead" or "behind" text which indicates split comparison is working
      await expectElement(page.getByText(/ahead|behind/i)).toBeVisible()

      app.cleanup()
    })

    it('handles multiple attempts with equal times correctly', async () => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 60, 5)
      await createCompletedAttempt(benchmark.id, 60, 0) // Same time, more recent

      const app = await createTestApp()
      await app.benchmarks.navigateToTab()

      // PB should show 60s (both attempts have equal best time)
      await expectElement(page.getByText('PB: 1:00')).toBeVisible()

      app.cleanup()
    })
  })
})
