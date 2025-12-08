import { onMounted, readonly, ref, watch, type Ref } from 'vue'
import { getBenchmarksRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'

// ============================================
// Types
// ============================================

export type AttemptWithComparison = {
  id: string
  completedAt: number
  completionTime: number
  isPersonalBest: boolean
  comparison: {
    delta: number | null // seconds diff from PB (null if this IS the PB)
    isFaster: boolean
  }
}

// ============================================
// Composable
// ============================================

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

    // Find PB time for delta calculations
    const pbTime = Math.min(...rawAttempts.map((a) => a.completionTime))

    // Transform to include comparison data
    attempts.value = rawAttempts.map((attempt) => ({
      id: attempt.id,
      completedAt: attempt.completedAt,
      completionTime: attempt.completionTime,
      isPersonalBest: attempt.isPersonalBest,
      comparison: {
        delta: attempt.isPersonalBest ? null : attempt.completionTime - pbTime,
        isFaster: attempt.completionTime < pbTime, // Should never be true if PB calculation is correct
      },
    }))

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
