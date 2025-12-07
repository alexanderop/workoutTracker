import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createTestApp } from '../helpers/createTestApp'
import { getBenchmarksRepository } from '@/db'
import type { DbBenchmark } from '@/db/schema'

describe('Edit Benchmark', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Cycle 1: Enter Edit Mode', () => {
    it('should enter edit mode when clicking edit button', async () => {
      // Create a benchmark to edit
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
          {
            exerciseDefinitionId: null,
            name: 'Pull-ups',
            prescribedReps: 21,
            thumbnail: '💪',
          },
        ],
      })

      const app = await createTestApp()

      // Navigate to benchmark detail page
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Fran')

      // Initially should be in view mode
      app.benchmarkDetail.assertViewMode()

      // Click edit button
      await app.benchmarkDetail.clickEdit()

      // Should now be in edit mode
      await waitFor(() => {
        app.benchmarkDetail.assertEditMode()
      })

      app.cleanup()
    })
  })

  describe('Cycle 2: Initialize Form', () => {
    it('should display editable form with current values in edit mode', async () => {
      // Create a benchmark to edit
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
          {
            exerciseDefinitionId: null,
            name: 'Push-ups',
            prescribedReps: 200,
            thumbnail: '🤸',
          },
          {
            exerciseDefinitionId: null,
            name: 'Squats',
            prescribedReps: 300,
            thumbnail: '🦵',
          },
        ],
      })

      const app = await createTestApp()

      // Navigate to benchmark detail page
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Murph')

      // Enter edit mode
      await app.benchmarkDetail.clickEdit()

      await waitFor(() => {
        app.benchmarkDetail.assertEditMode()
      })

      // Verify name input is populated with current value
      const nameInput = await waitFor(() =>
        app.getByRole('textbox', { name: /workout name|name/i }),
      )
      expect(nameInput).toHaveValue('Murph')

      // Verify exercises are displayed (check for exercise names)
      expect(app.queryByText('Pull-ups')).toBeTruthy()
      expect(app.queryByText('Push-ups')).toBeTruthy()
      expect(app.queryByText('Squats')).toBeTruthy()

      app.cleanup()
    })
  })

  describe('Cycle 3: Save Changes', () => {
    it('should save name changes to database and return to view mode', async () => {
      // Create a benchmark to edit
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

      // Navigate to benchmark detail page
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Fran')

      // Enter edit mode
      await app.benchmarkDetail.clickEdit()
      await waitFor(() => {
        app.benchmarkDetail.assertEditMode()
      })

      // Edit the name
      await app.benchmarkDetail.editBenchmarkName('Fran Modified')

      // Save changes
      await app.benchmarkDetail.clickSave()

      // Should return to view mode
      await waitFor(() => {
        app.benchmarkDetail.assertViewMode()
      })

      // Verify name updated in database
      const updated = await getBenchmarksRepository().getById(benchmark.id)
      expect(updated?.name).toBe('Fran Modified')

      // Verify name displayed on page
      expect(app.benchmarkDetail.getBenchmarkName()).toContain('Fran Modified')

      app.cleanup()
    })
  })
})
