import { computed, onMounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { getBenchmarksRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import { isFirstBenchmarkAttempt } from '@/lib/splitTracking'

export function useBenchmarkFirstAttempt(benchmarkId: MaybeRefOrGetter<string | null>) {
  const isFirstAttempt = ref(false)
  const isLoading = ref(true)

  async function loadAttemptHistory(): Promise<void> {
    const id = toValue(benchmarkId)
    if (!id) {
      isFirstAttempt.value = false
      isLoading.value = false
      return
    }

    isLoading.value = true
    const repo = getBenchmarksRepository()
    const [error, attempts] = await tryCatch(repo.getAttemptHistory(id))

    if (error) {
      console.error('Failed to load attempt history:', error)
      isFirstAttempt.value = false
      isLoading.value = false
      return
    }

    isFirstAttempt.value = isFirstBenchmarkAttempt(attempts)
    isLoading.value = false
  }

  onMounted(() => {
    loadAttemptHistory()
  })

  watch(() => toValue(benchmarkId), () => {
    loadAttemptHistory()
  })

  return {
    isFirstAttempt: computed(() => isFirstAttempt.value),
    isLoading: computed(() => isLoading.value),
    reload: loadAttemptHistory,
  }
}
