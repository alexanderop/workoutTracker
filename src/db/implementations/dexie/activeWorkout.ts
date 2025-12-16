import type { ActiveWorkoutRepository } from '@/db/interfaces'
import type { DbActiveWorkout } from '@/db/schema'
import { db } from './database'

export function createDexieActiveWorkoutRepository(): ActiveWorkoutRepository {
  return {
    async get(): Promise<DbActiveWorkout | undefined> {
      return db.activeWorkout.get('current')
    },

    async save(workout: Readonly<DbActiveWorkout>): Promise<void> {
      await db.activeWorkout.put({
        ...workout,
        id: 'current',
        lastModifiedAt: Date.now(),
      })
    },

    async clear(): Promise<void> {
      await db.activeWorkout.delete('current')
    },

    async exists(): Promise<boolean> {
      const workout = await db.activeWorkout.get('current')
      return workout !== undefined
    },
  }
}
