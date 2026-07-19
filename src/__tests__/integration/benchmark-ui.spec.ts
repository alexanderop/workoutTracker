import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import {
  createForTimeBenchmark,
  createRoundsBenchmark,
  startBenchmarkWorkout,
  completeExercise,
  createCompletedAttempt,
} from './helpers/benchmarkHelpers'

describe('Benchmark UI', () => {
  describe('Attempt History', () => {
    // eslint-disable-next-line vitest/expect-expect -- Assertions live in the Benchmarks page object.
    it('displays benchmarks tab with empty state', async ({ createTestApp }) => {
      const app = await createTestApp()
      await app.benchmarks.navigateToTab()
      await app.benchmarks.assertEmptyState()
    })

    it('navigates from list to detail page', async ({ createTestApp }) => {
      await createForTimeBenchmark({ name: 'Benchmark 1' })
      await createForTimeBenchmark({ name: 'Benchmark 2' })

      const app = await createTestApp()
      await app.benchmarks.navigateToTab()

      await expect.element(page.getByText('Benchmark 1')).toBeVisible()
      await expect.element(page.getByText('Benchmark 2')).toBeVisible()

      await app.benchmarks.clickBenchmarkCard('Benchmark 2')
      await expect.poll(() => app.router.currentRoute.value.path).toContain('/benchmarks/')
      await app.benchmarkDetail.waitForLoad('Benchmark 2')
    })

    it('displays attempt history sorted by date', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 90, 5)
      await createCompletedAttempt(benchmark.id, 75, 2)
      await createCompletedAttempt(benchmark.id, 60, 0)

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Fran')

      await expect
        .poll(async () => (await page.getByText(/\d+:\d{2}/).all()).length)
        .toBeGreaterThanOrEqual(3)
    })

    it('handles invalid benchmark ID', async ({ createTestApp }) => {
      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail('invalid-id')

      await app.benchmarkDetail.assertNotFoundState()
      await app.benchmarkDetail.clickGoBack()
      expect(app.router.currentRoute.value.path).toBe('/workouts')
    })
  })

  describe('Progress Display', () => {
    it('displays segmented progress bar showing rounds', async ({ createTestApp }) => {
      const benchmark = await createRoundsBenchmark({
        name: 'Cindy',
        rounds: 3,
        exercises: [
          { name: 'Pull-ups', reps: 5 },
          { name: 'Push-ups', reps: 10 },
        ],
      })
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await expect.element(page.getByText(/round 1\/3/i)).toBeVisible()
      await expect.element(page.getByText(/1\/6/i)).toBeVisible()
    })

    it('updates progress counts when advancing', async ({ createTestApp }) => {
      const benchmark = await createRoundsBenchmark({
        name: 'Test Progress',
        rounds: 2,
        exercises: [
          { name: 'Ex1', reps: 5 },
          { name: 'Ex2', reps: 5 },
        ],
      })
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await expect.element(page.getByText(/round 1\/2/i)).toBeVisible()
      await expect.element(page.getByText(/1\/4/i)).toBeVisible()

      await completeExercise()
      await expect.element(page.getByText(/2\/4/i)).toBeVisible()

      await completeExercise()
      await expect.element(page.getByText(/round 2\/2/i)).toBeVisible()
      await expect.element(page.getByText(/3\/4/i)).toBeVisible()
    })

    it('displays next exercise preview in footer', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark({
        name: 'Preview Test',
        exercises: [
          { name: 'Thrusters', reps: 21 },
          { name: 'Pull-ups', reps: 15 },
          { name: 'Box Jumps', reps: 9 },
        ],
      })
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await expect.element(page.getByText('NEXT', { exact: true })).toBeVisible()
      await expect
        .poll(async () => (await page.getByText(/pull-ups/i).all()).length)
        .toBeGreaterThan(0)

      await completeExercise()
      await expect
        .poll(async () => (await page.getByText(/box jumps/i).all()).length)
        .toBeGreaterThan(0)
    })

    it('shows final exercise indicator on last exercise', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Exercise 1', reps: 10 },
          { name: 'Exercise 2', reps: 10 },
        ],
      })
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await expect.element(page.getByText('NEXT', { exact: true })).toBeVisible()

      await completeExercise()
      await expect.element(page.getByText(/final exercise/i)).toBeVisible()
    })
  })

  describe('First Attempt Baseline', () => {
    it('displays first attempt baseline message', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Exercise 1', reps: 10 },
          { name: 'Exercise 2', reps: 10 },
        ],
      })

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)

      await expect.element(page.getByText('First attempt - set your PB!')).toBeVisible()
      await expect.element(page.getByText(/setting your baseline/i)).toBeVisible()
      await expect.element(page.getByText(/go all out/i)).toBeVisible()
    })
  })

  describe('Pace Indicators', () => {
    it('displays ahead indicator when faster than PB', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Ex1', reps: 10 },
          { name: 'Ex2', reps: 10 },
        ],
      })
      await createCompletedAttempt(benchmark.id, 240, 1, [120])

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)
      await completeExercise()

      await expect
        .poll(async () => (await page.getByText(/you're.*ahead/i).query()) !== null, {
          timeout: 3000,
        })
        .toBe(true)
    })

    it('displays behind indicator when slower than PB', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Ex1', reps: 10 },
          { name: 'Ex2', reps: 10 },
        ],
      })
      await createCompletedAttempt(benchmark.id, 2, 1, [1])

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)

      // Elapsed time is the pace-comparison input, so wait for the rendered
      // clock to cross the PB split instead of guessing when that happened.
      await expect
        .poll(
          async () => {
            const activeClock = await page.getByRole('timer', { name: /elapsed time/i }).element()
            const [minutes = 0, seconds = 0] = (activeClock.textContent ?? '0:00')
              .split(':')
              .map(Number)
            return minutes * 60 + seconds
          },
          { timeout: 3500 },
        )
        .toBeGreaterThanOrEqual(2)
      await completeExercise()

      await expect
        .poll(async () => (await page.getByText(/push.*behind/i).query()) !== null, {
          timeout: 3000,
        })
        .toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('supports keyboard navigation', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Exercise 1', reps: 10 },
          { name: 'Exercise 2', reps: 10 },
          { name: 'Exercise 3', reps: 10 },
        ],
      })

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)
      await expect.element(page.getByRole('heading', { name: 'Exercise 1' })).toBeVisible()

      await page.getByRole('button', { name: /tap to advance/i }).click()
      await expect.element(page.getByRole('heading', { name: 'Exercise 2' })).toBeVisible()

      await userEvent.keyboard('{Enter}')
      await expect.element(page.getByRole('heading', { name: 'Exercise 3' })).toBeVisible()
    })

    it('provides accessible progress announcements', async ({ createTestApp }) => {
      const benchmark = await createRoundsBenchmark({
        name: 'A11y Test',
        rounds: 3,
        exercises: [{ name: 'Ex1', reps: 5 }],
      })

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)

      await expect.element(page.getByRole('status', { name: /exercise 1 of 3/i })).toBeVisible()
    })
  })
})
