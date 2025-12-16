import { onMounted, ref, shallowRef } from 'vue'
import { getTemplatesRepository } from '@/db'
import { formatDate } from '@/lib/formatters'
import { tryCatch } from '@/lib/tryCatch'
import type { DbTemplateHeader } from '@/db/schema'

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
  const templates = shallowRef<ReadonlyArray<DbTemplateHeader>>([])

  // State Metadata
  const isLoading = ref(true)

  // Methods
  async function loadAll(): Promise<void> {
    isLoading.value = true
    const [error, result] = await tryCatch(getTemplatesRepository().getAll())
    if (!error && result) {
      templates.value = result
    }
    isLoading.value = false
  }

  // Lifecycle Hooks
  onMounted(() => {
    loadAll()
  })

  return {
    // State
    templates,
    isLoading,
    // Methods
    loadAll,
    formatTemplateDate,
  }
}
