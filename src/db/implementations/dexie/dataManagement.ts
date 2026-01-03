import type { DataManagementRepository, ExportDataContents } from '@/db/interfaces'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'

export function createDexieDataManagementRepository(
  database: WorkoutTrackerDatabase,
): DataManagementRepository {
  // Shared table list for transactions
  const allTables = [
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

  // Shared helper to clear all tables
  async function clearAllTables(): Promise<void> {
    await Promise.all([
      database.settings.clear(),
      database.customExercises.clear(),
      database.templates.clear(),
      database.workouts.clear(),
      database.benchmarks.clear(),
      database.activeWorkout.clear(),
      database.activeBenchmark.clear(),
      database.weightEntries.clear(),
      database.drafts.clear(),
      database.onboarding.clear(),
    ])
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
      await database.transaction('rw', allTables, async () => {
        await clearAllTables()

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

    async deleteAll(): Promise<void> {
      await database.transaction('rw', allTables, clearAllTables)
    },
  }
}
