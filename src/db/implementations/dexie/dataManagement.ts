import type { DataManagementRepository, ExportDataContents } from '@/db/interfaces'
import type { WorkoutTrackerDb } from './database'

export function createDexieDataManagementRepository(
  db: WorkoutTrackerDb,
): DataManagementRepository {
  return {
    async exportAll(): Promise<ExportDataContents> {
      const [settings, customExercises, templates, workouts] = await Promise.all([
        db.settings.toArray(),
        db.customExercises.toArray(),
        db.templates.toArray(),
        db.workouts.toArray(),
      ])

      return { settings, customExercises, templates, workouts }
    },

    async importAll(data: ExportDataContents): Promise<void> {
      await db.transaction(
        'rw',
        [db.settings, db.customExercises, db.templates, db.workouts, db.activeWorkout],
        async () => {
          await Promise.all([
            db.settings.clear(),
            db.customExercises.clear(),
            db.templates.clear(),
            db.workouts.clear(),
            db.activeWorkout.clear(),
          ])

          const { settings, customExercises, templates, workouts } = data

          await Promise.all([
            settings.length > 0 ? db.settings.bulkAdd([...settings]) : Promise.resolve(),
            customExercises.length > 0
              ? db.customExercises.bulkAdd([...customExercises])
              : Promise.resolve(),
            templates.length > 0 ? db.templates.bulkAdd([...templates]) : Promise.resolve(),
            workouts.length > 0 ? db.workouts.bulkAdd([...workouts]) : Promise.resolve(),
          ])
        },
      )
    },

    async deleteAll(): Promise<void> {
      await db.transaction(
        'rw',
        [db.settings, db.customExercises, db.templates, db.workouts, db.activeWorkout],
        async () => {
          await Promise.all([
            db.settings.clear(),
            db.customExercises.clear(),
            db.templates.clear(),
            db.workouts.clear(),
            db.activeWorkout.clear(),
          ])
        },
      )
    },
  }
}
