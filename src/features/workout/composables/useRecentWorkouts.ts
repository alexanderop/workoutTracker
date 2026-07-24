import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { getWorkoutsRepository } from '@/db'
import type { DbCompletedWorkout } from '@/db/schema'
import { formatDurationMinutes, formatRelativeDate } from '@/lib/formatters'
import { countCompletedSets } from '@/lib/workoutStats'

// ============================================
// Types
// ============================================

export type RecentWorkout = {
  id: string
  name: string
  relativeDate: string
  durationMinutes: string
  setCount: number
}

export type UseRecentWorkoutsReturn = {
  recentWorkouts: ComputedRef<ReadonlyArray<RecentWorkout>>
  hasHistory: ComputedRef<boolean>
  isLoading: ComputedRef<boolean>
}

// ============================================
// Pure Functions (Functional Core)
// ============================================

function mapToRecentWorkout(workout: DbCompletedWorkout): RecentWorkout {
  return {
    id: workout.id,
    name: workout.name,
    relativeDate: formatRelativeDate(workout.completedAt),
    durationMinutes: formatDurationMinutes(workout.durationSeconds),
    setCount: countCompletedSets(workout.blocks),
  }
}

// ============================================
// Composable (Imperative Shell)
// ============================================

/**
 * Reactive list of the most recently completed workouts, kept in sync with
 * storage via a live query (including changes from other tabs).
 *
 * @param limit Maximum number of workouts to expose; a ref or getter re-runs the query when it changes
 */
export function useRecentWorkouts(limit: MaybeRefOrGetter<number> = 3): UseRecentWorkoutsReturn {
  // Primary State — live query keeps `data` in sync with storage, including
  // changes made from other tabs, so no manual reload is needed. `limit` is
  // read inside the factory, so changing it re-runs the query automatically.
  const { data: workouts } = useLiveQuery<ReadonlyArray<DbCompletedWorkout>>(() =>
    getWorkoutsRepository().observeHistory(toValue(limit)),
  )

  // Computed
  const hasHistory = computed(() => (workouts.value?.length ?? 0) > 0)

  // State Metadata — no snapshot yet means the subscription hasn't emitted
  const isLoading = computed(() => workouts.value === undefined)

  const recentWorkouts = computed<ReadonlyArray<RecentWorkout>>(() =>
    (workouts.value ?? []).map((workout) => mapToRecentWorkout(workout)),
  )

  return {
    // State
    recentWorkouts,
    hasHistory,
    isLoading,
  }
}
