import { computed, onMounted, readonly, ref, shallowRef } from 'vue'
import { getWorkoutsRepository } from '@/db'
import type { DbWorkoutHeader } from '@/db/schema'
import { formatDurationMinutes, formatRelativeDate } from '@/lib/formatters'
import { tryCatch } from '@/lib/tryCatch'

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

function mapToRecentWorkout(header: DbWorkoutHeader): RecentWorkout {
  return {
    id: header.id,
    name: header.name,
    relativeDate: formatRelativeDate(header.completedAt),
    durationMinutes: formatDurationMinutes(header.durationSeconds),
    setCount: header.stats.completedSetCount,
  }
}

// ============================================
// Composable (Imperative Shell)
// ============================================

export function useRecentWorkouts(limit = 3) {
  // Primary State
  const workouts = shallowRef<ReadonlyArray<DbWorkoutHeader>>([])

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
