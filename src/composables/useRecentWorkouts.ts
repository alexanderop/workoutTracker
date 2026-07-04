import { computed } from 'vue'
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

export function useRecentWorkouts(limit = 3) {
  // Primary State — live query keeps `data` in sync with storage, including
  // changes made from other tabs, so no manual reload is needed.
  const { data: workouts } = useLiveQuery<ReadonlyArray<DbCompletedWorkout>>(() =>
    getWorkoutsRepository().observeHistory(limit),
  )

  // Computed
  const hasHistory = computed(() => (workouts.value?.length ?? 0) > 0)

  // State Metadata — no snapshot yet means the initial `get()` hasn't resolved
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
