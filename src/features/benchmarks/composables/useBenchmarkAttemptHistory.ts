import { onMounted, readonly, ref, watch, type Ref } from 'vue'
import { getBenchmarksRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import { transformAttempts, type AttemptWithComparison } from '@/features/benchmarks/lib/attemptStats'

// Re-export type for external consumers
export type { AttemptWithComparison }

/**
 * Loads benchmark attempt history with comparison data.
 * Thin composable wrapper around pure transformation functions.
 */
export function useBenchmarkAttemptHistory(benchmarkId: Ref<string>) {
  const attempts = ref<Array<AttemptWithComparison>>([])
  const isLoading = ref(true)

  async function loadAttempts(): Promise<void> {
    isLoading.value = true

    const repo = getBenchmarksRepository()
    const [error, rawAttempts] = await tryCatch(repo.getAttemptHistory(benchmarkId.value))

    if (error) {
      console.error('Failed to load attempt history:', error)
      attempts.value = []
      isLoading.value = false
      return
    }

    if (!rawAttempts || rawAttempts.length === 0) {
      attempts.value = []
      isLoading.value = false
      return
    }

    // Transform to include comparison data using pure function
    attempts.value = transformAttempts(rawAttempts)
    isLoading.value = false
  }

  onMounted(() => {
    loadAttempts()
  })

  // Watch benchmarkId for changes (defensive, ID shouldn't change in practice)
  watch(() => benchmarkId.value, () => {
    loadAttempts()
  })

  return {
    attempts: readonly(attempts),
    isLoading: readonly(isLoading),
  }
}
