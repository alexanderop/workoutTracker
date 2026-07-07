import type { DataManagementRepository, ExportDataContents } from '@/db/interfaces'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'

export function createDexieDataManagementRepository(
  database: WorkoutTrackerDatabase,
): DataManagementRepository {
  // Tables covered by export/import backups. Kept separate from the full
  // wipe list below so importAll's semantics (restore exactly what the
  // backup contains) don't change if the wipe list grows.
  const backupTables = [
    database.settings,
    database.customExercises,
    database.templates,
    database.workouts,
    database.benchmarks,
    database.activeWorkout,
    database.activeBenchmark,
    database.weightEntries,
    database.drafts,
    database.onboarding,
  ] as const

  // Every table in the schema, for a full wipe (Settings > Delete All Data).
  // Taken live from the Dexie schema so tables added in future versions are
  // wiped automatically — a hand-maintained list previously missed
  // progressions/progressionSessions (added in schema version 5), silently
  // leaving progression data behind after "delete all data" (UX review).
  const allTables = database.tables

  // Shared helper to clear a given set of tables
  async function clearTables(tables: ReadonlyArray<{ clear(): Promise<void> }>): Promise<void> {
    await Promise.all(tables.map((table) => table.clear()))
  }

  return {
    async exportAll(): Promise<ExportDataContents> {
      const [settings, customExercises, templates, workouts, benchmarks, weightEntries] =
        await Promise.all([
          database.settings.toArray(),
          database.customExercises.toArray(),
          database.templates.toArray(),
          database.workouts.toArray(),
          database.benchmarks.toArray(),
          database.weightEntries.toArray(),
        ])

      return { settings, customExercises, templates, workouts, benchmarks, weightEntries }
    },

    async importAll(data: ExportDataContents): Promise<void> {
      await database.transaction('rw', backupTables, async () => {
        await clearTables(backupTables)

        const { settings, customExercises, templates, workouts, benchmarks, weightEntries } = data

        await Promise.all([
          settings.length > 0 ? database.settings.bulkAdd([...settings]) : Promise.resolve(),
          customExercises.length > 0
            ? database.customExercises.bulkAdd([...customExercises])
            : Promise.resolve(),
          templates.length > 0 ? database.templates.bulkAdd([...templates]) : Promise.resolve(),
          workouts.length > 0 ? database.workouts.bulkAdd([...workouts]) : Promise.resolve(),
          benchmarks.length > 0 ? database.benchmarks.bulkAdd([...benchmarks]) : Promise.resolve(),
          weightEntries?.length > 0
            ? database.weightEntries.bulkAdd([...weightEntries])
            : Promise.resolve(),
        ])
      })
    },

    async deleteAll(options?: { preserveOnboarding?: boolean }): Promise<void> {
      const { preserveOnboarding = true } = options ?? {}

      // Preserve onboarding state - users shouldn't have to re-onboard after deleting data
      const onboardingData = preserveOnboarding ? await database.onboarding.toArray() : []

      await database.transaction('rw', allTables, async () => {
        await clearTables(allTables)
        // Restore onboarding state if requested
        if (onboardingData.length > 0) {
          await database.onboarding.bulkAdd(onboardingData)
        }
      })
    },
  }
}
