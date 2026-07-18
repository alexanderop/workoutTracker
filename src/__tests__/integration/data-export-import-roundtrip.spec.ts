import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDataManagementRepository } from '@/db'
import { seedPopularExercises } from '@/db/seedExercises'
import { parseExportFile, importAllData } from '@/features/settings/utils/dataImport'
import { exportDataSchema } from '@/features/settings/utils/validation'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import {
  getAllWorkouts,
  getRawSettings,
  getSettingsCount,
  getWorkoutCount,
  seedCompletedWorkout,
  seedSetting,
} from '../helpers/dbAssertions'

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
    await seedCompletedWorkout(workout)

    // Verify data exists
    expect(await getWorkoutCount()).toBe(1)

    // Act: Export all data using the repository (same as the export feature uses)
    const exportedData = await getDataManagementRepository().exportAll()

    // Build export file structure (matching ExportData type)
    const exportFile = {
      version: 2,
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
      expect.fail(
        `Import validation failed: ${parseResult.error} - ${parseResult.details ?? 'no details'}`,
      )
    }
    expect(parseResult.success).toBe(true)

    // Act: Actually import the data
    const importSuccess = await importAllData(parseResult.data)

    // Assert: Import should complete successfully
    expect(importSuccess).toBe(true)

    // Assert: Data should be in the database
    expect(await getWorkoutCount()).toBe(1)
    const workouts = await getAllWorkouts()
    expect(workouts[0]?.name).toBe('Test Workout')
  })

  it('normalizes legacy habits from version 1 without changing their entries', async () => {
    const legacyHabit = {
      id: 'legacy-habit',
      name: 'Stretch',
      icon: null,
      schedule: { type: 'daily' },
      kind: { type: 'binary' },
      autoLink: null,
      archivedAt: null,
      orderIndex: 0,
      createdAt: 1,
    }
    const entry = {
      id: 'legacy-entry',
      habitId: legacyHabit.id,
      date: 1,
      value: 1,
      recordedAt: 1,
    }
    const file = new File(
      [
        JSON.stringify({
          version: 1,
          exportedAt: new Date().toISOString(),
          data: {
            settings: [],
            customExercises: [],
            templates: [],
            workouts: [],
            benchmarks: [],
            habits: [legacyHabit],
            habitEntries: [entry],
          },
        }),
      ],
      'legacy-backup.json',
      { type: 'application/json' },
    )

    const result = await parseExportFile(file)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.data.habits).toEqual([
      { ...legacyHabit, description: null, accent: 'purple' },
    ])
    expect(result.data.data.habitEntries).toEqual([entry])
  })

  it('preserves all data types through export/import cycle', async () => {
    // Arrange: Create various data types
    const workout = databaseWorkoutBuilder()
      .withName('Full Workout')
      .withStrengthBlock()
      .withDuration(3600)
      .build()

    await seedCompletedWorkout(workout)
    await seedSetting({ key: 'theme', value: 'dark' })

    // Verify initial state
    expect(await getWorkoutCount()).toBe(1)
    expect(await getSettingsCount()).toBe(1)

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
      expect.fail(
        `Import validation failed: ${parseResult.error} - ${parseResult.details ?? 'no details'}`,
      )
    }
    expect(parseResult.success).toBe(true)

    const importSuccess = await importAllData(parseResult.data)
    expect(importSuccess).toBe(true)

    // Assert: All data preserved
    expect(await getWorkoutCount()).toBe(1)
    expect(await getSettingsCount()).toBe(1)

    const workouts = await getAllWorkouts()
    expect(workouts[0]?.name).toBe('Full Workout')
    expect(workouts[0]?.durationSeconds).toBe(3600)

    const settings = await getRawSettings()
    expect(settings[0]?.value).toBe('dark')
  })

  it('should pass export schema validation when the full seeded exercise library is exported', async () => {
    // Arrange: seed the same popular-exercise library the app seeds on first launch.
    // This library includes exercise types/equipment (e.g. 'isometric', 'battle-rope')
    // that a drifted validation schema would reject.
    await seedPopularExercises()

    // Act: export exactly as the app's own export feature does.
    const exportedData = await getDataManagementRepository().exportAll()
    const exportFile = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: exportedData,
    }

    // Assert: the app's own export must pass its own import validation.
    const result = exportDataSchema.safeParse(exportFile)

    if (!result.success) {
      expect.fail(`Seeded exercise library failed export validation: ${result.error.message}`)
    }
    expect(result.success).toBe(true)
  })
})
