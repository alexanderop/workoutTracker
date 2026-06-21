import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { RouteNames } from '@/router'
import {
  createForTimeBenchmark,
  createRoundsBenchmark,
  startBenchmarkWorkout,
  completeExercise,
  waitForCompletionScreen,
  getWorkoutsRepository as getWorkoutsRepo,
  getBenchmarksRepository as getBenchmarksRepo,
} from './helpers/benchmarkHelpers'

describe('Benchmark Management', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Complete Lifecycle', () => {
    it('completes full benchmark lifecycle from creation to deletion', async () => {
      const app = await createTestApp()

      // Create benchmark via API (form tested separately)
      const benchmark = await createForTimeBenchmark({
        name: 'Fran',
        exercises: [
          { name: 'Thrusters', reps: 21 },
          { name: 'Pull-ups', reps: 21 },
        ]
      })

      // Navigate to detail and verify
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Fran')
      app.benchmarkDetail.assertExerciseExists('Thrusters', 21)
      app.benchmarkDetail.assertExerciseExists('Pull-ups', 21)

      // Execute workout
      await startBenchmarkWorkout(app, benchmark.id)
      await expect.element(page.getByText('Thrusters')).toBeVisible()
      await completeExercise()
      await expect.element(page.getByText('Pull-ups')).toBeVisible()
      await completeExercise()

      // Save and verify
      await waitForCompletionScreen()
      await page.getByRole('button', { name: /view details/i }).click()
      await expect.poll(() => app.router.currentRoute.value.name).toBe('WorkoutSummary')

      const workouts = await getWorkoutsRepo().getHistory()
      expect(workouts).toHaveLength(1)
      expect(workouts[0]?.benchmarkId).toBe(benchmark.id)

      // Edit benchmark
      await app.benchmarks.navigateToTab()
      await app.benchmarks.clickBenchmarkCard('Fran')
      await app.benchmarkDetail.clickEdit()
      await app.benchmarkDetail.editBenchmarkName('Modified Fran')
      await app.benchmarkDetail.clickSave()
      await expect.element(page.getByText('Modified Fran')).toBeVisible()

      // Delete benchmark
      await app.benchmarkDetail.clickDelete()
      await expect.element(page.getByRole('dialog')).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /^delete$/i }))
      await expect.poll(() => app.router.currentRoute.value.path).toBe('/workouts')

      const deleted = await getBenchmarksRepo().getById(benchmark.id)
      expect(deleted).toBeFalsy()

      app.cleanup()
    })
  })

  describe('Creation', () => {
    it('creates benchmark with single exercise', async () => {
      await createForTimeBenchmark({
        name: 'Helen',
        exercises: [{ name: 'Run', reps: 400 }],
      })

      const benchmarks = await getBenchmarksRepo().getAll()
      expect(benchmarks).toHaveLength(1)
      expect(benchmarks[0]?.name).toBe('Helen')
      expect(benchmarks[0]?.rounds[0]?.exercises).toHaveLength(1)
    })

    it('creates benchmark with multiple exercises and rounds', async () => {
      await createRoundsBenchmark({
        name: 'Cindy',
        rounds: 5,
        exercises: [
          { name: 'Pull-ups', reps: 5 },
          { name: 'Push-ups', reps: 10 },
          { name: 'Squats', reps: 15 },
        ],
      })

      const benchmarks = await getBenchmarksRepo().getAll()
      expect(benchmarks[0]?.rounds).toHaveLength(5)
      expect(benchmarks[0]?.rounds[0]?.exercises).toHaveLength(3)
    })

    it('validates form: cannot save without exercises', async () => {
      const app = await createTestApp()
      await app.navigateTo({ name: RouteNames.CreateBenchmark })

      await app.benchmarkForm.fillName('Test Benchmark')
      // No type selection needed - all benchmarks are ForTime
      app.benchmarkForm.assertSaveDisabled()

      app.cleanup()
    })
  })

  describe('Editing', () => {
    it('edits existing benchmark and saves changes', async () => {
      const benchmark = await createForTimeBenchmark({ name: 'Original Name' })
      const app = await createTestApp()

      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Original Name')
      await app.benchmarkDetail.clickEdit()
      await app.benchmarkDetail.editBenchmarkName('Updated Name')
      await app.benchmarkDetail.clickSave()

      await expect.element(page.getByText('Updated Name')).toBeVisible()
      const updated = await getBenchmarksRepo().getById(benchmark.id)
      expect(updated?.name).toBe('Updated Name')

      app.cleanup()
    })
  })

  describe('Deletion', () => {
    it('deletes benchmark with confirmation dialog', async () => {
      const benchmark = await createForTimeBenchmark({ name: 'To Delete' })
      const app = await createTestApp()

      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('To Delete')

      // Test cancel
      await app.benchmarkDetail.clickDelete()
      await expect.element(page.getByRole('dialog')).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /cancel/i }))
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
      expect(await getBenchmarksRepo().getById(benchmark.id)).toBeTruthy()

      // Test confirm
      await app.benchmarkDetail.clickDelete()
      await userEvent.click(page.getByRole('button', { name: /^delete$/i }))
      await expect.poll(() => app.router.currentRoute.value.path).toBe('/workouts')
      expect(await getBenchmarksRepo().getById(benchmark.id)).toBeFalsy()

      app.cleanup()
    })
  })
})
