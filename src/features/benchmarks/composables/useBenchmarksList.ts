import type { ShallowRef } from 'vue'
import { shallowReadonly, shallowRef } from 'vue'
import { getBenchmarksRepository } from '@/db'
import { formatBenchmarkType, formatDate } from '@/lib/formatters'
import { tryCatch } from '@/lib/tryCatch'
import type { DbBenchmark } from '@/db/schema'

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

export type UseBenchmarksListReturn = {
  benchmarks: Readonly<ShallowRef<ReadonlyArray<DbBenchmark>>>
  personalBests: Readonly<ShallowRef<ReadonlyMap<string, number>>>
  isLoading: Readonly<ShallowRef<boolean>>
  /** Reload benchmarks and personal bests from the repository. */
  loadAll: () => Promise<void>
  formatBenchmarkType: typeof formatBenchmarkType
  formatBenchmarkDate: typeof formatBenchmarkDate
}

/**
 * Reactive list of benchmarks with their personal bests. Loads at setup time
 * (scope-based, no component instance required); call `loadAll` to refresh
 * after mutations.
 */
export function useBenchmarksList(): UseBenchmarksListReturn {
  // Primary State
  const benchmarks = shallowRef<ReadonlyArray<DbBenchmark>>([])
  const personalBests = shallowRef<ReadonlyMap<string, number>>(new Map())

  // State Metadata
  const isLoading = shallowRef(true)

  // Methods
  async function loadAll(): Promise<void> {
    isLoading.value = true
    const repo = getBenchmarksRepository()

    const [benchmarksError, allBenchmarks] = await tryCatch(repo.getAll())
    if (benchmarksError) {
      isLoading.value = false
      return
    }

    benchmarks.value = allBenchmarks

    // Load PBs for all benchmarks (batch query)
    const benchmarkIds = allBenchmarks.map((b) => b.id)
    const [pbError, pbs] = await tryCatch(repo.getPersonalBests(benchmarkIds))
    if (!pbError) {
      personalBests.value = pbs
    }

    isLoading.value = false
  }

  void loadAll()

  return {
    // State
    benchmarks: shallowReadonly(benchmarks),
    personalBests: shallowReadonly(personalBests),
    isLoading: shallowReadonly(isLoading),
    // Methods
    loadAll,
    formatBenchmarkType,
    formatBenchmarkDate,
  }
}
