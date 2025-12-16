import { computed, onMounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { getBenchmarksRepository, getWorkoutsRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import type { DbWorkoutBlock } from '@/db/schema'

/**
 * Comparison data for a single split time.
 */
export type SplitComparison = {
  currentSplit: number // Current split time in seconds
  pbSplit: number // PB split time in seconds
  delta: number // Difference in seconds (negative = faster, positive = slower)
  isFaster: boolean // True if current split is faster than PB
}

/**
 * Extract split times from workout blocks.
 */
function extractSplitTimes(blocks: ReadonlyArray<DbWorkoutBlock>): ReadonlyArray<number> {
  for (const block of blocks) {
    if (block.kind === 'fortime' && block.result?.splitTimes) {
      return block.result.splitTimes
    }
  }
  return []
}

/**
 * Loads PB attempt with split times and provides comparison functionality.
 * Used during benchmark workout execution to show real-time pace comparison.
 */
export function useBenchmarkSplitComparison(benchmarkId: MaybeRefOrGetter<string | null>) {
  const pbSplitTimes = ref<ReadonlyArray<number> | null>(null)
  const isLoading = ref(true)

  /**
   * Load the PB workout and extract split times.
   */
  async function loadPbSplitTimes(): Promise<void> {
    const id = toValue(benchmarkId)
    if (!id) {
      pbSplitTimes.value = null
      isLoading.value = false
      return
    }

    isLoading.value = true

    // Get PB record which contains the workoutId
    const benchmarksRepo = getBenchmarksRepository()
    const [pbError, pbRecord] = await tryCatch(benchmarksRepo.getPersonalBest(id))

    if (pbError || pbRecord === null) {
      pbSplitTimes.value = null
      isLoading.value = false
      return
    }

    // Load the PB workout with blocks using the workoutId from the PB record
    const workoutsRepo = getWorkoutsRepository()
    const [workoutError, pbWorkout] = await tryCatch(workoutsRepo.getById(pbRecord.workoutId))

    if (workoutError || !pbWorkout) {
      pbSplitTimes.value = null
      isLoading.value = false
      return
    }

    // Extract split times from the PB workout blocks
    const splits = extractSplitTimes(pbWorkout.blocks)
    pbSplitTimes.value = splits
    isLoading.value = false
  }

  /**
   * Compare current split time to PB split time for a given exercise index.
   * @param exerciseIndex - 0-based index of the exercise that was just completed
   * @param currentSplit - Current split time in seconds
   * @returns Comparison data, or null if no PB split exists for this index
   */
  function getComparison(exerciseIndex: number, currentSplit: number): SplitComparison | null {
    if (!pbSplitTimes.value || exerciseIndex >= pbSplitTimes.value.length) {
      return null
    }

    const pbSplit = pbSplitTimes.value[exerciseIndex]
    if (pbSplit === undefined) {
      return null
    }

    const delta = currentSplit - pbSplit

    return {
      currentSplit,
      pbSplit,
      delta,
      isFaster: delta < 0,
    }
  }

  /**
   * Check if PB split data is available.
   */
  const hasPbSplits = computed(() => {
    return pbSplitTimes.value !== null && pbSplitTimes.value.length > 0
  })

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
    isLoading: computed(() => isLoading.value),
    getComparison,
    reload: loadPbSplitTimes,
  }
}
