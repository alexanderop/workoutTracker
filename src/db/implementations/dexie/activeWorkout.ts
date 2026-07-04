import { liveQuery } from 'dexie'
import type { ActiveWorkoutRepository, LiveQuery } from '@/db/interfaces'
import type { DbActiveWorkout } from '@/db/schema'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'

/**
 * Shared query logic for `get()` and `observe()` so both read the same row.
 */
function queryCurrent(database: WorkoutTrackerDatabase): Promise<DbActiveWorkout | undefined> {
  return database.activeWorkout.get('current')
}

export function createDexieActiveWorkoutRepository(
  database: WorkoutTrackerDatabase,
): ActiveWorkoutRepository {
  return {
    async get(): Promise<DbActiveWorkout | undefined> {
      return queryCurrent(database)
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
      const workout = await queryCurrent(database)
      return workout !== undefined
    },

    observe(): LiveQuery<DbActiveWorkout | undefined> {
      const run = () => queryCurrent(database)
      return {
        get: () => run(),
        subscribe(onChange: (value: DbActiveWorkout | undefined) => void) {
          const subscription = liveQuery(run).subscribe({ next: onChange })
          return () => subscription.unsubscribe()
        },
      }
    },
  }
}
