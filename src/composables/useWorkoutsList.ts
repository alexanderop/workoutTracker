import { onMounted, ref } from 'vue'
import { getWorkoutsRepository, getTemplatesRepository } from '@/db'
import { formatDate } from '@/lib/formatters'
import type { DbCompletedWorkout, DbWorkoutTemplate } from '@/db/schema'

// ============================================
// Pure Functions (Functional Core)
// ============================================

/**
 * Formats a template's last used timestamp for display.
 */
function formatTemplateDate(timestamp: number | null): string {
  if (!timestamp) return 'Never used'
  return `Last used ${formatDate(timestamp)}`
}

// ============================================
// Composable (Imperative Shell)
// ============================================

export function useWorkoutsList() {
  // Primary State
  const workouts = ref<ReadonlyArray<DbCompletedWorkout>>([])
  const templates = ref<ReadonlyArray<DbWorkoutTemplate>>([])

  // State Metadata
  const isLoading = ref(true)

  // Methods
  async function loadAll(): Promise<void> {
    isLoading.value = true
    ;[workouts.value, templates.value] = await Promise.all([
      getWorkoutsRepository().getHistory(),
      getTemplatesRepository().getAll(),
    ])
    isLoading.value = false
  }

  // Lifecycle Hooks
  onMounted(() => {
    loadAll()
  })

  return {
    // State
    workouts,
    templates,
    isLoading,
    // Methods
    loadAll,
    formatTemplateDate,
  }
}
