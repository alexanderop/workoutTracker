/**
 * Timer composable for AMRAP (As Many Rounds As Possible) blocks.
 *
 * Counts down from a set duration while tracking completed rounds.
 */

import type { ShallowRef } from 'vue'
import { computed, shallowReadonly, shallowRef } from 'vue'
import type { AmrapBlock, AmrapResult } from '@/blocks'
import type { BlockTimerReturn } from './useBaseTimer'
import { blockTimerBase, createFormattedTimeComputeds, useBaseTimer } from './useBaseTimer'

export type UseAmrapTimerOptions = Readonly<{
  /** Called once when the timer completes (duration reached or completed manually). */
  onComplete?: () => void
}>

export type UseAmrapTimerReturn = BlockTimerReturn<AmrapBlock, AmrapResult> & {
  rounds: Readonly<ShallowRef<number>>
  currentExerciseIndex: Readonly<ShallowRef<number>>
  incrementRound: () => void
}

/**
 * Countdown timer for an AMRAP block with round tracking; completes
 * automatically when the configured duration is reached.
 *
 * @param options
 */
export function useAmrapTimer(options: UseAmrapTimerOptions = {}): UseAmrapTimerReturn {
  // AMRAP-specific state
  const block = shallowRef<AmrapBlock | null>(null)
  const rounds = shallowRef(0)
  const currentExerciseIndex = shallowRef(0)

  // Base timer with tick handler for completion check
  const baseTimer = useBaseTimer({
    onTick: () => {
      if (block.value && baseTimer.elapsedSeconds.value >= block.value.config.durationSeconds) {
        complete()
      }
    },
    onComplete: options.onComplete,
  })

  // AMRAP-specific computed
  const remainingSeconds = computed(() => {
    if (!block.value) return 0
    return Math.max(0, block.value.config.durationSeconds - baseTimer.elapsedSeconds.value)
  })

  const progress = computed(() => {
    if (!block.value) return 0
    return Math.min(
      100,
      (baseTimer.elapsedSeconds.value / block.value.config.durationSeconds) * 100,
    )
  })

  const { formattedElapsed, formattedRemaining } = createFormattedTimeComputeds(
    baseTimer.elapsedSeconds,
    remainingSeconds,
  )

  // Methods
  function initialize(amrapBlock: AmrapBlock) {
    block.value = amrapBlock
    rounds.value = 0
    currentExerciseIndex.value = 0
    baseTimer.resetState()
  }

  function reset() {
    if (!block.value) return
    initialize(block.value)
  }

  function complete(): AmrapResult {
    baseTimer.complete()
    return {
      rounds: rounds.value,
      partialReps: currentExerciseIndex.value,
      actualDuration: baseTimer.elapsedSeconds.value,
    }
  }

  function incrementRound() {
    rounds.value++
    currentExerciseIndex.value = 0
  }

  return {
    ...blockTimerBase(baseTimer),

    // AMRAP-specific state
    block: shallowReadonly(block),
    remainingSeconds,
    progress,
    formattedElapsed,
    formattedRemaining,
    rounds: shallowReadonly(rounds),
    currentExerciseIndex: shallowReadonly(currentExerciseIndex),

    // Methods
    initialize,
    reset,
    complete,
    incrementRound,
  }
}
