import { getActiveWorkoutRepository } from '@/db'
import type { DbActiveWorkout } from '@/db/schema'
import { useLiveQuery, type LiveQueryState } from './useLiveQuery'

/**
 * Subscribe to live updates of the active workout.
 * Automatically syncs across browser tabs via IndexedDB events.
 * Cleans up subscription when the component unmounts.
 *
 * @returns Reactive state with current workout data and ready status
 *
 * @example
 * const { data: activeWorkout, isReady } = useLiveActiveWorkout()
 *
 * watchEffect(() => {
 *   if (activeWorkout.value) {
 *     console.log('Workout updated:', activeWorkout.value.name)
 *   }
 * })
 */
export function useLiveActiveWorkout(): LiveQueryState<DbActiveWorkout | undefined> {
  return useLiveQuery<DbActiveWorkout | undefined>(
    (callback) => getActiveWorkoutRepository().subscribe(callback),
    undefined,
  )
}
