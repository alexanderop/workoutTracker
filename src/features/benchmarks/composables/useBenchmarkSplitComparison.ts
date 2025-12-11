import { computed, onMounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { getBenchmarksRepository, getWorkoutsRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import type { DbCompletedWorkout } from '@/db/schema'

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
 * Find the workout that matches the PB time.
 */
function findPbWorkout(
  workouts: ReadonlyArray<DbCompletedWorkout>,
  targetBenchmarkId: string,
  pbTime: number
): DbCompletedWorkout | null {
  for (const workout of workouts) {
    if (workout.benchmarkId !== targetBenchmarkId) continue

    for (const block of workout.blocks) {
      if (block.kind === 'fortime' && block.result?.completed) {
        if (Math.abs(block.result.completionTime - pbTime) < 0.1) {
          return workout
        }
      }
    }
  }
  return null
}

/**
 * Extract split times from a completed workout.
 */
function extractSplitTimes(workout: DbCompletedWorkout): ReadonlyArray<number> {
  for (const block of workout.blocks) {
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

    // Get PB time first
    const benchmarksRepo = getBenchmarksRepository()
    const [pbError, pbTime] = await tryCatch(benchmarksRepo.getPersonalBest(id))

    if (pbError || pbTime === null) {
      pbSplitTimes.value = null
      isLoading.value = false
      return
    }

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
