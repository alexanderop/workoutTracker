import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { getTemplatesRepository } from '@/db'
import { formatDate } from '@/lib/formatters'
import type { DbWorkoutTemplate } from '@/db/schema'

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

export type UseWorkoutsListReturn = {
  templates: ComputedRef<ReadonlyArray<DbWorkoutTemplate>>
  isLoading: ComputedRef<boolean>
  formatTemplateDate: (timestamp: number | null) => string
}

/**
 * Reactive list of workout templates, kept in sync with storage via a live
 * query (including changes from other tabs).
 */
export function useWorkoutsList(): UseWorkoutsListReturn {
  // Primary State — live query keeps `templates` in sync with storage, including
  // changes made from other tabs, so no manual reload is needed.
  const { data: templates } = useLiveQuery<ReadonlyArray<DbWorkoutTemplate>>(() =>
    getTemplatesRepository().observeAll(),
  )

  // State Metadata — no snapshot yet means the initial `get()` hasn't resolved
  const isLoading = computed(() => templates.value === undefined)

  return {
    // State
    templates: computed(() => templates.value ?? []),
    isLoading,
    formatTemplateDate,
  }
}
