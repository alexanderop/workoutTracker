import { onMounted, ref, shallowRef } from 'vue'
import { getBenchmarksRepository } from '@/db'
import { formatBenchmarkType, formatDate } from '@/lib/formatters'
import type { DbBenchmark, DbBenchmarkPersonalBest } from '@/db/schema'

// ============================================
// Pure Functions (Functional Core)
// ============================================

/**
 * Formats a benchmark's last used timestamp for display.
 */
function formatBenchmarkDate(timestamp: number | null): string {
  if (!timestamp) return 'Never used'
  return `Last used ${formatDate(timestamp)}`
}

// ============================================
// Composable (Imperative Shell)
// ============================================

export function useBenchmarksList() {
  // Primary State
  const benchmarks = shallowRef<ReadonlyArray<DbBenchmark>>([])
  const personalBests = shallowRef<ReadonlyMap<string, DbBenchmarkPersonalBest>>(new Map())

  // State Metadata
  const isLoading = ref(true)

  // Methods
  async function loadAll(): Promise<void> {
    isLoading.value = true
    const repo = getBenchmarksRepository()
    benchmarks.value = await repo.getAll()

    // Load PBs for all benchmarks (batch query)
    const benchmarkIds = benchmarks.value.map((b) => b.id)
    personalBests.value = await repo.getPersonalBests(benchmarkIds)

    isLoading.value = false
  }

  // Lifecycle Hooks
  onMounted(() => {
    loadAll()
  })

  return {
    // State
    benchmarks,
    personalBests,
    isLoading,
    // Methods
    loadAll,
    formatBenchmarkType,
    formatBenchmarkDate,
  }
}
