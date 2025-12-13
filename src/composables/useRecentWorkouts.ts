import { computed, onMounted, readonly, ref, shallowRef } from 'vue'
import { getWorkoutsRepository } from '@/db'
import type { DbCompletedWorkout } from '@/db/schema'
import { formatDurationMinutes, formatRelativeDate } from '@/lib/formatters'
import { tryCatch } from '@/lib/tryCatch'
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
  // Primary State
  const workouts = shallowRef<ReadonlyArray<DbCompletedWorkout>>([])

  // State Metadata
  const isLoading = ref(true)

  // Computed
  const hasHistory = computed(() => workouts.value.length > 0)

  const recentWorkouts = computed<ReadonlyArray<RecentWorkout>>(() =>
    workouts.value.map((workout) => mapToRecentWorkout(workout)),
  )

  // Methods
  async function loadRecent(): Promise<void> {
    isLoading.value = true
    const [error, result] = await tryCatch(getWorkoutsRepository().getHistory({ limit }))

    if (!error && result) {
      workouts.value = result
    }

    isLoading.value = false
  }

  // Lifecycle Hooks
  onMounted(() => {
    loadRecent()
  })

  return {
    // State
    recentWorkouts,
    hasHistory,
    isLoading: readonly(isLoading),
    // Methods
    loadRecent,
  }
}
