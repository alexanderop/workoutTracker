/**
 * Timer composable for For Time blocks.
 *
 * Counts up until completion or time cap is reached.
 */

import type { ShallowRef } from 'vue'
import { computed, shallowReadonly, shallowRef } from 'vue'
import type { ForTimeBlock, ForTimeResult } from '@/types/blocks'
import type { BlockTimerReturn } from './useBaseTimer'
import { createFormattedTimeComputeds, useBaseTimer } from './useBaseTimer'

export type UseForTimeTimerOptions = Readonly<{
  /** Called once when the timer completes (time cap reached or finished manually). */
  onComplete?: () => void
}>

export type UseForTimeTimerReturn = BlockTimerReturn<ForTimeBlock, ForTimeResult> & {
  completedExercises: Readonly<ShallowRef<Array<string>>>
  finishedBeforeCap: Readonly<ShallowRef<boolean>>
  markExerciseComplete: (exerciseId: string) => void
  finishWorkout: () => void
}

/**
 * Count-up timer for a For Time block that tracks per-exercise completion and
 * completes when the athlete finishes or the optional time cap is reached.
 *
 * @param options
 */
export function useForTimeTimer(options: UseForTimeTimerOptions = {}): UseForTimeTimerReturn {
  // ForTime-specific state
  const block = shallowRef<ForTimeBlock | null>(null)
  const completedExercises = shallowRef<Array<string>>([])
  const finishedBeforeCap = shallowRef(false)

  // Base timer with tick handler for time cap checking
  const baseTimer = useBaseTimer({
    onTick: () => {
      // Check for time cap
      if (
        block.value?.config.timeCapSeconds &&
        baseTimer.elapsedSeconds.value >= block.value.config.timeCapSeconds
      ) {
        complete()
      }
    },
    onComplete: options.onComplete,
  })

  // ForTime-specific computed
  const remainingSeconds = computed(() => {
    if (!block.value?.config.timeCapSeconds) return 0
    return Math.max(0, block.value.config.timeCapSeconds - baseTimer.elapsedSeconds.value)
  })

  const progress = computed(() => {
    if (!block.value?.config.timeCapSeconds) return 0
    return Math.min(100, (baseTimer.elapsedSeconds.value / block.value.config.timeCapSeconds) * 100)
  })

  const { formattedElapsed, formattedRemaining } = createFormattedTimeComputeds(
    baseTimer.elapsedSeconds,
    remainingSeconds,
  )

  // Methods
  function initialize(forTimeBlock: ForTimeBlock) {
    block.value = forTimeBlock
    completedExercises.value = []
    finishedBeforeCap.value = false
    baseTimer.resetState()
  }

  function reset() {
    if (!block.value) return
    initialize(block.value)
  }

  function complete(): ForTimeResult {
    baseTimer.complete()
    return {
      completionTime: baseTimer.elapsedSeconds.value,
      completed: finishedBeforeCap.value,
    }
  }

  function markExerciseComplete(exerciseId: string) {
    if (completedExercises.value.includes(exerciseId)) return
    completedExercises.value = [...completedExercises.value, exerciseId]
  }

  function finishWorkout() {
    finishedBeforeCap.value = true
    complete()
  }

  return {
    // State from base timer
    elapsedMs: baseTimer.elapsedMs,
    elapsedSeconds: baseTimer.elapsedSeconds,
    isRunning: baseTimer.isRunning,
    isPaused: baseTimer.isPaused,
    isCompleted: baseTimer.isCompleted,
    isIdle: baseTimer.isIdle,
    isActive: baseTimer.isActive,

    // ForTime-specific state
    block: shallowReadonly(block),
    remainingSeconds,
    progress,
    formattedElapsed,
    formattedRemaining,
    completedExercises: shallowReadonly(completedExercises),
    finishedBeforeCap: shallowReadonly(finishedBeforeCap),

    // Methods
    initialize,
    start: baseTimer.start,
    pause: baseTimer.pause,
    resume: baseTimer.resume,
    toggle: baseTimer.toggle,
    reset,
    complete,
    markExerciseComplete,
    finishWorkout,
  }
}
