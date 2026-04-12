import { shallowRef } from 'vue'
import { createGlobalState } from '@vueuse/core'
import { startOfDay, subMonths } from 'date-fns'
import { getWorkoutsRepository } from '@/db'
import type { DbCompletedWorkout } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'

const HISTORY_MONTHS = 12

/**
 * Shared cache of completed workouts over the last ~12 months for streak
 * and heatmap features. Implemented as a global state so both consumers
 * reuse a single DB query.
 */
export const useActivityHistory = createGlobalState(() => {
  const workouts = shallowRef<ReadonlyArray<DbCompletedWorkout>>([])
  const isLoading = shallowRef(false)
  const error = shallowRef<Error | null>(null)
  const hasLoaded = shallowRef(false)

  async function load(): Promise<void> {
    isLoading.value = true
    const today = startOfDay(new Date())
    const startDate = subMonths(today, HISTORY_MONTHS).getTime()
    const endDate = Date.now()

    const [loadError, result] = await tryCatch(
      getWorkoutsRepository().getByDateRange({ startDate, endDate }),
    )

    if (loadError) {
      error.value = loadError
      isLoading.value = false
      hasLoaded.value = true
      return
    }

    workouts.value = result ?? []
    error.value = null
    isLoading.value = false
    hasLoaded.value = true
  }

  function ensureLoaded(): void {
    if (!hasLoaded.value && !isLoading.value) {
      void load()
    }
  }

  function reset(): void {
    workouts.value = []
    isLoading.value = false
    error.value = null
    hasLoaded.value = false
  }

  return {
    workouts,
    isLoading,
    error,
    hasLoaded,
    load,
    ensureLoaded,
    reset,
  }
})

/**
 * Reset shared activity history state. Use in test cleanup.
 */
export function resetActivityHistory(): void {
  useActivityHistory().reset()
}
