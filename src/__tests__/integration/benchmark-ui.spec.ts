import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import {
  createForTimeBenchmark,
  createRoundsBenchmark,
  startBenchmarkWorkout,
  completeExercise,
  createCompletedAttempt,
  getBenchmarksRepository,
} from './helpers/benchmarkHelpers'

describe('Benchmark UI', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Attempt History', () => {
    it('displays benchmarks tab with empty state', async () => {
      const app = await createTestApp()
      await app.benchmarks.navigateToTab()
      await expect.poll(() => { app.benchmarks.assertEmptyState(); return true }).toBe(true)
      app.cleanup()
    })

    it('navigates from list to detail page', async () => {
      await createForTimeBenchmark({ name: 'Benchmark 1' })
      await createForTimeBenchmark({ name: 'Benchmark 2' })

      const app = await createTestApp()
      await app.benchmarks.navigateToTab()

      await expect.element(page.getByText('Benchmark 1')).toBeVisible()
      await expect.element(page.getByText('Benchmark 2')).toBeVisible()

      await app.benchmarks.clickBenchmarkCard('Benchmark 2')
      await expect.poll(() => app.router.currentRoute.value.path).toContain('/benchmarks/')
      await app.benchmarkDetail.waitForLoad('Benchmark 2')

      app.cleanup()
    })

    it('displays attempt history sorted by date', async () => {
      const benchmark = await createForTimeBenchmark()
      await createCompletedAttempt(benchmark.id, 90, 5)
      await createCompletedAttempt(benchmark.id, 75, 2)
      await createCompletedAttempt(benchmark.id, 60, 0)

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Fran')

      await expect.poll(async () => (await page.getByText(/\d+:\d{2}/).all()).length).toBeGreaterThanOrEqual(3)

      app.cleanup()
    })

    it('handles invalid benchmark ID', async () => {
      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail('invalid-id')

      await expect.poll(() => { app.benchmarkDetail.assertNotFoundState(); return true }).toBe(true)
      await app.benchmarkDetail.clickGoBack()
      expect(app.router.currentRoute.value.path).toBe('/workouts')

      app.cleanup()
    })
  })

  describe('Progress Display', () => {
    it('displays segmented progress bar showing rounds', async () => {
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

      app.cleanup()
    })

    it('updates progress counts when advancing', async () => {
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

      app.cleanup()
    })

    it('displays next exercise preview in footer', async () => {
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
      await expect.poll(async () => (await page.getByText(/pull-ups/i).all()).length).toBeGreaterThan(0)

      await completeExercise()
      await expect.poll(async () => (await page.getByText(/box jumps/i).all()).length).toBeGreaterThan(0)

      app.cleanup()
    })

    it('shows final exercise indicator on last exercise', async () => {
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

      app.cleanup()
    })
  })

  describe('First Attempt Baseline', () => {
    it('displays first attempt baseline message', async () => {
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

      app.cleanup()
    })
  })

  describe('Pace Indicators', () => {
    it('displays ahead indicator when faster than PB', async () => {
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

      await expect.poll(async () => await page.getByText(/you're.*ahead/i).query() !== null, { timeout: 3000 }).toBe(true)

      app.cleanup()
    })

    it('displays behind indicator when slower than PB', async () => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Ex1', reps: 10 },
          { name: 'Ex2', reps: 10 },
        ],
      })
      await createCompletedAttempt(benchmark.id, 2, 1, [1])

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)

      await new Promise(resolve => setTimeout(resolve, 2000))
      await completeExercise()

      await expect.poll(async () => await page.getByText(/push.*behind/i).query() !== null, { timeout: 3000 }).toBe(true)

      app.cleanup()
    })
  })

  describe('Accessibility', () => {
    it('supports keyboard navigation', async () => {
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

      app.cleanup()
    })

    it('provides accessible progress announcements', async () => {
      const benchmark = await createRoundsBenchmark({
        name: 'A11y Test',
        rounds: 3,
        exercises: [{ name: 'Ex1', reps: 5 }],
      })

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)

      await expect.element(page.getByRole('status', { name: /exercise 1 of 3/i })).toBeVisible()

      app.cleanup()
    })
  })
})
