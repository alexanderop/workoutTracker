import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createTestApp } from '../helpers/createTestApp'
import { getBenchmarksRepository } from '@/db'
import type { DbBenchmark } from '@/db/schema'

describe('Delete Benchmark', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Acceptance Criteria 1: Delete button on benchmark detail page', () => {
    it('displays delete button in view mode', async () => {
      // Create a benchmark
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Test Benchmark',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Burpees',
            prescribedReps: 50,
            thumbnail: '💪',
          },
        ],
      })

      const app = await createTestApp()

      // Navigate to benchmark detail page
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Test Benchmark')

      // Verify delete button is visible
      app.benchmarkDetail.assertDeleteButtonVisible()

      app.cleanup()
    })

    it('does not show delete button in edit mode', async () => {
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Test Benchmark',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Burpees',
            prescribedReps: 50,
            thumbnail: '💪',
          },
        ],
      })

      const app = await createTestApp()

      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Test Benchmark')

      // Enter edit mode
      await app.benchmarkDetail.clickEdit()
      await waitFor(() => {
        app.benchmarkDetail.assertEditMode()
      })

      // Delete button should not be visible in edit mode
      expect(app.queryByRole('button', { name: /delete benchmark/i })).toBeFalsy()

      app.cleanup()
    })
  })

  describe('Acceptance Criteria 2: Show confirmation dialog when user taps "Delete"', () => {
    it('opens confirmation dialog when delete button clicked', async () => {
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Fran',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Thrusters',
            prescribedReps: 21,
            thumbnail: '🏋️',
          },
        ],
      })

      const app = await createTestApp()

      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Fran')

      // Click delete button
      await app.benchmarkDetail.clickDelete()

      // Verify dialog is displayed with benchmark name
      await waitFor(() => {
        app.benchmarkDetail.assertDeleteDialogOpen()
      })

      app.cleanup()
    })
  })

  describe('Acceptance Criteria 3: If confirmed, delete benchmark and navigate to benchmarks list', () => {
    it('deletes benchmark from database when confirmed', async () => {
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Murph',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Pull-ups',
            prescribedReps: 100,
            thumbnail: '💪',
          },
        ],
      })

      const app = await createTestApp()

      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Murph')

      // Click delete and confirm
      await app.benchmarkDetail.clickDelete()
      await waitFor(() => {
        app.benchmarkDetail.assertDeleteDialogOpen()
      })

      await app.benchmarkDetail.confirmDelete()

      // Verify navigation to workouts list
      expect(app.router.currentRoute.value.path).toBe('/workouts')

      // Verify benchmark was deleted from database
      const deletedBenchmark = await getBenchmarksRepository().getById(benchmark.id)
      expect(deletedBenchmark).toBeUndefined()

      app.cleanup()
    })

    it('removes benchmark from list after deletion', async () => {
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
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
        ],
      })

      const app = await createTestApp()

      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Venus')

      // Delete benchmark
      await app.benchmarkDetail.clickDelete()
      await app.benchmarkDetail.confirmDelete()

      // Should be on workouts page
      expect(app.router.currentRoute.value.path).toBe('/workouts')

      // Navigate to benchmarks tab
      await app.benchmarks.navigateToTab()

      // Verify benchmark is not in list
      await waitFor(() => {
        expect(app.queryByText('Venus')).toBeFalsy()
      })

      app.cleanup()
    })
  })

  describe('Acceptance Criteria 4: If cancelled, close dialog and remain on detail page', () => {
    it('closes dialog and stays on detail page when cancelled', async () => {
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Cindy',
        type: 'rounds',
        rounds: 5,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Pull-ups',
            prescribedReps: 5,
            thumbnail: '💪',
          },
        ],
      })

      const app = await createTestApp()

      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Cindy')

      // Open delete dialog
      await app.benchmarkDetail.clickDelete()
      await waitFor(() => {
        app.benchmarkDetail.assertDeleteDialogOpen()
      })

      // Cancel
      await app.benchmarkDetail.clickDeleteCancel()

      // Should still be on detail page
      await waitFor(() => {
        expect(app.router.currentRoute.value.path).toBe(`/benchmarks/${benchmark.id}`)
      })

      // Verify benchmark still exists in database
      const stillExists = await getBenchmarksRepository().getById(benchmark.id)
      expect(stillExists).toBeDefined()
      expect(stillExists?.name).toBe('Cindy')

      // Verify still in view mode (not edit mode)
      app.benchmarkDetail.assertViewMode()

      app.cleanup()
    })

    it('does not delete benchmark when dialog is dismissed', async () => {
      const benchmark: DbBenchmark = await getBenchmarksRepository().create({
        name: 'Test',
        type: 'fortime',
        rounds: 1,
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Exercise',
            prescribedReps: 10,
            thumbnail: '💪',
          },
        ],
      })

      const app = await createTestApp()

      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Test')

      // Get initial count
      const allBenchmarks = await getBenchmarksRepository().getAll()
      const initialCount = allBenchmarks.length

      // Open and cancel delete dialog
      await app.benchmarkDetail.clickDelete()
      await app.benchmarkDetail.clickDeleteCancel()

      // Verify count unchanged
      const afterCancel = await getBenchmarksRepository().getAll()
      expect(afterCancel.length).toBe(initialCount)

      app.cleanup()
    })
  })
})
