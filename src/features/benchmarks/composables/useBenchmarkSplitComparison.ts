import { computed, onMounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { getBenchmarksRepository, getWorkoutsRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import {
  findPbWorkout,
  extractSplitTimes,
  getComparison,
  type SplitComparison,
} from '@/features/benchmarks/lib/splitComparison'

// Re-export type for external consumers
export type { SplitComparison }

/**
 * Loads PB attempt with split times and provides comparison functionality.
 * Also tracks whether this is the first attempt (no PB exists).
 *
 * Consolidates useBenchmarkFirstAttempt - both relate to "is there a PB to compare against?"
 */
export function useBenchmarkSplitComparison(benchmarkId: MaybeRefOrGetter<string | null>) {
  const pbSplitTimes = ref<ReadonlyArray<number> | null>(null)
  const hasPbTime = ref(false) // Tracks if ANY PB exists (for first attempt detection)
  const isLoading = ref(true)

  /**
   * Load the PB workout and extract split times.
   */
  async function loadPbSplitTimes(): Promise<void> {
    const id = toValue(benchmarkId)
    if (!id) {
      pbSplitTimes.value = null
      hasPbTime.value = false
      isLoading.value = false
      return
    }

    isLoading.value = true

    // Get PB time first
    const benchmarksRepo = getBenchmarksRepository()
    const [pbError, pbTime] = await tryCatch(benchmarksRepo.getPersonalBest(id))

    if (pbError || pbTime === null) {
      // No PB exists - this is a first attempt
      pbSplitTimes.value = null
      hasPbTime.value = false
      isLoading.value = false
      return
    }

    // PB exists
    hasPbTime.value = true

    // Get all workouts for this benchmark
    const workoutsRepo = getWorkoutsRepository()
    const [workoutsError, workouts] = await tryCatch(workoutsRepo.getHistory({ limit: 100 }))

    if (workoutsError || !workouts) {
      pbSplitTimes.value = null
      isLoading.value = false
      return
    }

    // Find the PB workout (matching the PB time)
    const pbWorkout = findPbWorkout(workouts, id, pbTime)

    if (!pbWorkout) {
      pbSplitTimes.value = null
      isLoading.value = false
      return
    }

    // Extract split times from the PB workout
    const splits = extractSplitTimes(pbWorkout)
    pbSplitTimes.value = splits
    isLoading.value = false
  }

  /**
   * Compare current split time to PB split time for a given exercise index.
   * Thin wrapper around pure getComparison function from lib.
   */
  function compareToSplit(exerciseIndex: number, currentSplit: number): SplitComparison | null {
    return getComparison(pbSplitTimes.value, exerciseIndex, currentSplit)
  }

  /**
   * Check if PB split data is available.
   */
  const hasPbSplits = computed(() => {
    return pbSplitTimes.value !== null && pbSplitTimes.value.length > 0
  })

  /**
   * Check if this is the first attempt (no PB exists).
   * Consolidated from useBenchmarkFirstAttempt.
   */
  const isFirstAttempt = computed(() => !hasPbTime.value)

  onMounted(() => {
    loadPbSplitTimes()
  })

  watch(
    () => toValue(benchmarkId),
    () => {
      loadPbSplitTimes()
    }
  )

  return {
    pbSplitTimes: computed(() => pbSplitTimes.value),
    hasPbSplits,
    isFirstAttempt,
    isLoading: computed(() => isLoading.value),
    getComparison: compareToSplit,
    reload: loadPbSplitTimes,
  }
}
