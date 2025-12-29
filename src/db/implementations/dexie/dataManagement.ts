import type { DataManagementRepository, ExportDataContents } from '@/db/interfaces'
import type { WorkoutTrackerDb } from './database'

export function createDexieDataManagementRepository(
  db: WorkoutTrackerDb,
): DataManagementRepository {
  // Shared table list for transactions
  const allTables = [
    db.settings,
    db.customExercises,
    db.templates,
    db.workouts,
    db.benchmarks,
    db.activeWorkout,
    db.activeBenchmark,
    db.weightEntries,
    db.drafts,
  ] as const

  // Shared helper to clear all tables
  async function clearAllTables(): Promise<void> {
    await Promise.all([
      db.settings.clear(),
      db.customExercises.clear(),
      db.templates.clear(),
      db.workouts.clear(),
      db.benchmarks.clear(),
      db.activeWorkout.clear(),
      db.activeBenchmark.clear(),
      db.weightEntries.clear(),
      db.drafts.clear(),
    ])
  }

  return {
    async exportAll(): Promise<ExportDataContents> {
      const [settings, customExercises, templates, workouts, benchmarks, weightEntries] =
        await Promise.all([
          db.settings.toArray(),
          db.customExercises.toArray(),
          db.templates.toArray(),
          db.workouts.toArray(),
          db.benchmarks.toArray(),
          db.weightEntries.toArray(),
        ])

      return { settings, customExercises, templates, workouts, benchmarks, weightEntries }
    },

    async importAll(data: ExportDataContents): Promise<void> {
      await db.transaction('rw', allTables, async () => {
        await clearAllTables()

        const { settings, customExercises, templates, workouts, benchmarks, weightEntries } = data

        await Promise.all([
          settings.length > 0 ? db.settings.bulkAdd([...settings]) : Promise.resolve(),
          customExercises.length > 0
            ? db.customExercises.bulkAdd([...customExercises])
            : Promise.resolve(),
          templates.length > 0 ? db.templates.bulkAdd([...templates]) : Promise.resolve(),
          workouts.length > 0 ? db.workouts.bulkAdd([...workouts]) : Promise.resolve(),
          benchmarks.length > 0 ? db.benchmarks.bulkAdd([...benchmarks]) : Promise.resolve(),
          weightEntries?.length > 0
            ? db.weightEntries.bulkAdd([...weightEntries])
            : Promise.resolve(),
        ])
      })
    },

    async deleteAll(): Promise<void> {
      await db.transaction('rw', allTables, clearAllTables)
    },
  }
}
