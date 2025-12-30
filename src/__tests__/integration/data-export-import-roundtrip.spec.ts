import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { getDataManagementRepository } from '@/db'
import { parseExportFile, importAllData } from '@/features/settings/utils/dataImport'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

/**
 * Integration test for export/import round-trip.
 *
 * This test verifies that data exported from the app can be successfully
 * imported back. It documents a bug where the export includes `benchmarks`
 * but the import validation schema uses `.strict()` and doesn't expect it.
 */
describe('Export/Import Round-Trip', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('successfully imports data that was just exported', async () => {
    // Arrange: Create test data in the database
    const workout = databaseWorkoutBuilder().withName('Test Workout').withStrengthBlock().build()
    await db.workouts.add(workout)

    // Verify data exists
    expect(await db.workouts.count()).toBe(1)

    // Act: Export all data using the repository (same as the export feature uses)
    const exportedData = await getDataManagementRepository().exportAll()

    // Build export file structure (matching ExportData type)
    const exportFile = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: exportedData,
    }

    // Create a File object from the export (simulating what the user would import)
    const file = new File([JSON.stringify(exportFile)], 'backup.json', {
      type: 'application/json',
    })

    // Act: Parse and validate the export file (this is where the bug manifests)
    const parseResult = await parseExportFile(file)

    // Assert: Validation should succeed
    // If it fails, include the error details in the assertion message
    if (!parseResult.success) {
      expect.fail(`Import validation failed: ${parseResult.error} - ${parseResult.details ?? 'no details'}`)
    }
    expect(parseResult.success).toBe(true)

    // Act: Actually import the data
    const importSuccess = await importAllData(parseResult.data)

    // Assert: Import should complete successfully
    expect(importSuccess).toBe(true)

    // Assert: Data should be in the database
    expect(await db.workouts.count()).toBe(1)
    const workouts = await db.workouts.toArray()
    expect(workouts[0]?.name).toBe('Test Workout')
  })

  it('preserves all data types through export/import cycle', async () => {
    // Arrange: Create various data types
    const workout = databaseWorkoutBuilder()
      .withName('Full Workout')
      .withStrengthBlock()
      .withDuration(3600)
      .build()

    await db.workouts.add(workout)
    await db.settings.put({ key: 'theme', value: 'dark' })

    // Verify initial state
    expect(await db.workouts.count()).toBe(1)
    expect(await db.settings.count()).toBe(1)

    // Act: Export
    const exportedData = await getDataManagementRepository().exportAll()
    const exportFile = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: exportedData,
    }
    const file = new File([JSON.stringify(exportFile)], 'backup.json', {
      type: 'application/json',
    })

    // Act: Parse and import
    const parseResult = await parseExportFile(file)

    if (!parseResult.success) {
      expect.fail(`Import validation failed: ${parseResult.error} - ${parseResult.details ?? 'no details'}`)
    }
    expect(parseResult.success).toBe(true)

    const importSuccess = await importAllData(parseResult.data)
    expect(importSuccess).toBe(true)

    // Assert: All data preserved
    expect(await db.workouts.count()).toBe(1)
    expect(await db.settings.count()).toBe(1)

    const workouts = await db.workouts.toArray()
    expect(workouts[0]?.name).toBe('Full Workout')
    expect(workouts[0]?.durationSeconds).toBe(3600)

    const settings = await db.settings.toArray()
    expect(settings[0]?.value).toBe('dark')
  })
})
