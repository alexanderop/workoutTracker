import { computed, type Ref, type ComputedRef } from 'vue'

export type PbComparisonResult =
  | { status: 'new-pb'; previousTime: number; improvement: number }
  | { status: 'first-pb' }
  | { status: 'no-pb'; previousTime: number }

/**
 * Compare completion time against previous personal best.
 * Returns comparison result for celebration UI.
 *
 * @param completionTime - Current workout completion time in seconds
 * @param previousBest - Previous best time in seconds, or null if no previous completion
 * @returns Computed comparison result with status and relevant data
 */
export function usePbComparison(
  completionTime: Ref<number>,
  previousBest: Ref<number | null>,
): { result: ComputedRef<PbComparisonResult> } {
  const result = computed<PbComparisonResult>(() => {
    const prev = previousBest.value
    const current = completionTime.value

    if (prev === null) {
      return { status: 'first-pb' }
    }

    if (current < prev) {
      return {
        status: 'new-pb',
        previousTime: prev,
        improvement: prev - current,
      }
    }

    return {
      status: 'no-pb',
      previousTime: prev,
    }
  })

  return { result }
}
