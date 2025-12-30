import type { ActiveWorkoutRepository } from '@/db/interfaces'
import type { DbActiveWorkout } from '@/db/schema'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'

export function createDexieActiveWorkoutRepository(
  database: WorkoutTrackerDatabase,
): ActiveWorkoutRepository {
  return {
    async get(): Promise<DbActiveWorkout | undefined> {
      return database.activeWorkout.get('current')
    },

    async save(workout: Readonly<DbActiveWorkout>): Promise<void> {
      await database.activeWorkout.put({
        ...workout,
        id: 'current',
        lastModifiedAt: Date.now(),
      })
    },

    async clear(): Promise<void> {
      await database.activeWorkout.delete('current')
    },

    async exists(): Promise<boolean> {
      const workout = await database.activeWorkout.get('current')
      return workout !== undefined
    },
  }
}
