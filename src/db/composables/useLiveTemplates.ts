import { getTemplatesRepository } from '@/db'
import type { DbWorkoutTemplate } from '@/db/schema'
import { useLiveQuery, type LiveQueryState } from './useLiveQuery'

/**
 * Subscribe to live updates of all workout templates (sorted by last used).
 * Automatically syncs across browser tabs via IndexedDB events.
 * Cleans up subscription when the component unmounts.
 *
 * @returns Reactive state with current templates array and ready status
 *
 * @example
 * const { data: templates, isReady } = useLiveTemplates()
 *
 * watchEffect(() => {
 *   if (isReady.value) {
 *     console.log('Templates:', templates.value.length)
 *   }
 * })
 */
export function useLiveTemplates(): LiveQueryState<ReadonlyArray<DbWorkoutTemplate>> {
  return useLiveQuery<ReadonlyArray<DbWorkoutTemplate>>(
    (callback) => getTemplatesRepository().subscribeAll(callback),
    [],
  )
}
