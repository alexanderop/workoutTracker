import type { ActiveWorkoutRepository, SubscribeCallback, Subscription } from '@/db/interfaces'
import type { DbActiveWorkout } from '@/db/schema'
import { liveQuery } from 'dexie'
import type { WorkoutTrackerDb } from './database'

export function createDexieActiveWorkoutRepository(
  db: WorkoutTrackerDb,
): ActiveWorkoutRepository {
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
      return (await db.activeWorkout.count()) > 0
    },

    subscribe(callback: SubscribeCallback<DbActiveWorkout | undefined>): Subscription {
      const observable = liveQuery(() => db.activeWorkout.get('current'))
      const subscription = observable.subscribe({
        next: callback,
        error: (err) => console.error('[ActiveWorkoutRepository] Live query error:', err),
      })
      return { unsubscribe: () => subscription.unsubscribe() }
    },
  }
}
