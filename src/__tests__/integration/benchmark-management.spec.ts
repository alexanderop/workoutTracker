import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from '../helpers/locator'
import { expectElement, expectPoll } from '../helpers/assertions'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { RouteNames } from '@/router'
import {
  createForTimeBenchmark,
  createRoundsBenchmark,
  startBenchmarkWorkout,
  completeExercise,
  waitForCompletionScreen,
  getWorkoutsRepository,
  getBenchmarksRepository,
} from './helpers/benchmarkHelpers'

describe('Benchmark Management', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Complete Lifecycle', () => {
    it('completes full benchmark lifecycle from creation to deletion', async () => {
      const app = await createTestApp()

      // Create benchmark via API (form tested separately) - use unique name to avoid collision with seeded benchmarks
      const benchmark = await createForTimeBenchmark({
        name: 'Test Fran Lifecycle',
        exercises: [
          { name: 'Thrusters', reps: 21 },
          { name: 'Pull-ups', reps: 21 },
        ]
      })

      // Navigate to detail and verify
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Test Fran Lifecycle')
      app.benchmarkDetail.assertExerciseExists('Thrusters', 21)
      app.benchmarkDetail.assertExerciseExists('Pull-ups', 21)

      // Execute workout
      await startBenchmarkWorkout(app, benchmark.id)
      await expectElement(page.getByText('Thrusters')).toBeVisible()
      await completeExercise()
      await expectElement(page.getByText('Pull-ups')).toBeVisible()
      await completeExercise()

      // Save and verify
      await waitForCompletionScreen()
      await page.getByRole('button', { name: /view details/i }).click()
      await expectPoll(() => app.router.currentRoute.value.name).toBe('WorkoutSummary')

      const workouts = await getWorkoutsRepository().getHistory()
      expect(workouts).toHaveLength(1)
      expect(workouts[0]?.benchmarkId).toBe(benchmark.id)

      // Edit benchmark
      await app.benchmarks.navigateToTab()
      await app.benchmarks.clickBenchmarkCard('Test Fran Lifecycle')
      await app.benchmarkDetail.clickEdit()
      await app.benchmarkDetail.editBenchmarkName('Modified Test Fran')
      await app.benchmarkDetail.clickSave()
      await expectElement(page.getByText('Modified Test Fran')).toBeVisible()

      // Delete benchmark
      await app.benchmarkDetail.clickDelete()
      await expectElement(page.getByRole('dialog')).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /^delete$/i }))
      await expectPoll(() => app.router.currentRoute.value.path).toBe('/workouts')

      const deleted = await getBenchmarksRepository().getById(benchmark.id)
      expect(deleted).toBeFalsy()

      app.cleanup()
    })
  })

  describe('Creation', () => {
    it('creates benchmark with single exercise', async () => {
      // Use unique name to avoid collision with seeded benchmarks
      await createForTimeBenchmark({
        name: 'Test Single Exercise',
        exercises: [{ name: 'Run', reps: 400 }],
      })

      const benchmarks = await getBenchmarksRepository().getAll()
      const benchmark = benchmarks.find((b) => b.name === 'Test Single Exercise')
      expect(benchmark).toBeDefined()
      expect(benchmark?.rounds[0]?.exercises).toHaveLength(1)
    })

    it('creates benchmark with multiple exercises and rounds', async () => {
      // Use unique name to avoid collision with seeded benchmarks
      await createRoundsBenchmark({
        name: 'Test Multi Round',
        rounds: 5,
        exercises: [
          { name: 'Pull-ups', reps: 5 },
          { name: 'Push-ups', reps: 10 },
          { name: 'Squats', reps: 15 },
        ],
      })

      const benchmarks = await getBenchmarksRepository().getAll()
      const benchmark = benchmarks.find((b) => b.name === 'Test Multi Round')
      expect(benchmark).toBeDefined()
      expect(benchmark?.rounds).toHaveLength(5)
      expect(benchmark?.rounds[0]?.exercises).toHaveLength(3)
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

      await expectElement(page.getByText('Updated Name')).toBeVisible()
      const updated = await getBenchmarksRepository().getById(benchmark.id)
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
      await expectElement(page.getByRole('dialog')).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /cancel/i }))
      await expectElement(page.getByRole('dialog')).not.toBeInTheDocument()
      expect(await getBenchmarksRepository().getById(benchmark.id)).toBeTruthy()

      // Test confirm
      await app.benchmarkDetail.clickDelete()
      await userEvent.click(page.getByRole('button', { name: /^delete$/i }))
      await expectPoll(() => app.router.currentRoute.value.path).toBe('/workouts')
      expect(await getBenchmarksRepository().getById(benchmark.id)).toBeFalsy()

      app.cleanup()
    })
  })
})
